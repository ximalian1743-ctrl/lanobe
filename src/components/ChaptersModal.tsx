import React from 'react';
import { List, X } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useUiText } from '../hooks/useUiText';
import { useEscClose } from '../hooks/useModalDismiss';

export function ChaptersModal({ onClose }: { onClose: () => void }) {
  const { chapters, currentIndex, setCurrentIndex } = useAppStore();
  const { text, format } = useUiText();
  useEscClose(onClose);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-800 p-6">
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-200">
            <List size={24} className="text-blue-400" />
            {text.chaptersModal.title}
          </h2>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-2 overflow-y-auto p-4">
          {chapters.map((chapter, index) => {
            const isCurrent =
              currentIndex >= chapter.index && (index === chapters.length - 1 || currentIndex < chapters[index + 1].index);

            return (
              <button
                key={`${chapter.title}-${chapter.index}`}
                onClick={() => {
                  setCurrentIndex(chapter.index);
                  onClose();
                }}
                className={[
                  'w-full rounded-2xl border p-4 text-left transition-all',
                  isCurrent
                    ? 'border-blue-500/30 bg-blue-600/20 text-blue-300'
                    : 'border-slate-700/50 bg-slate-800/50 text-slate-300 hover:border-slate-600 hover:bg-slate-800',
                ].join(' ')}
              >
                <div className="font-medium leading-relaxed">{chapter.title}</div>
                <div className="mt-2 text-xs opacity-60">{format(text.chaptersModal.jumpToLine, { line: chapter.index + 1 })}</div>
              </button>
            );
          })}
          {chapters.length === 0 && <div className="py-10 text-center text-slate-500">{text.chaptersModal.empty}</div>}
        </div>
      </div>
    </div>
  );
}

