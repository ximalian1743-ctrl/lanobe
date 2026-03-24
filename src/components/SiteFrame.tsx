import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';

interface SiteFrameProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'px-3 py-2 rounded-full text-sm transition-colors',
    isActive ? 'bg-orange-500 text-stone-950' : 'text-stone-300 hover:bg-stone-800/80 hover:text-stone-100',
  ].join(' ');

export function SiteFrame({ eyebrow, title, description, children }: SiteFrameProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.2),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(45,212,191,0.14),_transparent_32%),linear-gradient(180deg,_#11100d_0%,_#171512_52%,_#0d0c0a_100%)] text-stone-100">
      <div className="max-w-6xl mx-auto px-4 py-6 md:px-6 md:py-8">
        <header className="mb-8 rounded-[28px] border border-stone-800/80 bg-stone-950/60 backdrop-blur-xl px-5 py-4 md:px-6 md:py-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <Link to="/" className="text-xs uppercase tracking-[0.35em] text-orange-300/80">
                ximalian.cc.cd
              </Link>
              <h1 className="mt-2 text-2xl md:text-4xl font-black tracking-tight text-stone-100">{title}</h1>
              <p className="mt-2 max-w-2xl text-sm md:text-base text-stone-300/85">{description}</p>
            </div>
            <nav className="flex flex-wrap gap-2">
              <NavLink to="/" end className={navLinkClass}>
                Home
              </NavLink>
              <NavLink to="/lanobe" className={navLinkClass}>
                Lanobe
              </NavLink>
              <NavLink to="/lanobe/bookshelf" className={navLinkClass}>
                Bookshelf
              </NavLink>
            </nav>
          </div>
          <div className="mt-5 inline-flex items-center rounded-full border border-orange-400/30 bg-orange-500/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-orange-200/90">
            {eyebrow}
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}
