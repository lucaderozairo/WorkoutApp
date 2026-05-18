import { useState } from 'react';
import { ACTIVITY_ICONS } from '@ui/icons/activityIcons';
import type { SportType } from '@features/training_log/domain/types';
import {
  PINNED_ACTIVITIES, MORE_CATEGORIES, ROUTE_ACTIVITIES,
  todayDateString, useNewSession,
} from './useNewSession';

function ActivityButton({ sport, selected, onSelect }: {
  sport: SportType;
  selected: SportType;
  onSelect: (s: SportType) => void;
}) {
  const { label, Icon } = ACTIVITY_ICONS[sport];
  return (
    <button
      className={`surface tight column align-center grow${selected === sport ? ' active' : ''}`}
      onClick={() => onSelect(sport)}
    >
      <Icon size={22} />
      <span className="caption">{label}</span>
    </button>
  );
}

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

  const [showMore, setShowMore] = useState(false);

  return (
    <div className="column">
      <div className="row space-between align-center compact">
        <button className="ghost" onClick={() => navigate(-1)}>Back</button>
        <h2>New Session</h2>
        <span />
      </div>
      {/* Pinned quick-select row */}
      <div className="row compact">
        {PINNED_ACTIVITIES.map(sport => (
          <ActivityButton key={sport} sport={sport} selected={selected} onSelect={setSelected} />
        ))}
        <button
          className={`surface tight column align-center${showMore ? ' active' : ''}`}
          onClick={() => setShowMore(v => !v)}
          aria-expanded={showMore}
        >
          <h2>{showMore ? '✕' : '⊕'}</h2>
          <span className="caption">More</span>
        </button>
      </div>

      {/* Expandable "More" grid */}
      {showMore && (
        <div className="column compact card surface inset">
          {MORE_CATEGORIES.map(cat => (
            <div key={cat.label} className="column compact">
              <p className="eyebrow">{cat.label}</p>
              <div className="cluster compact">
                {cat.sports.map(sport => (
                  <ActivityButton key={sport} sport={sport} selected={selected} onSelect={sport => { setSelected(sport); setShowMore(false); }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

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
