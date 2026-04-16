import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useUiText } from '../hooks/useUiText';

interface SiteFrameProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'px-2.5 py-1 rounded-full text-xs transition-colors',
    isActive
      ? 'bg-orange-500 text-stone-950 font-semibold'
      : 'text-stone-400 hover:bg-stone-800/60 hover:text-stone-100',
  ].join(' ');

/**
 * Compact site shell for marketing / bookshelf pages.
 * Eyebrow + description removed to save vertical real estate — replaced
 * with a tight sticky top bar holding logo, nav, and language switcher.
 * Page title rendered inline as a single concise line above content.
 */
export function SiteFrame({ eyebrow, title, description, children }: SiteFrameProps) {
  const { text } = useUiText();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.16),_transparent_30%),linear-gradient(180deg,_#11100d_0%,_#171512_52%,_#0d0c0a_100%)] text-stone-100">
      {/* Sticky compact top bar */}
      <header className="sticky top-0 z-30 border-b border-stone-800/70 bg-stone-950/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 md:px-6">
          <Link to="/" className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-orange-300">
            Lanobe
          </Link>
          <nav className="flex flex-wrap items-center gap-1">
            <NavLink to="/" end className={navLinkClass}>
              {text.common.home}
            </NavLink>
            <NavLink to="/lanobe" className={navLinkClass}>
              {text.common.lanobe}
            </NavLink>
            <NavLink to="/lanobe/bookshelf" className={navLinkClass}>
              {text.common.bookshelf}
            </NavLink>
          </nav>
          <LanguageSwitcher />
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-5 md:px-6 md:py-6">
        {/* Page title line — single line, no decorative hero */}
        <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-orange-300/80">{eyebrow}</p>
            <h1 className="mt-1 line-clamp-2 text-xl font-black leading-tight tracking-tight text-stone-100 md:text-2xl">
              {title}
            </h1>
          </div>
          {description ? (
            <p className="hidden max-w-md text-right text-[11px] text-stone-400/80 md:block">{description}</p>
          ) : null}
        </div>

        {children}
      </div>
    </div>
  );
}
