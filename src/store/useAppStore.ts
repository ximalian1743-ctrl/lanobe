import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppSettings, Entry, Chapter } from '../types';

const defaultSettings: AppSettings = {
  apiBase: '',
  cacheAheadEntries: 6,
  showJP: true,
  showZH: true,
  showWords: true,
  showFurigana: false,
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
  entries: Entry[];
  currentIndex: number;
  isPlaying: boolean;
  autoNext: boolean;
  settings: AppSettings;
  audioCache: Record<number, string>; // index -> object URL
  isFetching: Record<number, boolean>;
  fetchErrors: Record<number, string>;
  locateTrigger: number;
  chapters: Chapter[];
  isGeneratingChapters: boolean;
  
  setEntries: (entries: Entry[]) => void;
  setCurrentIndex: (index: number) => void;
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
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      entries: [],
      currentIndex: 0,
      isPlaying: false,
      autoNext: true,
      settings: defaultSettings,
      audioCache: {},
      isFetching: {},
      fetchErrors: {},
      locateTrigger: 0,
      chapters: [],
      isGeneratingChapters: false,

      setEntries: (entries) => set({ entries, currentIndex: 0, audioCache: {}, isFetching: {}, fetchErrors: {}, isPlaying: false, chapters: [] }),
      setCurrentIndex: (currentIndex) => set({ currentIndex }),
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
    }),
    {
      name: 'lanobe-storage',
      partialize: (state) => ({ settings: state.settings, autoNext: state.autoNext, chapters: state.chapters }),
      merge: (persistedState: any, currentState) => {
        return {
          ...currentState,
          ...persistedState,
          settings: {
            ...currentState.settings,
            ...(persistedState?.settings || {})
          }
        };
      }
    }
  )
);
