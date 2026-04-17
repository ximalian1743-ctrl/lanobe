import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppSettings, Entry, Chapter } from '../types';
import { buildBuiltInBookProgressKey } from '../types/books';
import { UiLanguage } from '../i18n/ui';
import { getPageIndexForEntry } from '../lib/pagination';

const defaultSettings: AppSettings = {
  apiBase: '',
  ttsProvider: 'edge',
  qwenApiKey: '',
  doubaoCookie: '',
  cacheAheadEntries: 6,
  showJP: true,
  showZH: true,
  showWords: true,
  showFurigana: false,
  rubyFurigana: true,
  furiganaMode: 'ruby',
  readerDensity: 'compact',
  readerFontScale: 1,
  theme: 'dark',
  jpVoice: 'ja-JP-NanamiNeural',
  chVoice: 'zh-CN-XiaoxiaoNeural',
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
  aiApiKey: 'gg-gcli-uR-S9ny0D8h0pModFr4G0oqcQt-o4HqzDVphLDDUSD8',
  aiApiBase: 'https://gcli.ggchan.dev/v1',
  aiModel: 'gemini-3.1-pro-preview',
};

// Settings matching any of these legacy defaults get force-migrated to the
// gcli defaults above. Single-user deployment, so we overwrite unconfigured
// or stock values rather than leaving them stranded in localStorage.
const LEGACY_AI_BASES = ['', 'https://sub.jlypx.de/v1'];
const LEGACY_AI_MODELS = ['', 'gpt-5.4', 'agy-claude-sonnet-4-6'];

interface AppState {
  uiLanguage: UiLanguage;
  entries: Entry[];
  currentIndex: number;
  readerPageIndex: number;
  isPlaying: boolean;
  autoNext: boolean;
  settings: AppSettings;
  audioCache: Record<number, string>;
  isFetching: Record<number, boolean>;
  fetchErrors: Record<number, string>;
  locateTrigger: number;
  chapters: Chapter[];
  isGeneratingChapters: boolean;
  builtInBookProgress: Record<string, BuiltInBookProgress>;
  lastOpenedVolumes: Record<string, string>;
  lastOpenedBook: LastOpenedBook | null;

  // Round 2 additions
  /** Key: `${slug}::${volumeId}::${entryIndex}` → timestamp */
  bookmarks: Record<string, BookmarkEntry>;
  /** Key: `${slug}::${volumeId}::${entryIndex}` → free-form note text */
  notes: Record<string, NoteEntry>;
  /** Key: `${slug}::${volumeId}` → total active reading time in seconds */
  readingTime: Record<string, number>;
  /** Cached AI explanations. Key: `${slug}::${volumeId}::${entryIndex}` → explanation object */
  aiExplanations: Record<string, AiExplanationCache>;
  /** Global progress indicator for batch AI work that survives modal dismissal. */
  batchAiProgress: BatchAiProgress | null;

  setUiLanguage: (uiLanguage: UiLanguage) => void;
  setEntries: (entries: Entry[]) => void;
  appendEntries: (entries: Entry[]) => void;
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

  toggleBookmark: (slug: string, volumeId: string, entryIndex: number, title?: string) => void;
  removeBookmark: (key: string) => void;
  setNote: (slug: string, volumeId: string, entryIndex: number, text: string) => void;
  removeNote: (key: string) => void;
  addReadingTime: (slug: string, volumeId: string, seconds: number) => void;
  setAiExplanation: (slug: string, volumeId: string, entryIndex: number, data: AiExplanationCache['data']) => void;
  clearAiExplanations: () => void;
  setBatchAiProgress: (progress: BatchAiProgress | null) => void;
  importPersistedState: (payload: Partial<PersistedAppState>) => void;
}

