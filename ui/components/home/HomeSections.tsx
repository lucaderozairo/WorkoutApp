import { useNavigate } from 'react-router-dom';
import { Barbell } from 'phosphor-react';
import { Dot, IconFrame, Text } from '@ui/atoms';
import { Column, Row } from '@ui/layout';
import { Section } from '@ui/patterns';
import type { Appointment } from '@features/scheduling/contract';

// ── Helpers ───────────────────────────────────────────────────────────────────

function appointmentDayLabel(scheduledAt: number): string {
  const appt = new Date(scheduledAt);
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart); tomorrowStart.setDate(todayStart.getDate() + 1);
  const apptDay = new Date(appt); apptDay.setHours(0, 0, 0, 0);
  if (apptDay.getTime() === todayStart.getTime()) return 'Today';
  if (apptDay.getTime() === tomorrowStart.getTime()) return 'Tomorrow';
  return appt.toLocaleDateString(undefined, { weekday: 'long' });
}

// ── Upcoming content (no Surface — SplitTabs provides the card) ───────────────

interface UpcomingContentProps {
  appointments: Appointment[];
}

export function UpcomingContent({ appointments }: UpcomingContentProps) {
  const navigate = useNavigate();

  return (
    <Section label="Upcoming" gap={2}>
      {appointments.length === 0 ? (
        <Column gap={1}>
          <Text size="detail" color="muted">No sessions planned</Text>
          <Text size="caption" color="muted">Add one to see it here</Text>
        </Column>
      ) : (
        <Column gap={2}>
          {appointments.map(a => {
            const timeStr = new Date(a.scheduledAt).toLocaleTimeString(undefined, {
              hour: '2-digit', minute: '2-digit',
            });
            const dayLabel = appointmentDayLabel(a.scheduledAt);
            return (
              <Row key={a.id} align="center" gap={2} className="list-item sm">
                <IconFrame>
                  <Barbell size={14} weight="fill" />
                </IconFrame>
                <Column gap={0} className="min-w-0">
                  <Text size="detail">{a.title}</Text>
                  <Text size="caption" color="muted">{dayLabel}</Text>
                </Column>
                <Text mono size="caption" className="spacer shrink-0">{timeStr}</Text>
              </Row>
            );
          })}
        </Column>
      )}
    </Section>
  );
}

// ── This Week content (no Surface — SplitTabs provides the card) ──────────────

interface WeekDay {
  label: string;
  done: boolean;
  isToday: boolean;
  isFuture: boolean;
}

interface ThisWeekContentProps {
  weekDays: WeekDay[];
  workoutsThisWeek: number;
  streak: number;
}

export function ThisWeekContent({ weekDays, workoutsThisWeek, streak }: ThisWeekContentProps) {
  const sessionsLabel = workoutsThisWeek === 1 ? '1 session' : `${workoutsThisWeek} sessions`;

  return (
    <Section label="This Week" gap={2}>
      <Row align="center" justify="between" gap={1}>
        {weekDays.map((d, i) => (
          <Column key={i} align="center" gap={1}>
            <Dot
              className="week-dot"
              data-done={d.done || undefined}
              data-today={d.isToday || undefined}
              data-future={d.isFuture || undefined}
              aria-label={`${d.label}${d.done ? ' completed' : ''}`}
            />
            <Text size="caption" color="muted">{d.label}</Text>
          </Column>
        ))}
      </Row>
      <Text size="caption" color="muted">
        {workoutsThisWeek === 0 ? 'No sessions yet this week' : `${sessionsLabel} completed`}
        {streak >= 2 ? ` · ${streak} day streak` : ''}
      </Text>
    </Section>
  );
}
