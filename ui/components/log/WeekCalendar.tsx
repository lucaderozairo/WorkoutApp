import { useState } from 'react';
import type { TypeFilter } from './SessionFilterBar';
import type { CombinedSession } from './calendarUtils';
import { buildDateMap, getWeekStart, formatWeekRange, toDateKey } from './calendarUtils';
import { StrengthSessionItem, CardioSessionItem } from './SessionListItem';

interface Props {
  sessions: CombinedSession[];
  typeFilter: TypeFilter;
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function WeekCalendar({ sessions, typeFilter }: Props) {
  const today = new Date();
  const [weekStart, setWeekStart] = useState(() => getWeekStart(today));
  const [selectedKey, setSelectedKey] = useState(toDateKey(today.getTime()));

  const dateMap = buildDateMap(sessions, typeFilter);
  const todayKey = toDateKey(today.getTime());

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  function prev() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
    setSelectedKey(toDateKey(d.getTime()));
  }
  function next() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
    setSelectedKey(toDateKey(d.getTime()));
  }

  const selectedSessions = dateMap.get(selectedKey) ?? [];

  return (
    <div className="column">
      <div className="row space-between align-center surface compact">
        <button className="secondary icon sm" onClick={prev}>‹</button>
        <span className="caption text-center">{formatWeekRange(weekStart)}</span>
        <button className="secondary icon sm" onClick={next}>›</button>
      </div>

      <div className="row surface compact">
        {days.map((date, i) => {
          const key = toDateKey(date.getTime());
          const isToday = key === todayKey;
          const isFuture = date > today;
          const hasSessions = dateMap.has(key);
          const isSelected = key === selectedKey;
          return (
            <button
              key={key}
              className={`column align-center grow ghost${isSelected ? ' primary' : ''}`}
              {...(isToday ? { 'data-today': true } : {})}
              onClick={() => !isFuture && setSelectedKey(key)}
              disabled={isFuture}
            >
              <span className="caption">{DAY_LABELS[i]}</span>
              <strong>{date.getDate()}</strong>
              {hasSessions
                ? <span className="dot sm active" />
                : <span className="dot sm" style={{ opacity: 0 }} />
              }
            </button>
          );
        })}
      </div>

      <div className="column">
        <div className="row space-between align-center compact surface flat">
          <span className="caption muted">
            {new Date(selectedKey + 'T12:00:00').toLocaleDateString('en-GB', {
              weekday: 'short', day: 'numeric', month: 'long',
            })}
            {selectedKey === todayKey ? ' — today' : ''}
          </span>
        </div>
        {selectedSessions.length === 0 ? (
          <p className="muted caption compact">No sessions this day.</p>
        ) : (
          selectedSessions.map((entry, i) =>
            entry.kind === 'strength'
              ? <StrengthSessionItem key={i} session={entry.session} />
              : <CardioSessionItem key={i} session={entry.session} />
          )
        )}
      </div>
    </div>
  );
}