export interface BatchAiProgress {
  label: string;
  done: number;
  total: number;
  /** When non-null, clicking the indicator should call this to abort. */
  onCancel?: () => void;
  /** When non-null, orchestrator is stuck waiting for user to re-trigger the failed chunk. */
  onRetry?: () => void;
  /** Number of additional batches queued behind the currently-running one. */
  queueAhead?: number;
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

export interface BookmarkEntry {
  slug: string;
  volumeId: string;
  entryIndex: number;
  /** short preview title (jp text trimmed) to display in bookmark list */
  preview: string;
  createdAt: string;
}

export interface NoteEntry {
  slug: string;
  volumeId: string;
  entryIndex: number;
  text: string;
  updatedAt: string;
}

export interface AiExplanationCache {
  slug: string;
  volumeId: string;
  entryIndex: number;
  /** Stored as the raw explanation object from aiService */
  data: unknown;
  savedAt: string;
}

export interface PersistedAppState {
  uiLanguage?: UiLanguage;
  settings?: AppSettings;
  autoNext?: boolean;
  builtInBookProgress?: Record<string, BuiltInBookProgress>;
  lastOpenedVolumes?: Record<string, string>;
  lastOpenedBook?: LastOpenedBook | null;
  bookmarks?: Record<string, BookmarkEntry>;
  notes?: Record<string, NoteEntry>;
  readingTime?: Record<string, number>;
  aiExplanations?: Record<string, AiExplanationCache>;
  /** Snapshot of the current reader session (entries + chapters + cursor).
   *  Restores mid-read custom uploads and AI-annotated sessions after a
   *  browser close. Built-in book loads overwrite on open via setEntries. */
  entries?: Entry[];
  chapters?: Chapter[];
  currentIndex?: number;
  readerPageIndex?: number;
}

export function buildEntryKey(slug: string, volumeId: string, entryIndex: number): string {
  return `${slug}::${volumeId}::${entryIndex}`;
}

export function buildVolumeKey(slug: string, volumeId: string): string {
  return `${slug}::${volumeId}`;
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
      bookmarks: {},
      notes: {},
      readingTime: {},
      aiExplanations: {},
      batchAiProgress: null,

      setUiLanguage: (uiLanguage) => set({ uiLanguage }),
      setEntries: (entries) =>
        set({
          entries,
          currentIndex: 0,
          readerPageIndex: 0,
          audioCache: {},
          isFetching: {},
          fetchErrors: {},
          isPlaying: false,
          chapters: [],
        }),
      appendEntries: (newEntries) =>
        set((state) => {
          if (!newEntries.length) return {};
          const base = state.entries.length;
          const reindexed = newEntries.map((entry, i) => ({
            ...entry,
            id: `entry-${base + i}`,
          }));
          return { entries: [...state.entries, ...reindexed] };
        }),
      setCurrentIndex: (currentIndex) =>
        set({ currentIndex, readerPageIndex: getPageIndexForEntry(currentIndex) }),
      setReaderPageIndex: (readerPageIndex) => set({ readerPageIndex }),
      setIsPlaying: (isPlaying) => set({ isPlaying }),
      setAutoNext: (autoNext) => set({ autoNext }),
      updateSettings: (newSettings) => set((state) => ({ settings: { ...state.settings, ...newSettings } })),
      setAudioCache: (index, url) =>
        set((state) => ({
          audioCache: { ...state.audioCache, [index]: url },
          fetchErrors: { ...state.fetchErrors, [index]: '' },
        })),
      setIsFetching: (index, fetching) =>
        set((state) => ({ isFetching: { ...state.isFetching, [index]: fetching } })),
      setFetchError: (index, error) =>
        set((state) => ({ fetchErrors: { ...state.fetchErrors, [index]: error || '' } })),
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

      toggleBookmark: (slug, volumeId, entryIndex, preview) =>
        set((state) => {
          const key = buildEntryKey(slug, volumeId, entryIndex);
          const next = { ...state.bookmarks };
          if (next[key]) {
            delete next[key];
          } else {
            next[key] = {
              slug,
              volumeId,
              entryIndex,
              preview: (preview ?? '').slice(0, 80),
              createdAt: new Date().toISOString(),
            };
          }
          return { bookmarks: next };
        }),
      removeBookmark: (key) =>
        set((state) => {
          const next = { ...state.bookmarks };
          delete next[key];
          return { bookmarks: next };
        }),
      setNote: (slug, volumeId, entryIndex, text) =>
        set((state) => {
          const key = buildEntryKey(slug, volumeId, entryIndex);
          const next = { ...state.notes };
          if (!text.trim()) {
            delete next[key];
          } else {
            next[key] = {
              slug,
              volumeId,
              entryIndex,
              text,
              updatedAt: new Date().toISOString(),
            };
          }
          return { notes: next };
        }),
      removeNote: (key) =>
        set((state) => {
          const next = { ...state.notes };
          delete next[key];
          return { notes: next };
        }),
      addReadingTime: (slug, volumeId, seconds) =>
        set((state) => {
          const key = buildVolumeKey(slug, volumeId);
          return {
            readingTime: {
              ...state.readingTime,
              [key]: (state.readingTime[key] ?? 0) + Math.max(0, seconds),
            },
          };
        }),
      setAiExplanation: (slug, volumeId, entryIndex, data) =>
        set((state) => {
          const key = buildEntryKey(slug, volumeId, entryIndex);
          return {
            aiExplanations: {
              ...state.aiExplanations,
              [key]: {
                slug,
                volumeId,
                entryIndex,
                data,
                savedAt: new Date().toISOString(),
              },
            },
          };
        }),
      clearAiExplanations: () => set({ aiExplanations: {} }),
      setBatchAiProgress: (batchAiProgress) => set({ batchAiProgress }),
      importPersistedState: (payload) =>
        set((state) => ({
          uiLanguage: payload.uiLanguage ?? state.uiLanguage,
          autoNext: payload.autoNext ?? state.autoNext,
          settings: { ...state.settings, ...(payload.settings ?? {}) },
          builtInBookProgress: payload.builtInBookProgress ?? state.builtInBookProgress,
          lastOpenedVolumes: payload.lastOpenedVolumes ?? state.lastOpenedVolumes,
          lastOpenedBook: payload.lastOpenedBook ?? state.lastOpenedBook,
          bookmarks: payload.bookmarks ?? state.bookmarks,
          notes: payload.notes ?? state.notes,
          readingTime: payload.readingTime ?? state.readingTime,
          aiExplanations: payload.aiExplanations ?? state.aiExplanations,
        })),
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
        bookmarks: state.bookmarks,
        notes: state.notes,
        readingTime: state.readingTime,
        aiExplanations: state.aiExplanations,
        entries: state.entries,
        chapters: state.chapters,
        currentIndex: state.currentIndex,
        readerPageIndex: state.readerPageIndex,
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
          bookmarks: persisted.bookmarks ?? currentState.bookmarks,
          notes: persisted.notes ?? currentState.notes,
          readingTime: persisted.readingTime ?? currentState.readingTime,
          aiExplanations: persisted.aiExplanations ?? currentState.aiExplanations,
          entries: persisted.entries ?? currentState.entries,
          chapters: persisted.chapters ?? currentState.chapters,
          currentIndex: persisted.currentIndex ?? currentState.currentIndex,
          readerPageIndex: persisted.readerPageIndex ?? currentState.readerPageIndex,
          settings: (() => {
            const merged = { ...currentState.settings, ...(persisted.settings || {}) };
            // Migrate legacy showFurigana + rubyFurigana → furiganaMode
            if (!merged.furiganaMode || merged.furiganaMode === undefined) {
              if (!merged.showFurigana) merged.furiganaMode = 'hidden';
              else if (merged.rubyFurigana === false) merged.furiganaMode = 'bracket';
              else merged.furiganaMode = 'ruby';
            }
            // Migrate stale AI provider settings to current gcli/sonnet defaults.
            if (!merged.aiApiKey?.trim() || LEGACY_AI_BASES.includes(merged.aiApiBase) || LEGACY_AI_MODELS.includes(merged.aiModel)) {
              merged.aiApiKey = defaultSettings.aiApiKey;
              merged.aiApiBase = defaultSettings.aiApiBase;
              merged.aiModel = defaultSettings.aiModel;
            }
            return merged;
          })(),
        };
      },
    },
  ),
);
