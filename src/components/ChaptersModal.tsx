import { useCallback, useMemo, useRef, useState } from 'react';
import { List, Sparkles, X } from 'lucide-react';
import { useAppStore, buildEntryKey } from '../store/useAppStore';
import { useUiText } from '../hooks/useUiText';
import { useEscClose } from '../hooks/useModalDismiss';
import { useToast } from './Toast';
import { explainEntryWithAi } from '../services/aiService';

interface ChaptersModalProps {
  onClose: () => void;
  slug?: string;
  volumeId?: string;
}

export function ChaptersModal({ onClose, slug, volumeId }: ChaptersModalProps) {
  const chapters = useAppStore((s) => s.chapters);
  const entries = useAppStore((s) => s.entries);
  const currentIndex = useAppStore((s) => s.currentIndex);
  const settings = useAppStore((s) => s.settings);
  const setCurrentIndex = useAppStore((s) => s.setCurrentIndex);
  const setAiExplanation = useAppStore((s) => s.setAiExplanation);
  const aiExplanations = useAppStore((s) => s.aiExplanations);
  const { text, format, uiLanguage } = useUiText();
  const { toast } = useToast();
  useEscClose(onClose);

  const [batchChapterIdx, setBatchChapterIdx] = useState<number | null>(null);
  const [batchProgress, setBatchProgress] = useState({ done: 0, total: 0 });
  const abortRef = useRef(false);

  const hasAi = Boolean(
    settings.aiApiBase?.trim() && settings.aiApiKey?.trim() && settings.aiModel?.trim(),
  );

  // Count how many entries in a chapter are already cached
  const chapterCachedCount = useMemo(() => {
    if (!slug || !volumeId) return new Map<number, number>();
    const map = new Map<number, number>();
    chapters.forEach((chap, chapIdx) => {
      const endIdx = chapIdx === chapters.length - 1 ? entries.length : chapters[chapIdx + 1].index;
      let count = 0;
      for (let i = chap.index; i < endIdx; i++) {
        if (aiExplanations[buildEntryKey(slug, volumeId, i)]) count++;
      }
      map.set(chapIdx, count);
    });
    return map;
  }, [chapters, entries.length, aiExplanations, slug, volumeId]);

  const handleBatchExplain = useCallback(
    async (chapIdx: number) => {
      if (!hasAi || !slug || !volumeId) {
        toast('请先配置 AI', 'warning');
        return;
      }
      const chap = chapters[chapIdx];
      const endIdx = chapIdx === chapters.length - 1 ? entries.length : chapters[chapIdx + 1].index;
      const targets: number[] = [];
      for (let i = chap.index; i < endIdx; i++) {
        if (!aiExplanations[buildEntryKey(slug, volumeId, i)]) targets.push(i);
      }
      if (targets.length === 0) {
        toast('本章已全部缓存', 'info');
        return;
      }

      abortRef.current = false;
      setBatchChapterIdx(chapIdx);
      setBatchProgress({ done: 0, total: targets.length });

      const CONCURRENCY = Math.max(1, Math.min(3, settings.entryConcurrency || 2));
      let nextTarget = 0;
      let completed = 0;

      async function worker() {
        while (!abortRef.current) {
          const myIdx = nextTarget++;
          if (myIdx >= targets.length) break;
          const entryIdx = targets[myIdx];
          const entry = entries[entryIdx];
          if (!entry) continue;
          try {
            const result = await explainEntryWithAi({
              entry,
              previousEntry: entries[entryIdx - 1],
              nextEntry: entries[entryIdx + 1],
              lineNumber: entryIdx + 1,
              apiKey: settings.aiApiKey,
              apiBase: settings.aiApiBase,
              model: settings.aiModel,
              backendApiBase: settings.apiBase,
              uiLanguage,
            });
            if (abortRef.current) break;
            setAiExplanation(slug!, volumeId!, entryIdx, result);
            completed++;
            setBatchProgress({ done: completed, total: targets.length });
          } catch (err) {
            console.error('batch ai failed', err);
            completed++;
            setBatchProgress({ done: completed, total: targets.length });
          }
        }
      }

      await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

      setBatchChapterIdx(null);
      if (abortRef.current) {
        toast('已中止批量讲解', 'warning');
      } else {
        toast(`本章 ${targets.length} 句 AI 讲解已生成`, 'success');
      }
    },
    [
      hasAi,
      slug,
      volumeId,
      chapters,
      entries,
      aiExplanations,
      settings.entryConcurrency,
      settings.aiApiKey,
      settings.aiApiBase,
      settings.aiModel,
      settings.apiBase,
      uiLanguage,
      setAiExplanation,
      toast,
    ],
  );

  function cancelBatch() {
    abortRef.current = true;
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-800 p-6">
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-200">
            <List size={24} className="text-blue-400" />
            {text.chaptersModal.title}
          </h2>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200">
            <X size={20} />
          </button>
        </div>

        {batchChapterIdx !== null ? (
          <div className="border-b border-slate-800 bg-blue-500/5 px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-slate-300">
                批量讲解中… {batchProgress.done} / {batchProgress.total}
              </span>
              <button
                type="button"
                onClick={cancelBatch}
                className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300 hover:bg-red-500/20"
              >
                中止
              </button>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-blue-500 transition-all"
                style={{
                  width: `${batchProgress.total > 0 ? (batchProgress.done / batchProgress.total) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        ) : null}

        <div className="space-y-2 overflow-y-auto p-4">
          {chapters.map((chapter, index) => {
            const isCurrent =
              currentIndex >= chapter.index &&
              (index === chapters.length - 1 || currentIndex < chapters[index + 1].index);
            const endIdx = index === chapters.length - 1 ? entries.length : chapters[index + 1].index;
            const chapTotal = endIdx - chapter.index;
            const cached = chapterCachedCount.get(index) ?? 0;

            return (
              <div
                key={`${chapter.title}-${chapter.index}`}
                className={[
                  'rounded-2xl border p-3 transition-all',
                  isCurrent
                    ? 'border-blue-500/30 bg-blue-600/20'
                    : 'border-slate-700/50 bg-slate-800/50',
                ].join(' ')}
              >
                <button
                  type="button"
                  onClick={() => {
                    setCurrentIndex(chapter.index);
                    onClose();
                  }}
                  className="w-full text-left"
                >
                  <div className={isCurrent ? 'font-medium leading-relaxed text-blue-300' : 'font-medium leading-relaxed text-slate-300'}>
                    {chapter.title}
                  </div>
                  <div className="mt-1 text-xs opacity-60">
                    {format(text.chaptersModal.jumpToLine, { line: chapter.index + 1 })}
                    {' · '}
                    {chapTotal} 句
                    {cached > 0 ? ` · AI ${cached}/${chapTotal}` : ''}
                  </div>
                </button>
                {hasAi && slug && volumeId ? (
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      disabled={batchChapterIdx !== null || cached >= chapTotal}
                      onClick={() => handleBatchExplain(index)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/25 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold text-amber-200 transition-colors hover:bg-amber-500/20 disabled:opacity-30"
                    >
                      <Sparkles size={12} />
                      {cached >= chapTotal ? '全部已缓存' : '讲解本章'}
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
          {chapters.length === 0 && <div className="py-10 text-center text-slate-500">{text.chaptersModal.empty}</div>}
        </div>
      </div>
    </div>
  );
}
