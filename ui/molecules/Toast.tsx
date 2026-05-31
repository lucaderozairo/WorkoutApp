import { useState, useCallback, createContext, useContext, useRef } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Badge } from '@ui/atoms/Badge';
import { Button } from '@ui/atoms/Button';

type ToastVariant = 'success' | 'error' | 'info' | 'warn';

interface ToastItem {
  id: number;
  variant: ToastVariant;
  message: string;
  duration?: number;
}

interface ToastAPI {
  success: (message: string, opts?: { duration?: number }) => void;
  error: (message: string, opts?: { duration?: number }) => void;
  info: (message: string, opts?: { duration?: number }) => void;
  warn: (message: string, opts?: { duration?: number }) => void;
}

const ToastContext = createContext<ToastAPI | null>(null);

export function useToast(): ToastAPI {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <Toaster>');
  return ctx;
}

const BADGE_VARIANT: Record<ToastVariant, 'ok' | 'bad' | 'accent' | 'warn'> = {
  success: 'ok',
  error: 'bad',
  info: 'accent',
  warn: 'warn',
};

export function Toaster({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const add = useCallback((variant: ToastVariant, message: string, opts?: { duration?: number }) => {
    const id = ++counter.current;
    setToasts(prev => [...prev, { id, variant, message, duration: opts?.duration ?? 3000 }]);
    setTimeout(() => dismiss(id), opts?.duration ?? 3000);
  }, [dismiss]);

  const api: ToastAPI = {
    success: (m, o) => add('success', m, o),
    error: (m, o) => add('error', m, o),
    info: (m, o) => add('info', m, o),
    warn: (m, o) => add('warn', m, o),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      {createPortal(
        <div className="toast-stack column">
          {toasts.map(t => (
            <div key={t.id} className="surface row align-center toast">
              <Badge tone={BADGE_VARIANT[t.variant]} dot />
              <span className="grow">{t.message}</span>
              <Button variant="ghost" size="icon" onClick={() => dismiss(t.id)} aria-label="Dismiss">×</Button>
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}
