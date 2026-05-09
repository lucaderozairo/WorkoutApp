import { useCallback, useEffect, useRef, useState } from 'react';

// Two-press confirmation: first press arms, second press within the window
// fires onConfirm. Auto-disarms after `windowMs` if no second press.

export function useConfirmPress(onConfirm: () => void, windowMs = 3000): {
  armed: boolean;
  press: () => void;
  reset: () => void;
} {
  const [armed, setArmed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    clear();
    setArmed(false);
  }, [clear]);

  const press = useCallback(() => {
    if (armed) {
      clear();
      setArmed(false);
      onConfirm();
      return;
    }
    setArmed(true);
    timerRef.current = setTimeout(() => {
      setArmed(false);
      timerRef.current = null;
    }, windowMs);
  }, [armed, clear, onConfirm, windowMs]);

  useEffect(() => clear, [clear]);

  return { armed, press, reset };
}
