import { useState, useMemo, useCallback } from 'react';
import type { PlanType, DistanceMarker } from '@features/planning';
import { formatPace, parsePace, buildMarkers } from '@features/planning';
import { RouteMap, totalDistanceKm } from './RouteMap';

interface StepCardioProps {
  planType: PlanType;  // 'run' | 'cycle'
  sessionName: string;
  waypoints: [number, number][];
  paceSecPerKm: number;
  onSessionNameChange: (name: string) => void;
  onWaypointsChange: (waypoints: [number, number][]) => void;
  onPaceChange: (paceSecPerKm: number) => void;
  onRoutedKmChange?: (km: number) => void;
}

export function StepCardio({
  planType,
  sessionName,
  waypoints,
  paceSecPerKm,
  onSessionNameChange,
  onWaypointsChange,
  onPaceChange,
  onRoutedKmChange,
}: StepCardioProps) {
  const [routeTab, setRouteTab] = useState<'draw' | 'saved'>('draw');
  const [paceInput, setPaceInput] = useState(formatPace(paceSecPerKm));
  const [routedKm, setRoutedKm] = useState(0);

  const distanceKm = useMemo(
    () => (routedKm > 0 ? routedKm : totalDistanceKm(waypoints)),
    [routedKm, waypoints],
  );
  const intervalKm = planType === 'cycle' ? 5 : 1;
  const markers: DistanceMarker[] = useMemo(
    () => distanceKm > 0 ? buildMarkers(distanceKm, paceSecPerKm, intervalKm) : [],
    [distanceKm, paceSecPerKm, intervalKm],
  );

  const estMinutes = distanceKm > 0 ? Math.round((distanceKm * paceSecPerKm) / 60) : null;

  const handleRoutedKm = useCallback((km: number) => {
    setRoutedKm(km);
    onRoutedKmChange?.(km);
  }, [onRoutedKmChange]);

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
          placeholder={planType === 'run' ? 'e.g. Morning Run' : 'e.g. Morning Ride'}
        />
      </div>

      <div className="column compact">
        <label className="caption">Target pace (min/km)</label>
        <div className="row compact align-center">
          <input
            type="text"
            value={paceInput}
            onChange={e => setPaceInput(e.target.value)}
            onBlur={handlePaceBlur}
            placeholder="5:00"
            aria-label="Target pace"
          />
          <span className="caption muted">min/km</span>
          {estMinutes && (
            <span className="caption muted">· ~{estMinutes} min est.</span>
          )}
        </div>
      </div>

      <div className="tabs">
        <button
          type="button"
          className={`tab${routeTab === 'draw' ? ' active' : ''}`}
          onClick={() => setRouteTab('draw')}
        >
          🗺 Draw route
        </button>
        <button
          type="button"
          className={`tab${routeTab === 'saved' ? ' active' : ''}`}
          onClick={() => setRouteTab('saved')}
        >
          📂 Saved
        </button>
      </div>

      {routeTab === 'draw' ? (
        <div className="column compact">
          <RouteMap
            waypoints={waypoints}
            onChange={onWaypointsChange}
            profile={planType === 'cycle' ? 'bike' : 'foot'}
            onRoutedDistanceChange={handleRoutedKm}
          />
          <span className="caption muted">
            {waypoints.length < 2
              ? 'Tap the map to place waypoints'
              : `Distance: ${distanceKm} km · ${waypoints.length} waypoints · snapped to path`}
          </span>
        </div>
      ) : (
        <div className="surface">
          <p className="caption muted">
            Select from recent {planType} sessions to reuse a route.
          </p>
          <p className="caption faint">(Route selection from history — coming soon)</p>
        </div>
      )}

      {markers.length > 0 && (
        <div className="column compact">
          <span className="caption">Distance markers</span>
          <div className="surface column compact">
            {markers.map(m => (
              <div key={m.distanceKm} className="row space-between">
                <span className="caption muted">{m.distanceKm} km</span>
                <span className="caption mono">{m.cumulativeTime}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
