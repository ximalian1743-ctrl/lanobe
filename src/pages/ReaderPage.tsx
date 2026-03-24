import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { ReaderExperience } from '../features/reader/ReaderExperience';
import { useLoadContent } from '../hooks/useLoadContent';
import { fetchBookMeta, fetchBookText } from '../services/bookService';
import { buildBuiltInBookProgressKey, BuiltInBookMeta } from '../types/books';
import { useAppStore } from '../store/useAppStore';

export function ReaderPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [meta, setMeta] = useState<BuiltInBookMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hydratedLoadKey, setHydratedLoadKey] = useState<string | null>(null);
  const lastLoadedKey = useRef<string | null>(null);
  const { loadContent } = useLoadContent();
  const lastOpenedVolumeId = useAppStore((state) => (slug ? state.lastOpenedVolumes[slug] : undefined));
  const currentIndex = useAppStore((state) => state.currentIndex);
  const entryCount = useAppStore((state) => state.entries.length);
  const saveBuiltInBookProgress = useAppStore((state) => state.saveBuiltInBookProgress);

  const volumeId = searchParams.get('volume');

  useEffect(() => {
    let cancelled = false;

    async function loadMeta() {
      if (!slug) {
        setError('Missing book slug.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const nextMeta = await fetchBookMeta(`/books/${slug}/meta.json`);
        if (!cancelled) {
          setMeta(nextMeta);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load built-in book.');
          setMeta(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadMeta();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const selectedVolume = useMemo(() => {
    if (!meta) return null;
    const preferredVolumeId = volumeId ?? lastOpenedVolumeId ?? meta.defaultVolumeId;
    return meta.volumes.find((volume) => volume.id === preferredVolumeId) ?? meta.volumes[0] ?? null;
  }, [lastOpenedVolumeId, meta, volumeId]);

  useEffect(() => {
    if (!meta || volumeId || !selectedVolume) return;
    setSearchParams({ volume: selectedVolume.id }, { replace: true });
  }, [meta, selectedVolume, setSearchParams, volumeId]);

  useEffect(() => {
    let cancelled = false;

    async function loadBuiltInVolume() {
      if (!slug || !selectedVolume) {
        return;
      }

      const loadKey = `${slug}:${selectedVolume.id}`;
      if (lastLoadedKey.current === loadKey) {
        return;
      }

      try {
        setHydratedLoadKey(null);
        setError(null);
        const text = await fetchBookText(selectedVolume.textPath);
        if (cancelled) {
          return;
        }
        await loadContent(text, { skipAi: true });
        if (cancelled) {
          return;
        }

        const state = useAppStore.getState();
        const progressKey = buildBuiltInBookProgressKey(slug, selectedVolume.id);
        const savedProgress = state.builtInBookProgress[progressKey];
        const maxIndex = Math.max(0, state.entries.length - 1);
        const restoredIndex = savedProgress ? Math.min(savedProgress.currentIndex, maxIndex) : 0;

        state.setCurrentIndex(restoredIndex);
        lastLoadedKey.current = loadKey;
        setHydratedLoadKey(loadKey);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load selected volume.');
        }
      }
    }

    loadBuiltInVolume();

    return () => {
      cancelled = true;
    };
  }, [loadContent, selectedVolume, slug]);

  useEffect(() => {
    if (!slug || !meta || !selectedVolume || entryCount === 0) {
      return;
    }

    const loadKey = `${slug}:${selectedVolume.id}`;
    if (hydratedLoadKey !== loadKey) {
      return;
    }

    const timer = window.setTimeout(() => {
      saveBuiltInBookProgress({
        slug,
        bookTitle: meta.title,
        volumeId: selectedVolume.id,
        volumeLabel: selectedVolume.label,
        currentIndex,
        entryCount,
      });
    }, 240);

    return () => {
      window.clearTimeout(timer);
    };
  }, [currentIndex, entryCount, hydratedLoadKey, meta, saveBuiltInBookProgress, selectedVolume, slug]);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = meta ? `${meta.title} - ${selectedVolume?.label ?? 'Reader'}` : slug ? `Lanobe Reader - ${slug}` : 'Lanobe Reader';
    return () => {
      document.title = previousTitle;
    };
  }, [meta, selectedVolume?.label, slug]);

  const handleVolumeSelect = (nextVolumeId: string) => {
    setSearchParams({ volume: nextVolumeId });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center gap-3">
        <Loader2 className="animate-spin text-orange-300" size={20} />
        Loading built-in book...
      </div>
    );
  }

  if (error || !meta || !selectedVolume) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8">
        <Link
          to="/lanobe/bookshelf"
          className="inline-flex items-center gap-2 rounded-full border border-stone-700/80 bg-stone-950/75 px-4 py-2 text-sm font-semibold text-stone-100 backdrop-blur-md hover:border-stone-500"
        >
          <ArrowLeft size={16} />
          Back To Bookshelf
        </Link>
        <div className="mt-6 rounded-[28px] border border-red-500/20 bg-red-500/10 p-6 text-red-200">
          {error ?? 'Unable to load the requested book.'}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-4 right-4 top-4 z-50 flex flex-col gap-3 md:left-6 md:right-6">
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/lanobe/bookshelf"
            className="inline-flex items-center gap-2 rounded-full border border-stone-700/80 bg-stone-950/75 px-4 py-2 text-sm font-semibold text-stone-100 backdrop-blur-md hover:border-stone-500"
          >
            <ArrowLeft size={16} />
            Back To Bookshelf
          </Link>
          <div className="rounded-full border border-stone-700/80 bg-stone-950/75 px-4 py-2 text-xs uppercase tracking-[0.25em] text-orange-200/85 backdrop-blur-md">
            {meta.subtitle}
          </div>
        </div>
        <div className="rounded-[24px] border border-stone-700/80 bg-stone-950/70 px-4 py-4 backdrop-blur-md md:px-5">
          <h1 className="text-lg md:text-2xl font-black tracking-tight text-stone-100">{meta.title}</h1>
          <p className="mt-1 text-xs uppercase tracking-[0.25em] text-stone-400">
            {meta.author} / {meta.illustrator}
          </p>
          <p className="mt-3 text-sm text-stone-300/80">
            Local progress and listening preferences are saved in this browser. Reopening this volume will resume from line {currentIndex + 1}.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {meta.volumes.map((volume) => (
              <button
                key={volume.id}
                type="button"
                onClick={() => handleVolumeSelect(volume.id)}
                className={[
                  'rounded-full px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] transition-colors',
                  volume.id === selectedVolume.id
                    ? 'bg-orange-400 text-stone-950'
                    : 'border border-stone-700 bg-stone-900/80 text-stone-200 hover:border-stone-500',
                ].join(' ')}
              >
                {volume.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <ReaderExperience />
    </div>
  );
}
