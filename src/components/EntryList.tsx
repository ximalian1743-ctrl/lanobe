import React, { useEffect, useRef, useState, useMemo, memo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { cn } from '../lib/utils';
import { Loader2, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight, Volume2 } from 'lucide-react';
import { Entry, AppSettings } from '../types';

const ITEMS_PER_PAGE = 50;

const EntryItem = memo(({ 
  entry, 
  originalIndex, 
  isActive, 
  isPlaying, 
  settings, 
  onSelect, 
  activeRef 
}: { 
  entry: Entry; 
  originalIndex: number; 
  isActive: boolean; 
  isPlaying: boolean; 
  settings: AppSettings; 
  onSelect: (index: number) => void; 
  activeRef: React.RefObject<HTMLLIElement> | null;
}) => {
  const isCached = useAppStore(state => !!state.audioCache[originalIndex]);
  const fetching = useAppStore(state => state.isFetching[originalIndex]);
  const fetchError = useAppStore(state => state.fetchErrors[originalIndex]);

  return (
    <li 
      ref={activeRef}
      onClick={() => onSelect(originalIndex)}
      className={cn(
        "p-4 md:p-6 rounded-2xl md:rounded-3xl border transition-all duration-300 cursor-pointer group relative overflow-hidden",
        isActive 
          ? (isPlaying 
              ? "bg-blue-900/20 border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.1)]" 
              : "bg-slate-800/80 border-slate-600 shadow-lg") 
          : "bg-slate-900/40 border-slate-800/50 hover:border-slate-700 hover:bg-slate-800/60"
      )}
    >
      {isActive && isPlaying && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
      )}

      <div className="flex justify-between items-start mb-3 md:mb-4">
        <span className={cn(
          "text-[11px] md:text-xs font-bold px-2 py-1 md:px-2.5 rounded-lg flex items-center gap-1.5",
          isActive ? "bg-blue-500/20 text-blue-400" : "bg-slate-800 text-slate-500 group-hover:bg-slate-700 group-hover:text-slate-400"
        )}>
          {isActive && isPlaying && <Volume2 size={12} className="animate-pulse" />}
          #{originalIndex + 1}
        </span>
        
        <div className="flex items-center gap-1.5 md:gap-2">
          {fetchError ? (
            <span className="flex items-center gap-1 text-[11px] md:text-xs font-medium text-red-400 bg-red-500/10 px-2 py-1 md:px-2.5 rounded-lg border border-red-500/20" title={fetchError}>
              <AlertCircle size={12} /> 加载失败
            </span>
          ) : fetching ? (
            <span className="flex items-center gap-1 text-[11px] md:text-xs font-medium text-yellow-500 bg-yellow-500/10 px-2 py-1 md:px-2.5 rounded-lg border border-yellow-500/20">
              <Loader2 size={12} className="animate-spin" /> 合成中
            </span>
          ) : isCached ? (
            <span className="flex items-center gap-1 text-[11px] md:text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 md:px-2.5 rounded-lg border border-emerald-500/20">
              <CheckCircle2 size={12} /> 已缓存
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] md:text-xs font-medium text-slate-500 bg-slate-800/50 px-2 py-1 md:px-2.5 rounded-lg border border-slate-700/50">
              <AlertCircle size={12} /> 未缓存
            </span>
          )}
        </div>
      </div>

      {settings.showJP && entry.jp && (
        <p className={cn(
          "text-lg md:text-2xl leading-relaxed mb-2 md:mb-3 transition-colors font-medium tracking-wide",
          isActive ? "text-blue-100" : "text-slate-200 group-hover:text-slate-100"
        )}>
          {settings.showFurigana ? entry.jp : entry.jp.replace(/\[[^\]]+\]/g, '')}
        </p>
      )}
      
      {settings.showZH && entry.ch && (
        <p className={cn(
          "text-sm md:text-lg leading-relaxed transition-colors",
          isActive ? "text-blue-300/80" : "text-slate-400 group-hover:text-slate-300"
        )}>
          {entry.ch}
        </p>
      )}

      {settings.showWords && entry.words.length > 0 && (
        <div className="flex flex-wrap gap-1.5 md:gap-2 mt-4 md:mt-5 pt-3 md:pt-4 border-t border-slate-800/50">
          {entry.words.map((w, i) => (
            <span key={i} className={cn(
              "inline-flex items-center gap-1.5 md:gap-2 text-[11px] md:text-sm border px-2 md:px-3 py-1 md:py-1.5 rounded-lg md:rounded-xl shadow-sm transition-colors",
              isActive ? "bg-blue-950/50 border-blue-800/50 text-blue-300" : "bg-slate-950/50 border-slate-800/80 text-slate-300"
            )}>
              <span className={isActive ? "text-blue-200 font-medium" : "text-blue-300 font-medium"}>{w[0]}</span>
              <span className={isActive ? "text-blue-800/50" : "text-slate-700"}>|</span>
              <span className={isActive ? "text-blue-300/80" : "text-slate-400"}>{w[1]}</span>
            </span>
          ))}
        </div>
      )}
    </li>
  );
});

