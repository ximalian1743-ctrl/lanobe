import { annotateTextWithAi, AnnotatedEntry } from './aiService';
import { chunkJapaneseText } from '../lib/jpChunker';
import { useAppStore } from '../store/useAppStore';
import { AppSettings, Entry } from '../types';

export const AI_MAX_CHARS = 20000;
export const AI_CHUNK_CHARS = 800;
/** Upper bound on concurrent in-flight chunk requests within a single job. */
export const AI_CHUNK_CONCURRENCY = 5;

/** Attempts per chunk before the whole job aborts with an error. */
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

interface QueueItem {
  job: RunArgs;
  resolve: (ok: boolean) => void;
}

/**
 * Module-level FIFO queue across runAiAnnotate() invocations. Each job owns
 * the reader state while it runs; within a job, chunks fan out up to
 * AI_CHUNK_CONCURRENCY at a time.
 */
const queue: QueueItem[] = [];
let pumping = false;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function runLabel(
  doneChunks: number,
  totalChunks: number,
  mode: 'replace' | 'append',
  queueAhead: number,
) {
  const prefix = mode === 'append' ? 'AI 追加段落' : 'AI 分句处理';
  const base =
    doneChunks >= totalChunks
      ? `${prefix} · 完成`
      : `${prefix} · ${doneChunks} / ${totalChunks} 段已入库`;
  return queueAhead > 0 ? `${base} · 队列还有 ${queueAhead} 批` : base;
}

/** Re-publish the currently-running batch's progress with the latest queue depth. */
function refreshQueueAhead() {
  const current = useAppStore.getState().batchAiProgress;
  if (!current) return;
  useAppStore.getState().setBatchAiProgress({
    ...current,
    queueAhead: queue.length,
  });
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

async function runOneJob({ text, settings, mode, toast }: RunArgs): Promise<boolean> {
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
  const batchStartIndex = mode === 'replace' ? 0 : useAppStore.getState().entries.length;
  let chapterAdded = false;
  let failureMsg: string | null = null;

  const results: Array<AnnotatedEntry[] | null | undefined> = new Array(total);
  let nextChunk = 0;
  let flushIdx = 0;
  let doneChunks = 0;
  let flushChain: Promise<void> = Promise.resolve();

  const publishProgress = (done: number) => {
    useAppStore.getState().setBatchAiProgress({
      label: runLabel(done, total, mode, queue.length),
      done,
      total,
      onCancel: () => controller.abort(),
      queueAhead: queue.length,
    });
  };

  const flushReady = () => {
    while (flushIdx < total && results[flushIdx] !== undefined) {
      const annotated = results[flushIdx];
      if (annotated === null) {
        failureMsg = `第 ${flushIdx + 1} / ${total} 段失败`;
        controller.abort();
        return;
      }
      const newEntries: Entry[] = annotated.map((a) => ({
        id: '',
        jp: a.jp,
        ch: a.ch,
        words: a.words,
      }));
      const s = useAppStore.getState();
      if (mode === 'replace' && flushIdx === 0) {
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

      flushIdx++;
      doneChunks++;
      publishProgress(doneChunks);
    }
  };

  if (mode === 'replace') {
    useAppStore.getState().setEntries([]);
  }
  publishProgress(0);

  const worker = async () => {
    while (!controller.signal.aborted) {
      const idx = nextChunk++;
      if (idx >= total) return;
      const annotated = await attemptChunkWithBackoff(chunks[idx], settings, controller.signal, idx);
      if (controller.signal.aborted) return;
      results[idx] = annotated;
      // Chain flushes so they serialize without interleaving between workers.
      flushChain = flushChain.then(flushReady);
      await flushChain;
    }
  };

  const poolSize = Math.min(AI_CHUNK_CONCURRENCY, total);
  await Promise.all(Array.from({ length: poolSize }, worker));
  await flushChain;

  if (failureMsg) {
    toast(`${failureMsg}，请重试该批次`, 'error');
    return false;
  }
  if (controller.signal.aborted) {
    toast('已中止 AI 处理', 'info');
    return false;
  }
  toast(mode === 'append' ? 'AI 追加完成 · 可从章节列表跳转' : 'AI 注音翻译完成', 'success');
  return true;
}

async function pump() {
  if (pumping) return;
  pumping = true;
  try {
    while (queue.length) {
      const current = queue.shift()!;
      refreshQueueAhead();
      const ok = await runOneJob(current.job);
      current.resolve(ok);
    }
  } finally {
    // Clear progress only after the whole queue drains, so the user never
    // sees the banner flash away between batches.
    useAppStore.getState().setBatchAiProgress(null);
    pumping = false;
  }
}

/**
 * Enqueue an AI annotate job. Runs sequentially with any prior job already
 * in flight. Returns a promise that resolves to whether this specific job
 * completed successfully.
 */
export function runAiAnnotate(job: RunArgs): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    queue.push({ job, resolve });
    refreshQueueAhead();
    void pump();
  });
}

/** Current number of batches waiting behind the active one (0 if idle). */
export function getQueueDepth(): number {
  return queue.length;
}
