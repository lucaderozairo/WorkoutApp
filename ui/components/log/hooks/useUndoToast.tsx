import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

// A single global undo-toast slot. Optimistic UI calls `enqueue` with a
// message, an `onExpire` callback (commits the delete), and an `onUndo`
// callback (cancels it). If a new toast enqueues before the previous
// window expires, the pending one is flushed synchronously.

export interface UndoToastItem {
  id: string;
  message: string;
  onExpire: () => void;
  onUndo: () => void;
  /** ms remaining; countdown driven by the provider */
  expiresAt: number;
}

interface UndoToastContextValue {
  current: UndoToastItem | null;
  enqueue: (item: Omit<UndoToastItem, 'id' | 'expiresAt'> & { windowMs?: number }) => void;
  undo: () => void;
  flush: () => void;
}

const UndoToastContext = createContext<UndoToastContextValue | null>(null);

const DEFAULT_WINDOW_MS = 5000;

export function UndoToastProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<UndoToastItem | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentRef = useRef<UndoToastItem | null>(null);
  currentRef.current = current;

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const flush = useCallback(() => {
    const c = currentRef.current;
    if (!c) return;
    clearTimer();
    currentRef.current = null;
    setCurrent(null);
    c.onExpire();
  }, [clearTimer]);

  const undo = useCallback(() => {
    const c = currentRef.current;
    if (!c) return;
    clearTimer();
    currentRef.current = null;
    setCurrent(null);
    c.onUndo();
  }, [clearTimer]);

  const enqueue = useCallback(
    (item: Omit<UndoToastItem, 'id' | 'expiresAt'> & { windowMs?: number }) => {
      // If something's already pending, commit it first.
      if (currentRef.current) {
        clearTimer();
        currentRef.current.onExpire();
      }
      const windowMs = item.windowMs ?? DEFAULT_WINDOW_MS;
      const next: UndoToastItem = {
        id: `undo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        message: item.message,
        onExpire: item.onExpire,
        onUndo: item.onUndo,
        expiresAt: Date.now() + windowMs,
      };
      currentRef.current = next;
      setCurrent(next);
      timerRef.current = setTimeout(() => {
        if (currentRef.current?.id === next.id) {
          currentRef.current = null;
          setCurrent(null);
          next.onExpire();
        }
      }, windowMs);
    },
    [clearTimer]
  );

  useEffect(() => {
    const flushOnLeave = () => {
      if (currentRef.current) currentRef.current.onExpire();
    };
    window.addEventListener('beforeunload', flushOnLeave);
    return () => {
      window.removeEventListener('beforeunload', flushOnLeave);
      clearTimer();
    };
  }, [clearTimer]);

  return (
    <UndoToastContext.Provider value={{ current, enqueue, undo, flush }}>
      {children}
    </UndoToastContext.Provider>
  );
}

export function useUndoToast(): UndoToastContextValue {
  const ctx = useContext(UndoToastContext);
  if (!ctx) {
    throw new Error('useUndoToast must be used inside <UndoToastProvider>');
  }
  return ctx;
}
