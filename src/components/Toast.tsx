import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react';

type ToastTone = 'info' | 'success' | 'warning' | 'error';

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
  leaving?: boolean;
}

interface ToastContextValue {
  toast: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) return { toast: () => {} };
  return ctx;
}

const TONE_CLASS: Record<ToastTone, string> = {
  info: 'bg-slate-800/95 text-slate-100',
  success: 'bg-emerald-600/95 text-white',
  warning: 'bg-amber-500/95 text-white',
  error: 'bg-red-600/95 text-white',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const toast = useCallback((message: string, tone: ToastTone = 'info') => {
    const id = nextId.current++;
    setItems((prev) => [...prev, { id, message, tone }]);
    window.setTimeout(() => {
      setItems((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    }, 2200);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 2600);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-32 z-[95] flex flex-col items-center gap-2 px-4 md:bottom-36">
        {items.map((item) => (
          <div
            key={item.id}
            className={[
              'pointer-events-auto max-w-[min(90vw,420px)] rounded-full px-4 py-2 text-sm font-medium shadow-xl shadow-black/30 backdrop-blur-md',
              TONE_CLASS[item.tone],
              item.leaving
                ? 'animate-[toastOut_300ms_ease_forwards]'
                : 'animate-[toastIn_220ms_ease]',
            ].join(' ')}
          >
            {item.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

