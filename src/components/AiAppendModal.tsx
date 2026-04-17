import { useState } from 'react';
import { ArrowLeft, Loader2, Plus, Sparkles, X } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useEscClose } from '../hooks/useModalDismiss';
import { useUiText } from '../hooks/useUiText';
import { runAiAnnotate, AI_MAX_CHARS } from '../services/aiAnnotate';
import { useToast } from './Toast';

interface AiAppendModalProps {
  onClose: () => void;
}

export function AiAppendModal({ onClose }: AiAppendModalProps) {
  const settings = useAppStore((s) => s.settings);
  const batchAiProgress = useAppStore((s) => s.batchAiProgress);
  const aiBusy = !!batchAiProgress;
  const queueAhead = batchAiProgress?.queueAhead ?? 0;
  const { text: ui, format } = useUiText();
  const t = ui.aiAppend;
  const { toast } = useToast();
  const [text, setText] = useState('');
  // Always allow ESC to dismiss — AI keeps running in background via the banner.
  useEscClose(onClose);

  const handleSubmit = () => {
    const value = text.trim();
    if (!value) {
      toast(t.emptyError, 'error');
      return;
    }
    if (value.length > AI_MAX_CHARS) {
      toast(format(t.tooLongError, { n: AI_MAX_CHARS }), 'error');
      return;
    }
    // Enqueue. If a batch is already running, this joins the queue and will
    // run after. If idle, it starts immediately. Either way, the banner is
    // the source of truth — closing the modal is safe.
    void runAiAnnotate({ text: value, settings, mode: 'append', toast });
    if (aiBusy) {
      toast(t.queuedToast, 'info');
    }
    setText('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/80 p-0 backdrop-blur-sm md:items-center md:p-4"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-2xl flex-col overflow-hidden rounded-t-[28px] border border-slate-800 bg-slate-950 shadow-2xl md:rounded-[28px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 px-5 py-4">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-200">
              <Sparkles size={12} />
              {t.badge}
            </div>
            <h2 className="mt-2 text-lg font-bold text-slate-100">{t.title}</h2>
            <p className="mt-1 text-xs leading-5 text-slate-400">{t.description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-700/80 bg-slate-900 p-2 text-slate-400 transition-colors hover:border-slate-500 hover:text-white"
            aria-label={t.closeLabel}
            title={t.closeTooltip}
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-3 px-5 py-4">
          {aiBusy ? (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs leading-6 text-amber-100">
              <div className="flex items-center gap-2 font-semibold">
                <Loader2 size={13} className="animate-spin" />
                {t.inflightTitle}
                {queueAhead > 0 ? format(t.inflightQueue, { n: queueAhead }) : ''}
              </div>
              <p className="mt-1 text-amber-200/80">{t.inflightHint}</p>
            </div>
          ) : null}

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={format(t.placeholder, { n: AI_MAX_CHARS })}
            rows={8}
            className="w-full resize-y rounded-2xl border border-slate-700/60 bg-slate-900/70 px-3 py-2.5 text-sm leading-7 text-slate-100 outline-none transition-colors placeholder:text-slate-600 focus:border-amber-400/60"
          />
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>{t.lengthHint}</span>
            <span>{text.length} / {AI_MAX_CHARS}</span>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:border-slate-500 hover:text-slate-100"
            >
              <ArrowLeft size={13} />
              {aiBusy ? t.cancelBusy : t.cancel}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={text.trim().length === 0}
              className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2 text-xs font-bold text-slate-900 shadow-lg shadow-amber-500/20 transition-all hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none"
              title={aiBusy ? t.submitBusyTooltip : ''}
            >
              <Plus size={14} />
              {aiBusy ? t.submitBusy : t.submit}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
