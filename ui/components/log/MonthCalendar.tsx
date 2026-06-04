import { useMemo, useState } from 'react';
import { Grid } from '@ui/layout';
import type { ReactNode } from 'react';
import type { TypeFilter } from './SessionFilterBar';
import type { CombinedSession } from '@features/training_log/contract';
import { buildDateMap, getMonthGrid, toDateKey } from '@features/training_log/queries/calendarUtils';
import { StrengthSessionItem, CardioSessionItem } from './SessionListItem';
import { Row, Column } from '@ui/layout';
import { Surface, Text } from '@ui/atoms';
import { Button } from '@ui/molecules';

interface Props {
  sessions: CombinedSession[];
  typeFilter: TypeFilter;
  renderFilter?: () => ReactNode;
}

const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function MonthCalendar({ sessions, typeFilter, renderFilter }: Props) {
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

  const allMonthSessions = useMemo(() => {
    const result: CombinedSession[] = [];
    for (const entry of sessions) {
      const ts = entry.kind === 'strength' ? entry.session.finishedAt : entry.session.startedAt;
      const d = new Date(ts);
      if (d.getFullYear() === year && d.getMonth() === month) result.push(entry);
    }
    return result;
  }, [sessions, year, month]);

  const displaySessions = selectedKey
    ? (dateMap.get(selectedKey) ?? [])
    : allMonthSessions;

  return (
    <Column>
      <Surface pad="sm">
        <Row justify="between" align="center">
          <Button variant="secondary" size="icon" onClick={prev}>‹</Button>
          <Text bold>{monthLabel}</Text>
          <Button variant="secondary" size="icon" onClick={next}>›</Button>
        </Row>
      </Surface>

      <Grid variant="cal">
        {WEEKDAY_LABELS.map((d, i) => (
          <Text key={i} size="caption" className="text-center">{d}</Text>
        ))}
      </Grid>

      <Grid variant="cal">
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
                : <span className="dot sm invisible" />
              }
            </button>
          );
        })}
      </Grid>

      {renderFilter?.()}

      <Column>
        <Surface variant="flat">
          <Row justify="between" align="center" gap={1}>
            {selectedKey ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => setSelectedKey(null)}>Back</Button>
                <Text size="caption" color="muted">
                  {new Date(selectedKey + 'T12:00:00').toLocaleDateString('en-GB', {
                    weekday: 'short', day: 'numeric', month: 'long',
                  })}
                </Text>
              </>
            ) : (
              <Text size="caption" color="muted">All sessions · {monthLabel}</Text>
            )}
          </Row>
        </Surface>
        {displaySessions.length === 0 ? (
          <Text size="caption" color="muted">No sessions {selectedKey ? 'this day' : 'this month'}.</Text>
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
