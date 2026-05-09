import { useEffect, useRef, useState } from 'react';

export interface SessionTimer {
  display: string;
  isPaused: boolean;
  pause: () => void;
  resume: () => void;
}

export function useSessionTimer(startedAt: number | null): SessionTimer {
  const [elapsed, setElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const pauseStartRef = useRef<number | null>(null);
  const totalPausedMsRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pause = () => {
    if (!isPaused && startedAt) {
      pauseStartRef.current = Date.now();
      setIsPaused(true);
    }
  };

  const resume = () => {
    if (isPaused && pauseStartRef.current) {
      totalPausedMsRef.current += Date.now() - pauseStartRef.current;
      pauseStartRef.current = null;
      setIsPaused(false);
    }
  };

  useEffect(() => {
    if (!startedAt) {
      setElapsed(0);
      setIsPaused(false);
      pauseStartRef.current = null;
      totalPausedMsRef.current = 0;
      return;
    }
    const tick = () => {
      const currentPause = pauseStartRef.current ? Date.now() - pauseStartRef.current : 0;
      const raw = Date.now() - startedAt - totalPausedMsRef.current - currentPause;
      setElapsed(Math.max(0, Math.floor(raw / 1000)));
    };
    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startedAt]);

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');
  return { display: `${mm}:${ss}`, isPaused, pause, resume };
}
