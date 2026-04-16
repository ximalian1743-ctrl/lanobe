import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, UploadCloud } from 'lucide-react';
import { AiExplainModal } from '../../components/AiExplainModal';
import { Controls } from '../../components/Controls';
import { EntryList } from '../../components/EntryList';
import { Header } from '../../components/Header';
import { SettingsModal } from '../../components/SettingsModal';
import { TxtUploadPanel } from '../../components/TxtUploadPanel';
import { ReaderTopBar } from '../../components/ReaderTopBar';
import { BookmarksModal } from '../../components/BookmarksModal';
import { NoteEditorModal } from '../../components/NoteEditorModal';
import { WordLookupSheet } from '../../components/WordLookupSheet';
import { ChaptersModal } from '../../components/ChaptersModal';
import { useToast } from '../../components/Toast';
import { useAudioQueue } from '../../hooks/useAudioQueue';
import { useLoadContent } from '../../hooks/useLoadContent';
import { useAppStore } from '../../store/useAppStore';
import { useUiText } from '../../hooks/useUiText';
import { useReadingTimer } from '../../hooks/useReadingTimer';

interface ReaderExperienceProps {
  showHeader?: boolean;
  returnTo?: string;
  showEmptyUpload?: boolean;
  slug?: string;
  volumeId?: string;
}

export function ReaderExperience({
  showHeader = true,
  returnTo,
  showEmptyUpload = false,
  slug,
  volumeId,
}: ReaderExperienceProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [showAiExplain, setShowAiExplain] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showChapters, setShowChapters] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [noteEntryIdx, setNoteEntryIdx] = useState<number | null>(null);
  const [lookupWord, setLookupWord] = useState<string | null>(null);
  const {
    isGeneratingChapters,
    setIsPlaying,
    entries,
    currentIndex,
    isFetching,
    audioCache,
    settings,
  } = useAppStore();
  const { loadContent } = useLoadContent();
  const { text } = useUiText();
  const { toast } = useToast();

  useAudioQueue();
  useReadingTimer(slug, volumeId);

  // Apply theme to <html>
  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme ?? 'dark';
    return () => {
      // on unmount keep theme to avoid flashing on navigation
    };
  }, [settings.theme]);

  // Progress saved toast (debounced)
  const firstMount = useRef(true);
  const savedTimer = useRef<number | null>(null);
  useEffect(() => {
    if (firstMount.current) {
      firstMount.current = false;
      return;
    }
    if (entries.length === 0) return;
    if (savedTimer.current) window.clearTimeout(savedTimer.current);
    savedTimer.current = window.setTimeout(() => {
      toast('进度已保存', 'success');
    }, 600);
    return () => {
      if (savedTimer.current) window.clearTimeout(savedTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  // Audio state toast
  const lastAudioState = useRef<'idle' | 'fetching' | 'ready'>('idle');
  useEffect(() => {
    if (entries.length === 0) {
      lastAudioState.current = 'idle';
      return;
    }
    const fetching = !!isFetching[currentIndex];
    const ready = !!audioCache[currentIndex];
    let next: 'idle' | 'fetching' | 'ready' = 'idle';
    if (fetching) next = 'fetching';
    else if (ready) next = 'ready';

    if (next === 'fetching' && lastAudioState.current !== 'fetching') {
      toast('正在生成音频…', 'info');
    } else if (next === 'ready' && lastAudioState.current === 'fetching') {
      toast('音频已就绪', 'success');
    }
    lastAudioState.current = next;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, isFetching[currentIndex], audioCache[currentIndex]]);

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

  const handleOpenAiExplain = () => {
    setIsPlaying(false);
    setShowAiExplain(true);
  };

  const readingCtx = slug && volumeId ? { slug, volumeId } : null;
  const noteEntryPreview =
    noteEntryIdx !== null ? (entries[noteEntryIdx]?.jp ?? '').replace(/\[[^\]]+\]/g, '').slice(0, 60) : '';

  return (
    <div
      className="relative flex h-[100dvh] min-h-screen flex-col bg-slate-950 font-sans text-slate-200 selection:bg-blue-500/30"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 z-[70] m-3 flex flex-col items-center justify-center rounded-[28px] border-2 border-dashed border-blue-400/70 bg-slate-950/88 backdrop-blur-md">
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-blue-400/30 bg-blue-500/20 shadow-[0_0_48px_rgba(59,130,246,0.35)]">
              <UploadCloud size={40} className="text-blue-300" />
            </div>
            <h2 className="mb-2 text-2xl font-bold tracking-tight text-white">{text.reader.dropTitle}</h2>
            <p className="text-base text-blue-200/75">{text.reader.dropHint}</p>
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

      {entries.length > 0 && (
        <ReaderTopBar returnTo={returnTo} onOpenBookmarks={() => setShowBookmarks(true)} />
      )}

      <div className="flex-1 overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+8.75rem)] md:pb-[calc(env(safe-area-inset-bottom)+9.5rem)]">
        <div className="mx-auto max-w-5xl p-4 md:p-5 lg:p-6">
          {showHeader ? <Header onOpenSettings={() => setShowSettings(true)} onOpenChapters={() => setShowChapters(true)} /> : null}
          {!isGeneratingChapters &&
            (showEmptyUpload && entries.length === 0 ? (
              <TxtUploadPanel />
            ) : (
              <EntryList
                readingCtx={readingCtx}
                onOpenNote={(idx) => setNoteEntryIdx(idx)}
                onLookup={(word) => setLookupWord(word)}
              />
            ))}
        </div>
      </div>

      <Controls
        onOpenSettings={() => setShowSettings(true)}
        onOpenAi={handleOpenAiExplain}
        returnTo={returnTo}
      />

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showAiExplain && (
        <AiExplainModal
          onClose={() => setShowAiExplain(false)}
          slug={slug}
          volumeId={volumeId}
        />
      )}
      {showBookmarks && (
        <BookmarksModal slug={slug} volumeId={volumeId} onClose={() => setShowBookmarks(false)} />
      )}
      {showChapters && (
        <ChaptersModal slug={slug} volumeId={volumeId} onClose={() => setShowChapters(false)} />
      )}
      {noteEntryIdx !== null && slug && volumeId && (
        <NoteEditorModal
          slug={slug}
          volumeId={volumeId}
          entryIndex={noteEntryIdx}
          entryPreview={noteEntryPreview}
          onClose={() => setNoteEntryIdx(null)}
        />
      )}
      {lookupWord && <WordLookupSheet word={lookupWord} onClose={() => setLookupWord(null)} />}
    </div>
  );
}
