import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookMarked, Clock3, Loader2 } from 'lucide-react';
import { SiteFrame } from '../components/SiteFrame';
import { fetchBooksIndex } from '../services/bookService';
import { BuiltInBookSummary } from '../types/books';

export function BookshelfPage() {
  const [books, setBooks] = useState<BuiltInBookSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          setError(err instanceof Error ? err.message : 'Failed to load bookshelf.');
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
  }, []);

  return (
    <SiteFrame
      eyebrow="Bookshelf"
      title="The shelf now loads a real built-in series from the site itself."
      description="Stage 2 introduces static bookshelf metadata and local text assets. Users can enter the first built-in novel without uploading any file."
    >
      {loading ? (
        <div className="rounded-[30px] border border-stone-800/80 bg-stone-950/55 p-8 text-stone-300 flex items-center gap-3">
          <Loader2 className="animate-spin text-orange-300" size={18} />
          Loading bookshelf...
        </div>
      ) : error ? (
        <div className="rounded-[30px] border border-red-500/20 bg-red-500/10 p-8 text-red-200">
          {error}
        </div>
      ) : (
        <main className="grid gap-5 md:grid-cols-2">
          {books.map((book) => (
            <article
              key={book.slug}
              className="rounded-[30px] border border-stone-800/80 bg-stone-950/55 p-6 shadow-xl shadow-black/15"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="w-14 h-20 rounded-2xl bg-[linear-gradient(180deg,_rgba(251,146,60,0.45),_rgba(120,53,15,0.9))] border border-orange-300/20 flex items-center justify-center shadow-lg shadow-orange-950/40">
                  <BookMarked className="text-stone-950" size={22} />
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-teal-400/20 bg-teal-500/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-teal-200/90">
                  <Clock3 size={12} />
                  {book.volumeCount} Volumes
                </div>
              </div>

              <h2 className="mt-5 text-2xl font-black tracking-tight text-stone-100">{book.title}</h2>
              <p className="mt-1 text-sm uppercase tracking-[0.22em] text-orange-200/80">{book.subtitle}</p>
              <p className="mt-3 text-sm leading-7 text-stone-300/85">{book.description}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {book.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-stone-700 bg-stone-900/70 px-3 py-1 text-xs uppercase tracking-[0.2em] text-stone-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to={`/lanobe/book/${book.slug}?volume=${book.defaultVolumeId}`}
                  className="inline-flex items-center gap-2 rounded-full bg-orange-400 px-5 py-3 text-sm font-bold text-stone-950 transition-transform hover:-translate-y-0.5"
                >
                  Start Reading
                  <ArrowRight size={16} />
                </Link>
                <Link
                  to={`/lanobe/book/${book.slug}?volume=${book.defaultVolumeId}`}
                  className="inline-flex items-center gap-2 rounded-full border border-stone-700 bg-stone-900/70 px-5 py-3 text-sm font-semibold text-stone-100 hover:border-stone-500"
                >
                  Open Volume 01
                </Link>
              </div>
            </article>
          ))}
        </main>
      )}
    </SiteFrame>
  );
}
