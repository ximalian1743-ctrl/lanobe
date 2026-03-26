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

export interface AppSettings extends BackendSettings {
  apiBase: string;
  cacheAheadEntries: number;
  showJP: boolean;
  showZH: boolean;
  showWords: boolean;
  showFurigana: boolean;
  readerDensity: 'compact' | 'comfortable';
  entryConcurrency: number;
  aiApiKey: string;
  aiApiBase: string;
  aiModel: string;
}

export interface Chapter {
  title: string;
  index: number;
}
