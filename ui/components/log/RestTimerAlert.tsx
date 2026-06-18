import { useEffect, useRef, useState } from 'react';
import { viewStore } from '@data/projections/views';
import { Row } from '@ui/layout';
import { Surface, Text } from '@ui/atoms';
import { Badge, Button } from '@ui/molecules';

type Props = {
  initialSeconds: number;
  onSkip: () => void;
};

interface SavedRestTimer {
  remaining: number;
  savedAt: number;
}

export function RestTimerAlert({ initialSeconds, onSkip }: Props) {
  const [remaining, setRemaining] = useState(() => {
    const saved = viewStore.get('rest_timer_state');
    if (!saved) return initialSeconds;
    const elapsed = Math.floor((Date.now() - saved.savedAt) / 1000);
    const restored = Math.max(0, saved.remaining - elapsed);
    viewStore.set('rest_timer_state', null);
    return restored;
  });
  const [running, setRunning] = useState(true);

  // Stable refs so cleanup reads current values without stale closures
  const remainingRef = useRef(remaining);
  const runningRef = useRef(running);
  useEffect(() => { remainingRef.current = remaining; }, [remaining]);
  useEffect(() => { runningRef.current = running; }, [running]);

  // Stable ref so the effect never re-fires due to onSkip identity changes
  const onSkipRef = useRef(onSkip);
  useEffect(() => { onSkipRef.current = onSkip; });

  // Save remaining to viewStore on unmount so it survives navigation
  useEffect(() => {
    return () => {
      if (remainingRef.current > 0 && runningRef.current) {
        viewStore.set('rest_timer_state', { remaining: remainingRef.current, savedAt: Date.now() });
      } else {
        viewStore.set('rest_timer_state', null);
      }
    };
  }, []);

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

  const handleSkip = () => {
    viewStore.set('rest_timer_state', null);
    onSkipRef.current();
  };

  return (
    <Surface className="alert">
      <Row justify="between" align="center">
        <Text size="detail">Rest</Text>
        <Badge tone={done ? 'warn' : 'plain'}>{mm}:{ss}</Badge>
        <Row>
          <Button variant="ghost" size="sm" onClick={restart}>Restart</Button>
          {!done && (
            <Button
              variant="ghost"
              size="sm"
              aria-label={running ? 'Pause timer' : 'Resume timer'}
              onClick={() => setRunning(r => !r)}
            >
              {running ? 'Pause' : 'Resume'}
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={handleSkip}>Skip</Button>
        </Row>
      </Row>
    </Surface>
  );
}
