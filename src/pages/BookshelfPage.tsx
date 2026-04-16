import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookMarked, Clock3, Headphones, Loader2, Upload } from 'lucide-react';
import { motion } from 'motion/react';
import { GuideModal } from '../components/GuideModal';
import { SiteFrame } from '../components/SiteFrame';
import { fetchBooksIndex } from '../services/bookService';
import { buildBuiltInBookProgressKey, BuiltInBookSummary } from '../types/books';
import { useAppStore, buildVolumeKey } from '../store/useAppStore';
import { useUiText } from '../hooks/useUiText';
import { getFormattedVolumeLabel, getLocalizedBookSummary } from '../i18n/books';
import { formatReadingTime } from '../hooks/useReadingTimer';

function BookCardSkeleton() {
  return (
    <div className="animate-pulse rounded-[30px] border border-stone-800/60 bg-stone-950/40 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="h-20 w-14 rounded-2xl bg-stone-800/60" />
        <div className="h-6 w-24 rounded-full bg-stone-800/40" />
      </div>
      <div className="mt-5 h-7 w-3/4 rounded-full bg-stone-800/60" />
      <div className="mt-3 space-y-2">
        <div className="h-4 rounded-full bg-stone-800/40" />
        <div className="h-4 w-4/5 rounded-full bg-stone-800/40" />
        <div className="h-4 w-2/3 rounded-full bg-stone-800/40" />
      </div>
      <div className="mt-4 flex gap-2">
        <div className="h-6 w-16 rounded-full bg-stone-800/40" />
        <div className="h-6 w-12 rounded-full bg-stone-800/40" />
      </div>
      <div className="mt-5 h-14 rounded-2xl bg-stone-800/30" />
      <div className="mt-5 h-20 rounded-2xl bg-stone-800/30" />
      <div className="mt-5 flex gap-3">
        <div className="h-11 w-32 rounded-full bg-stone-800/50" />
        <div className="h-11 w-28 rounded-full bg-stone-800/30" />
      </div>
    </div>
  );
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, delay: i * 0.09, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

export function BookshelfPage() {
  const [showGuide, setShowGuide] = useState(false);
  const [books, setBooks] = useState<BuiltInBookSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVolumes, setSelectedVolumes] = useState<Record<string, string>>({});
  const builtInBookProgress = useAppStore((state) => state.builtInBookProgress);
  const lastOpenedVolumes = useAppStore((state) => state.lastOpenedVolumes);
  const lastOpenedBook = useAppStore((state) => state.lastOpenedBook);
  const readingTime = useAppStore((state) => state.readingTime);
  const { text, format, uiLanguage } = useUiText();

  useEffect(() => {
    let cancelled = false;

    async function loadBooks() {
      try {
        const nextBooks = await fetchBooksIndex();
        if (!cancelled) {
          setBooks(nextBooks);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : text.reader.missingBook);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadBooks();

    return () => {
      cancelled = true;
    };
  }, [text.reader.missingBook]);

  const localizedBooks = useMemo(() => books.map((book) => getLocalizedBookSummary(book, uiLanguage)), [books, uiLanguage]);
  const localizedTags = [text.bookshelf.tagsBuiltIn, text.bookshelf.tagsJapaneseNovel, text.bookshelf.tagsSeries];
  const localizedLastOpenedBook = useMemo(
    () => (lastOpenedBook ? localizedBooks.find((book) => book.slug === lastOpenedBook.slug) ?? null : null),
    [lastOpenedBook, localizedBooks],
  );
  const guideContent = useMemo(() => {
    if (uiLanguage === 'ja-JP') {
      return {
        title: '本棚の使い方',
        summary: 'この版では、先に本棚で巻を選んでからリーダーに入る流れに整理しました。',
        steps: [
          '本ごとに表示される巻ボタンから、再生したい巻を先に選びます。',
          'オレンジ色のボタンで選択中の巻へ入り、前回位置があればその巻の進捗から再開します。',
          'リーダー内では巻切り替えを常時浮かせず、設定ボタンの中に検索や移動をまとめています。',
        ],
      };
    }

    if (uiLanguage === 'en-US') {
      return {
        title: 'How the Bookshelf Works',
        summary: 'This version moves volume selection to the bookshelf, so you choose the volume before entering the reader.',
        steps: [
          'Use the volume chips on each book card to pick the volume you want to listen to or read.',
          'Open the selected volume with the orange button. If that volume has saved progress, it resumes from there.',
          'The reader no longer keeps the volume switcher floating. Search, jump, and playback controls now live under Settings.',
        ],
      };
    }

    return {
      title: '书架使用引导',
      summary: '这一版把"先选分册，再进入阅读"放回书架页，阅读页会更清爽。',
      steps: [
        '先在每本书卡片里点选你要播放或阅读的分册。',
        '橙色按钮会直接进入当前选中的分册；如果该分册已有进度，会从保存位置继续。',
        '进入阅读后，不再一直悬浮显示分册切换，搜索、跳转和播放控制统一收进设置按钮里。',
      ],
    };
  }, [uiLanguage]);

  useEffect(() => {
    if (window.localStorage.getItem('lanobe-guide-bookshelf-v2') !== '1') {
      setShowGuide(true);
    }
  }, []);

  const handleCloseGuide = () => {
    window.localStorage.setItem('lanobe-guide-bookshelf-v2', '1');
    setShowGuide(false);
  };

  return (
    <>
      <SiteFrame
        eyebrow={text.bookshelf.eyebrow}
        title={text.bookshelf.title}
        description={text.bookshelf.description}
      >
        {loading ? (
          <div className="space-y-5">
            <div className="flex items-center gap-3 rounded-[30px] border border-stone-800/60 bg-stone-950/40 p-6 text-stone-400">
              <Loader2 className="animate-spin text-orange-300" size={16} />
              <span className="text-sm">{text.bookshelf.loading}</span>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <BookCardSkeleton />
              <BookCardSkeleton />
            </div>
          </div>
        ) : error ? (
          <div className="rounded-[30px] border border-red-500/20 bg-red-500/10 p-8 text-red-200">
            {error}
          </div>
        ) : (
          <main className="space-y-5">
            {lastOpenedBook && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.32, ease: 'easeOut' }}
              >
                <Link
                  to={`/lanobe/book/${lastOpenedBook.slug}?volume=${lastOpenedBook.volumeId}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-[30px] border border-orange-300/15 bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.18),_rgba(12,10,9,0.92)_55%)] p-6 shadow-xl shadow-black/20 transition-shadow hover:shadow-orange-950/20"
                >
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-orange-200/85">{text.bookshelf.continueListening}</p>
                    <h2 className="mt-2 text-2xl font-black tracking-tight text-stone-100">
                      {localizedLastOpenedBook?.title ?? lastOpenedBook.bookTitle}
                    </h2>
                    <p className="mt-2 text-sm text-stone-300/85">
                      {getFormattedVolumeLabel(lastOpenedBook.volumeId, uiLanguage)} · {text.bookshelf.localHint}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-orange-400 px-5 py-3 text-sm font-bold text-stone-950 transition-transform hover:-translate-y-0.5">
                    {text.bookshelf.resumeButton}
                    <ArrowRight size={16} />
                  </span>
                </Link>
              </motion.div>
            )}

            <div className="grid gap-5 md:grid-cols-2">
              {localizedBooks.map((book, index) => {
                const resumeVolumeId = lastOpenedVolumes[book.slug] ?? book.defaultVolumeId;
                const selectedVolumeId = selectedVolumes[book.slug] ?? resumeVolumeId;
                const selectedProgress = builtInBookProgress[buildBuiltInBookProgressKey(book.slug, selectedVolumeId)];
                const resumeProgress = builtInBookProgress[buildBuiltInBookProgressKey(book.slug, resumeVolumeId)];
                const hasSelectedProgress = !!selectedProgress;
                const hasResumeProgress = !!resumeProgress;
                const volumeOptions = Array.from({ length: book.volumeCount }, (_, idx) => {
                  const volumeNumber = idx + 1;
                  const volumeId = `volume-${String(volumeNumber).padStart(2, '0')}`;
                  return {
                    id: volumeId,
                    label: getFormattedVolumeLabel(volumeId, uiLanguage),
                  };
                });

                return (
                  <motion.article
                    key={book.slug}
                    custom={index}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    className="rounded-[30px] border border-stone-800/80 bg-stone-950/55 p-6 shadow-xl shadow-black/15"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex h-20 w-14 items-center justify-center rounded-2xl border border-orange-300/20 bg-[linear-gradient(180deg,_rgba(251,146,60,0.45),_rgba(120,53,15,0.9))] shadow-lg shadow-orange-950/40">
                        <BookMarked className="text-stone-950" size={22} />
                      </div>
                      <div className="inline-flex items-center gap-2 rounded-full border border-teal-400/20 bg-teal-500/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-teal-200/90">
                        <Clock3 size={12} />
                        {format(text.bookshelf.volumesCount, { count: book.volumeCount })}
                      </div>
                    </div>

                    <h2 className="mt-5 text-2xl font-black tracking-tight text-stone-100">{book.title}</h2>
                    <p className="mt-1 text-sm uppercase tracking-[0.22em] text-orange-200/80">{book.subtitle}</p>
                    <p className="mt-3 text-sm leading-7 text-stone-300/85">{book.description}</p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {localizedTags.map((tag) => (
                        <span
                          key={`${book.slug}-${tag}`}
                          className="rounded-full border border-stone-700 bg-stone-900/70 px-3 py-1 text-xs uppercase tracking-[0.2em] text-stone-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="mt-5 rounded-2xl border border-stone-800/80 bg-stone-900/65 px-4 py-3 text-sm text-stone-300/90">
                      {hasSelectedProgress
                        ? format(text.bookshelf.savedProgress, {
                            volumeLabel: getFormattedVolumeLabel(selectedProgress.volumeId, uiLanguage),
                            line: selectedProgress.currentIndex + 1,
                            entryCount: selectedProgress.entryCount,
                          })
                        : text.bookshelf.noProgress}
                    </div>

                    <div className="mt-5 rounded-2xl border border-stone-800/80 bg-stone-900/65 p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-stone-400">{text.bookshelf.pickVolumeLabel}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {volumeOptions.map((volume) => {
                          const volProgress =
                            builtInBookProgress[buildBuiltInBookProgressKey(book.slug, volume.id)];
                          const isLastOpened = lastOpenedVolumes[book.slug] === volume.id;
                          const isSelected = selectedVolumeId === volume.id;
                          return (
                            <button
                              key={`${book.slug}-${volume.id}`}
                              type="button"
                              onClick={() =>
                                setSelectedVolumes((current) => ({
                                  ...current,
                                  [book.slug]: volume.id,
                                }))
                              }
                              className={[
                                'relative rounded-full px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] transition-colors duration-150',
                                isSelected
                                  ? 'bg-orange-400 text-stone-950'
                                  : 'border border-stone-700 bg-stone-950/75 text-stone-200 hover:border-stone-500',
                              ].join(' ')}
                            >
                              {volume.label}
                              {volProgress && !isSelected ? (
                                <span
                                  className={[
                                    'absolute -right-1 -top-1 h-2 w-2 rounded-full',
                                    isLastOpened ? 'bg-orange-300' : 'bg-teal-400/80',
                                  ].join(' ')}
                                  title={
                                    isLastOpened
                                      ? `上次 · 第 ${volProgress.currentIndex + 1} 行`
                                      : `进度 · 第 ${volProgress.currentIndex + 1} 行`
                                  }
                                />
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                      {lastOpenedVolumes[book.slug] && (
                        <p className="mt-3 text-[11px] text-stone-500">
                          <span className="mr-1 inline-block h-2 w-2 rounded-full bg-orange-300 align-middle" />
                          上次阅读：
                          {getFormattedVolumeLabel(lastOpenedVolumes[book.slug], uiLanguage)}
                          {(() => {
                            const p =
                              builtInBookProgress[
                                buildBuiltInBookProgressKey(book.slug, lastOpenedVolumes[book.slug])
                              ];
                            return p ? ` · 第 ${p.currentIndex + 1} 行 / ${p.entryCount}` : '';
                          })()}
                        </p>
                      )}
                    </div>

                    {(() => {
                      const timeKey = buildVolumeKey(book.slug, selectedVolumeId);
                      const seconds = readingTime[timeKey] ?? 0;
                      if (seconds === 0) return null;
                      return (
                        <p className="mt-3 text-[11px] text-stone-500">
                          <Clock3 size={11} className="mr-1 inline align-middle" />
                          本卷已阅读 {formatReadingTime(seconds)}
                        </p>
                      );
                    })()}

                    <div className="mt-6 flex flex-wrap gap-3">
                      <Link
                        to={`/lanobe/book/${book.slug}?volume=${selectedVolumeId}`}
                        className="inline-flex items-center gap-2 rounded-full bg-orange-400 px-5 py-3 text-sm font-bold text-stone-950 transition-transform hover:-translate-y-0.5"
                      >
                        {hasSelectedProgress ? text.common.resume : text.bookshelf.openSelectedVolume}
                        <ArrowRight size={16} />
                      </Link>
                      <Link
                        to={`/lanobe/drive/${book.slug}?volume=${selectedVolumeId}`}
                        className="inline-flex items-center gap-2 rounded-full border border-blue-600/50 bg-blue-600/15 px-5 py-3 text-sm font-semibold text-blue-200 hover:bg-blue-600/25"
                        title="听书模式（适合开车/通勤）"
                      >
                        <Headphones size={16} />
                        听书
                      </Link>
                      {hasResumeProgress && selectedVolumeId !== resumeVolumeId ? (
                        <Link
                          to={`/lanobe/book/${book.slug}?volume=${resumeVolumeId}`}
                          className="inline-flex items-center gap-2 rounded-full border border-stone-700 bg-stone-900/70 px-5 py-3 text-sm font-semibold text-stone-100 hover:border-stone-500"
                        >
                          {text.bookshelf.resumeSavedVolume}
                        </Link>
                      ) : null}
                    </div>
                  </motion.article>
                );
              })}

              {/* Custom TXT upload card */}
              <motion.article
                custom={localizedBooks.length}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className="flex flex-col justify-between rounded-[30px] border border-dashed border-blue-800/40 bg-stone-950/35 p-6 shadow-xl shadow-black/10"
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-20 w-14 items-center justify-center rounded-2xl border border-blue-400/20 bg-[linear-gradient(180deg,_rgba(59,130,246,0.35),_rgba(30,58,138,0.8))] shadow-lg shadow-blue-950/40">
                      <Upload className="text-blue-100" size={22} />
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-blue-200/80">
                      TXT
                    </div>
                  </div>
                  <h2 className="mt-5 text-2xl font-black tracking-tight text-stone-100">{text.txtUpload.cardTitle}</h2>
                  <p className="mt-3 text-sm leading-7 text-stone-300/75">{text.txtUpload.cardDescription}</p>
                </div>
                <div className="mt-6">
                  <Link
                    to="/lanobe/reader"
                    className="inline-flex items-center gap-2 rounded-full border border-blue-600/50 bg-blue-600/15 px-5 py-3 text-sm font-bold text-blue-200 transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-600/25"
                  >
                    {text.txtUpload.cardButton}
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </motion.article>
            </div>
          </main>
        )}
      </SiteFrame>

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
