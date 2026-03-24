import { Link } from 'react-router-dom';
import { ChevronRight, LibraryBig, Sparkles } from 'lucide-react';
import { SiteFrame } from '../components/SiteFrame';

export function HomePage() {
  return (
    <SiteFrame
      eyebrow="Site Navigation"
      title="A small personal web hub, with Lanobe as the first living product."
      description="This homepage is the new entry layer for ximalian.cc.cd. V1 starts by giving the current reader a real product shell: navigation, bookshelf, and a clean path into the reader."
    >
      <main className="grid gap-6 md:grid-cols-[1.5fr_1fr]">
        <section className="rounded-[32px] border border-stone-800/80 bg-stone-950/55 p-6 md:p-8 shadow-2xl shadow-black/20">
          <div className="flex items-center gap-3 text-orange-300">
            <Sparkles size={18} />
            <span className="text-xs uppercase tracking-[0.3em]">Current Focus</span>
          </div>
          <h2 className="mt-4 text-3xl md:text-5xl font-black tracking-tight text-stone-100">
            Turn the reader into a site people can actually enter and understand.
          </h2>
          <p className="mt-4 max-w-2xl text-stone-300/85 leading-7">
            The existing reading engine stays in place. What changes now is the structure around it:
            a homepage, a Lanobe entrance, a bookshelf, and dedicated reader routes.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/lanobe"
              className="inline-flex items-center gap-2 rounded-full bg-orange-400 px-5 py-3 text-sm font-bold text-stone-950 transition-transform hover:-translate-y-0.5"
            >
              Enter Lanobe
              <ChevronRight size={16} />
            </Link>
            <Link
              to="/lanobe/bookshelf"
              className="inline-flex items-center gap-2 rounded-full border border-stone-700 bg-stone-900/70 px-5 py-3 text-sm font-semibold text-stone-100 hover:border-stone-500"
            >
              Open Bookshelf
            </Link>
          </div>
        </section>

        <section className="rounded-[32px] border border-stone-800/80 bg-stone-950/55 p-6 md:p-8">
          <div className="flex items-center gap-3 text-teal-300">
            <LibraryBig size={18} />
            <span className="text-xs uppercase tracking-[0.3em]">V1 Shape</span>
          </div>
          <div className="mt-5 space-y-4 text-sm leading-7 text-stone-300/85">
            <p>Home &rarr; Lanobe &rarr; Bookshelf &rarr; Reader</p>
            <p>Built-in books come next.</p>
            <p>Progress stays local in V1.</p>
            <p>Accounts and cloud sync stay in V2.</p>
          </div>
        </section>
      </main>
    </SiteFrame>
  );
}
