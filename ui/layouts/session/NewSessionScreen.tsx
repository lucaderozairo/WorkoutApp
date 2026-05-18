import { ACTIVITY_ICONS } from '@ui/icons/activityIcons';
import type { SportType } from '@features/training_log/domain/types';
import type { PlanType } from '@features/planning';
import { SESSION_ACTIVITIES, ROUTE_ACTIVITIES, todayDateString, useNewSession } from './useNewSession';

const PLAN_TO_SPORT: Record<PlanType, SportType> = {
  gym:   'strength',
  run:   'run',
  cycle: 'cycle',
  swim:  'swim',
  hike:  'hike',
};

export function NewSessionScreen() {
  const {
    navigate,
    selected, setSelected,
    name, setName, setNameTouched,
    date, setDate,
    startTime, setStartTime,
    routeLabel,
    handleNewSession,
    handleAddRoute,
    handleSavedRoutes,
  } = useNewSession();

  return (
    <div className="column">
      <div className="row space-between align-center compact">
        <button className="ghost" onClick={() => navigate(-1)}>Back</button>
        <h2>New Session</h2>
        <span />
      </div>

      <div className="row compact">
        {SESSION_ACTIVITIES.map(key => {
          const { label, Icon } = ACTIVITY_ICONS[PLAN_TO_SPORT[key]];
          return (
            <button
              key={key}
              className={`surface tight column align-center grow${selected === key ? ' active' : ''}`}
              onClick={() => setSelected(key)}
            >
              <Icon size={24} />
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
        <label className="label" htmlFor="session-time">Time</label>
        <input
          id="session-time"
          className="form-input"
          type="time"
          value={startTime}
          onChange={e => setStartTime(e.target.value)}
        />
      </div>

      {ROUTE_ACTIVITIES.has(selected) && (
        <div className="row compact">
          <button className="secondary grow" onClick={handleAddRoute}>
            {routeLabel}
          </button>
          <button className="secondary" onClick={handleSavedRoutes}>
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
