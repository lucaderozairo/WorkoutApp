import { useState } from 'react';
import type { TypeFilter } from './SessionFilterBar';
import type { CombinedSession } from './calendarUtils';
import { buildDateMap, getMonthGrid, toDateKey } from './calendarUtils';
import { StrengthSessionItem, CardioSessionItem } from './SessionListItem';

interface Props {
  sessions: CombinedSession[];
  typeFilter: TypeFilter;
}

const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function MonthCalendar({ sessions, typeFilter }: Props) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedKey, setSelectedKey] = useState<string | null>(toDateKey(today.getTime()));

  const dateMap = buildDateMap(sessions, typeFilter);
  const grid = getMonthGrid(year, month);
  const todayKey = toDateKey(today.getTime());
  const monthLabel = new Date(year, month).toLocaleDateString('en-GB', {
    month: 'long', year: 'numeric',
  });

  function prev() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
    setSelectedKey(null);
  }
  function next() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
    setSelectedKey(null);
  }

  const selectedSessions = selectedKey ? (dateMap.get(selectedKey) ?? []) : [];

  return (
    <div className="column">
      <div className="row space-between align-center surface compact">
        <button className="secondary icon sm" onClick={prev}>‹</button>
        <strong>{monthLabel}</strong>
        <button className="secondary icon sm" onClick={next}>›</button>
      </div>

      <div className="cal">
        {WEEKDAY_LABELS.map((d, i) => (
          <span key={i} className="caption text-center">{d}</span>
        ))}
      </div>

      <div className="cal">
        {grid.map((date, i) => {
          if (!date) return <div key={i} />;
          const key = toDateKey(date.getTime());
          const hasSessions = dateMap.has(key);
          const isToday = key === todayKey;
          const isSelected = key === selectedKey;
          return (
            <button
              key={key}
              className={`day column align-center${isSelected && !isToday ? ' surface selected' : ''}`}
              {...(isToday ? { 'data-today': true } : {})}
              onClick={() => setSelectedKey(isSelected ? null : key)}
            >
              {date.getDate()}
              {hasSessions
                ? <span className={`dot sm${isToday ? '' : ' active'}`} />
                : <span className="dot sm" style={{ opacity: 0 }} />
              }
            </button>
          );
        })}
      </div>

      {selectedKey && (
        <div className="column">
          <div className="row space-between align-center compact surface flat">
            <button className="ghost sm" onClick={() => setSelectedKey(null)}>← Back</button>
            <span className="caption muted">
              {new Date(selectedKey + 'T12:00:00').toLocaleDateString('en-GB', {
                weekday: 'short', day: 'numeric', month: 'long',
              })}
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
      )}
    </div>
  );
}