export function EntryList() {
  const entries = useAppStore(state => state.entries);
  const currentIndex = useAppStore(state => state.currentIndex);
  const setCurrentIndex = useAppStore(state => state.setCurrentIndex);
  const isPlaying = useAppStore(state => state.isPlaying);
  const settings = useAppStore(state => state.settings);
  const locateTrigger = useAppStore(state => state.locateTrigger);
  
  const activeRef = useRef<HTMLLIElement>(null);
  
  const activePage = Math.floor(currentIndex / ITEMS_PER_PAGE);
  const [currentPage, setCurrentPage] = useState(activePage);

  useEffect(() => {
    setCurrentPage(Math.floor(currentIndex / ITEMS_PER_PAGE));
  }, [currentIndex]);

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentIndex, currentPage, locateTrigger]);

  const totalPages = Math.ceil(entries.length / ITEMS_PER_PAGE);
  
  const currentEntries = useMemo(() => {
    const start = currentPage * ITEMS_PER_PAGE;
    return entries.slice(start, start + ITEMS_PER_PAGE).map((entry, idx) => ({
      entry,
      originalIndex: start + idx
    }));
  }, [entries, currentPage]);

  if (entries.length === 0) {
    return (
      <div className="text-center py-32 text-slate-500 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/20">
        <p className="text-lg font-medium mb-2">暂无内容</p>
        <p className="text-sm text-slate-600">请点击上方按钮上传 TXT 文件或加载示例</p>
      </div>
    );
  }

  return (
    <div className="pb-32">
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-slate-900/80 backdrop-blur-sm p-3 rounded-2xl border border-slate-800 mb-6 shadow-sm">
          <button 
            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 disabled:opacity-30 hover:bg-slate-700 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm text-slate-400 font-medium tracking-wide">
            第 <span className="text-slate-200">{currentPage + 1}</span> / {totalPages} 页
          </span>
          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage === totalPages - 1}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 disabled:opacity-30 hover:bg-slate-700 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      <ul className="space-y-4">
        {currentEntries.map(({ entry, originalIndex }) => (
          <EntryItem
            key={entry.id}
            entry={entry}
            originalIndex={originalIndex}
            isActive={originalIndex === currentIndex}
            isPlaying={isPlaying}
            settings={settings}
            onSelect={setCurrentIndex}
            activeRef={originalIndex === currentIndex ? activeRef : null}
          />
        ))}
      </ul>

      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-slate-900/80 backdrop-blur-sm p-3 rounded-2xl border border-slate-800 mt-6 shadow-sm">
          <button 
            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 disabled:opacity-30 hover:bg-slate-700 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm text-slate-400 font-medium tracking-wide">
            第 <span className="text-slate-200">{currentPage + 1}</span> / {totalPages} 页
          </span>
          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage === totalPages - 1}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 disabled:opacity-30 hover:bg-slate-700 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
