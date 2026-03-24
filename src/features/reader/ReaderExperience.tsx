import React, { useCallback, useState } from 'react';
import { UploadCloud, Loader2 } from 'lucide-react';
import { Header } from '../../components/Header';
import { Controls } from '../../components/Controls';
import { EntryList } from '../../components/EntryList';
import { SettingsModal } from '../../components/SettingsModal';
import { ChaptersModal } from '../../components/ChaptersModal';
import { useAudioQueue } from '../../hooks/useAudioQueue';
import { useAppStore } from '../../store/useAppStore';
import { useLoadContent } from '../../hooks/useLoadContent';

export function ReaderExperience() {
  const [showSettings, setShowSettings] = useState(false);
  const [showChapters, setShowChapters] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const { isGeneratingChapters } = useAppStore();
  const { loadContent } = useLoadContent();

  useAudioQueue();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        loadContent(text);
      };
      reader.readAsText(file);
    }
  }, [loadContent]);

  return (
    <div
      className="h-screen flex flex-col bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30 overflow-hidden relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-md border-4 border-blue-500/50 border-dashed m-4 rounded-3xl flex flex-col items-center justify-center transition-all duration-300">
          <div className="text-center transform scale-110 transition-transform duration-300">
            <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(59,130,246,0.3)]">
              <UploadCloud size={48} className="text-blue-400 animate-bounce" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">Drop your text file here</h2>
            <p className="text-blue-200/80 text-lg">TXT files are supported for the current reader workflow.</p>
          </div>
        </div>
      )}

      {isGeneratingChapters && (
        <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center">
          <Loader2 size={48} className="text-blue-500 animate-spin mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Generating chapter structure with AI...</h2>
          <p className="text-slate-400">Please wait a moment while the reader prepares the book.</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pb-40 md:pb-32">
        <div className="max-w-5xl mx-auto p-4 md:p-6 lg:p-8">
          <Header onOpenSettings={() => setShowSettings(true)} onOpenChapters={() => setShowChapters(true)} />
          {!isGeneratingChapters && <EntryList />}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-40">
        <Controls />
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showChapters && <ChaptersModal onClose={() => setShowChapters(false)} />}
    </div>
  );
}
