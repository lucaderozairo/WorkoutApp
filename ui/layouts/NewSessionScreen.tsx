import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCommand } from '@ui/bindings';
import { handleStartSession } from '@features/training_log';
import { handlePlanSession } from '@features/planning';
import { defaultSessionName } from '@ui/components/workout/wizard/wizardUtils';
import { ACTIVITY_META } from '@ui/components/log/activityConfig';
import type { PlanType } from '@features/planning';
import type { Id } from '@shared/types';
import { viewStore } from '@data/projections/views';

const USER_ID = 'user-001' as Id<'User'>;

const ROUTE_ACTIVITIES = new Set<PlanType>(['run', 'cycle', 'hike']);
const SESSION_ACTIVITIES: PlanType[] = ['gym', 'run', 'cycle', 'hike'];

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

interface ReturnedRouteState {
  waypoints?: [number, number][];
  distanceKm?: number;
  profile?: 'foot' | 'bike';
  callerState?: { selected: PlanType; name: string; date: string };
}

export function NewSessionScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const returned = (location.state ?? {}) as ReturnedRouteState;

  const [selected, setSelected] = useState<PlanType>(
    returned.callerState?.selected ?? 'gym'
  );
  const [name, setName] = useState(
    returned.callerState?.name ?? defaultSessionName('gym')
  );
  const [date, setDate] = useState(
    returned.callerState?.date ?? todayDateString()
  );
  const [waypoints] = useState<[number, number][]>(returned.waypoints ?? []);
  const [routeKm] = useState(returned.distanceKm ?? 0);

  // Sync name default when activity type changes (only if user hasn't edited it)
  const [nameTouched, setNameTouched] = useState(!!returned.callerState?.name);
  useEffect(() => {
    if (!nameTouched) setName(defaultSessionName(selected));
  }, [selected, nameTouched]);

  const { dispatch: startSession } = useCommand(handleStartSession);
  const { dispatch: planSession } = useCommand(handlePlanSession);

  function recordRecentSport(sport: PlanType) {
    const current = (viewStore.get<PlanType[]>('wapp_recent_sports') ?? [])
      .filter(s => s !== sport);
    viewStore.set('wapp_recent_sports', [sport, ...current].slice(0, 10));
  }

  async function handleNewSession() {
    recordRecentSport(selected);

    if (selected === 'gym') {
      await startSession({ type: 'StartSession', userId: USER_ID, name });
      navigate('/log');
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
    navigate(-1);
  }

  function handleAddRoute() {
    navigate('/plan-route', {
      state: {
        waypoints,
        profile: selected === 'cycle' ? 'bike' : 'foot',
        returnTo: '/new-session',
        callerState: { selected, name, date },
      },
    });
  }

  const routeLabel = routeKm > 0
    ? `Route saved · ${routeKm.toFixed(1)} km — Edit →`
    : 'Add route →';

  return (
    <div className="column">
      <div className="row space-between align-center compact">
        <button className="ghost" onClick={() => navigate(-1)}>Back</button>
        <h2>New Session</h2>
        <span />
      </div>

      <div className="row compact">
        {SESSION_ACTIVITIES.map(key => {
          const { emoji, label } = ACTIVITY_META[key];
          return (
            <button
              key={key}
              className={`surface compact column align-center grow${selected === key ? ' active' : ''}`}
              onClick={() => setSelected(key)}
            >
              <span>{emoji}</span>
              <span className="caption">{label}</span>
            </button>
          );
        })}
      </div>

      <div className="column compact">
        <label className="label" htmlFor="session-name">Name</label>
        <input
          id="session-name"
          className="form-input"
          type="text"
          value={name}
          onChange={e => { setName(e.target.value); setNameTouched(true); }}
        />
      </div>

      <div className="column compact">
        <label className="label" htmlFor="session-date">Date</label>
        <input
          id="session-date"
          className="form-input"
          type="date"
          value={date}
          min={todayDateString()}
          onChange={e => setDate(e.target.value)}
        />
      </div>

      {ROUTE_ACTIVITIES.has(selected) && (
        <div className="row compact">
          <button className="secondary grow" onClick={handleAddRoute}>
            {routeLabel}
          </button>
          <button className="secondary" onClick={() => navigate('/saved-routes', { state: { returnTo: '/new-session', callerState: { selected, name, date } } })}>
            Saved Routes
          </button>
        </div>
      )}

      <button
        className="primary"
        onClick={handleNewSession}
        disabled={!name.trim() || !date}
      >
        New Session
      </button>
    </div>
  );
}
