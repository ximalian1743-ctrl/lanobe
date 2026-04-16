import type React from 'react';
import { useRef } from 'react';

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  /** Minimum horizontal travel in px to count as a swipe (default 50). */
  threshold?: number;
  /** Maximum vertical drift allowed (default 45). Prevents confusion with scroll. */
  verticalTolerance?: number;
}

/**
 * Attach to any container as spread props to enable left/right swipe handlers.
 * Usage: `const swipe = useSwipe({...}); <div {...swipe}>`
 */
export function useSwipe({ onSwipeLeft, onSwipeRight, threshold = 50, verticalTolerance = 45 }: SwipeHandlers) {
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);

  function onTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (startX.current === null || startY.current === null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    const dy = e.changedTouches[0].clientY - startY.current;
    if (Math.abs(dy) > verticalTolerance) {
      startX.current = null;
      startY.current = null;
      return;
    }
    if (Math.abs(dx) >= threshold) {
      if (dx < 0) onSwipeLeft?.();
      else onSwipeRight?.();
    }
    startX.current = null;
    startY.current = null;
  }

  return { onTouchStart, onTouchEnd };
}
