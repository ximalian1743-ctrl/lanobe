import { useState } from 'react';
import { Loader2, Plus, Sparkles, X } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useEscClose } from '../hooks/useModalDismiss';
import { runAiAnnotate, AI_MAX_CHARS } from '../services/aiAnnotate';
import { useToast } from './Toast';

interface AiAppendModalProps {
  onClose: () => void;
}

export function AiAppendModal({ onClose }: AiAppendModalProps) {
  const settings = useAppStore((s) => s.settings);
  const batchAiProgress = useAppStore((s) => s.batchAiProgress);
  const aiBusy = !!batchAiProgress;
  const { toast } = useToast();
  const [text, setText] = useState('');
  useEscClose(onClose, !aiBusy);

  const handleSubmit = async () => {
    if (aiBusy) return;
    const ok = await runAiAnnotate({
      text,
      settings,
      mode: 'append',
      toast,
    });
    if (ok) {
      setText('');
      onClose();
    }
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
              AI 追加段落
            </div>
            <h2 className="mt-2 text-lg font-bold text-slate-100">继续粘贴下一段日文</h2>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              AI 分句并注音后会追加到当前阅读列表末尾，不会打断正在播放的进度。
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={aiBusy}
            className="rounded-2xl border border-slate-700/80 bg-slate-900 p-2 text-slate-400 transition-colors hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="关闭"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-3 px-5 py-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`粘贴日文段落，AI 会自动切分为句子、标注平假名并翻译为中文（最多 ${AI_MAX_CHARS} 字）`}
            rows={8}
            disabled={aiBusy}
            className="w-full resize-y rounded-2xl border border-slate-700/60 bg-slate-900/70 px-3 py-2.5 text-sm leading-7 text-slate-100 outline-none transition-colors placeholder:text-slate-600 focus:border-amber-400/60 disabled:opacity-60"
          />
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>建议每次 200 ~ 5000 字；更长也支持但分段更多。</span>
            <span>{text.length} / {AI_MAX_CHARS}</span>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={aiBusy}
              className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={aiBusy || text.trim().length === 0}
              className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2 text-xs font-bold text-slate-900 shadow-lg shadow-amber-500/20 transition-all hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none"
            >
              {aiBusy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              {aiBusy ? 'AI 处理中…' : '追加并 AI 处理'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
