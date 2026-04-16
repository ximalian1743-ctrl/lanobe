import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppSettings, Entry, Chapter } from '../types';
import { buildBuiltInBookProgressKey } from '../types/books';
import { UiLanguage } from '../i18n/ui';
import { getPageIndexForEntry } from '../lib/pagination';

const defaultSettings: AppSettings = {
  apiBase: '',
  cacheAheadEntries: 6,
  showJP: true,
  showZH: true,
  showWords: true,
  showFurigana: false,
  readerDensity: 'compact',
  readerFontScale: 1,
  jpVoice: "ja-JP-NanamiNeural",
  chVoice: "zh-CN-XiaoxiaoNeural",
  jpRate: 1.0,
  chRate: 1.0,
  sequence: ['jp', 'ch', 'word_pair'],
  entryRepeat: 1,
  finalReplayJp: false,
  pauseSegmentMs: 200,
  pauseWordItemMs: 200,
  pauseBetweenWordsMs: 200,
  pauseBetweenEntriesMs: 350,
  entryConcurrency: 3,
  aiApiKey: '',
  aiApiBase: 'https://sub.jlypx.de/v1',
  aiModel: 'gpt-5.4',
};

interface AppState {
  uiLanguage: UiLanguage;
  entries: Entry[];
  currentIndex: number;
  readerPageIndex: number;
  isPlaying: boolean;
  autoNext: boolean;
  settings: AppSettings;
  audioCache: Record<number, string>; // index -> object URL
  isFetching: Record<number, boolean>;
  fetchErrors: Record<number, string>;
  locateTrigger: number;
  chapters: Chapter[];
  isGeneratingChapters: boolean;
  builtInBookProgress: Record<string, BuiltInBookProgress>;
  lastOpenedVolumes: Record<string, string>;
  lastOpenedBook: LastOpenedBook | null;
  
  setUiLanguage: (uiLanguage: UiLanguage) => void;
  setEntries: (entries: Entry[]) => void;
  setCurrentIndex: (index: number) => void;
  setReaderPageIndex: (pageIndex: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setAutoNext: (autoNext: boolean) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  setAudioCache: (index: number, url: string) => void;
  setIsFetching: (index: number, fetching: boolean) => void;
  setFetchError: (index: number, error: string | null) => void;
  clearCache: () => void;
  triggerLocate: () => void;
  setChapters: (chapters: Chapter[]) => void;
  setIsGeneratingChapters: (isGenerating: boolean) => void;
  saveBuiltInBookProgress: (input: SaveBuiltInBookProgressInput) => void;
}

interface BuiltInBookProgress {
  slug: string;
  bookTitle: string;
  volumeId: string;
  volumeLabel: string;
  currentIndex: number;
  entryCount: number;
  updatedAt: string;
}

interface LastOpenedBook {
  slug: string;
  bookTitle: string;
  volumeId: string;
  volumeLabel: string;
  updatedAt: string;
}

interface SaveBuiltInBookProgressInput {
  slug: string;
  bookTitle: string;
  volumeId: string;
  volumeLabel: string;
  currentIndex: number;
  entryCount: number;
}

interface PersistedAppState {
  uiLanguage?: UiLanguage;
  settings?: AppSettings;
  autoNext?: boolean;
  builtInBookProgress?: Record<string, BuiltInBookProgress>;
  lastOpenedVolumes?: Record<string, string>;
  lastOpenedBook?: LastOpenedBook | null;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      entries: [],
      uiLanguage: 'zh-CN',
      currentIndex: 0,
      readerPageIndex: 0,
      isPlaying: false,
      autoNext: true,
      settings: defaultSettings,
      audioCache: {},
      isFetching: {},
      fetchErrors: {},
      locateTrigger: 0,
      chapters: [],
      isGeneratingChapters: false,
      builtInBookProgress: {},
      lastOpenedVolumes: {},
      lastOpenedBook: null,

      setUiLanguage: (uiLanguage) => set({ uiLanguage }),
      setEntries: (entries) => set({ entries, currentIndex: 0, readerPageIndex: 0, audioCache: {}, isFetching: {}, fetchErrors: {}, isPlaying: false, chapters: [] }),
      setCurrentIndex: (currentIndex) => set({ currentIndex, readerPageIndex: getPageIndexForEntry(currentIndex) }),
      setReaderPageIndex: (readerPageIndex) => set({ readerPageIndex }),
      setIsPlaying: (isPlaying) => set({ isPlaying }),
      setAutoNext: (autoNext) => set({ autoNext }),
      updateSettings: (newSettings) => set((state) => ({ settings: { ...state.settings, ...newSettings } })),
      setAudioCache: (index, url) => set((state) => ({ audioCache: { ...state.audioCache, [index]: url }, fetchErrors: { ...state.fetchErrors, [index]: '' } })),
      setIsFetching: (index, fetching) => set((state) => ({ isFetching: { ...state.isFetching, [index]: fetching } })),
      setFetchError: (index, error) => set((state) => ({ fetchErrors: { ...state.fetchErrors, [index]: error || '' } })),
      clearCache: () => set({ audioCache: {}, isFetching: {}, fetchErrors: {} }),
      triggerLocate: () => set((state) => ({ locateTrigger: state.locateTrigger + 1 })),
      setChapters: (chapters) => set({ chapters }),
      setIsGeneratingChapters: (isGeneratingChapters) => set({ isGeneratingChapters }),
      saveBuiltInBookProgress: ({ slug, bookTitle, volumeId, volumeLabel, currentIndex, entryCount }) =>
        set((state) => {
          const updatedAt = new Date().toISOString();
          const progressKey = buildBuiltInBookProgressKey(slug, volumeId);

          return {
            builtInBookProgress: {
              ...state.builtInBookProgress,
              [progressKey]: {
                slug,
                bookTitle,
                volumeId,
                volumeLabel,
                currentIndex: Math.max(0, currentIndex),
                entryCount: Math.max(0, entryCount),
                updatedAt,
              },
            },
            lastOpenedVolumes: {
              ...state.lastOpenedVolumes,
              [slug]: volumeId,
            },
            lastOpenedBook: {
              slug,
              bookTitle,
              volumeId,
              volumeLabel,
              updatedAt,
            },
          };
        }),
    }),
    {
      name: 'lanobe-storage',
      partialize: (state) => ({
        settings: state.settings,
        uiLanguage: state.uiLanguage,
        autoNext: state.autoNext,
        builtInBookProgress: state.builtInBookProgress,
        lastOpenedVolumes: state.lastOpenedVolumes,
        lastOpenedBook: state.lastOpenedBook,
      }),
      merge: (persistedState: unknown, currentState) => {
        const persisted = (persistedState ?? {}) as PersistedAppState;

        return {
          ...currentState,
          uiLanguage: persisted.uiLanguage ?? currentState.uiLanguage,
          autoNext: persisted.autoNext ?? currentState.autoNext,
          builtInBookProgress: persisted.builtInBookProgress ?? currentState.builtInBookProgress,
          lastOpenedVolumes: persisted.lastOpenedVolumes ?? currentState.lastOpenedVolumes,
          lastOpenedBook: persisted.lastOpenedBook ?? currentState.lastOpenedBook,
          settings: {
            ...currentState.settings,
            ...(persisted.settings || {})
          }
        };
      }
    }
  )
);
