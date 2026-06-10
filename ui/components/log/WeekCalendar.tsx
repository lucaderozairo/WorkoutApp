import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { TypeFilter } from './SessionFilterBar';
import type { CombinedSession } from '@features/training_log/queries/calendarUtils';
import { buildDateMap, getWeekStart, formatWeekRange, toDateKey } from '@features/training_log/queries/calendarUtils';
import { StrengthSessionItem, CardioSessionItem } from './SessionListItem';
import { Row, Column } from '@ui/layout';
import { Surface } from '@ui/atoms';

interface Props {
  sessions: CombinedSession[];
  typeFilter: TypeFilter;
  renderFilter?: () => ReactNode;
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function WeekCalendar({ sessions, typeFilter, renderFilter }: Props) {
  const today = new Date();
  const [weekStart, setWeekStart] = useState(() => getWeekStart(today));
  const [selectedKey, setSelectedKey] = useState<string | null>(toDateKey(today.getTime()));

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

  const weekStartKey = toDateKey(weekStart.getTime());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const weekEndKey = toDateKey(weekEnd.getTime());

  const allWeekSessions = useMemo(() => {
    const result: CombinedSession[] = [];
    for (const entry of sessions) {
      const ts = entry.kind === 'strength' ? entry.session.finishedAt : entry.session.startedAt;
      const key = toDateKey(ts);
      if (key >= weekStartKey && key <= weekEndKey) result.push(entry);
    }
    return result;
  }, [sessions, weekStartKey, weekEndKey]);

  const displaySessions = selectedKey
    ? (dateMap.get(selectedKey) ?? [])
    : allWeekSessions;

  return (
    <Column>
      <Surface pad="sm">
        <Row justify="between" align="center">
          <button className="secondary icon sm" onClick={prev}>‹</button>
          <span className="caption text-center">{formatWeekRange(weekStart)}</span>
          <button className="secondary icon sm" onClick={next}>›</button>
        </Row>
      </Surface>

      <Surface pad="sm">
        <Row>
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
                onClick={() => !isFuture && setSelectedKey(k => k === key ? null : key)}
                disabled={isFuture}
              >
                <span className="caption">{DAY_LABELS[i]}</span>
                <strong>{date.getDate()}</strong>
                {hasSessions
                  ? <span className="dot sm active" />
                  : <span className="dot sm invisible" />
                }
              </button>
            );
          })}
        </Row>
      </Surface>

      {renderFilter?.()}

      <Column>
        <Surface variant="flat">
          <Row justify="between" align="center" gap={1}>
            <span className="caption muted">
              {selectedKey
                ? <>
                    {new Date(selectedKey + 'T12:00:00').toLocaleDateString('en-GB', {
                      weekday: 'short', day: 'numeric', month: 'long',
                    })}
                    {selectedKey === todayKey ? ' — today' : ''}
                  </>
                : formatWeekRange(weekStart)
              }
            </span>
          </Row>
        </Surface>
        {displaySessions.length === 0 ? (
          <p className="muted caption">No sessions {selectedKey ? 'this day' : 'this week'}.</p>
        ) : (
          displaySessions.map((entry, i) =>
            entry.kind === 'strength'
              ? <StrengthSessionItem key={i} session={entry.session} />
              : <CardioSessionItem key={i} session={entry.session} />
          )
        )}
      </Column>
    </Column>
  );
}
