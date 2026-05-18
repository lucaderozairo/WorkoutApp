import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCommand } from '@ui/bindings';
import { handleStartSession } from '@features/training_log';
import { handlePlanSession } from '@features/planning';
import { defaultSessionName } from '@features/planning/domain/utils';
import type { SportType } from '@features/training_log/domain/types';
import type { Id } from '@shared/types';
import { viewStore } from '@data/projections/views';

const USER_ID = 'user-001' as Id<'User'>;

export const PINNED_ACTIVITIES: SportType[] = ['strength', 'run', 'cycle', 'hike'];

export const ROUTE_ACTIVITIES = new Set<SportType>([
  'run', 'cycle', 'hike', 'ski', 'snowboard', 'kayak', 'surf', 'climb', 'row',
]);

export const MORE_CATEGORIES: { label: string; sports: SportType[] }[] = [
  { label: 'Outdoor',      sports: ['swim', 'row', 'ski', 'snowboard', 'kayak', 'surf', 'climb'] },
  { label: 'Machines',     sports: ['treadmill', 'stair_climber', 'elliptical', 'ski_erg', 'assault_bike', 'air_bike', 'concept2_rower'] },
  { label: 'Fitness',      sports: ['hiit', 'yoga', 'stretch', 'mobility', 'boxing'] },
  { label: 'Events',       sports: ['triathlon', 'duathlon', 'hyrox', 'obstacle_course', 'multi'] },
];

export function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

interface ReturnedRouteState {
  waypoints?: [number, number][];
  distanceKm?: number;
  profile?: 'foot' | 'bike';
  callerState?: { selected: SportType; name: string; date: string };
}

export function useNewSession() {
  const navigate = useNavigate();
  const location = useLocation();
  const returned = (location.state ?? {}) as ReturnedRouteState;

  const [selected, setSelected] = useState<SportType>(
    returned.callerState?.selected ?? 'strength'
  );
  const [name, setName] = useState(
    returned.callerState?.name ?? defaultSessionName('strength')
  );
  const [date, setDate] = useState(
    returned.callerState?.date ?? todayDateString()
  );
  const [startTime, setStartTime] = useState(new Date().toTimeString().slice(0, 5));
  const [waypoints] = useState<[number, number][]>(returned.waypoints ?? []);
  const [routeKm] = useState(returned.distanceKm ?? 0);
  const [nameTouched, setNameTouched] = useState(!!returned.callerState?.name);

  useEffect(() => {
    if (!nameTouched) setName(defaultSessionName(selected));
  }, [selected, nameTouched]);

  const { dispatch: startSession } = useCommand(handleStartSession);
  const { dispatch: planSession } = useCommand(handlePlanSession);

  function recordRecentSport(sport: SportType) {
    const current = (viewStore.get<SportType[]>('wapp_recent_sports') ?? [])
      .filter(s => s !== sport);
    viewStore.set('wapp_recent_sports', [sport, ...current].slice(0, 10));
  }

  async function handleNewSession() {
    recordRecentSport(selected);

    if (selected === 'strength') {
      const result = await startSession({ type: 'StartSession', userId: USER_ID, name, primarySport: selected });
      if (result.ok) {
        navigate(`/sessions/${result.value!.sessionId}`);
      }
      return;
    }

    const scheduledAt = new Date(`${date}T18:00:00`).getTime();
    await planSession({
      type: 'PlanSession',
      userId: USER_ID,
      planType: selected,
      name,
      scheduledAt,
      notes: '',
      routeWaypoints: waypoints.length > 0 ? waypoints : undefined,
      distanceKm: routeKm > 0 ? routeKm : undefined,
    });
    navigate('/');
  }

  function handleAddRoute() {
    navigate('/plan-route', {
      state: {
        waypoints,
        profile: selected === 'cycle' ? 'bike' : 'foot',
        returnTo: '/sessions/new',
        callerState: { selected, name, date },
      },
    });
  }

  function handleSavedRoutes() {
    navigate('/saved-routes', {
      state: { returnTo: '/sessions/new', callerState: { selected, name, date } },
    });
  }

  const routeLabel = routeKm > 0
    ? `Route saved · ${routeKm.toFixed(1)} km — Edit →`
    : 'Add route →';

  return {
    navigate,
    selected, setSelected,
    name, setName, setNameTouched,
    date, setDate,
    startTime, setStartTime,
    routeKm,
    routeLabel,
    handleNewSession,
    handleAddRoute,
    handleSavedRoutes,
  };
}
