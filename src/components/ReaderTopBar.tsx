import { useMemo, useRef } from 'react';
import { ALargeSmall, BookOpen, Type } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

interface ReaderTopBarProps {
  returnTo?: string;
}

export function ReaderTopBar({ returnTo }: ReaderTopBarProps) {
  const entries = useAppStore((s) => s.entries);
  const currentIndex = useAppStore((s) => s.currentIndex);
  const setCurrentIndex = useAppStore((s) => s.setCurrentIndex);
  const chapters = useAppStore((s) => s.chapters);
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);

  const total = entries.length;
  const currentOneBased = total > 0 ? currentIndex + 1 : 0;
  const percent = total > 0 ? Math.round(((currentIndex + 1) / total) * 100) : 0;

  const currentChapter = useMemo(() => {
    if (!chapters.length) return null;
    let match = chapters[0];
    for (const c of chapters) {
      if (c.index <= currentIndex) match = c;
      else break;
    }
    return match;
  }, [chapters, currentIndex]);

  const progressRef = useRef<HTMLDivElement | null>(null);
  function handleSeek(clientX: number) {
    if (!progressRef.current || total === 0) return;
    const rect = progressRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const targetIndex = Math.min(total - 1, Math.max(0, Math.floor(ratio * total)));
    setCurrentIndex(targetIndex);
  }

  const fontScale = settings.readerFontScale ?? 1;
  function adjustFont(delta: number) {
    const next = Math.round((fontScale + delta) * 100) / 100;
    const clamped = Math.min(1.4, Math.max(0.85, next));
    updateSettings({ readerFontScale: clamped });
  }

  return (
    <div className="sticky top-0 z-40 border-b border-slate-800/70 bg-slate-950/92 px-3 py-2 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl flex-col gap-1.5">
        {/* Row 1: chapter + counts + font controls */}
        <div className="flex items-center gap-2">
          {returnTo ? (
            <a
              href={returnTo}
              className="inline-flex shrink-0 items-center gap-1 rounded-full border border-slate-700/60 bg-slate-900/70 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-200 hover:border-slate-500"
            >
              <BookOpen size={12} /> 书架
            </a>
          ) : null}
          <div className="flex min-w-0 flex-1 items-center gap-1.5 text-xs text-slate-400">
            {currentChapter ? (
              <span className="truncate font-medium text-slate-200">{currentChapter.title}</span>
            ) : (
              <span className="truncate">阅读中</span>
            )}
          </div>
          <span className="shrink-0 whitespace-nowrap font-mono text-xs text-slate-400">
            {currentOneBased} / {total}
            <span className="mx-1 text-slate-600">·</span>
            {percent}%
          </span>
          <div className="flex shrink-0 items-center gap-0.5 rounded-full border border-slate-700/60 bg-slate-900/70 p-0.5">
            <button
              type="button"
              onClick={() => adjustFont(-0.1)}
              className="rounded-full p-1 text-slate-300 hover:bg-slate-800 disabled:opacity-35"
              title="字号 -"
              disabled={fontScale <= 0.86}
            >
              <ALargeSmall size={14} />
            </button>
            <button
              type="button"
              onClick={() => adjustFont(0.1)}
              className="rounded-full p-1 text-slate-300 hover:bg-slate-800 disabled:opacity-35"
              title="字号 +"
              disabled={fontScale >= 1.39}
            >
              <Type size={14} />
            </button>
          </div>
        </div>

        {/* Row 2: progress bar (seekable) */}
        <div
          ref={progressRef}
          onClick={(e) => handleSeek(e.clientX)}
          onTouchStart={(e) => handleSeek(e.touches[0].clientX)}
          className="group relative h-1.5 cursor-pointer rounded-full bg-slate-800/80"
        >
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-blue-500 transition-all duration-200"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
