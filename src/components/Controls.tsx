import { Play, Square, SkipForward, SkipBack, Search, Target, Volume2, LocateFixed } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useState, useEffect } from 'react';

export function Controls() {
  const { isPlaying, setIsPlaying, autoNext, setAutoNext, entries, currentIndex, setCurrentIndex, triggerLocate } = useAppStore();
  const [search, setSearch] = useState('');
  const [jumpPercent, setJumpPercent] = useState(0);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying(!isPlaying);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        setCurrentIndex(Math.max(0, currentIndex - 1));
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        setCurrentIndex(Math.min(entries.length - 1, currentIndex + 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, currentIndex, entries.length, setIsPlaying, setCurrentIndex]);

  const handleSearch = () => {
    if (!search) return;
    const idx = entries.findIndex(e => e.jp.includes(search) || e.ch.includes(search) || e.words.some(w => w[0].includes(search) || w[1].includes(search)));
    if (idx !== -1) setCurrentIndex(idx);
  };

  const handleJump = () => {
    if (entries.length === 0) return;
    const idx = Math.floor((jumpPercent / 100) * (entries.length - 1));
    setCurrentIndex(Math.max(0, Math.min(idx, entries.length - 1)));
  };

  return (
    <div className="bg-slate-900/95 backdrop-blur-2xl border-t border-slate-800/80 p-3 md:p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.4)] rounded-t-3xl md:rounded-none">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        
        {/* Playback Controls */}
        <div className="flex items-center justify-between md:justify-start gap-4 w-full md:w-auto">
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center justify-center gap-2 w-14 h-14 md:w-28 md:h-12 rounded-2xl md:rounded-xl font-bold transition-all ${
              isPlaying 
                ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20' 
                : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20'
            }`}
          >
            {isPlaying ? <Square size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
            <span className="hidden md:inline">{isPlaying ? '停止' : '播放'}</span>
          </button>
          
          <div className="flex items-center gap-1 bg-slate-950/60 p-1.5 rounded-2xl border border-slate-800/60 shadow-inner">
            <button 
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))} 
              className="p-2.5 md:p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors active:scale-95"
              title="上一句 (左方向键)"
            >
              <SkipBack size={20} />
            </button>
            <div className="px-2 md:px-4 text-sm font-semibold text-slate-300 min-w-[80px] md:min-w-[100px] text-center flex items-center justify-center gap-1.5">
              {isPlaying && <Volume2 size={14} className="text-blue-400 animate-pulse" />}
              {entries.length > 0 ? `${currentIndex + 1} / ${entries.length}` : '0 / 0'}
            </div>
            <button 
              onClick={() => setCurrentIndex(Math.min(entries.length - 1, currentIndex + 1))} 
              className="p-2.5 md:p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors active:scale-95"
              title="下一句 (右方向键)"
            >
              <SkipForward size={20} />
            </button>
          </div>

          <button
            onClick={triggerLocate}
            className="p-3 md:p-2.5 bg-slate-800/50 hover:bg-slate-700 text-blue-400 rounded-2xl md:rounded-xl border border-slate-700/50 transition-all active:scale-95 shadow-sm"
            title="定位到当前播放位置"
          >
            <LocateFixed size={20} />
          </button>
        </div>

        {/* Search & Jump */}
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer group whitespace-nowrap bg-slate-950/40 px-3 py-2 rounded-xl border border-slate-800/50">
            <div className="relative flex items-center justify-center">
              <input 
                type="checkbox" 
                checked={autoNext} 
                onChange={(e) => setAutoNext(e.target.checked)}
                className="peer sr-only"
              />
              <div className="w-9 h-5 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
            </div>
            <span className="group-hover:text-white transition-colors font-medium">自动连播</span>
          </label>

          <div className="flex items-center bg-slate-950/60 rounded-xl border border-slate-800/60 p-1 flex-1 md:flex-none min-w-[140px]">
            <input 
              type="text" 
              placeholder="搜索..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="bg-transparent border-none px-3 py-1.5 text-sm text-slate-200 focus:outline-none w-full md:w-28 placeholder:text-slate-500"
            />
            <button onClick={handleSearch} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
              <Search size={16} />
            </button>
          </div>
          
          <div className="flex items-center bg-slate-950/60 rounded-xl border border-slate-800/60 p-1 min-w-[100px]">
            <input 
              type="number" 
              min="0" max="100"
              value={jumpPercent}
              onChange={(e) => setJumpPercent(Number(e.target.value))}
              className="bg-transparent border-none px-2 py-1.5 text-sm text-slate-200 focus:outline-none w-12 text-center"
            />
            <span className="text-slate-500 text-sm pr-1">%</span>
            <button onClick={handleJump} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
              <Target size={16} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
