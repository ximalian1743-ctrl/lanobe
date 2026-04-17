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

export type Theme = 'dark' | 'light' | 'sepia' | 'auto';
export type FuriganaMode = 'hidden' | 'bracket' | 'ruby';
export type TtsProvider = 'edge' | 'qwen3' | 'doubao';

export interface AppSettings extends BackendSettings {
  apiBase: string;
  /** Which TTS backend `/api/tts-batch` should dispatch to. */
  ttsProvider: TtsProvider;
  /** Aliyun Bailian API key (used when ttsProvider === 'qwen3'). */
  qwenApiKey: string;
  /** doubao.com session cookie string (used when ttsProvider === 'doubao'). */
  doubaoCookie: string;
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
