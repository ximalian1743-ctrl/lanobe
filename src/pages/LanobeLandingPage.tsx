import { Link } from 'react-router-dom';
import { BookOpenText, Headphones, LayoutTemplate } from 'lucide-react';
import { SiteFrame } from '../components/SiteFrame';

const features = [
  {
    title: 'Reader-first flow',
    description: 'Keep the current reader as the core experience and wrap it with clearer entry pages.',
    icon: BookOpenText,
  },
  {
    title: 'Listening support',
    description: 'Reuse the existing TTS pipeline and playback controls instead of rebuilding the engine.',
    icon: Headphones,
  },
  {
    title: 'Bookshelf architecture',
    description: 'Prepare the product for built-in books, progress state, and cleaner route-based navigation.',
    icon: LayoutTemplate,
  },
];

export function LanobeLandingPage() {
  return (
    <SiteFrame
      eyebrow="Lanobe Entrance"
      title="Lanobe starts as a structured reader, not just a tool page."
      description="This route becomes the product landing page for the novel-reading experience. In V1, it guides users into the bookshelf and then into the current reader engine."
    >
      <main className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
        <section className="rounded-[32px] border border-stone-800/80 bg-stone-950/55 p-6 md:p-8">
          <h2 className="text-2xl md:text-4xl font-black tracking-tight text-stone-100">
            One clean story:
            discover, choose a book, then enter reading and listening mode.
          </h2>
          <p className="mt-4 text-stone-300/85 leading-7">
            This page marks the boundary between the public-facing website and the actual reader. V1 keeps the scope sharp:
            bookshelf first, user accounts later.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/lanobe/bookshelf"
              className="rounded-full bg-orange-400 px-5 py-3 text-sm font-bold text-stone-950 transition-transform hover:-translate-y-0.5"
            >
              Go To Bookshelf
            </Link>
            <Link
              to="/lanobe/book/stage1-preview"
              className="rounded-full border border-stone-700 bg-stone-900/70 px-5 py-3 text-sm font-semibold text-stone-100 hover:border-stone-500"
            >
              Open Reader Shell
            </Link>
          </div>
        </section>

        <section className="grid gap-4">
          {features.map(({ title, description, icon: Icon }) => (
            <article key={title} className="rounded-[28px] border border-stone-800/80 bg-stone-950/55 p-5">
              <Icon size={18} className="text-orange-300" />
              <h3 className="mt-4 text-lg font-bold text-stone-100">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-stone-300/85">{description}</p>
            </article>
          ))}
        </section>
      </main>
    </SiteFrame>
  );
}
