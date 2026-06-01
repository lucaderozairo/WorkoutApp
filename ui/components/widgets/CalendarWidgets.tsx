import { useQuery } from '@ui/bindings';
import { Grid, Row, Column } from '@ui/layout';
import { Surface, Button, Text, Badge } from '@ui/atoms';
import type { SportType } from '@features/training_log/domain/types';
import type { MockCalendarEvent } from '@features/scheduling';

const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] as const;


export function CalendarGrid({ year, month }: { year: number; month: number }) {
  const today = new Date();
  const todayDate = today.getDate();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  const workoutCalendar = (useQuery<Record<number, SportType[]>>('workout_calendar') ?? {}) as Record<number, SportType[]>;

  const startOffset = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array<null>(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <Grid variant="cal">
      {DAY_LABELS.map(label => (
        <span key={label} className="day">{label}</span>
      ))}
      {cells.map((day, i) => {
        if (day === null) return <span key={`e-${i}`} className="day" />;
        const isToday = isCurrentMonth && day === todayDate;
        const primarySport = (workoutCalendar[day] ?? [])[0];

        return (
          <button key={day} className="day" {...(isToday ? { 'data-today': '' } : {})}>
            <span>{day}</span>
            <span className={`dot ${primarySport ?? ''}`} style={primarySport ? undefined : { visibility: 'hidden' }} />
          </button>
        );
      })}
    </Grid>
  );
}


export function CalendarLarge() {
  const today = new Date();
  const label = today.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const upcoming = (useQuery<MockCalendarEvent[]>('calendar_upcoming') ?? []) as MockCalendarEvent[];

  return (
    <Surface>
      <Column>
        <Row justify="between" align="center" gap={1}>
          <Button variant="ghost" size="icon">‹</Button>
          <Text size="caption">{label}</Text>
          <Button variant="ghost" size="icon">›</Button>
        </Row>
        <CalendarGrid year={today.getFullYear()} month={today.getMonth()} />

        <Text as="h3">Coming up</Text>
        <Column gap={1}>
          {upcoming.map(ev => (
            <Surface key={ev.day}>
              <Row align="center" gap={1}>
                <div>
                  {/* fontSize: 9 is below the token scale — no atom covers this */}
                  <span className="eyebrow" style={{ fontSize: 9 }}>{ev.month}</span>
                  <span style={{ fontSize: 'var(--t-lg)', lineHeight: 1 }}>{ev.day}</span>
                </div>
                <Column gap={1} className="grow">
                  <Row justify="between" align="center">
                    <Text size="detail">{ev.title}</Text>
                    <Badge className={`pill ${ev.sport}`}>{ev.sport}</Badge>
                  </Row>
                  <Text size="caption">{ev.time}</Text>
                </Column>
              </Row>
            </Surface>
          ))}
        </Column>
      </Column>
    </Surface>
  );
}
