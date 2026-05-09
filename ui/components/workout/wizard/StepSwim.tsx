import { useState, useMemo } from 'react';
import type { DistanceMarker } from '@features/planning';
import { formatPace, parsePace, buildMarkers } from '@features/planning';

interface StepSwimProps {
  sessionName: string;
  poolLengthM: 25 | 50;
  targetDistanceM: number;
  paceSecPer100m: number;
  onSessionNameChange: (name: string) => void;
  onPoolLengthChange: (l: 25 | 50) => void;
  onTargetDistanceChange: (m: number) => void;
  onPaceChange: (secPer100m: number) => void;
}

export function StepSwim({
  sessionName,
  poolLengthM,
  targetDistanceM,
  paceSecPer100m,
  onSessionNameChange,
  onPoolLengthChange,
  onTargetDistanceChange,
  onPaceChange,
}: StepSwimProps) {
  const [paceInput, setPaceInput] = useState(formatPace(paceSecPer100m));

  const distanceKm = targetDistanceM / 1000;
  const paceSecPerKm = paceSecPer100m * 10;  // 100m pace → km pace
  const markers: DistanceMarker[] = useMemo(
    () => distanceKm > 0 ? buildMarkers(distanceKm, paceSecPerKm, 0.1) : [],
    [distanceKm, paceSecPerKm],
  );

  const estMinutes = targetDistanceM > 0
    ? Math.round((targetDistanceM / 100) * paceSecPer100m / 60)
    : null;

  function handlePaceBlur() {
    const sec = parsePace(paceInput);
    if (sec > 0) {
      onPaceChange(sec);
      setPaceInput(formatPace(sec));
    }
  }

  return (
    <div className="column">
      <div className="column compact">
        <label className="caption">Session name</label>
        <input
          type="text"
          value={sessionName}
          onChange={e => onSessionNameChange(e.target.value)}
          placeholder="e.g. Morning Swim"
        />
      </div>

      <div className="column compact">
        <label className="caption">Pool length</label>
        <div className="tabs">
          <button
            type="button"
            className={`tab${poolLengthM === 25 ? ' active' : ''}`}
            onClick={() => onPoolLengthChange(25)}
          >
            25 m
          </button>
          <button
            type="button"
            className={`tab${poolLengthM === 50 ? ' active' : ''}`}
            onClick={() => onPoolLengthChange(50)}
          >
            50 m
          </button>
        </div>
      </div>

      <div className="column compact">
        <label className="caption">Target distance (metres)</label>
        <input
          type="number"
          min={100}
          step={poolLengthM}
          value={targetDistanceM}
          onChange={e => onTargetDistanceChange(Math.max(0, Number(e.target.value)))}
        />
      </div>

      <div className="column compact">
        <label className="caption">Target pace (min/100m)</label>
        <div className="row compact align-center">
          <input
            type="text"
            value={paceInput}
            onChange={e => setPaceInput(e.target.value)}
            onBlur={handlePaceBlur}
            placeholder="2:00"
            aria-label="Target pace"
          />
          <span className="caption muted">min/100m</span>
          {estMinutes && <span className="caption muted">· ~{estMinutes} min est.</span>}
        </div>
      </div>

      {markers.length > 0 && (
        <div className="column compact">
          <span className="caption">Distance markers</span>
          <div className="surface column compact">
            {markers.map(m => (
              <div key={m.distanceKm} className="row space-between">
                <span className="caption muted">{Math.round(m.distanceKm * 1000)} m</span>
                <span className="caption mono">{m.cumulativeTime}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
