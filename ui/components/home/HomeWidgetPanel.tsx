import { Fragment, useState } from 'react';
import { Flame, CaretRight, Cloud } from 'phosphor-react';
import { Surface, Text, ProgressRing, MultiSegmentBar, IconFrame, Dot, Divider } from '@ui/atoms';
import { CheckRow, Button, Metric } from '@ui/molecules';
import { Column, Grid, Row } from '@ui/layout';
import type { SleepSession } from '@features/readiness/domain/mock-types';
import type { ActivityHistoryItem } from '@features/training_log/contract';
import type { SportType } from '@features/training_log/domain/types';
import type { Appointment } from '@features/scheduling/domain/types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleepDuration(s: SleepSession): string {
  const ms = s.end.getTime() - s.start.getTime();
  const h = Math.floor(ms / 3600000);
  const m = Math.round((ms % 3600000) / 60000);
  return `${h}h ${m}m`;
}

function sleepTimings(s: SleepSession): string {
  const fmt = (d: Date) => d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  return `${fmt(s.start)} → ${fmt(s.end)}`;
}

function fmtMins(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function fmtSecs(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function timeStr(ts: number): string {
  return new Date(ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function relativeDay(ts: number): string {
  const appt = new Date(ts);
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const d = new Date(appt); d.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - todayStart.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return appt.toLocaleDateString(undefined, { weekday: 'long' });
}

const SPORT_ATTR: Partial<Record<SportType, string>> = {
  run: 'run', cycle: 'cycle', swim: 'swim',
  row: 'rowing', concept2_rower: 'rowing',
  strength: 'lift', hiit: 'lift', boxing: 'lift',
  yoga: 'mind', mobility: 'mind', stretch: 'mind',
};

function scoreToTone(score: number): 'ok' | 'warn' | 'bad' {
  return score >= 80 ? 'ok' : score >= 60 ? 'warn' : 'bad';
}

// ── Sleep widget ──────────────────────────────────────────────────────────────

export function HomeSleepWidget({ session }: { session: SleepSession }) {
  const { stages } = session;
  const total = stages.deep + stages.rem + stages.light + stages.awake;

  const segments = [
    { pct: (stages.deep  / total) * 100, color: 'color-sleep-deep',  label: 'Deep' },
    { pct: (stages.rem   / total) * 100, color: 'color-sleep-rem',   label: 'REM' },
    { pct: (stages.light / total) * 100, color: 'color-sleep-light', label: 'Light' },
    { pct: (stages.awake / total) * 100, color: 'color-sleep-awake', label: 'Awake' },
  ];

  return (
    <Surface pad="sm" className="home-widget full" aria-labelledby="hw-sleep-title">
      <Column gap={3}>
        <Row align="start" gap={3}>
          <Column gap={1} grow>
            <Text size="eyebrow" id="hw-sleep-title">Sleep</Text>
            <Metric value={sleepDuration(session)} size="lg" mono />
            <Text mono size="caption" color="muted">{sleepTimings(session)}</Text>
          </Column>
          <Column gap={1} align="center" className="shrink-0">
            <Grid placeItems="center" className="score-circle" data-tone="sleep" aria-label={`Sleep score ${session.score}`}>
              {session.score}
            </Grid>
            <Text size="caption" color="faint">score</Text>
          </Column>
        </Row>

        <MultiSegmentBar segments={segments} aria-label="Sleep stages breakdown" />

        <Grid cols={4} gap={2}>
          <Column gap={1} align="center" className="text-center">
            <Text as="strong" size="detail" mono data-stage="deep">{fmtMins(stages.deep)}</Text>
            <Text size="caption" color="faint">Deep</Text>
          </Column>
          <Column gap={1} align="center" className="text-center">
            <Text as="strong" size="detail" mono data-stage="rem">{fmtMins(stages.rem)}</Text>
            <Text size="caption" color="faint">REM</Text>
          </Column>
          <Column gap={1} align="center" className="text-center">
            <Text as="strong" size="detail" mono data-stage="light">{fmtMins(stages.light)}</Text>
            <Text size="caption" color="faint">Light</Text>
          </Column>
          <Column gap={1} align="center" className="text-center">
            <Text as="strong" size="detail" mono data-stage="awake">{fmtMins(stages.awake)}</Text>
            <Text size="caption" color="faint">Awake</Text>
          </Column>
        </Grid>
      </Column>
    </Surface>
  );
}

// ── Readiness widget ──────────────────────────────────────────────────────────

interface HomeReadinessWidgetProps {
  score: number;
  hasEntry: boolean;
}

export function HomeReadinessWidget({ score, hasEntry }: HomeReadinessWidgetProps) {
  const tone = hasEntry ? scoreToTone(score) : undefined;
  const label = !hasEntry ? '—' : score >= 80 ? 'Good' : score >= 60 ? 'OK' : 'Poor';

  return (
    <Surface pad="sm" className="home-widget compact" aria-labelledby="hw-readiness-title">
      <Column gap={3} align="center" className="text-center">
        <Text size="eyebrow" id="hw-readiness-title">Readiness</Text>
        <ProgressRing value={hasEntry ? score : 0} tone={tone ?? 'accent'} size="sm">
          <Text mono size="caption">{hasEntry ? score : '—'}</Text>
        </ProgressRing>
        {tone && <Text as="span" className="status-word" data-tone={tone}>{label}</Text>}
      </Column>
    </Surface>
  );
}

// ── Streak widget ─────────────────────────────────────────────────────────────

export function HomeStreakWidget({ streak }: { streak: number }) {
  return (
    <Surface pad="sm" className="home-widget compact" aria-labelledby="hw-streak-title">
      <Column gap={3}>
        <Text size="eyebrow" id="hw-streak-title">Streak</Text>
        <Row align="center" gap={2} className="streak-icon">
          <Flame size={22} weight="fill" aria-hidden="true" />
          <Metric value={streak} size="lg" />
        </Row>
        <Text size="detail" color="muted">days in a row</Text>
      </Column>
    </Surface>
  );
}

// ── Checklist widget ──────────────────────────────────────────────────────────

const DEFAULT_HABITS = [
  'Buy protein powder',
  'Book next physio',
  'Stretch after run',
  'Drink 2 L water',
];

export function HomeChecklistWidget() {
  const [checked, setChecked] = useState<Set<number>>(new Set([0]));

  const toggle = (i: number) =>
    setChecked(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });

  return (
    <Surface pad="sm" className="home-widget full" aria-labelledby="hw-checklist-title">
      <Column gap={3}>
        <Row align="center" justify="between" gap={3}>
          <Text size="eyebrow" id="hw-checklist-title">Checklist</Text>
          <Button variant="ghost" size="sm" aria-label="Add habit">+</Button>
        </Row>
        <Column gap={0}>
          {DEFAULT_HABITS.map((label, i) => (
            <Fragment key={label}>
              {i > 0 && <Divider />}
              <CheckRow
                label={label}
                checked={checked.has(i)}
                onChange={() => toggle(i)}
              />
            </Fragment>
          ))}
        </Column>
      </Column>
    </Surface>
  );
}

// ── Weather widget ────────────────────────────────────────────────────────────

export function HomeWeatherWidget() {
  return (
    <Surface pad="sm" className="home-widget full" aria-labelledby="hw-weather-title">
      <Column gap={3}>
        <Text size="eyebrow" id="hw-weather-title">Weather</Text>
        <Row align="center" justify="between" gap={3}>
          <Row align="center" gap={3} className="min-w-0">
            <IconFrame size="xl" tone="accent">
              <Cloud size={22} aria-hidden="true" />
            </IconFrame>
            <Column gap={0} className="min-w-0">
              <Row align="baseline" gap={1}>
                <Metric value={18} size="md" />
                <Text size="detail" color="muted">°C</Text>
              </Row>
              <Text size="detail" color="muted">Partly cloudy</Text>
            </Column>
          </Row>
          <Row gap={3} aria-label="Weather details">
            <Column gap={1} align="center">
              <Text size="caption" color="muted" mono>12 km/h</Text>
              <Text size="caption" color="faint">Wind</Text>
            </Column>
            <Column gap={1} align="center">
              <Text size="caption" color="muted" mono>65%</Text>
              <Text size="caption" color="faint">Hum.</Text>
            </Column>
            <Column gap={1} align="center">
              <Text size="caption" color="muted" mono>UV 3</Text>
              <Text size="caption" color="faint">UV</Text>
            </Column>
          </Row>
        </Row>
      </Column>
    </Surface>
  );
}

// ── Calendar / Today widget ───────────────────────────────────────────────────

const DOT_COLORS = ['accent', 'ok', 'warn'] as const;

export function HomeCalendarWidget({ appointments }: { appointments: Appointment[] }) {
  return (
    <Surface pad="sm" className="home-widget full" aria-labelledby="hw-calendar-title">
      <Column gap={3}>
        <Text size="eyebrow" id="hw-calendar-title">Today</Text>
        {appointments.length === 0 ? (
          <Text size="detail" color="muted">Nothing scheduled today</Text>
        ) : (
          <Column gap={0}>
            {appointments.map((a, i) => (
              <Fragment key={a.id}>
                {i > 0 && <Divider />}
                <Row align="center" gap={3} className="list-item sm">
                  <Dot color={DOT_COLORS[i % 3]} active size="sm" aria-hidden="true" />
                  <Text size="detail" truncate className="min-w-0">{a.title}</Text>
                  <Text mono size="caption" color="muted" className="shrink-0">
                    {timeStr(a.scheduledAt)}
                  </Text>
                </Row>
              </Fragment>
            ))}
          </Column>
        )}
      </Column>
    </Surface>
  );
}

// ── Last session card ─────────────────────────────────────────────────────────

export function HomeSessionCard({ session }: { session: ActivityHistoryItem }) {
  const sport = SPORT_ATTR[session.primarySport];
  const day = relativeDay(session.startedAt);

  return (
    <Surface pad="sm" className="grid">
      <Row align="center" gap={3}>
        <IconFrame size="lg" sport={sport as 'lift' | 'run' | 'cycle' | 'swim' | 'rowing' | 'mind' | undefined}>
          <Cloud size={20} aria-hidden="true" />
        </IconFrame>
        <Column gap={0} grow>
          <Text size="detail" bold truncate>{session.name}</Text>
          <Text size="caption" color="muted">{day}</Text>
        </Column>
        <CaretRight size={18} className="faint" aria-hidden="true" weight="bold" />
      </Row>
      <Grid cols={3} gap={2}>
        <Surface variant="flat" pad="xs" className="q-tile">
          <Column gap={1}>
            <Text as="strong" size="detail" mono truncate>{fmtSecs(session.durationSeconds)}</Text>
            <Text size="caption" color="faint" truncate>Duration</Text>
          </Column>
        </Surface>
        <Surface variant="flat" pad="xs" className="q-tile">
          <Column gap={1}>
            <Text as="strong" size="detail" mono truncate>{session.totalSets} sets</Text>
            <Text size="caption" color="faint" truncate>Volume</Text>
          </Column>
        </Surface>
        <Surface variant="flat" pad="xs" className="q-tile">
          <Column gap={1}>
            <Text as="strong" size="detail" mono truncate>{session.exerciseCount} ex</Text>
            <Text size="caption" color="faint" truncate>Exercises</Text>
          </Column>
        </Surface>
      </Grid>
    </Surface>
  );
}
