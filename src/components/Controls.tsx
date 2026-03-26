import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LocateFixed, Play, Settings, SkipBack, SkipForward, Square, Volume2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useUiText } from '../hooks/useUiText';

interface ControlsProps {
  onOpenSettings: () => void;
  returnTo?: string;
}

export function Controls({ onOpenSettings, returnTo }: ControlsProps) {
  const { isPlaying, setIsPlaying, autoNext, entries, currentIndex, setCurrentIndex, triggerLocate } = useAppStore();
  const { text } = useUiText();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying(!isPlaying);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        setCurrentIndex(Math.max(0, currentIndex - 1));
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        setCurrentIndex(Math.min(entries.length - 1, currentIndex + 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, entries.length, isPlaying, setCurrentIndex, setIsPlaying]);

  const canNavigate = entries.length > 0;

  return (
    <div className="border-t border-slate-800/80 bg-slate-900/95 p-2.5 shadow-[0_-10px_40px_rgba(0,0,0,0.4)] backdrop-blur-2xl md:p-3">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {returnTo && (
            <Link
              to={returnTo}
              className="inline-flex items-center gap-2 rounded-full border border-orange-300/20 bg-orange-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-orange-100 transition-colors hover:border-orange-300/45 hover:bg-orange-500/15"
            >
              {text.reader.returnShelf}
            </Link>
          )}

          <div className="flex items-center gap-1 rounded-full border border-slate-800/70 bg-slate-950/65 p-1 shadow-inner">
            <button
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white disabled:opacity-35"
              title={text.controls.previous}
              disabled={!canNavigate || currentIndex === 0}
            >
              <SkipBack size={18} />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={[
                'flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition-all',
                isPlaying
                  ? 'border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20'
                  : 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500',
              ].join(' ')}
            >
              {isPlaying ? <Square size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
              <span>{isPlaying ? text.controls.stop : text.controls.play}</span>
            </button>
            <button
              onClick={() => setCurrentIndex(Math.min(entries.length - 1, currentIndex + 1))}
              className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white disabled:opacity-35"
              title={text.controls.next}
              disabled={!canNavigate || currentIndex >= entries.length - 1}
            >
              <SkipForward size={18} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1.5 rounded-full border border-slate-800/70 bg-slate-950/65 px-3 py-2 text-xs font-semibold text-slate-300 md:inline-flex">
            {isPlaying && <Volume2 size={13} className="animate-pulse text-blue-400" />}
            {entries.length > 0 ? `${currentIndex + 1} / ${entries.length}` : '0 / 0'}
            <span className="text-slate-500">·</span>
            <span className="text-slate-400">{autoNext ? text.controls.autoNextOn : text.controls.autoNextOff}</span>
          </div>
          <button
            onClick={triggerLocate}
            className="rounded-full border border-slate-700/50 bg-slate-800/50 p-2.5 text-blue-400 shadow-sm transition-all hover:bg-slate-700 hover:text-blue-300 disabled:opacity-35"
            title={text.controls.locateAction}
            disabled={!canNavigate}
          >
            <LocateFixed size={18} />
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-100 transition-colors hover:border-slate-500"
          >
            <Settings size={14} />
            {text.common.settings}
          </button>
        </div>
      </div>
    </div>
  );
}
