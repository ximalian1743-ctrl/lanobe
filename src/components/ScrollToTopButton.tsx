import type React from 'react';
import { useEffect, useState } from 'react';
import { ChevronUp } from 'lucide-react';

interface ScrollToTopButtonProps {
  /** The scrollable element to watch + scroll. */
  targetRef: React.RefObject<HTMLDivElement | null>;
  /** Threshold (px) — appear after scrolling past this. Default 600. */
  threshold?: number;
}

export function ScrollToTopButton({ targetRef, threshold = 600 }: ScrollToTopButtonProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = targetRef.current;
    if (!el) return;
    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setVisible((el?.scrollTop ?? 0) > threshold);
        ticking = false;
      });
    }
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [targetRef, threshold]);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => targetRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-4 left-4 z-[54] flex h-10 w-10 items-center justify-center rounded-full border border-slate-700/60 bg-slate-900/95 text-slate-200 shadow-xl backdrop-blur-md hover:bg-slate-800"
      style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="回到顶部"
      title="回到顶部"
    >
      <ChevronUp size={18} />
    </button>
  );
}
