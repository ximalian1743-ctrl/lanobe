import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';

/**
 * Accumulates active reading time for the given book/volume.
 * Active = either TTS is playing OR user interacted in last 30 seconds.
 *
 * Tick interval 10s; adds 10s per tick to volume total.
 * Idle (no interaction + not playing) stops accumulation.
 */
export function useReadingTimer(slug: string | undefined, volumeId: string | undefined) {
  const isPlaying = useAppStore((s) => s.isPlaying);
  const addReadingTime = useAppStore((s) => s.addReadingTime);
  const lastActiveAt = useRef<number>(Date.now());

  // Mark user activity on any pointer/key event
  useEffect(() => {
    if (!slug || !volumeId) return;
    function bump() {
      lastActiveAt.current = Date.now();
    }
    window.addEventListener('pointerdown', bump);
    window.addEventListener('keydown', bump);
    window.addEventListener('wheel', bump, { passive: true });
    window.addEventListener('touchstart', bump, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', bump);
      window.removeEventListener('keydown', bump);
      window.removeEventListener('wheel', bump);
      window.removeEventListener('touchstart', bump);
    };
  }, [slug, volumeId]);

  // Tick every 10s, adding time if active
  useEffect(() => {
    if (!slug || !volumeId) return;
    const IDLE_MS = 30_000;
    const TICK_S = 10;
    const interval = window.setInterval(() => {
      const sinceActive = Date.now() - lastActiveAt.current;
      const isActive = isPlaying || sinceActive < IDLE_MS;
      if (isActive) {
        addReadingTime(slug, volumeId, TICK_S);
      }
    }, TICK_S * 1000);
    return () => window.clearInterval(interval);
  }, [slug, volumeId, isPlaying, addReadingTime]);
}

export function formatReadingTime(seconds: number): string {
  if (!seconds) return '0 分';
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return mins > 0 ? `${hours} 小时 ${mins} 分` : `${hours} 小时`;
  }
  return `${mins} 分`;
}
