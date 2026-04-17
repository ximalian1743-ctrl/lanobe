import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, UploadCloud } from 'lucide-react';
import { AiExplainModal } from '../../components/AiExplainModal';
import { AiAppendModal } from '../../components/AiAppendModal';
import { EntryList } from '../../components/EntryList';
import { Header } from '../../components/Header';
import { SettingsModal } from '../../components/SettingsModal';
import { TxtUploadPanel } from '../../components/TxtUploadPanel';
import { ReaderTopBar } from '../../components/ReaderTopBar';
import { BookmarksModal } from '../../components/BookmarksModal';
import { BatchProgressBanner } from '../../components/BatchProgressBanner';
import { NoteEditorModal } from '../../components/NoteEditorModal';
import { WordLookupSheet } from '../../components/WordLookupSheet';
import { ChaptersModal } from '../../components/ChaptersModal';
import { MiniPlayer } from '../../components/MiniPlayer';
import { ScrollToTopButton } from '../../components/ScrollToTopButton';
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
  const [showAiAppend, setShowAiAppend] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showChapters, setShowChapters] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [chromeHidden, setChromeHidden] = useState(false);
  const [noteEntryIdx, setNoteEntryIdx] = useState<number | null>(null);
  const [lookupWord, setLookupWord] = useState<string | null>(null);
  const {
    isGeneratingChapters,
    setIsPlaying,
    isPlaying,
    entries,
    currentIndex,
    setCurrentIndex,
    isFetching,
    audioCache,
    settings,
  } = useAppStore();
  const { loadContent } = useLoadContent();
  const { text } = useUiText();
  const { toast } = useToast();

  useAudioQueue();
  useReadingTimer(slug, volumeId);

  // One-time hint so new users know the floating player exists.
  useEffect(() => {
    if (entries.length === 0) return;
    try {
      if (window.localStorage.getItem('lanobe-hint-mini-player-v1') === '1') return;
      const t = window.setTimeout(() => {
        toast('右下角是悬浮播放器 · 点 ⌃ 展开更多控制', 'info');
        window.localStorage.setItem('lanobe-hint-mini-player-v1', '1');
      }, 1400);
      return () => window.clearTimeout(t);
    } catch {
      /* localStorage may be unavailable */
    }
  }, [entries.length, toast]);

  // Apply theme
  useEffect(() => {
    const applied: 'dark' | 'light' | 'sepia' =
      settings.theme === 'auto'
        ? window.matchMedia('(prefers-color-scheme: light)').matches
          ? 'light'
          : 'dark'
        : (settings.theme ?? 'dark');
    document.documentElement.dataset.theme = applied;
  }, [settings.theme]);

  // Audio toast — only > 800ms fetches
  const lastAudioState = useRef<'idle' | 'fetching' | 'ready'>('idle');
  const audioToastTimer = useRef<number | null>(null);
  useEffect(() => {
    if (entries.length === 0) {
      lastAudioState.current = 'idle';
      return;
    }
    const fetching = !!isFetching[currentIndex];
    const ready = !!audioCache[currentIndex];
    const prev = lastAudioState.current;
    const next: 'idle' | 'fetching' | 'ready' = fetching ? 'fetching' : ready ? 'ready' : 'idle';
    if (audioToastTimer.current) {
      window.clearTimeout(audioToastTimer.current);
      audioToastTimer.current = null;
    }
    if (next === 'fetching' && prev !== 'fetching') {
      audioToastTimer.current = window.setTimeout(() => {
        const s = useAppStore.getState();
        if (s.isFetching[currentIndex]) toast('正在生成音频…', 'info');
      }, 800);
    }
    lastAudioState.current = next;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, isFetching[currentIndex], audioCache[currentIndex]]);

  // Immersive scroll: hide chrome when scrolling down, show when scrolling up
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const lastScrollTop = useRef(0);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const current = el!.scrollTop;
        const delta = current - lastScrollTop.current;
        if (Math.abs(delta) > 6) {
          if (delta > 0 && current > 120) setChromeHidden(true);
          else if (delta < 0) setChromeHidden(false);
          lastScrollTop.current = current;
        }
        ticking = false;
      });
    }
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // Double-tap on reader area: play/pause, and left/right half = prev/next
  const lastTapAt = useRef(0);
  const handleDoubleTap = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Ignore double-taps that started on interactive elements (buttons, inputs)
      const target = e.target as HTMLElement;
      if (target.closest('button, a, input, select, textarea, [role="button"]')) return;
      const now = performance.now();
      if (now - lastTapAt.current < 300) {
        // Second tap — decide action by horizontal third
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const ratio = (e.clientX - rect.left) / rect.width;
        if (ratio < 0.33) {
          setCurrentIndex(Math.max(0, currentIndex - 1));
        } else if (ratio > 0.67) {
          setCurrentIndex(Math.min(entries.length - 1, currentIndex + 1));
        } else {
          setIsPlaying(!isPlaying);
        }
        lastTapAt.current = 0;
      } else {
        lastTapAt.current = now;
      }
    },
    [currentIndex, entries.length, isPlaying, setCurrentIndex, setIsPlaying],
  );

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

      <BatchProgressBanner />

      {entries.length > 0 && (
        <div
          className={[
            'transition-transform duration-300',
            chromeHidden ? '-translate-y-full' : 'translate-y-0',
          ].join(' ')}
        >
          <ReaderTopBar returnTo={returnTo} onOpenBookmarks={() => setShowBookmarks(true)} />
        </div>
      )}

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
        onClick={handleDoubleTap}
      >
        <div className="mx-auto max-w-5xl p-4 pb-32 md:p-5 lg:p-6">
          {showHeader ? (
            <Header onOpenSettings={() => setShowSettings(true)} onOpenChapters={() => setShowChapters(true)} />
          ) : null}
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

      {/* Floating mini-player replaces the old permanent Controls bar */}
      <MiniPlayer
        hidden={entries.length === 0}
        onOpenSettings={() => setShowSettings(true)}
        onOpenAi={handleOpenAiExplain}
        onOpenChapters={() => setShowChapters(true)}
        onOpenAiAppend={() => setShowAiAppend(true)}
      />
      <ScrollToTopButton targetRef={scrollRef} />

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showAiExplain && <AiExplainModal onClose={() => setShowAiExplain(false)} slug={slug} volumeId={volumeId} />}
      {showAiAppend && <AiAppendModal onClose={() => setShowAiAppend(false)} />}
      {showBookmarks && <BookmarksModal slug={slug} volumeId={volumeId} onClose={() => setShowBookmarks(false)} />}
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
