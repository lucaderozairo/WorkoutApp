import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { RouteMap, totalDistanceKm } from '@ui/components/workout/wizard/RouteMap';
import { handlePlanSession } from '@features/planning';
import type { Id } from '@shared/types';

const USER_ID = 'user-001' as Id<'User'>;

interface RoutePlannerState {
  waypoints?: [number, number][];
  profile?: 'foot' | 'bike';
  returnTo?: string;
  // Opaque caller state that is round-tripped back on save
  callerState?: unknown;
}

export function RoutePlannerScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const incoming = (location.state ?? {}) as RoutePlannerState;

  const [waypoints, setWaypoints] = useState<[number, number][]>(incoming.waypoints ?? []);
  const [routedKm, setRoutedKm] = useState(0);

  const profile = incoming.profile ?? 'foot';
  const displayKm = routedKm > 0 ? routedKm : totalDistanceKm(waypoints);

  async function handleSave() {
    const dest = incoming.returnTo ?? (-1 as never);

    if (!incoming.callerState && waypoints.length >= 2 && displayKm > 0) {
      await handlePlanSession({
        type: 'PlanSession',
        userId: USER_ID,
        planType: profile === 'bike' ? 'cycle' : 'run',
        name: profile === 'bike' ? 'Cycle Route' : 'Run Route',
        scheduledAt: Date.now(),
        notes: '',
        routeWaypoints: waypoints,
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
      <RouteMap
        waypoints={waypoints}
        onChange={setWaypoints}
        profile={profile}
        onRoutedDistanceChange={setRoutedKm}
      />
    </div>
  );
}
