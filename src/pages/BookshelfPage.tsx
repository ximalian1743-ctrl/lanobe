import { Link } from 'react-router-dom';
import { ArrowRight, BookMarked, Clock3 } from 'lucide-react';
import { SiteFrame } from '../components/SiteFrame';

const stageOneShelf = [
  {
    slug: 'stage1-preview',
    title: 'Lanobe Reader Preview',
    description: 'Stage 1 routing preview. The dedicated built-in novel content will be connected in Stage 2.',
    status: 'Route shell ready',
  },
];

export function BookshelfPage() {
  return (
    <SiteFrame
      eyebrow="Bookshelf"
      title="The shelf is now a real destination, even before built-in content is wired in."
      description="Stage 1 creates the route structure and the shelf concept. Stage 2 will connect a real built-in novel, metadata, chapters, and local progress by book slug."
    >
      <main className="grid gap-5 md:grid-cols-2">
        {stageOneShelf.map((book) => (
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
                {book.status}
              </div>
            </div>

            <h2 className="mt-5 text-2xl font-black tracking-tight text-stone-100">{book.title}</h2>
            <p className="mt-3 text-sm leading-7 text-stone-300/85">{book.description}</p>

            <Link
              to={`/lanobe/book/${book.slug}`}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-orange-400 px-5 py-3 text-sm font-bold text-stone-950 transition-transform hover:-translate-y-0.5"
            >
              Enter Reader
              <ArrowRight size={16} />
            </Link>
          </article>
        ))}
      </main>
    </SiteFrame>
  );
}
