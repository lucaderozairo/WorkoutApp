import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { RouteMap, totalDistanceKm } from '@ui/components/workout/wizard/RouteMap';
import { handleSaveRoute } from '@features/planning';

interface RoutePlannerState {
  waypoints?: [number, number][];
  profile?: 'foot' | 'bike';
  returnTo?: string;
  callerState?: unknown;
}

export function RoutePlannerScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const incoming = (location.state ?? {}) as RoutePlannerState;

  const [waypoints, setWaypoints] = useState<[number, number][]>(incoming.waypoints ?? []);
  const [routedKm, setRoutedKm] = useState(0);
  const [routeName, setRouteName] = useState('');

  const profile = incoming.profile ?? 'foot';
  const displayKm = routedKm > 0 ? routedKm : totalDistanceKm(waypoints);
  const isStandalone = !incoming.callerState;

  async function handleSave() {
    const dest = incoming.returnTo ?? (-1 as never);

    if (isStandalone && waypoints.length >= 2 && displayKm > 0) {
      const name = routeName.trim() || (profile === 'bike' ? 'Cycle Route' : 'Run Route');
      await handleSaveRoute({
        type: 'SaveRoute',
        name,
        profile,
        waypoints,
        distanceKm: displayKm,
      });
    }

    navigate(dest, {
      state: { waypoints, distanceKm: displayKm, callerState: incoming.callerState },
    });
  }

  function handleBack() {
    navigate(incoming.returnTo ?? (-1 as never));
  }

  return (
    <div className="grow column">
      <div className="row space-between align-center compact">
        <button className="ghost" onClick={handleBack}>Back</button>
        <h2>Plan Route</h2>
        <button className="primary compact" onClick={handleSave}>
          Save{displayKm > 0 ? ` · ${displayKm.toFixed(1)} km` : ''}
        </button>
      </div>
      {isStandalone && waypoints.length >= 2 && (
        <div className="row compact" style={{ padding: '0 var(--space-2)' }}>
          <input
            className="input grow"
            placeholder="Route name…"
            value={routeName}
            onChange={e => setRouteName(e.target.value)}
          />
        </div>
      )}
      <RouteMap
        waypoints={waypoints}
        onChange={setWaypoints}
        profile={profile}
        onRoutedDistanceChange={setRoutedKm}
      />
    </div>
  );
}
