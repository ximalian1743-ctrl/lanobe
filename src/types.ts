export interface Entry {
  id: string;
  jp: string;
  ch: string;
  words: [string, string][];
}

export interface BackendSettings {
  jpVoice: string;
  chVoice: string;
  jpRate: number;
  chRate: number;
  sequence: string[];
  entryRepeat: number;
  finalReplayJp: boolean;
  pauseSegmentMs: number;
  pauseWordItemMs: number;
  pauseBetweenWordsMs: number;
  pauseBetweenEntriesMs: number;
}

export type Theme = 'dark' | 'light' | 'sepia';
export type FuriganaMode = 'hidden' | 'bracket' | 'ruby';

export interface AppSettings extends BackendSettings {
  apiBase: string;
  cacheAheadEntries: number;
  showJP: boolean;
  showZH: boolean;
  showWords: boolean;
  /** @deprecated Kept for migration only — use `furiganaMode`. */
  showFurigana: boolean;
  /** @deprecated Kept for migration only — use `furiganaMode`. */
  rubyFurigana: boolean;
  /** Single source of truth for furigana rendering (replaces showFurigana + rubyFurigana). */
  furiganaMode: FuriganaMode;
  readerDensity: 'compact' | 'comfortable';
  /** Font scale multiplier for reader text (0.85 – 1.4). */
  readerFontScale: number;
  /** Visual theme for reader + shell. */
  theme: Theme;
  entryConcurrency: number;
  aiApiKey: string;
  aiApiBase: string;
  aiModel: string;
}

export interface Chapter {
  title: string;
  index: number;
}
