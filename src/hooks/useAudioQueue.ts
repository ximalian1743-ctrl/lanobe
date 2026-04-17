import { useEffect, useRef, type MutableRefObject } from 'react';
import { useAppStore } from '../store/useAppStore';
import { AppSettings, Entry } from '../types';
import { cleanWordJapaneseText, stripBracketReadings } from '../lib/textCleanup';
import { getProviderMime } from '../lib/ttsVoices';

interface PlaylistItem {
  type: 'tts' | 'pause';
  text?: string;
  voice?: string;
  rate?: number;
  durationMs?: number;
  audioUrl?: string;
}

interface AudioSessionNavigator extends Navigator {
  audioSession?: {
    type?: 'auto' | 'playback' | 'transient' | 'transient-solo';
  };
}

const BACKGROUND_AUDIO_ELEMENT_ID = 'lanobe-background-audio';

function ensurePersistentAudioElement(
  audioRef: MutableRefObject<HTMLAudioElement | null>,
): HTMLAudioElement | null {
  if (typeof document === 'undefined') return null;

  if (audioRef.current && document.body.contains(audioRef.current)) {
    return audioRef.current;
  }

  const existing = document.getElementById(BACKGROUND_AUDIO_ELEMENT_ID);
  if (existing instanceof HTMLAudioElement) {
    audioRef.current = existing;
    return existing;
  }

  const audio = document.createElement('audio');
  audio.id = BACKGROUND_AUDIO_ELEMENT_ID;
  audio.preload = 'auto';
  audio.autoplay = false;
  audio.loop = false;
  audio.controls = false;
  audio.setAttribute('playsinline', 'true');
  audio.setAttribute('webkit-playsinline', 'true');
  audio.setAttribute('x-webkit-airplay', 'allow');
  audio.setAttribute('aria-hidden', 'true');
  audio.tabIndex = -1;
  audio.style.position = 'fixed';
  audio.style.width = '1px';
  audio.style.height = '1px';
  audio.style.left = '0';
  audio.style.bottom = '0';
  audio.style.opacity = '0.001';
  audio.style.pointerEvents = 'none';
  audio.style.zIndex = '-1';
  document.body.appendChild(audio);

  audioRef.current = audio;
  return audio;
}

function releasePersistentAudioElement(audio: HTMLAudioElement | null) {
  if (!audio) return;

  audio.pause();
  audio.removeAttribute('src');
  audio.load();

  if (audio.id === BACKGROUND_AUDIO_ELEMENT_ID) {
    audio.remove();
  }
}

function hintPlaybackAudioSession() {
  const browserNavigator = navigator as AudioSessionNavigator;

  try {
    if (browserNavigator.audioSession && browserNavigator.audioSession.type !== 'playback') {
      browserNavigator.audioSession.type = 'playback';
    }
  } catch (error) {
    console.debug('Audio session playback hint unavailable', error);
  }
}

