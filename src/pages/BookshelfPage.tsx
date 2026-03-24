import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookMarked, Clock3, Loader2 } from 'lucide-react';
import { SiteFrame } from '../components/SiteFrame';
import { fetchBooksIndex } from '../services/bookService';
import { buildBuiltInBookProgressKey, BuiltInBookSummary } from '../types/books';
import { useAppStore } from '../store/useAppStore';
import { useUiText } from '../hooks/useUiText';
import { getFormattedVolumeLabel, getLocalizedBookSummary } from '../i18n/books';

export function BookshelfPage() {
  const [books, setBooks] = useState<BuiltInBookSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const builtInBookProgress = useAppStore((state) => state.builtInBookProgress);
  const lastOpenedVolumes = useAppStore((state) => state.lastOpenedVolumes);
  const lastOpenedBook = useAppStore((state) => state.lastOpenedBook);
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

  return (
    <SiteFrame
      eyebrow={text.bookshelf.eyebrow}
      title={text.bookshelf.title}
      description={text.bookshelf.description}
    >
      {loading ? (
        <div className="flex items-center gap-3 rounded-[30px] border border-stone-800/80 bg-stone-950/55 p-8 text-stone-300">
          <Loader2 className="animate-spin text-orange-300" size={18} />
          {text.bookshelf.loading}
        </div>
      ) : error ? (
        <div className="rounded-[30px] border border-red-500/20 bg-red-500/10 p-8 text-red-200">
          {error}
        </div>
      ) : (
        <main className="space-y-5">
          {lastOpenedBook && (
            <Link
              to={`/lanobe/book/${lastOpenedBook.slug}?volume=${lastOpenedBook.volumeId}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-[30px] border border-orange-300/15 bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.18),_rgba(12,10,9,0.92)_55%)] p-6 shadow-xl shadow-black/20"
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
          )}

          <div className="grid gap-5 md:grid-cols-2">
            {localizedBooks.map((book) => {
              const resumeVolumeId = lastOpenedVolumes[book.slug] ?? book.defaultVolumeId;
              const progress = builtInBookProgress[buildBuiltInBookProgressKey(book.slug, resumeVolumeId)];
              const hasSavedProgress = !!progress;

              return (
                <article
                  key={book.slug}
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
                    {hasSavedProgress
                      ? format(text.bookshelf.savedProgress, {
                          volumeLabel: getFormattedVolumeLabel(progress.volumeId, uiLanguage),
                          line: progress.currentIndex + 1,
                          entryCount: progress.entryCount,
                        })
                      : text.bookshelf.noProgress}
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      to={`/lanobe/book/${book.slug}?volume=${resumeVolumeId}`}
                      className="inline-flex items-center gap-2 rounded-full bg-orange-400 px-5 py-3 text-sm font-bold text-stone-950 transition-transform hover:-translate-y-0.5"
                    >
                      {hasSavedProgress ? text.common.resume : text.common.startReading}
                      <ArrowRight size={16} />
                    </Link>
                    <Link
                      to={`/lanobe/book/${book.slug}?volume=${book.defaultVolumeId}`}
                      className="inline-flex items-center gap-2 rounded-full border border-stone-700 bg-stone-900/70 px-5 py-3 text-sm font-semibold text-stone-100 hover:border-stone-500"
                    >
                      {text.bookshelf.openVolumeOne}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </main>
      )}
    </SiteFrame>
  );
}

