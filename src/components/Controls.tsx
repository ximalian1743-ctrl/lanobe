import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookCopy,
  LocateFixed,
  Play,
  Search,
  Settings,
  SkipBack,
  SkipForward,
  Square,
  Target,
  Volume2,
  BookOpenText,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useUiText } from '../hooks/useUiText';
import { LanguageSwitcher } from './LanguageSwitcher';

interface ControlsProps {
  onOpenSettings: () => void;
  onOpenChapters: () => void;
  onOpenVolumePanel?: () => void;
  returnTo?: string;
}

export function Controls({ onOpenSettings, onOpenChapters, onOpenVolumePanel, returnTo }: ControlsProps) {
  const { isPlaying, setIsPlaying, autoNext, setAutoNext, entries, currentIndex, setCurrentIndex, triggerLocate } = useAppStore();
  const [search, setSearch] = useState('');
  const [jumpPercent, setJumpPercent] = useState(0);
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

  const handleSearch = () => {
    if (!search) return;
    const idx = entries.findIndex(
      (entry) =>
        entry.jp.includes(search) ||
        entry.ch.includes(search) ||
        entry.words.some((word) => word[0].includes(search) || word[1].includes(search)),
    );
    if (idx !== -1) {
      setCurrentIndex(idx);
    }
  };

  const handleJump = () => {
    if (entries.length === 0) return;
    const idx = Math.floor((jumpPercent / 100) * (entries.length - 1));
    setCurrentIndex(Math.max(0, Math.min(idx, entries.length - 1)));
  };

  const canNavigate = entries.length > 0;

  return (
    <div className="rounded-t-3xl border-t border-slate-800/80 bg-slate-900/95 p-3 shadow-[0_-10px_40px_rgba(0,0,0,0.4)] backdrop-blur-2xl md:rounded-none md:p-4">
      <div className="mx-auto flex max-w-5xl flex-col gap-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={[
                'flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition-all md:rounded-xl md:px-5 md:py-3',
                isPlaying
                  ? 'border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20'
                  : 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500',
              ].join(' ')}
            >
              {isPlaying ? <Square size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
              <span>{isPlaying ? text.controls.stop : text.controls.play}</span>
            </button>

            <div className="flex items-center gap-1 rounded-2xl border border-slate-800/60 bg-slate-950/60 p-1.5 shadow-inner">
              <button
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white disabled:opacity-35"
                title={text.controls.previous}
                disabled={!canNavigate || currentIndex === 0}
              >
                <SkipBack size={20} />
              </button>
              <div className="flex min-w-[100px] items-center justify-center gap-1.5 px-3 text-sm font-semibold text-slate-300">
                {isPlaying && <Volume2 size={14} className="animate-pulse text-blue-400" />}
                {entries.length > 0 ? `${currentIndex + 1} / ${entries.length}` : '0 / 0'}
              </div>
              <button
                onClick={() => setCurrentIndex(Math.min(entries.length - 1, currentIndex + 1))}
                className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white disabled:opacity-35"
                title={text.controls.next}
                disabled={!canNavigate || currentIndex >= entries.length - 1}
              >
                <SkipForward size={20} />
              </button>
            </div>

            <button
              onClick={triggerLocate}
              className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-3 text-blue-400 shadow-sm transition-all hover:bg-slate-700 hover:text-blue-300 disabled:opacity-35 md:rounded-xl"
              title={text.controls.locateAction}
              disabled={!canNavigate}
            >
              <LocateFixed size={20} />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onOpenSettings}
              className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-100 transition-colors hover:border-slate-500"
            >
              <Settings size={14} />
              {text.common.settings}
            </button>
            <button
              type="button"
              onClick={onOpenChapters}
              className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-100 transition-colors hover:border-slate-500 disabled:opacity-40"
              disabled={!canNavigate}
            >
              <BookOpenText size={14} />
              {text.common.chapters}
            </button>
            {onOpenVolumePanel && (
              <button
                type="button"
                onClick={onOpenVolumePanel}
                className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-100 transition-colors hover:border-slate-500"
              >
                <BookCopy size={14} />
                {text.reader.openVolumes}
              </button>
            )}
            {returnTo && (
              <Link
                to={returnTo}
                className="inline-flex items-center gap-2 rounded-full border border-orange-300/20 bg-orange-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-orange-100 transition-colors hover:border-orange-300/45 hover:bg-orange-500/15"
              >
                {text.reader.returnShelf}
              </Link>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="group flex items-center gap-3 rounded-xl border border-slate-800/50 bg-slate-950/40 px-3 py-2 text-sm text-slate-300">
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={autoNext}
                  onChange={(e) => setAutoNext(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="h-5 w-9 rounded-full bg-slate-700 peer-checked:bg-blue-500 peer-checked:after:translate-x-full after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-['']"></div>
              </div>
              <span className="font-medium transition-colors group-hover:text-white">{text.controls.autoNext}</span>
            </label>
            <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200/90">
              {text.controls.utilitySaved}
            </div>
            <LanguageSwitcher compact />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center xl:justify-end">
            <div className="flex min-w-[190px] flex-1 items-center rounded-xl border border-slate-800/60 bg-slate-950/60 p-1 sm:flex-none">
              <input
                type="text"
                placeholder={text.controls.searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full bg-transparent px-3 py-1.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none"
              />
              <button
                onClick={handleSearch}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
                title={text.controls.searchAction}
              >
                <Search size={16} />
              </button>
            </div>

            <div className="flex items-center rounded-xl border border-slate-800/60 bg-slate-950/60 p-1">
              <input
                type="number"
                min="0"
                max="100"
                value={jumpPercent}
                onChange={(e) => setJumpPercent(Number(e.target.value))}
                className="w-14 bg-transparent px-2 py-1.5 text-center text-sm text-slate-200 focus:outline-none"
              />
              <span className="pr-1 text-sm text-slate-500">%</span>
              <button
                onClick={handleJump}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
                title={text.controls.jumpAction}
              >
                <Target size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

