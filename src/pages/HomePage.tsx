import { Link } from 'react-router-dom';
import { ChevronRight, FileText, LibraryBig, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { SiteFrame } from '../components/SiteFrame';
import { useUiText } from '../hooks/useUiText';

const featureIconClass = 'mt-0.5 h-4 w-4 shrink-0 rounded-full bg-orange-400/20 p-0.5 text-orange-300';

export function HomePage() {
  const { text } = useUiText();

  const features = [
    { text: text.home.shapeLine1 },
    { text: text.home.shapeLine2 },
    { text: text.home.shapeLine3 },
    { text: text.home.shapeLine4 },
  ];

  return (
    <SiteFrame
      eyebrow={text.home.eyebrow}
      title={text.home.title}
      description={text.home.description}
    >
      <main className="grid gap-6 md:grid-cols-[1.5fr_1fr]">
        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, ease: 'easeOut' }}
          className="rounded-[32px] border border-stone-800/80 bg-stone-950/55 p-6 shadow-2xl shadow-black/20 md:p-8"
        >
          <div className="flex items-center gap-3 text-orange-300">
            <Sparkles size={16} />
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
        </motion.section>

        {/* Feature list */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: 0.1, ease: 'easeOut' }}
          className="rounded-[32px] border border-stone-800/80 bg-stone-950/55 p-6 md:p-8"
        >
          <div className="flex items-center gap-3 text-teal-300">
            <LibraryBig size={16} />
            <span className="text-xs uppercase tracking-[0.3em]">{text.home.shapeLabel}</span>
          </div>
          <ul className="mt-6 space-y-4">
            {features.map((feature, i) => (
              <li key={i} className="flex items-start gap-3 text-sm leading-6 text-stone-300/85">
                <span className={featureIconClass}>
                  <svg viewBox="0 0 12 12" fill="none" className="h-full w-full">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                {feature.text}
              </li>
            ))}
          </ul>

          {/* Quick access to free reader */}
          <div className="mt-8 rounded-2xl border border-blue-800/30 bg-blue-500/8 p-4">
            <div className="flex items-start gap-3">
              <FileText size={14} className="mt-0.5 shrink-0 text-blue-400" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300/80">{text.txtUpload.cardTitle}</p>
                <Link
                  to="/lanobe/reader"
                  className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-blue-300/70 hover:text-blue-200"
                >
                  {text.txtUpload.cardButton}
                  <ChevronRight size={12} />
                </Link>
              </div>
            </div>
          </div>
        </motion.section>
      </main>
    </SiteFrame>
  );
}
