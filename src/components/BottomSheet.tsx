import type React from 'react';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { useEscClose } from '../hooks/useModalDismiss';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  /** Max height as a vh fraction (default 0.85). */
  maxHeightVh?: number;
  /** Prevent closing during a blocking action. */
  locked?: boolean;
  /** Optional: z-index override (default 80). */
  zIndex?: number;
}

/**
 * Bottom-anchored sheet that slides up from the screen bottom. Drag the
 * grabber down to dismiss. Tap backdrop to dismiss. Esc to dismiss.
 */
export function BottomSheet({
  open,
  onClose,
  title,
  children,
  maxHeightVh = 0.85,
  locked,
  zIndex = 80,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const [dragY, setDragY] = useState(0);
  const startYRef = useRef<number | null>(null);
  const titleId = useId();
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEscClose(onClose, open && !locked);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const invoker = document.activeElement;
    returnFocusRef.current = invoker instanceof HTMLElement ? invoker : null;
    return () => {
      document.body.style.overflow = prev;
      const target = returnFocusRef.current;
      if (target?.isConnected) target.focus({ preventScroll: true });
      returnFocusRef.current = null;
    };
  }, [open]);

  if (!open) return null;

  function handleTouchStart(e: React.TouchEvent) {
    startYRef.current = e.touches[0].clientY;
  }
  function handleTouchMove(e: React.TouchEvent) {
    if (startYRef.current === null) return;
    const delta = e.touches[0].clientY - startYRef.current;
    if (delta > 0) setDragY(delta);
  }
  function handleTouchEnd() {
    if (dragY > 120 && !locked) onClose();
    setDragY(0);
    startYRef.current = null;
  }

  return (
    <div
      className="fixed inset-0 flex items-end justify-center bg-slate-950/75 backdrop-blur-sm"
      style={{ zIndex }}
      onClick={locked ? undefined : onClose}
    >
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-2xl overflow-hidden rounded-t-[28px] border border-slate-800 bg-[linear-gradient(180deg,_rgba(15,23,42,0.98),_rgba(2,6,23,0.96))] shadow-2xl"
        style={{
          maxHeight: `${maxHeightVh * 100}vh`,
          transform: `translateY(${dragY}px)`,
          transition: dragY === 0 ? 'transform 240ms cubic-bezier(0.22,1,0.36,1)' : undefined,
          animation: 'sheetIn 260ms cubic-bezier(0.22,1,0.36,1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex justify-center py-2"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="h-1 w-10 rounded-full bg-slate-700" />
        </div>
        <div className="border-b border-slate-800/70 px-5 pb-3">
          <h3 id={titleId} className="text-base font-bold text-slate-100">{title}</h3>
        </div>
        <div
          className="overflow-y-auto px-5 pb-[calc(20px+env(safe-area-inset-bottom))] pt-4"
          style={{ maxHeight: `calc(${maxHeightVh * 100}vh - 80px)` }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
