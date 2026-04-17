import { annotateTextWithAi, AnnotatedEntry } from './aiService';
import { chunkJapaneseText } from '../lib/jpChunker';
import { useAppStore } from '../store/useAppStore';
import { AppSettings, Entry } from '../types';

export const AI_MAX_CHARS = 20000;
export const AI_CHUNK_CHARS = 800;

/** Attempts per chunk before entering the "stuck" state that lets the user press retry. */
const PER_CHUNK_ATTEMPTS = 3;
/** Backoff between automatic retries: 1s, 2s. */
const BACKOFF_MS = [1000, 2000];

type ToastFn = (msg: string, kind?: 'success' | 'error' | 'info') => void;

interface RunArgs {
  text: string;
  settings: AppSettings;
  mode: 'replace' | 'append';
  toast: ToastFn;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function runLabel(doneChunks: number, totalChunks: number, mode: 'replace' | 'append') {
  const prefix = mode === 'append' ? 'AI 追加段落' : 'AI 分句处理';
  if (doneChunks >= totalChunks) return `${prefix} · 完成`;
  return `${prefix} · 处理第 ${Math.min(doneChunks + 1, totalChunks)} / ${totalChunks} 段`;
}

function stuckLabel(failedIndex: number, totalChunks: number) {
  return `第 ${failedIndex + 1} / ${totalChunks} 段失败 · 点击横幅「重试」`;
}

async function attemptChunkWithBackoff(
  text: string,
  settings: AppSettings,
  signal: AbortSignal,
  chunkIdx: number,
): Promise<AnnotatedEntry[] | null> {
  let lastErr: unknown = null;
  for (let attempt = 0; attempt < PER_CHUNK_ATTEMPTS; attempt++) {
    if (signal.aborted) return null;
    try {
      console.info(`[ai-annotate] chunk ${chunkIdx + 1} attempt ${attempt + 1}/${PER_CHUNK_ATTEMPTS}`);
      return await annotateTextWithAi({
        text,
        apiKey: settings.aiApiKey,
        apiBase: settings.aiApiBase,
        model: settings.aiModel,
        backendApiBase: settings.apiBase,
        signal,
      });
    } catch (err) {
      lastErr = err;
      if ((err as Error)?.name === 'AbortError') return null;
      console.warn(`[ai-annotate] chunk ${chunkIdx + 1} attempt ${attempt + 1} failed:`, err);
      const backoff = BACKOFF_MS[attempt];
      if (backoff && attempt < PER_CHUNK_ATTEMPTS - 1) await sleep(backoff);
    }
  }
  console.error(`[ai-annotate] chunk ${chunkIdx + 1} exhausted ${PER_CHUNK_ATTEMPTS} attempts:`, lastErr);
  return null;
}

/**
 * Wait for either a user-triggered retry signal or the controller abort.
 * Returns true if retry was signalled, false if aborted.
 */
function waitForRetryOrAbort(
  signal: AbortSignal,
  attachResume: (resolve: () => void) => void,
): Promise<boolean> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve(false);
      return;
    }
    const onAbort = () => {
      signal.removeEventListener('abort', onAbort);
      resolve(false);
    };
    signal.addEventListener('abort', onAbort, { once: true });
    attachResume(() => {
      signal.removeEventListener('abort', onAbort);
      resolve(true);
    });
  });
}

export async function runAiAnnotate({ text, settings, mode, toast }: RunArgs) {
  const value = text.trim();
  if (!value) {
    toast('请输入日语文本', 'error');
    return false;
  }
  if (value.length > AI_MAX_CHARS) {
    toast(`文本过长（AI 最多 ${AI_MAX_CHARS} 字）`, 'error');
    return false;
  }
  if (!settings.aiApiKey?.trim()) {
    toast('未配置 AI API 密钥', 'error');
    return false;
  }

  const chunks = chunkJapaneseText(value, AI_CHUNK_CHARS);
  if (!chunks.length) {
    toast('未识别到可处理的文本', 'error');
    return false;
  }

  const total = chunks.length;
  const controller = new AbortController();
  const store = useAppStore.getState();
  const batchStartIndex = mode === 'replace' ? 0 : store.entries.length;
  let chapterAdded = false;
  let resumeFn: (() => void) | null = null;

  const publishProgress = (done: number, stuckIndex: number | null) => {
    useAppStore.getState().setBatchAiProgress({
      label: stuckIndex !== null ? stuckLabel(stuckIndex, total) : runLabel(done, total, mode),
      done,
      total,
      onCancel: () => controller.abort(),
      onRetry: stuckIndex !== null ? () => {
        const fn = resumeFn;
        resumeFn = null;
        fn?.();
      } : undefined,
    });
  };

  if (mode === 'replace') {
    store.setEntries([]);
  }
  publishProgress(0, null);

  let i = 0;
  while (i < total) {
    if (controller.signal.aborted) break;

    publishProgress(i, null);
    const annotated = await attemptChunkWithBackoff(chunks[i], settings, controller.signal, i);

    if (controller.signal.aborted) break;

    if (!annotated) {
      toast(`第 ${i + 1} / ${total} 段失败，横幅上点「重试」继续`, 'error');
      publishProgress(i, i);
      const resumed = await waitForRetryOrAbort(controller.signal, (r) => { resumeFn = r; });
      if (!resumed) break;
      // User pressed retry; loop with same i.
      continue;
    }

    const newEntries: Entry[] = annotated.map((a) => ({
      id: '',
      jp: a.jp,
      ch: a.ch,
      words: [],
    }));
    const s = useAppStore.getState();
    if (mode === 'replace' && i === 0) {
      s.setEntries(newEntries.map((e, idx) => ({ ...e, id: `entry-${idx}` })));
    } else {
      s.appendEntries(newEntries);
    }

    if (!chapterAdded) {
      const after = useAppStore.getState();
      const num = after.chapters.length + 1;
      const title = mode === 'replace' ? `段落 ${num}` : `追加段落 ${num}`;
      after.setChapters([...after.chapters, { title, index: batchStartIndex }]);
      chapterAdded = true;
    }

    i++;
    publishProgress(i, null);
  }

  useAppStore.getState().setBatchAiProgress(null);

  if (controller.signal.aborted) {
    toast('已中止 AI 处理', 'info');
    return false;
  }
  toast(mode === 'append' ? 'AI 追加完成 · 可从章节列表跳转' : 'AI 注音翻译完成', 'success');
  return true;
}
