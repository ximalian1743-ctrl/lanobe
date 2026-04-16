import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useAudioQueue } from '../hooks/useAudioQueue';
import { useLoadContent } from '../hooks/useLoadContent';
import { fetchBookMeta, fetchBookText } from '../services/bookService';
import { BuiltInBookMeta, buildBuiltInBookProgressKey } from '../types/books';
import { getLocalizedBookMeta } from '../i18n/books';
import { useUiText } from '../hooks/useUiText';
import { useSwipe } from '../hooks/useSwipe';
import { useReadingTimer } from '../hooks/useReadingTimer';

/**
 * Drive Mode — minimal, large-text, thumb-friendly player view for listening
 * while driving / commuting. No reader list, no word glossary.
 */
export function DriveModePage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const volumeId = searchParams.get('volume');

  const [meta, setMeta] = useState<BuiltInBookMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastLoadedKey = useRef<string | null>(null);
  const { loadContent } = useLoadContent();
  const { uiLanguage } = useUiText();

  const entries = useAppStore((s) => s.entries);
  const currentIndex = useAppStore((s) => s.currentIndex);
  const setCurrentIndex = useAppStore((s) => s.setCurrentIndex);
  const setIsPlaying = useAppStore((s) => s.setIsPlaying);
  const isPlaying = useAppStore((s) => s.isPlaying);
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const saveBuiltInBookProgress = useAppStore((s) => s.saveBuiltInBookProgress);

  useAudioQueue();
  useReadingTimer(slug, volumeId ?? undefined);

  const localizedMeta = useMemo(() => (meta ? getLocalizedBookMeta(meta, uiLanguage) : null), [meta, uiLanguage]);
  const selectedVolume = useMemo(() => {
    if (!localizedMeta || !volumeId) return null;
    return localizedMeta.volumes.find((v) => v.id === volumeId) ?? null;
  }, [localizedMeta, volumeId]);

  // Load meta + volume text
  useEffect(() => {
    let cancelled = false;
    async function loadMeta() {
      if (!slug) return;
      try {
        setLoading(true);
        const nextMeta = await fetchBookMeta(`/books/${slug}/meta.json`);
        if (!cancelled) {
          setMeta(nextMeta);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : '无法加载小说');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadMeta();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!slug || !selectedVolume || !localizedMeta) return;
    const loadKey = `${slug}:${selectedVolume.id}`;
    if (lastLoadedKey.current === loadKey) return;
    let cancelled = false;
    (async () => {
      try {
        const text = await fetchBookText(selectedVolume.textPath);
        if (cancelled) return;
        await loadContent(text, { skipAi: true });
        const state = useAppStore.getState();
        const savedProgress = state.builtInBookProgress[buildBuiltInBookProgressKey(slug, selectedVolume.id)];
        const restoredIndex = savedProgress ? Math.min(savedProgress.currentIndex, state.entries.length - 1) : 0;
        state.setCurrentIndex(restoredIndex);
        lastLoadedKey.current = loadKey;
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : '加载失败');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, selectedVolume, localizedMeta, loadContent]);

  // Auto-save progress
  useEffect(() => {
    if (!slug || !localizedMeta || !selectedVolume || entries.length === 0) return;
    const timer = window.setTimeout(() => {
      saveBuiltInBookProgress({
        slug,
        bookTitle: localizedMeta.title,
        volumeId: selectedVolume.id,
        volumeLabel: selectedVolume.label,
        currentIndex,
        entryCount: entries.length,
      });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [slug, localizedMeta, selectedVolume, currentIndex, entries.length, saveBuiltInBookProgress]);

  // Auto-play when loaded
  useEffect(() => {
    if (entries.length > 0 && !isPlaying) {
      setIsPlaying(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries.length]);

  const currentEntry = entries[currentIndex];
  const jpClean = currentEntry?.jp?.replace(/\[[^\]]+\]/g, '') ?? '';
  const progressPct = entries.length > 0 ? Math.round(((currentIndex + 1) / entries.length) * 100) : 0;

  const swipe = useSwipe({
    onSwipeLeft: () => setCurrentIndex(Math.min(entries.length - 1, currentIndex + 1)),
    onSwipeRight: () => setCurrentIndex(Math.max(0, currentIndex - 1)),
  });

  const fontScale = settings.readerFontScale ?? 1;

  if (loading || !localizedMeta) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-3 bg-slate-950 text-slate-100">
        <Loader2 className="animate-spin text-orange-300" size={20} />
        加载中…
      </div>
    );
  }

  if (error || !selectedVolume) {
    return (
      <div className="min-h-screen bg-slate-950 p-6 text-slate-100">
        <Link to={`/lanobe/book/${slug}?volume=${volumeId ?? ''}`} className="inline-flex items-center gap-2 text-sm text-slate-300">
          <ArrowLeft size={16} /> 退出
        </Link>
        <div className="mt-6 rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-red-200">{error ?? '找不到该卷'}</div>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-[100dvh] flex-col bg-slate-950 text-slate-100"
      {...swipe}
    >
      {/* Top: exit + progress + title */}
      <div className="flex items-center justify-between border-b border-slate-800/70 px-5 py-3">
        <Link
          to={`/lanobe/book/${slug}?volume=${volumeId ?? ''}`}
          className="inline-flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-900/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-200 hover:border-slate-500"
        >
          <ArrowLeft size={14} /> 退出听书
        </Link>
        <div className="flex flex-col items-end">
          <span className="truncate text-xs text-slate-400">{localizedMeta.title} · {selectedVolume.label}</span>
          <span className="font-mono text-[10px] text-slate-500">{currentIndex + 1} / {entries.length} · {progressPct}%</span>
        </div>
      </div>

      {/* Center: big sentence */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-8 text-center">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.26em] text-amber-300">当前句</div>
        <p
          className="mb-6 max-w-3xl text-slate-100"
          style={{ fontSize: `${1.8 * fontScale}rem`, lineHeight: 1.5, fontWeight: 600 }}
        >
          {jpClean || '—'}
        </p>
        {currentEntry?.ch ? (
          <p
            className="max-w-2xl text-slate-400"
            style={{ fontSize: `${1.1 * fontScale}rem`, lineHeight: 1.7 }}
          >
            {currentEntry.ch}
          </p>
        ) : null}
      </div>

      {/* Bottom: big controls */}
      <div className="flex flex-col gap-4 border-t border-slate-800/70 bg-slate-950/95 px-6 py-6">
        {/* Progress bar */}
        <div className="h-1 w-full rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-blue-500 transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="flex items-center justify-center gap-6">
          <button
            type="button"
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-200 transition-colors hover:border-slate-500 disabled:opacity-30"
            aria-label="上一句"
          >
            <SkipBack size={24} />
          </button>
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className={[
              'flex h-20 w-20 items-center justify-center rounded-full text-white shadow-2xl transition-all',
              isPlaying ? 'bg-red-500 shadow-red-500/30' : 'bg-blue-500 shadow-blue-500/30',
            ].join(' ')}
            aria-label={isPlaying ? '暂停' : '播放'}
          >
            {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
          </button>
          <button
            type="button"
            onClick={() => setCurrentIndex(Math.min(entries.length - 1, currentIndex + 1))}
            disabled={currentIndex >= entries.length - 1}
            className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-200 transition-colors hover:border-slate-500 disabled:opacity-30"
            aria-label="下一句"
          >
            <SkipForward size={24} />
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <button
            type="button"
            onClick={() => updateSettings({ readerFontScale: Math.max(0.85, fontScale - 0.1) })}
            className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 hover:border-slate-500"
          >
            A-
          </button>
          <span>字号 {(fontScale * 100).toFixed(0)}%</span>
          <button
            type="button"
            onClick={() => updateSettings({ readerFontScale: Math.min(1.4, fontScale + 0.1) })}
            className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 hover:border-slate-500"
          >
            A+
          </button>
        </div>
      </div>
    </div>
  );
}
