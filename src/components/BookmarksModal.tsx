import { useMemo } from 'react';
import { Bookmark, Trash2 } from 'lucide-react';
import { useAppStore, buildEntryKey } from '../store/useAppStore';
import { BottomSheet } from './BottomSheet';

interface BookmarksModalProps {
  slug?: string;
  volumeId?: string;
  onClose: () => void;
}

export function BookmarksModal({ slug, volumeId, onClose }: BookmarksModalProps) {
  const bookmarks = useAppStore((s) => s.bookmarks);
  const removeBookmark = useAppStore((s) => s.removeBookmark);
  const setCurrentIndex = useAppStore((s) => s.setCurrentIndex);

  const relevant = useMemo(() => {
    const all = Object.values(bookmarks);
    const filtered =
      slug && volumeId ? all.filter((b) => b.slug === slug && b.volumeId === volumeId) : all;
    return filtered.sort((a, b) => a.entryIndex - b.entryIndex);
  }, [bookmarks, slug, volumeId]);

  return (
    <BottomSheet
      open
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <Bookmark size={18} className="text-amber-400" />
          我的书签 <span className="text-xs font-normal text-slate-500">({relevant.length})</span>
        </span>
      }
    >
      {relevant.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">
          暂无书签，阅读时点击 📖 图标添加
        </p>
      ) : (
        <ul className="space-y-2">
          {relevant.map((bm) => (
            <li
              key={buildEntryKey(bm.slug, bm.volumeId, bm.entryIndex)}
              className="group flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-3 hover:border-amber-500/40"
            >
              <button
                type="button"
                onClick={() => {
                  setCurrentIndex(bm.entryIndex);
                  onClose();
                }}
                className="flex-1 text-left"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-400">
                  #{bm.entryIndex + 1}
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-slate-200">{bm.preview || '(无预览)'}</p>
              </button>
              <button
                type="button"
                onClick={() =>
                  removeBookmark(buildEntryKey(bm.slug, bm.volumeId, bm.entryIndex))
                }
                className="rounded-lg p-1.5 text-slate-500 opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
                title="删除书签"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </BottomSheet>
  );
}
