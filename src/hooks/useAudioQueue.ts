import { useEffect, useRef, type MutableRefObject } from 'react';
import { useAppStore } from '../store/useAppStore';
import { AppSettings, Entry } from '../types';

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

function generateSilentWav(durationMs: number): string {
  const sampleRate = 8000;
  const numChannels = 1;
  const bitsPerSample = 8;
  const numSamples = Math.floor((durationMs / 1000) * sampleRate);
  const subchunk2Size = numSamples * numChannels * (bitsPerSample / 8);
  const chunkSize = 36 + subchunk2Size;

  const buffer = new ArrayBuffer(44 + subchunk2Size);
  const view = new DataView(buffer);

  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
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
    const cleaned = text.replace(/\[[^\]]+\]/g, '').trim();
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
      entry.words.forEach((w, i) => {
        const jpText = w[0].replace(/[（(][^)）]+[)）]/g, '').replace(/\[[^\]]+\]/g, '').trim();
        if (jpText) {
          if (i > 0) addPause(settings.pauseBetweenWordsMs);
          addTts(jpText, settings.jpVoice, settings.jpRate);
          added = true;
        }
      });
    } else if (token === 'word_ch') {
      entry.words.forEach((w, i) => {
        if (w[1]) {
          if (i > 0) addPause(settings.pauseBetweenWordsMs);
          addTts(w[1], settings.chVoice, settings.chRate);
          added = true;
        }
      });
    } else if (token === 'word_pair') {
      entry.words.forEach((w, i) => {
        const jpText = w[0].replace(/[（(][^)）]+[)）]/g, '').replace(/\[[^\]]+\]/g, '').trim();
        const chText = w[1].trim();
        if (jpText || chText) {
          if (i > 0) addPause(settings.pauseBetweenWordsMs);
          if (jpText) addTts(jpText, settings.jpVoice, settings.jpRate);
          if (jpText && chText) addPause(settings.pauseWordItemMs);
          if (chText) addTts(chText, settings.chVoice, settings.chRate);
          added = true;
        }
      });
    }
    return added;
  };

  for (let r = 0; r < settings.entryRepeat; r++) {
    settings.sequence.forEach((token, i) => {
      const added = buildToken(token);
      if (added && i < settings.sequence.length - 1) {
        addPause(settings.pauseSegmentMs);
      }
    });
    if (r < settings.entryRepeat - 1) {
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
    autoNext,
    settings,
    audioCache,
    isFetching,
    fetchErrors,
    setAudioCache,
    setIsFetching,
    setFetchError,
    setCurrentIndex,
    setIsPlaying,
  } = useAppStore();

  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const playCanceledRef = useRef(false);
  const playlistIndexRef = useRef(0);

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

  // Reset playlist index when currentIndex or settings change
  useEffect(() => {
    playlistIndexRef.current = 0;
  }, [currentIndex, settings]);

  // Pre-fetch logic
  useEffect(() => {
    if (entries.length === 0) return;

    const fetchEntry = async (index: number) => {
      if (audioCache[index] || isFetching[index] || fetchErrors[index] || !entries[index]) return;

      setIsFetching(index, true);
      try {
        const entry = entries[index];
        const playlist = generatePlaylist(entry, settings);
        
        const ttsRequests: any[] = [];
        const seen = new Set();
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
          const apiBase = settings.apiBase === 'https://api.ximalian.cc.cd' ? '' : settings.apiBase;
          const MAX_RETRIES = 3;
          let attempt = 0;
          let success = false;
          let lastError: any = null;

          while (attempt < MAX_RETRIES && !success) {
            try {
              const res = await fetch(`${apiBase}/api/tts-batch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requests: ttsRequests })
              });

              if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(`Failed to fetch audio: ${errData.error || res.statusText}`);
              }

              const { results } = await res.json();
              const urlMap = new Map();
              for (const r of results) {
                const key = `${r.text}|${r.voice}|${r.rate}`;
                urlMap.set(key, `data:audio/mp3;base64,${r.audioBase64}`);
              }

              for (const item of playlist) {
                if (item.type === 'tts') {
                  const key = `${item.text}|${item.voice}|${item.rate}`;
                  item.audioUrl = urlMap.get(key);
                }
              }
              
              success = true;
            } catch (err: any) {
              lastError = err;
              attempt++;
              if (attempt < MAX_RETRIES) {
                console.warn(`Retry ${attempt}/${MAX_RETRIES} for entry ${index} after error:`, err);
                await new Promise(r => setTimeout(r, 1000 * attempt)); // Exponential backoff: 1s, 2s
              }
            }
          }

          if (!success) {
            throw lastError || new Error('Failed to fetch audio after multiple attempts');
          }
        }

        setAudioCache(index, playlist as any);
      } catch (err: any) {
        console.error(`Failed to fetch audio for entry ${index}`, err);
        setFetchError(index, err.message || 'Failed to fetch audio');
      } finally {
        setIsFetching(index, false);
      }
    };

    let activeFetches = 0;
    for (let i = currentIndex; i <= currentIndex + settings.cacheAheadEntries; i++) {
      if (i < entries.length && !audioCache[i] && !isFetching[i] && !fetchErrors[i]) {
        if (activeFetches < settings.entryConcurrency) {
          fetchEntry(i);
          activeFetches++;
        }
      }
    }
  }, [currentIndex, entries, settings, audioCache, isFetching, fetchErrors]);

  // Playback logic
  const currentPlaylist = audioCache[currentIndex] as unknown as PlaylistItem[] | undefined;
  const currentFetchError = fetchErrors[currentIndex];

  useEffect(() => {
    if (!isPlaying) {
      playCanceledRef.current = true;
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
      }
      updateMediaSessionPlaybackState('paused');
      return;
    }

    // Auto-skip on fetch error
    if (isPlaying && currentFetchError) {
      const state = useAppStore.getState();
      if (state.autoNext) {
        const nextIndex = currentIndex + 1;
        if (nextIndex < state.entries.length) {
          const pauseAudio = ensurePersistentAudioElement(activeAudioRef);
          if (!pauseAudio) {
            state.setCurrentIndex(nextIndex);
            return;
          }
          hintPlaybackAudioSession();
          pauseAudio.src = generateSilentWav(state.settings.pauseBetweenEntriesMs);
          pauseAudio.onended = () => {
            if (!playCanceledRef.current) {
              state.setCurrentIndex(nextIndex);
            }
          };
          pauseAudio.onerror = () => {
            if (!playCanceledRef.current) {
              state.setCurrentIndex(nextIndex);
            }
          };
          pauseAudio.play().catch(() => {
            if (!playCanceledRef.current) {
              state.setCurrentIndex(nextIndex);
            }
          });
        } else {
          state.setIsPlaying(false);
        }
      } else {
        state.setIsPlaying(false);
      }
      return;
    }

    playCanceledRef.current = false;

    if (isPlaying && currentPlaylist) {
      let canceled = false;
      
      const playSequence = async () => {
        hintPlaybackAudioSession();

        const state = useAppStore.getState();
        const currentBook = state.lastOpenedBook;

        if ('mediaSession' in navigator) {
          const entry = state.entries[currentIndex];
          navigator.mediaSession.metadata = new MediaMetadata({
            title: currentBook ? `${currentBook.volumeLabel} · #${currentIndex + 1}` : `Entry ${currentIndex + 1}`,
            artist: entry ? (entry.jp || entry.ch || currentBook?.bookTitle || 'Lanobe') : (currentBook?.bookTitle || 'Lanobe'),
            album: currentBook ? currentBook.bookTitle : 'Language Learning',
          });
        }
        updateMediaSessionPlaybackState('playing');

        while (playlistIndexRef.current < currentPlaylist.length) {
          if (playCanceledRef.current || canceled) break;
          
          const item = currentPlaylist[playlistIndexRef.current];
          let finished = false;
          
          let audioUrl = item.audioUrl;
          if (item.type === 'pause' && item.durationMs) {
            audioUrl = generateSilentWav(item.durationMs);
          }

          if (audioUrl) {
            const audio = ensurePersistentAudioElement(activeAudioRef);
            if (!audio) {
              finished = true;
              break;
            }

            hintPlaybackAudioSession();
            audio.src = audioUrl;
            
            await new Promise<void>((resolve) => {
              audio.onplay = () => {
                updateMediaSessionPlaybackState('playing');
              };
              audio.onended = () => { finished = true; resolve(); };
              audio.onerror = () => { 
                console.error('Audio playback error');
                updateMediaSessionPlaybackState('paused');
                finished = true; 
                resolve(); 
              };
              audio.onpause = () => {
                if (audio.ended || (audio.duration && audio.duration - audio.currentTime < 0.1)) {
                  return;
                }

                updateMediaSessionPlaybackState('paused');

                if (playCanceledRef.current || canceled || !useAppStore.getState().isPlaying) {
                  resolve();
                  return;
                }

                if (!document.hidden) {
                  useAppStore.getState().setIsPlaying(false);
                  resolve();
                }
              };
              audio.play().catch((err) => {
                console.error('Audio play error:', err);
                updateMediaSessionPlaybackState('paused');
                if (err.name === 'NotAllowedError') {
                  if (!playCanceledRef.current && !canceled) {
                    useAppStore.getState().setIsPlaying(false);
                  }
                  finished = false;
                } else {
                  finished = true;
                }
                resolve();
              });
            });
            // We don't nullify activeAudioRef.current here so we can reuse it
          } else {
            finished = true;
          }

          if (playCanceledRef.current || canceled) break;

          if (finished) {
            playlistIndexRef.current++;
          } else {
            break;
          }
        }

        if (!playCanceledRef.current && !canceled && playlistIndexRef.current >= currentPlaylist.length) {
          const state = useAppStore.getState();
          if (state.autoNext) {
            const nextIndex = currentIndex + 1;
            if (nextIndex < state.entries.length) {
              const pauseAudio = ensurePersistentAudioElement(activeAudioRef);
              if (!pauseAudio) {
                state.setCurrentIndex(nextIndex);
                return;
              }
              hintPlaybackAudioSession();
              pauseAudio.src = generateSilentWav(state.settings.pauseBetweenEntriesMs);
              await new Promise<void>((resolve) => {
                pauseAudio.onended = () => resolve();
                pauseAudio.onerror = () => resolve();
                pauseAudio.onpause = () => resolve();
                pauseAudio.play().catch(() => resolve());
              });
              
              if (!playCanceledRef.current && !canceled) {
                state.setCurrentIndex(nextIndex);
              }
            } else {
              updateMediaSessionPlaybackState('paused');
              state.setIsPlaying(false);
            }
          } else {
            updateMediaSessionPlaybackState('paused');
            state.setIsPlaying(false);
          }
        }
      };

      playSequence();

      return () => {
        canceled = true;
        if (activeAudioRef.current) {
          activeAudioRef.current.pause();
        }
      };
    }
  }, [currentIndex, isPlaying, currentPlaylist, currentFetchError]);

  return { audioCache, isFetching };
}
