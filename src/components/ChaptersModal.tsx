import React from 'react';
import { X, List } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export function ChaptersModal({ onClose }: { onClose: () => void }) {
  const { chapters, currentIndex, setCurrentIndex } = useAppStore();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
            <List size={24} className="text-blue-400" />
            章节目录
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto p-4 space-y-2">
          {chapters.map((chapter, i) => {
            const isCurrent = currentIndex >= chapter.index && (i === chapters.length - 1 || currentIndex < chapters[i + 1].index);
            return (
              <button
                key={i}
                onClick={() => {
                  setCurrentIndex(chapter.index);
                  onClose();
                }}
                className={`w-full text-left p-4 rounded-2xl transition-all ${
                  isCurrent 
                    ? 'bg-blue-600/20 border border-blue-500/30 text-blue-300' 
                    : 'bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="font-medium leading-relaxed">{chapter.title}</div>
                <div className="text-xs mt-2 opacity-50">跳转至第 {chapter.index + 1} 句</div>
              </button>
            );
          })}
          {chapters.length === 0 && (
            <div className="text-center py-10 text-slate-500">
              暂无章节信息
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
