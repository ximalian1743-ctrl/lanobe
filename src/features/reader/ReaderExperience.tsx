import React, { useCallback, useState } from 'react';
import { Loader2, UploadCloud } from 'lucide-react';
import { Header } from '../../components/Header';
import { Controls } from '../../components/Controls';
import { EntryList } from '../../components/EntryList';
import { SettingsModal } from '../../components/SettingsModal';
import { useAudioQueue } from '../../hooks/useAudioQueue';
import { useAppStore } from '../../store/useAppStore';
import { useLoadContent } from '../../hooks/useLoadContent';
import { useUiText } from '../../hooks/useUiText';

interface ReaderExperienceProps {
  showHeader?: boolean;
  topInsetClassName?: string;
  returnTo?: string;
}

export function ReaderExperience({ showHeader = true, topInsetClassName, returnTo }: ReaderExperienceProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const { isGeneratingChapters } = useAppStore();
  const { loadContent } = useLoadContent();
  const { text } = useUiText();

  useAudioQueue();

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setIsDragging(false);
      const file = event.dataTransfer.files?.[0];
      if (file && file.name.endsWith('.txt')) {
        const reader = new FileReader();
        reader.onload = (loadEvent) => {
          const textContent = loadEvent.target?.result as string;
          loadContent(textContent);
        };
        reader.readAsText(file);
      }
    },
    [loadContent],
  );

  return (
    <div
      className="relative flex h-screen flex-col overflow-hidden bg-slate-950 font-sans text-slate-200 selection:bg-blue-500/30"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 z-[70] m-4 flex flex-col items-center justify-center rounded-3xl border-4 border-dashed border-blue-500/50 bg-slate-950/80 backdrop-blur-md transition-all duration-300">
          <div className="scale-110 text-center transition-transform duration-300">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-blue-500/20 shadow-[0_0_40px_rgba(59,130,246,0.3)]">
              <UploadCloud size={48} className="animate-bounce text-blue-400" />
            </div>
            <h2 className="mb-3 text-3xl font-bold tracking-tight text-white">{text.reader.dropTitle}</h2>
            <p className="text-lg text-blue-200/80">{text.reader.dropHint}</p>
          </div>
        </div>
      )}

      {isGeneratingChapters && (
        <div className="absolute inset-0 z-[70] flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md">
          <Loader2 size={48} className="mb-4 animate-spin text-blue-500" />
          <h2 className="mb-2 text-2xl font-bold text-white">{text.reader.generatingChapters}</h2>
          <p className="text-slate-400">{text.reader.generatingHint}</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pb-28 md:pb-32">
        <div className={['mx-auto max-w-5xl p-4 md:p-5 lg:p-6', topInsetClassName ?? ''].join(' ')}>
          {showHeader ? <Header onOpenSettings={() => setShowSettings(true)} onOpenChapters={() => undefined} /> : null}
          {!isGeneratingChapters && <EntryList />}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-[60]">
        <Controls
          onOpenSettings={() => setShowSettings(true)}
          returnTo={returnTo}
        />
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}
