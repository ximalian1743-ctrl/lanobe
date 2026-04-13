import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { GuideModal } from '../components/GuideModal';
import { ReaderExperience } from '../features/reader/ReaderExperience';
import { useLoadContent } from '../hooks/useLoadContent';
import { fetchBookMeta, fetchBookText } from '../services/bookService';
import { buildBuiltInBookProgressKey, BuiltInBookMeta } from '../types/books';
import { useAppStore } from '../store/useAppStore';
import { useUiText } from '../hooks/useUiText';
import { getLocalizedBookMeta } from '../i18n/books';

export function ReaderPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [meta, setMeta] = useState<BuiltInBookMeta | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hydratedLoadKey, setHydratedLoadKey] = useState<string | null>(null);
  const lastLoadedKey = useRef<string | null>(null);
  const { loadContent } = useLoadContent();
  const lastOpenedVolumeId = useAppStore((state) => (slug ? state.lastOpenedVolumes[slug] : undefined));
  const currentIndex = useAppStore((state) => state.currentIndex);
  const entryCount = useAppStore((state) => state.entries.length);
  const saveBuiltInBookProgress = useAppStore((state) => state.saveBuiltInBookProgress);
  const { text, uiLanguage } = useUiText();

  const volumeId = searchParams.get('volume');
  const guideContent = useMemo(() => {
    if (uiLanguage === 'ja-JP') {
      return {
        title: 'リーダーの使い方',
        summary: 'この画面は本文を広く見せるために、上部と下部のコントロールをかなり絞っています。',
        steps: [
          '下部には再生、前後移動、現在地復帰、設定だけを残しています。',
          '検索、割合ジャンプ、自動連続再生、表示切り替え、再生順プリセットは設定ボタンの中に移しました。',
          '別の巻に切り替えたいときは、この画面ではなく本棚へ戻って選び直してください。',
        ],
      };
    }

    if (uiLanguage === 'en-US') {
      return {
        title: 'Reader Guide',
        summary: 'This page now keeps the novel area much larger by trimming the always-visible controls.',
        steps: [
          'The bottom bar only keeps playback, previous/next, locate, and Settings.',
          'Search, percentage jump, auto next, display options, and playback presets are now inside Settings.',
          'If you want a different volume, go back to the bookshelf and choose it there first.',
        ],
      };
    }

    return {
      title: '阅读页使用引导',
      summary: '这一页已经把长期占位的控件收紧，正文可见区域会大很多。',
      steps: [
        '底部只保留播放、前后切换、定位和设置按钮。',
        '搜索、百分比跳转、自动连播、显示切换和播放顺序预设，都收进设置按钮里了。',
        '如果想切到别的分册，请先回书架选择，这一页不再常驻悬浮分册切换。',
      ],
    };
  }, [uiLanguage]);

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
    document.title = localizedMeta
      ? `Lanobe | ${localizedMeta.title} · ${selectedVolume?.label ?? 'Reader'}`
      : slug
        ? `Lanobe | Reader · ${slug}`
        : 'Lanobe | Reader';
    return () => {
      document.title = previousTitle;
    };
  }, [localizedMeta, selectedVolume?.label, slug]);

  useEffect(() => {
    if (window.localStorage.getItem('lanobe-guide-reader-v2') !== '1') {
      setShowGuide(true);
    }
  }, []);

  const handleCloseGuide = () => {
    window.localStorage.setItem('lanobe-guide-reader-v2', '1');
    setShowGuide(false);
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
    <>
      <ReaderExperience
        showHeader={false}
        returnTo="/lanobe/bookshelf"
      />

      {showGuide && (
        <GuideModal
          title={guideContent.title}
          summary={guideContent.summary}
          steps={guideContent.steps}
          closeLabel={text.common.close}
          onClose={handleCloseGuide}
        />
      )}
    </>
  );
}
