import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, BookCopy, Loader2, PanelTopClose, PanelTopOpen } from 'lucide-react';
import { ReaderExperience } from '../features/reader/ReaderExperience';
import { useLoadContent } from '../hooks/useLoadContent';
import { fetchBookMeta, fetchBookText } from '../services/bookService';
import { buildBuiltInBookProgressKey, BuiltInBookMeta } from '../types/books';
import { useAppStore } from '../store/useAppStore';
import { useUiText } from '../hooks/useUiText';
import { getLocalizedBookMeta } from '../i18n/books';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

export function ReaderPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [meta, setMeta] = useState<BuiltInBookMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hydratedLoadKey, setHydratedLoadKey] = useState<string | null>(null);
  const [showVolumePanel, setShowVolumePanel] = useState(false);
  const lastLoadedKey = useRef<string | null>(null);
  const { loadContent } = useLoadContent();
  const lastOpenedVolumeId = useAppStore((state) => (slug ? state.lastOpenedVolumes[slug] : undefined));
  const currentIndex = useAppStore((state) => state.currentIndex);
  const entryCount = useAppStore((state) => state.entries.length);
  const saveBuiltInBookProgress = useAppStore((state) => state.saveBuiltInBookProgress);
  const { text, format, uiLanguage } = useUiText();

  const volumeId = searchParams.get('volume');

  useEffect(() => {
    let cancelled = false;

    async function loadMeta() {
      if (!slug) {
        setError(text.reader.missingBook);
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
          setError(err instanceof Error ? err.message : text.reader.missingBook);
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
  }, [slug, text.reader.missingBook]);

  const localizedMeta = useMemo(() => (meta ? getLocalizedBookMeta(meta, uiLanguage) : null), [meta, uiLanguage]);

  const selectedVolume = useMemo(() => {
    if (!localizedMeta) return null;
    const preferredVolumeId = volumeId ?? lastOpenedVolumeId ?? localizedMeta.defaultVolumeId;
    return localizedMeta.volumes.find((volume) => volume.id === preferredVolumeId) ?? localizedMeta.volumes[0] ?? null;
  }, [lastOpenedVolumeId, localizedMeta, volumeId]);

  useEffect(() => {
    if (!localizedMeta || volumeId || !selectedVolume) return;
    setSearchParams({ volume: selectedVolume.id }, { replace: true });
  }, [localizedMeta, selectedVolume, setSearchParams, volumeId]);

  useEffect(() => {
    let cancelled = false;

    async function loadBuiltInVolume() {
      if (!slug || !selectedVolume || !localizedMeta) {
        return;
      }

      const loadKey = `${slug}:${selectedVolume.id}`;
      if (lastLoadedKey.current === loadKey) {
        return;
      }

      try {
        setHydratedLoadKey(null);
        setError(null);
        const textContent = await fetchBookText(selectedVolume.textPath);
        if (cancelled) {
          return;
        }
        await loadContent(textContent, { skipAi: true });
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
          setError(err instanceof Error ? err.message : text.reader.missingBook);
        }
      }
    }

    loadBuiltInVolume();

    return () => {
      cancelled = true;
    };
  }, [loadContent, localizedMeta, selectedVolume, slug, text.reader.missingBook]);

  useEffect(() => {
    if (!slug || !localizedMeta || !selectedVolume || entryCount === 0) {
      return;
    }

    const loadKey = `${slug}:${selectedVolume.id}`;
    if (hydratedLoadKey !== loadKey) {
      return;
    }

    const timer = window.setTimeout(() => {
      saveBuiltInBookProgress({
        slug,
        bookTitle: localizedMeta.title,
        volumeId: selectedVolume.id,
        volumeLabel: selectedVolume.label,
        currentIndex,
        entryCount,
      });
    }, 240);

    return () => {
      window.clearTimeout(timer);
    };
  }, [currentIndex, entryCount, hydratedLoadKey, localizedMeta, saveBuiltInBookProgress, selectedVolume, slug]);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = localizedMeta ? `${localizedMeta.title} - ${selectedVolume?.label ?? 'Reader'}` : slug ? `Lanobe Reader - ${slug}` : 'Lanobe Reader';
    return () => {
      document.title = previousTitle;
    };
  }, [localizedMeta, selectedVolume?.label, slug]);

  const handleVolumeSelect = (nextVolumeId: string) => {
    setSearchParams({ volume: nextVolumeId });
    setShowVolumePanel(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-3 bg-slate-950 text-slate-100">
        <Loader2 className="animate-spin text-orange-300" size={20} />
        {text.reader.loadingBook}
      </div>
    );
  }

  if (error || !localizedMeta || !selectedVolume) {
    return (
      <div className="min-h-screen bg-slate-950 p-6 text-slate-100 md:p-8">
        <Link
          to="/lanobe/bookshelf"
          className="inline-flex items-center gap-2 rounded-full border border-stone-700/80 bg-stone-950/75 px-4 py-2 text-sm font-semibold text-stone-100 backdrop-blur-md hover:border-stone-500"
        >
          <ArrowLeft size={16} />
          {text.common.backToBookshelf}
        </Link>
        <div className="mt-6 rounded-[28px] border border-red-500/20 bg-red-500/10 p-6 text-red-200">
          {error ?? text.reader.missingBook}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="pointer-events-none fixed left-4 right-4 top-4 z-[65] md:left-6 md:right-6">
        <div className="pointer-events-auto rounded-[28px] border border-stone-700/80 bg-stone-950/80 p-4 shadow-2xl shadow-black/35 backdrop-blur-md">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to="/lanobe/bookshelf"
                  className="inline-flex items-center gap-2 rounded-full border border-stone-700 bg-stone-900/80 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-100 transition-colors hover:border-stone-500"
                >
                  <ArrowLeft size={14} />
                  {text.common.backToBookshelf}
                </Link>
                <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200/90">
                  {text.reader.savedStatus}
                </div>
                <button
                  type="button"
                  onClick={() => setShowVolumePanel((value) => !value)}
                  className="inline-flex items-center gap-2 rounded-full border border-stone-700 bg-stone-900/80 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-100 transition-colors hover:border-stone-500"
                >
                  {showVolumePanel ? <PanelTopClose size={14} /> : <PanelTopOpen size={14} />}
                  {showVolumePanel ? text.reader.hidePanel : text.reader.showPanel}
                </button>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.26em] text-orange-200/85">{text.reader.utilityLabel}</p>
                <h1 className="mt-1 text-xl font-black tracking-tight text-stone-100 md:text-2xl">{localizedMeta.title}</h1>
                <p className="mt-1 text-xs uppercase tracking-[0.22em] text-stone-400">
                  {localizedMeta.author} / {localizedMeta.illustrator}
                </p>
                <p className="mt-2 text-sm text-stone-300/80">{format(text.reader.autoSaveMessage, { line: currentIndex + 1 })}</p>
                <p className="mt-1 text-xs text-stone-500">{text.reader.returnHint}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 xl:justify-end">
              <div className="rounded-full border border-stone-700/80 bg-stone-900/80 px-3 py-2 text-xs uppercase tracking-[0.25em] text-orange-200/85">
                {selectedVolume.label}
              </div>
              <LanguageSwitcher compact />
            </div>
          </div>

          {showVolumePanel && (
            <div className="mt-4 rounded-2xl border border-stone-800/80 bg-stone-900/70 p-4">
              <div className="flex items-center gap-2 text-orange-200/85">
                <BookCopy size={16} />
                <p className="text-xs uppercase tracking-[0.24em]">{text.reader.volumePanelTitle}</p>
              </div>
              <p className="mt-2 text-sm text-stone-400">{text.reader.volumePanelDescription}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {localizedMeta.volumes.map((volume) => (
                  <button
                    key={volume.id}
                    type="button"
                    onClick={() => handleVolumeSelect(volume.id)}
                    className={[
                      'rounded-full px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] transition-colors',
                      volume.id === selectedVolume.id
                        ? 'bg-orange-400 text-stone-950'
                        : 'border border-stone-700 bg-stone-950/75 text-stone-200 hover:border-stone-500',
                    ].join(' ')}
                  >
                    {volume.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <ReaderExperience
        showHeader={false}
        topInsetClassName="pt-40 md:pt-44"
        onOpenVolumePanel={() => setShowVolumePanel((value) => !value)}
        returnTo="/lanobe/bookshelf"
      />
    </div>
  );
}

