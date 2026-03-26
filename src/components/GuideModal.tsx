import { X } from 'lucide-react';

interface GuideModalProps {
  title: string;
  summary: string;
  steps: string[];
  closeLabel: string;
  onClose: () => void;
}

export function GuideModal({ title, summary, steps, closeLabel, onClose }: GuideModalProps) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/82 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 px-5 py-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">{summary}</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3 px-5 py-5">
          {steps.map((step, index) => (
            <div key={`${index}-${step}`} className="flex gap-3 rounded-2xl border border-slate-800/70 bg-slate-950/50 p-4">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-400 font-bold text-stone-950">
                {index + 1}
              </div>
              <p className="text-sm leading-6 text-slate-200">{step}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-end border-t border-slate-800 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-orange-400 px-5 py-2.5 text-sm font-bold text-stone-950 transition-transform hover:-translate-y-0.5"
          >
            {closeLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
