import { Sparkles, X } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

/**
 * Persistent progress banner for batch operations (e.g. batch AI explanations).
 * Shown at the top of the app regardless of modal state so users can track
 * progress even after closing the dialog where they started the work.
 */
export function BatchProgressBanner() {
  const progress = useAppStore((s) => s.batchAiProgress);
  if (!progress) return null;

  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="sticky top-0 z-[45] border-b border-amber-500/20 bg-amber-500/10 px-4 py-1.5 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center gap-3">
        <Sparkles size={14} className="shrink-0 animate-pulse text-amber-300" />
        <span className="shrink-0 text-xs font-semibold text-amber-100">{progress.label}</span>
        <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-amber-900/30">
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-amber-400 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="shrink-0 font-mono text-[11px] text-amber-200">
          {progress.done} / {progress.total}
        </span>
        {progress.onCancel ? (
          <button
            type="button"
            onClick={() => progress.onCancel?.()}
            className="shrink-0 rounded-full p-1 text-amber-200 hover:bg-amber-500/20"
            aria-label="中止"
            title="中止"
          >
            <X size={12} />
          </button>
        ) : null}
      </div>
    </div>
  );
}
