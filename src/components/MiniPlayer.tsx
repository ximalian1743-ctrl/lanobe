import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  LocateFixed,
  Pause,
  Play,
  Plus,
  Settings,
  SkipBack,
  SkipForward,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

interface MiniPlayerProps {
  onOpenSettings: () => void;
  onOpenAi: () => void;
  onOpenChapters?: () => void;
  onOpenAiAppend?: () => void;
  hidden?: boolean;
}

/**
 * Compact floating player anchored bottom-right. Collapsed state shows a
 * single circular play button. Expanded state reveals prev/next, locate,
 * settings, AI in a horizontal pill. Keeps reader content free of a
 * permanent chrome bar.
 */
export function MiniPlayer({ onOpenSettings, onOpenAi, onOpenChapters, onOpenAiAppend, hidden }: MiniPlayerProps) {
  const [expanded, setExpanded] = useState(false);
  const {
    isPlaying,
    setIsPlaying,
    entries,
    currentIndex,
    setCurrentIndex,
    triggerLocate,
    settings,
  } = useAppStore();
  const hasAi = Boolean(settings.aiApiBase?.trim() && settings.aiApiKey?.trim() && settings.aiModel?.trim());
  const canNav = entries.length > 0;

  if (hidden) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[55] flex flex-col items-end gap-2"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {expanded ? (
        <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-slate-700/70 bg-slate-900/95 px-2 py-1.5 shadow-2xl backdrop-blur-md">
          <button
            type="button"
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={!canNav || currentIndex === 0}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-300 hover:bg-slate-800 disabled:opacity-30"
            title="上一句"
          >
            <SkipBack size={16} />
          </button>
          <button
            type="button"
            onClick={() => setCurrentIndex(Math.min(entries.length - 1, currentIndex + 1))}
            disabled={!canNav || currentIndex >= entries.length - 1}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-300 hover:bg-slate-800 disabled:opacity-30"
            title="下一句"
          >
            <SkipForward size={16} />
          </button>
          <div className="mx-1 h-5 w-px bg-slate-700" />
          <button
            type="button"
            onClick={triggerLocate}
            disabled={!canNav}
            className="flex h-9 w-9 items-center justify-center rounded-full text-blue-400 hover:bg-slate-800"
            title="定位当前行"
          >
            <LocateFixed size={16} />
          </button>
          {onOpenChapters ? (
            <button
              type="button"
              onClick={onOpenChapters}
              className="flex h-9 items-center gap-1 rounded-full px-3 text-slate-300 hover:bg-slate-800"
              title="章节"
            >
              <span className="text-xs font-semibold">章节</span>
            </button>
          ) : null}
          {hasAi ? (
            <button
              type="button"
              onClick={onOpenAi}
              disabled={!canNav}
              className="flex h-9 w-9 items-center justify-center rounded-full text-amber-300 hover:bg-slate-800 disabled:opacity-30"
              title="AI 讲解"
            >
              <Sparkles size={16} />
            </button>
          ) : null}
          {hasAi && onOpenAiAppend ? (
            <button
              type="button"
              onClick={onOpenAiAppend}
              className="flex h-9 w-9 items-center justify-center rounded-full text-amber-200 hover:bg-slate-800"
              title="AI 追加段落 · 继续粘贴更多日文"
            >
              <Plus size={16} />
            </button>
          ) : null}
          <button
            type="button"
            onClick={onOpenSettings}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-300 hover:bg-slate-800"
            title="设置"
          >
            <Settings size={16} />
          </button>
        </div>
      ) : null}

      <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-slate-700/70 bg-slate-900/95 p-1 shadow-2xl backdrop-blur-md">
        <button
          type="button"
          onClick={() => setIsPlaying(!isPlaying)}
          className={[
            'flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition-all',
            isPlaying ? 'bg-red-500 shadow-red-500/30' : 'bg-blue-500 shadow-blue-500/30',
          ].join(' ')}
          aria-label={isPlaying ? '停止' : '播放'}
          title={isPlaying ? '停止' : '播放'}
        >
          {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
        </button>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-300 hover:bg-slate-800 hover:text-slate-100"
          aria-label={expanded ? '收起更多控制' : '展开更多控制'}
          title={expanded ? '收起' : '前后 / 章节 / AI / 设置'}
        >
          {expanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
      </div>
    </div>
  );
}
