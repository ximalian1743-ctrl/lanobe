import { annotateTextWithAi } from './aiService';
import { chunkJapaneseText } from '../lib/jpChunker';
import { useAppStore } from '../store/useAppStore';
import { AppSettings, Entry } from '../types';

export const AI_MAX_CHARS = 20000;
export const AI_CHUNK_CHARS = 800;
const PER_CHUNK_RETRIES = 1;

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

function buildLabel(doneChunks: number, totalChunks: number, mode: 'replace' | 'append') {
  const prefix = mode === 'append' ? 'AI 追加段落' : 'AI 分句处理';
  if (doneChunks >= totalChunks) return `${prefix} · 完成`;
  return `${prefix} · 处理第 ${Math.min(doneChunks + 1, totalChunks)} / ${totalChunks} 段`;
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

  const controller = new AbortController();
  const store = useAppStore.getState();
  const total = chunks.length;
  let done = 0;
  let failed = 0;

  if (mode === 'replace') {
    store.setEntries([]);
  }
  store.setBatchAiProgress({
    label: buildLabel(done, total, mode),
    done,
    total,
    onCancel: () => controller.abort(),
  });

  for (let i = 0; i < chunks.length; i++) {
    if (controller.signal.aborted) break;

    let lastErr: unknown = null;
    let annotated: { jp: string; ch: string }[] | null = null;
    for (let attempt = 0; attempt <= PER_CHUNK_RETRIES; attempt++) {
      if (controller.signal.aborted) break;
      try {
        console.info(`[ai-annotate] chunk ${i + 1}/${total} attempt ${attempt + 1} (${chunks[i].length} chars)`);
        annotated = await annotateTextWithAi({
          text: chunks[i],
          apiKey: settings.aiApiKey,
          apiBase: settings.aiApiBase,
          model: settings.aiModel,
          backendApiBase: settings.apiBase,
          signal: controller.signal,
        });
        break;
      } catch (err) {
        lastErr = err;
        if ((err as Error)?.name === 'AbortError') break;
        console.warn(`[ai-annotate] chunk ${i + 1} attempt ${attempt + 1} failed:`, err);
        if (attempt < PER_CHUNK_RETRIES) await sleep(1500 * (attempt + 1));
      }
    }

    if (controller.signal.aborted) break;

    if (!annotated) {
      failed++;
      const msg = (lastErr as Error)?.message || '未知错误';
      console.error(`[ai-annotate] chunk ${i + 1} gave up:`, lastErr);
      toast(`第 ${i + 1} / ${total} 段失败 · ${msg}`, 'error');
      // Still advance so later chunks process — don't abort the whole run.
      done++;
      useAppStore.getState().setBatchAiProgress({
        label: buildLabel(done, total, mode),
        done,
        total,
        onCancel: () => controller.abort(),
      });
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
    done++;
    s.setBatchAiProgress({
      label: buildLabel(done, total, mode),
      done,
      total,
      onCancel: () => controller.abort(),
    });
  }

  useAppStore.getState().setBatchAiProgress(null);

  if (controller.signal.aborted) {
    toast('已中止 AI 处理', 'info');
    return false;
  }
  if (failed === total) {
    toast('AI 处理全部失败', 'error');
    return false;
  }
  if (failed > 0) {
    toast(`AI 处理完成 · ${failed} 段失败`, 'info');
  } else {
    toast(mode === 'append' ? 'AI 追加完成' : 'AI 注音翻译完成 · 可开始播放', 'success');
  }
  return true;
}
