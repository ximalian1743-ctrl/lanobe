import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useAppStore, buildEntryKey } from '../store/useAppStore';
import { useEscClose } from '../hooks/useModalDismiss';
import { useToast } from './Toast';

interface NoteEditorModalProps {
  slug: string;
  volumeId: string;
  entryIndex: number;
  entryPreview: string;
  onClose: () => void;
}

export function NoteEditorModal({ slug, volumeId, entryIndex, entryPreview, onClose }: NoteEditorModalProps) {
  useEscClose(onClose);
  const key = buildEntryKey(slug, volumeId, entryIndex);
  const existing = useAppStore((s) => s.notes[key]);
  const setNote = useAppStore((s) => s.setNote);
  const { toast } = useToast();
  const [text, setText] = useState(existing?.text ?? '');

  useEffect(() => {
    setText(existing?.text ?? '');
  }, [existing?.text]);

  function save() {
    setNote(slug, volumeId, entryIndex, text);
    toast(text.trim() ? '笔记已保存' : '笔记已清空', 'success');
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[85] flex items-end justify-center bg-slate-950/80 p-4 backdrop-blur-sm md:items-center"
      onClick={onClose}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 px-5 py-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-400">笔记 · 第 {entryIndex + 1} 行</p>
            <p className="mt-1 truncate text-sm text-slate-300">{entryPreview}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="在这里写下你的笔记…（留空保存可删除）"
            rows={8}
            autoFocus
            className="w-full rounded-2xl border border-slate-700 bg-slate-950/60 p-4 text-sm leading-relaxed text-slate-100 placeholder:text-slate-600 focus:border-blue-500/50 focus:outline-none"
          />
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-800 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-200 hover:border-slate-500"
          >
            取消
          </button>
          <button
            type="button"
            onClick={save}
            className="rounded-full bg-blue-500 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white hover:bg-blue-400"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
