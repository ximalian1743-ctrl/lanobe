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
    <div className="sticky top-0 z-[50] border-b-2 border-amber-400/50 bg-amber-500/20 px-4 py-2.5 shadow-[0_4px_20px_rgba(251,191,36,0.25)] backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center gap-3">
        <Sparkles size={18} className="shrink-0 animate-pulse text-amber-300" />
        <span className="shrink-0 text-sm font-bold text-amber-50">{progress.label}</span>
        <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-amber-900/40">
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.6)] transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="shrink-0 font-mono text-xs font-semibold text-amber-100">
          {progress.done} / {progress.total}
        </span>
        {progress.onCancel ? (
          <button
            type="button"
            onClick={() => progress.onCancel?.()}
            className="shrink-0 rounded-full p-1.5 text-amber-100 hover:bg-amber-500/30"
            aria-label="中止"
            title="中止"
          >
            <X size={14} />
          </button>
        ) : null}
      </div>
    </div>
  );
}
