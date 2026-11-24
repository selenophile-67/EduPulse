import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

type ToastTone = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  title: string;
  description?: string;
  tone: ToastTone;
}

interface ToastContextValue {
  toast: (message: string, options?: { tone?: ToastTone; description?: string }) => void;
  success: (message: string, description?: string) => void;
  error: (message: string, description?: string) => void;
  info: (message: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TONES: Record<ToastTone, { icon: typeof Info; ring: string; iconWrap: string }> = {
  success: { icon: CheckCircle2, ring: 'border-success/30', iconWrap: 'bg-success-soft text-success' },
  error: { icon: AlertTriangle, ring: 'border-danger/30', iconWrap: 'bg-red-50 text-danger dark:bg-red-500/10' },
  info: { icon: Info, ring: 'border-info/30', iconWrap: 'bg-blue-50 text-info dark:bg-blue-500/10' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const push = useCallback(
    (message: string, options?: { tone?: ToastTone; description?: string }) => {
      const id = ++counter.current;
      const tone = options?.tone || 'info';
      setToasts((current) => [...current.slice(-3), { id, title: message, description: options?.description, tone }]);
      window.setTimeout(() => dismiss(id), 4800);
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      toast: push,
      success: (message, description) => push(message, { tone: 'success', description }),
      error: (message, description) => push(message, { tone: 'error', description }),
      info: (message, description) => push(message, { tone: 'info', description }),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:right-6 sm:left-auto sm:items-end">
        {toasts.map((item) => {
          const tone = TONES[item.tone];
          const Icon = tone.icon;
          return (
            <div
              key={item.id}
              className={`animate-fade-up pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border ${tone.ring} bg-surface p-3.5 shadow-xl shadow-navy/10`}
              role="status"
            >
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tone.iconWrap}`}>
                <Icon size={17} />
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-sm font-semibold text-ink">{item.title}</p>
                {item.description && <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">{item.description}</p>}
              </div>
              <button
                onClick={() => dismiss(item.id)}
                className="rounded-md p-1 text-ink-muted transition hover:bg-surface-2 hover:text-ink"
                aria-label="Dismiss notification"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}