function updateMediaSessionPlaybackState(state: MediaSessionPlaybackState) {
  if (!('mediaSession' in navigator)) return;

  try {
    navigator.mediaSession.playbackState = state;
  } catch {
    // Ignore browsers that expose Media Session partially.
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateSilentWav(durationMs: number): string {
  const sampleRate = 8000;
  const numChannels = 1;
  const bitsPerSample = 8;
  const numSamples = Math.floor((durationMs / 1000) * sampleRate);
  const subchunk2Size = numSamples * numChannels * (bitsPerSample / 8);
  const chunkSize = 36 + subchunk2Size;

  const buffer = new ArrayBuffer(44 + subchunk2Size);
  const view = new DataView(buffer);

  const writeString = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++) {
      view.setUint8(offset + i, value.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, chunkSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true);
  view.setUint16(32, numChannels * (bitsPerSample / 8), true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, 'data');
  view.setUint32(40, subchunk2Size, true);

  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return 'data:audio/wav;base64,' + btoa(binary);
}

function generatePlaylist(entry: Entry, settings: AppSettings): PlaylistItem[] {
  const playlist: PlaylistItem[] = [];

  const addPause = (ms: number) => {
    if (ms > 0) playlist.push({ type: 'pause', durationMs: ms });
  };

  const addTts = (text: string, voice: string, rate: number) => {
    const cleaned = stripBracketReadings(text);
    if (cleaned) playlist.push({ type: 'tts', text: cleaned, voice, rate });
  };

  const buildToken = (token: string) => {
    let added = false;
    if (token === 'jp' && entry.jp) {
      addTts(entry.jp, settings.jpVoice, settings.jpRate);
      added = true;
    } else if (token === 'ch' && entry.ch) {
      addTts(entry.ch, settings.chVoice, settings.chRate);
      added = true;
    } else if (token === 'word_jp') {
      entry.words.forEach((word, index) => {
        const jpText = cleanWordJapaneseText(word[0]);
        if (jpText) {
          if (index > 0) addPause(settings.pauseBetweenWordsMs);
          addTts(jpText, settings.jpVoice, settings.jpRate);
          added = true;
        }
      });
    } else if (token === 'word_ch') {
      entry.words.forEach((word, index) => {
        if (word[1]) {
          if (index > 0) addPause(settings.pauseBetweenWordsMs);
          addTts(word[1], settings.chVoice, settings.chRate);
          added = true;
        }
      });
    } else if (token === 'word_pair') {
      entry.words.forEach((word, index) => {
        const jpText = cleanWordJapaneseText(word[0]);
        const chText = word[1].trim();
        if (jpText || chText) {
          if (index > 0) addPause(settings.pauseBetweenWordsMs);
          if (jpText) addTts(jpText, settings.jpVoice, settings.jpRate);
          if (jpText && chText) addPause(settings.pauseWordItemMs);
          if (chText) addTts(chText, settings.chVoice, settings.chRate);
          added = true;
        }
      });
    }
    return added;
  };

  for (let repeat = 0; repeat < settings.entryRepeat; repeat++) {
    settings.sequence.forEach((token, index) => {
      const added = buildToken(token);
      if (added && index < settings.sequence.length - 1) {
        addPause(settings.pauseSegmentMs);
      }
    });
    if (repeat < settings.entryRepeat - 1) {
      addPause(settings.pauseSegmentMs);
    }
  }

  if (settings.finalReplayJp && entry.jp) {
    addPause(settings.pauseSegmentMs);
    addTts(entry.jp, settings.jpVoice, settings.jpRate);
  }

  return playlist;
}

export function useAudioQueue() {
  const {
    entries,
    currentIndex,
    isPlaying,
    settings,
    audioCache,
    isFetching,
    fetchErrors,
  } = useAppStore();

  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const playCanceledRef = useRef(false);
  const playlistIndexRef = useRef(0);
  const internalAdvanceRef = useRef(false);

  const fetchEntry = async (index: number) => {
    const state = useAppStore.getState();
    const currentEntries = state.entries;
    const currentSettings = state.settings;

    if (state.audioCache[index] || state.isFetching[index] || state.fetchErrors[index] || !currentEntries[index]) return;

    state.setIsFetching(index, true);
    try {
      const playlist = generatePlaylist(currentEntries[index], currentSettings);
      const ttsRequests: Array<{ text?: string; voice?: string; rate?: number }> = [];
      const seen = new Set<string>();

      for (const item of playlist) {
        if (item.type === 'tts') {
          const key = `${item.text}|${item.voice}|${item.rate}`;
          if (!seen.has(key)) {
            seen.add(key);
            ttsRequests.push({ text: item.text, voice: item.voice, rate: item.rate });
          }
        }
      }

      if (ttsRequests.length > 0) {
        const apiBase = currentSettings.apiBase === 'https://api.ximalian.cc.cd' ? '' : currentSettings.apiBase;
        const provider = currentSettings.ttsProvider || 'edge';
        const mime = getProviderMime(provider);
        const auth = {
          qwenApiKey: currentSettings.qwenApiKey || '',
          doubaoCookie: currentSettings.doubaoCookie || '',
        };
        const MAX_RETRIES = 3;
        let attempt = 0;
        let success = false;
        let lastError: any = null;

        while (attempt < MAX_RETRIES && !success) {
          try {
            const res = await fetch(`${apiBase}/api/tts-batch`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ requests: ttsRequests, provider, auth }),
            });

            if (!res.ok) {
              const errData = await res.json().catch(() => ({}));
              throw new Error(`Failed to fetch audio: ${errData.error || res.statusText}`);
            }

            const { results } = await res.json();
            const urlMap = new Map<string, string>();

            for (const result of results) {
              if (!result?.audioBase64) continue;
              const key = `${result.text}|${result.voice}|${result.rate}`;
              urlMap.set(key, `data:${mime};base64,${result.audioBase64}`);
            }

            // Any missing audioUrl means a silent dropout during playback; retry instead of caching partial.
            const missing: string[] = [];
            for (const item of playlist) {
              if (item.type === 'tts') {
                const key = `${item.text}|${item.voice}|${item.rate}`;
                const url = urlMap.get(key);
                if (!url) {
                  missing.push(key);
                  continue;
                }
                item.audioUrl = url;
              }
            }

            if (missing.length > 0) {
              throw new Error(
                `TTS batch incomplete: ${missing.length} item(s) missing audioBase64`,
              );
            }

            success = true;
          } catch (error: any) {
            lastError = error;
            attempt++;
            if (attempt < MAX_RETRIES) {
              console.warn(`Retry ${attempt}/${MAX_RETRIES} for entry ${index} after error:`, error);
              await sleep(1000 * attempt);
            }
          }
        }

        if (!success) {
          throw lastError || new Error('Failed to fetch audio after multiple attempts');
        }
      }

      state.setAudioCache(index, playlist as any);
    } catch (error: any) {
      console.error(`Failed to fetch audio for entry ${index}`, error);
      state.setFetchError(index, error.message || 'Failed to fetch audio');
    } finally {
      state.setIsFetching(index, false);
    }
  };

  const waitForPlaylist = async (index: number) => {
    const timeoutAt = Date.now() + 20000;

    while (Date.now() < timeoutAt) {
      const state = useAppStore.getState();
      const playlist = state.audioCache[index] as unknown as PlaylistItem[] | undefined;
      const error = state.fetchErrors[index];

      if (playlist !== undefined) {
        return { playlist };
      }

      if (error) {
        return { error };
      }

      if (!state.isFetching[index] && state.entries[index]) {
        void fetchEntry(index);
      }

      await sleep(120);
    }

    return { error: 'Timed out while preparing audio' };
  };

  const playAudioUrl = async (
    audioUrl: string,
    canceledRef: { current: boolean },
  ) => {
    const audio = ensurePersistentAudioElement(activeAudioRef);
    if (!audio) return false;

    hintPlaybackAudioSession();
    audio.src = audioUrl;

    return new Promise<boolean>((resolve) => {
      let resolved = false;
      let hiddenResumeAttempts = 0;

      const finish = (completed: boolean) => {
        if (resolved) return;
        resolved = true;
        resolve(completed);
      };

      audio.onplay = () => {
        updateMediaSessionPlaybackState('playing');
      };

      audio.onended = () => finish(true);
      audio.onerror = () => {
        console.error('Audio playback error');
        updateMediaSessionPlaybackState('paused');
        finish(true);
      };
      audio.onpause = () => {
        if (audio.ended || (audio.duration && audio.duration - audio.currentTime < 0.1)) {
          return;
        }

        updateMediaSessionPlaybackState('paused');

        if (playCanceledRef.current || canceledRef.current || !useAppStore.getState().isPlaying) {
          finish(false);
          return;
        }

        if (document.hidden) {
          hiddenResumeAttempts += 1;
          if (hiddenResumeAttempts > 3) {
            useAppStore.getState().setIsPlaying(false);
            finish(false);
            return;
          }

          audio.play().then(() => {
            updateMediaSessionPlaybackState('playing');
          }).catch((error) => {
            console.warn('Failed to resume hidden audio playback', error);
            useAppStore.getState().setIsPlaying(false);
            finish(false);
          });
          return;
        }

        useAppStore.getState().setIsPlaying(false);
        finish(false);
      };

      audio.play().catch((error) => {
        console.error('Audio play error:', error);
        updateMediaSessionPlaybackState('paused');
        if (error.name === 'NotAllowedError') {
          if (!playCanceledRef.current && !canceledRef.current) {
            useAppStore.getState().setIsPlaying(false);
          }
          finish(false);
          return;
        }
        finish(true);
      });
    });
  };

  useEffect(() => {
    const audio = ensurePersistentAudioElement(activeAudioRef);
    if (!audio) return;

    hintPlaybackAudioSession();

    return () => {
      updateMediaSessionPlaybackState('none');
      releasePersistentAudioElement(audio);
      if (activeAudioRef.current === audio) {
        activeAudioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    const setActionHandler = (
      action: MediaSessionAction,
      handler: MediaSessionActionHandler | null,
    ) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        // Ignore actions not supported by the current browser.
      }
    };

    setActionHandler('play', async () => {
      const audio = ensurePersistentAudioElement(activeAudioRef);
      if (!audio) return;

      hintPlaybackAudioSession();

      const state = useAppStore.getState();
      if (state.isPlaying && audio.src && audio.paused) {
        try {
          await audio.play();
          updateMediaSessionPlaybackState('playing');
          return;
        } catch (error) {
          console.error('Failed to resume audio from media session', error);
        }
      }

      state.setIsPlaying(true);
    });

    setActionHandler('pause', () => {
      updateMediaSessionPlaybackState('paused');
      useAppStore.getState().setIsPlaying(false);
    });

    setActionHandler('previoustrack', () => {
      const state = useAppStore.getState();
      if (state.currentIndex > 0) state.setCurrentIndex(state.currentIndex - 1);
    });

    setActionHandler('nexttrack', () => {
      const state = useAppStore.getState();
      if (state.currentIndex < state.entries.length - 1) state.setCurrentIndex(state.currentIndex + 1);
    });

    return () => {
      setActionHandler('play', null);
      setActionHandler('pause', null);
      setActionHandler('previoustrack', null);
      setActionHandler('nexttrack', null);
    };
  }, []);

  useEffect(() => {
    playlistIndexRef.current = 0;
  }, [currentIndex, settings]);

  useEffect(() => {
    if (entries.length === 0) return;

    let activeFetches = 0;
    for (let index = currentIndex; index <= currentIndex + settings.cacheAheadEntries; index++) {
      if (index < entries.length && !audioCache[index] && !isFetching[index] && !fetchErrors[index]) {
        if (activeFetches < settings.entryConcurrency) {
          void fetchEntry(index);
          activeFetches++;
        }
      }
    }
  }, [audioCache, currentIndex, entries, fetchErrors, isFetching, settings]);

  useEffect(() => {
    if (!isPlaying) {
      playCanceledRef.current = true;
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
      }
      updateMediaSessionPlaybackState('paused');
      return;
    }

    if (internalAdvanceRef.current) {
      internalAdvanceRef.current = false;
      return;
    }

    playCanceledRef.current = false;
    const canceledRef = { current: false };

    const playSession = async () => {
      let entryIndex = currentIndex;
      let itemIndex = playlistIndexRef.current;

      while (!playCanceledRef.current && !canceledRef.current) {
        const state = useAppStore.getState();
        const entry = state.entries[entryIndex];

        if (!entry) {
          state.setIsPlaying(false);
          break;
        }

        if ('mediaSession' in navigator) {
          const currentBook = state.lastOpenedBook;
          navigator.mediaSession.metadata = new MediaMetadata({
            title: currentBook ? `${currentBook.volumeLabel} · #${entryIndex + 1}` : `Entry ${entryIndex + 1}`,
            artist: entry.jp || entry.ch || currentBook?.bookTitle || 'Lanobe',
            album: currentBook?.bookTitle || 'Language Learning',
          });
        }
        updateMediaSessionPlaybackState('playing');

        const { playlist, error } = await waitForPlaylist(entryIndex);
        if (playCanceledRef.current || canceledRef.current) break;

        if (error || !playlist) {
          const latestState = useAppStore.getState();
          if (latestState.autoNext && entryIndex + 1 < latestState.entries.length) {
            entryIndex += 1;
            itemIndex = 0;
            playlistIndexRef.current = 0;
            internalAdvanceRef.current = true;
            latestState.setCurrentIndex(entryIndex);
            continue;
          }

          latestState.setIsPlaying(false);
          break;
        }

        if (state.currentIndex !== entryIndex) {
          internalAdvanceRef.current = true;
          state.setCurrentIndex(entryIndex);
        }

        while (itemIndex < playlist.length && !playCanceledRef.current && !canceledRef.current) {
          const item = playlist[itemIndex];
          let audioUrl = item.audioUrl;
          if (item.type === 'pause' && item.durationMs) {
            audioUrl = generateSilentWav(item.durationMs);
          }

          const completed = audioUrl ? await playAudioUrl(audioUrl, canceledRef) : true;
          if (playCanceledRef.current || canceledRef.current) break;
          if (!completed) return;

          itemIndex += 1;
          playlistIndexRef.current = itemIndex;
        }

        if (playCanceledRef.current || canceledRef.current) break;

        const latestState = useAppStore.getState();
        if (!latestState.autoNext || entryIndex >= latestState.entries.length - 1) {
          updateMediaSessionPlaybackState('paused');
          latestState.setIsPlaying(false);
          break;
        }

        const gapCompleted = latestState.settings.pauseBetweenEntriesMs > 0
          ? await playAudioUrl(generateSilentWav(latestState.settings.pauseBetweenEntriesMs), canceledRef)
          : true;

        if (playCanceledRef.current || canceledRef.current) break;
        if (!gapCompleted) return;

        entryIndex += 1;
        itemIndex = 0;
        playlistIndexRef.current = 0;
        internalAdvanceRef.current = true;
        latestState.setCurrentIndex(entryIndex);
      }
    };

    void playSession();

    return () => {
      if (internalAdvanceRef.current) return;
      canceledRef.current = true;
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
      }
    };
  }, [currentIndex, isPlaying, settings]);

  return { audioCache, isFetching };
}
