import { Link } from 'react-router-dom';
import { BookOpenText, Headphones, LayoutTemplate } from 'lucide-react';
import { SiteFrame } from '../components/SiteFrame';
import { useUiText } from '../hooks/useUiText';

export function LanobeLandingPage() {
  const { text } = useUiText();

  const features = [
    {
      title: text.landing.featureReader,
      description: text.landing.featureReaderDesc,
      icon: BookOpenText,
    },
    {
      title: text.landing.featureListening,
      description: text.landing.featureListeningDesc,
      icon: Headphones,
    },
    {
      title: text.landing.featureShelf,
      description: text.landing.featureShelfDesc,
      icon: LayoutTemplate,
    },
  ];

  return (
    <SiteFrame
      eyebrow={text.landing.eyebrow}
      title={text.landing.title}
      description={text.landing.description}
    >
      <main className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
        <section className="rounded-[32px] border border-stone-800/80 bg-stone-950/55 p-6 md:p-8">
          <h2 className="text-2xl font-black tracking-tight text-stone-100 md:text-4xl">
            {text.landing.heroTitle}
          </h2>
          <p className="mt-4 leading-7 text-stone-300/85">{text.landing.heroDescription}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/lanobe/bookshelf"
              className="rounded-full bg-orange-400 px-5 py-3 text-sm font-bold text-stone-950 transition-transform hover:-translate-y-0.5"
            >
              {text.landing.goBookshelf}
            </Link>
            <Link
              to="/lanobe/book/makeine-too-many-heroines?volume=volume-01"
              className="rounded-full border border-stone-700 bg-stone-900/70 px-5 py-3 text-sm font-semibold text-stone-100 hover:border-stone-500"
            >
              {text.landing.openVolumeOne}
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

