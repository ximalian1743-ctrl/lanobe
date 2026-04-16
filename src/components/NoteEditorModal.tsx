import { useEffect, useState } from 'react';
import { useAppStore, buildEntryKey } from '../store/useAppStore';
import { BottomSheet } from './BottomSheet';
import { useToast } from './Toast';

interface NoteEditorModalProps {
  slug: string;
  volumeId: string;
  entryIndex: number;
  entryPreview: string;
  onClose: () => void;
}

export function NoteEditorModal({ slug, volumeId, entryIndex, entryPreview, onClose }: NoteEditorModalProps) {
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
    <BottomSheet
      open
      onClose={onClose}
      title={
        <span className="block">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-400">
            笔记 · 第 {entryIndex + 1} 行
          </span>
          <span className="mt-1 block truncate text-sm font-normal text-slate-300">{entryPreview}</span>
        </span>
      }
    >
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="写下你的笔记…（留空保存可删除）"
        rows={7}
        autoFocus
        className="w-full rounded-2xl border border-slate-700 bg-slate-950/60 p-4 text-sm leading-relaxed text-slate-100 placeholder:text-slate-600 focus:border-blue-500/50 focus:outline-none"
      />
      <div className="mt-4 flex justify-end gap-2">
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
    </BottomSheet>
  );
}
