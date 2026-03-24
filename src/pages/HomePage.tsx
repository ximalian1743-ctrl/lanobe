import { Link } from 'react-router-dom';
import { ChevronRight, LibraryBig, Sparkles } from 'lucide-react';
import { SiteFrame } from '../components/SiteFrame';
import { useUiText } from '../hooks/useUiText';

export function HomePage() {
  const { text } = useUiText();

  return (
    <SiteFrame
      eyebrow={text.home.eyebrow}
      title={text.home.title}
      description={text.home.description}
    >
      <main className="grid gap-6 md:grid-cols-[1.5fr_1fr]">
        <section className="rounded-[32px] border border-stone-800/80 bg-stone-950/55 p-6 shadow-2xl shadow-black/20 md:p-8">
          <div className="flex items-center gap-3 text-orange-300">
            <Sparkles size={18} />
            <span className="text-xs uppercase tracking-[0.3em]">{text.home.focusLabel}</span>
          </div>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-stone-100 md:text-5xl">
            {text.home.heroTitle}
          </h2>
          <p className="mt-4 max-w-2xl leading-7 text-stone-300/85">{text.home.heroDescription}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/lanobe"
              className="inline-flex items-center gap-2 rounded-full bg-orange-400 px-5 py-3 text-sm font-bold text-stone-950 transition-transform hover:-translate-y-0.5"
            >
              {text.home.enterLanobe}
              <ChevronRight size={16} />
            </Link>
            <Link
              to="/lanobe/bookshelf"
              className="inline-flex items-center gap-2 rounded-full border border-stone-700 bg-stone-900/70 px-5 py-3 text-sm font-semibold text-stone-100 hover:border-stone-500"
            >
              {text.home.openBookshelf}
            </Link>
          </div>
        </section>

        <section className="rounded-[32px] border border-stone-800/80 bg-stone-950/55 p-6 md:p-8">
          <div className="flex items-center gap-3 text-teal-300">
            <LibraryBig size={18} />
            <span className="text-xs uppercase tracking-[0.3em]">{text.home.shapeLabel}</span>
          </div>
          <div className="mt-5 space-y-4 text-sm leading-7 text-stone-300/85">
            <p>{text.home.shapeLine1}</p>
            <p>{text.home.shapeLine2}</p>
            <p>{text.home.shapeLine3}</p>
            <p>{text.home.shapeLine4}</p>
          </div>
        </section>
      </main>
    </SiteFrame>
  );
}

