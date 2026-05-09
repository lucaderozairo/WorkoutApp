import { useEffect, useRef, useState } from 'react';

type Props = {
  initialSeconds: number;
  onSkip: () => void;
};

export function RestTimerAlert({ initialSeconds, onSkip }: Props) {
  const [remaining, setRemaining] = useState(initialSeconds);
  const [running, setRunning] = useState(true);

  // Stable ref so the effect never re-fires due to onSkip identity changes
  const onSkipRef = useRef(onSkip);
  useEffect(() => { onSkipRef.current = onSkip; });

  useEffect(() => {
    if (!running) return;
    if (remaining <= 0) { setRunning(false); return; }
    const t = setTimeout(() => setRemaining(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [running, remaining]);

  const mm = Math.floor(remaining / 60);
  const ss = String(remaining % 60).padStart(2, '0');
  const done = remaining <= 0;

  const restart = () => { setRemaining(initialSeconds); setRunning(true); };

  return (
    <div className="alert">
      <div className="row space-between align-center">
        <span className="detail">Rest</span>
        <span className={`badge caption ${done ? 'warning' : 'neutral'}`}>{mm}:{ss}</span>
        <div className="row">
          <span className="sm caption ghost" onClick={restart}>Restart</span>
          {!done && (
            <span
              className="sm caption ghost"
              onClick={() => setRunning(r => !r)}
              aria-label={running ? 'Pause timer' : 'Resume timer'}
            >
              {running ? 'Pause' : 'Resume'}
            </span>
          )}
          <span className="sm caption ghost" onClick={onSkip}>Skip</span>
        </div>
      </div>
    </div>
  );
}
