import { ScoreRing, SleepStagesBar, SparklineArea, fmtMin } from '@ui/patterns/charts/domain-charts';
import { Grid, Row, Column, Cluster, Spacer } from '@ui/layout';
import { Surface, Text, Metric, Divider } from '@ui/atoms';
import { Badge } from '@ui/molecules';
import type { SleepSession } from '@features/readiness/contract';
import type { HealthMetricsView } from '@features/readiness/contract';
import type { Appointment } from '@features/scheduling/contract';

type WidgetSize = '1x1' | '2x1' | '2x2';
type ScoreClass = 'good' | 'warning' | 'poor';

const BADGE_CLASS: Record<ScoreClass, string> = { good: 'green', warning: 'amber', poor: '' };
const RECOVERY_LABEL: Record<ScoreClass, string> = { good: 'Green', warning: 'Amber', poor: 'Red' };
const RECOVERY_DETAIL: Record<ScoreClass, string> = {
  good: 'Well recovered. Ready to train hard.',
  warning: 'Moderate recovery. Keep intensity in check.',
  poor: 'Low recovery. Prioritise rest today.',
};
const RECOVERY_TIP: Record<ScoreClass, string> = {
  good: 'You can push hard today — HRV and sleep support it.',
  warning: 'Stick to moderate effort. Avoid back-to-back hard sessions.',
  poor: 'Prioritise sleep tonight and consider an active recovery session.',
};

function scoreBadge(score: number) {
  if (score >= 85) return { label: 'Good', cls: 'green' };
  if (score >= 65) return { label: 'OK', cls: 'amber' };
  return { label: 'Poor', cls: '' };
}

// ── Sleep ────────────────────────────────────────────────────────────────────

export function SleepWidget({
  size,
  session,
  goalMinutes = 480,
  scoreHistory = [],
}: {
  size: WidgetSize;
  session: SleepSession | null;
  goalMinutes?: number;
  scoreHistory?: Array<{ x: string; y: number }>;
}) {
  if (!session) {
    return (
      <Surface><Column gap={1} className="h-full">
        <Text size="caption">Sleep</Text>
        <Text size="caption" color="faint">No data</Text>
      </Column></Surface>
    );
  }

  const totalMin = Math.floor((session.end.getTime() - session.start.getTime()) / 60_000);
  const duration = `${Math.floor(totalMin / 60)}h ${totalMin % 60}m`;
  const badge = scoreBadge(session.score);
  const debtMin = goalMinutes - totalMin;
  const debtLabel = debtMin > 0
    ? `−${Math.round(debtMin / 6) / 10}h vs goal`
    : `+${Math.round(-debtMin / 6) / 10}h vs goal`;

  if (size === '1x1') {
    return (
      <Surface><Column gap={1} className="h-full">
        <Text size="caption">Sleep</Text>
        <Metric value={session.score} size="lg" />
      </Column></Surface>
    );
  }

  if (size === '2x1') {
    return (
      <Surface><Column gap={1} className="h-full">
        <Row justify="between" align="center">
          <Text size="caption">Sleep</Text>
          <Badge className={badge.cls}>{badge.label}</Badge>
        </Row>
        <Row align="center">
          <Metric value={session.score} unit="/ 100" />
          <Spacer />
          <Text size="detail">{duration}</Text>
        </Row>
        <SleepStagesBar stages={session.stages} height={10} />
      </Column></Surface>
    );
  }

  return (
    <Surface><Column gap={1} className="h-full">
      <Row justify="between" align="center">
        <Text size="caption">Sleep</Text>
        <Badge className={badge.cls}>{badge.label}</Badge>
      </Row>
      <Row align="center">
        <ScoreRing score={session.score} subtitle="score" size={72} />
        <Column gap={1} className="grow">
          <Text size="detail">{duration}</Text>
          <Text size="caption" color="faint">{debtLabel}</Text>
        </Column>
      </Row>
      <SleepStagesBar stages={session.stages} height={10} />
      <Cluster gap={1}>
        <Badge className="deep">Deep {fmtMin(session.stages.deep)}</Badge>
        <Badge className="light">Light {fmtMin(session.stages.light)}</Badge>
        <Badge className="rem">REM {fmtMin(session.stages.rem)}</Badge>
        <Badge className="awake">Awake {fmtMin(session.stages.awake)}</Badge>
      </Cluster>
      {scoreHistory.length > 0 && (
        <SparklineArea
          data={scoreHistory}
          color="var(--color-primary)"
          height={40}
          id="dash-sleep-score"
          showTooltip
          tooltipFormatter={(v) => `Score ${v}`}
        />
      )}
    </Column></Surface>
  );
}

// ── Weather ───────────────────────────────────────────────────────────────────

const NEXT_HOURS = [
  { hour: '4pm', icon: '⛅', temp: 19, rain: 10 },
  { hour: '5pm', icon: '🌤', temp: 18, rain: 15 },
  { hour: '6pm', icon: '☁️', temp: 17, rain: 35 },
  { hour: '7pm', icon: '🌦', temp: 16, rain: 60 },
  { hour: '8pm', icon: '🌧', temp: 15, rain: 75 },
];

export function WeatherDashWidget({ size }: { size: WidgetSize }) {
  if (size === '1x1') {
    return (
      <Surface><Column gap={1} justify="center" align="center" className="h-full">
        <span className="emoji sm">⛅</span>
        <Metric value={18} unit="°C" />
        <Text size="caption" color="faint">Kingston</Text>
      </Column></Surface>
    );
  }

  if (size === '2x1') {
    return (
      <Surface><Column gap={1} className="h-full">
        <Row justify="between" align="center">
          <Text size="caption">Kingston, UK</Text>
          <Text size="caption" color="faint">15m ago</Text>
        </Row>
        <Row align="center">
          <span className="emoji md">⛅</span>
          <Column gap={1} className="grow">
            <Metric value={18} unit="°" size="sm" />
            <Text size="caption" color="faint">Partly Cloudy · Feels 16°</Text>
          </Column>
        </Row>
        <Row justify="between">
          {NEXT_HOURS.map(({ hour, icon, temp, rain }) => (
            <Column key={hour} gap={1} align="center">
              <Text size="caption" mono>{hour}</Text>
              <span>{icon}</span>
              <Text mono>{temp}°</Text>
              <Text size="caption" color="faint" mono>{rain}%</Text>
            </Column>
          ))}
        </Row>
      </Column></Surface>
    );
  }

  return (
    <Surface><Column gap={1} className="h-full">
      <Row justify="between" align="center">
        <Text size="caption">Kingston, UK</Text>
        <Text size="caption" color="faint">15m ago</Text>
      </Row>
      <Row justify="between" align="center">
        <Row align="center">
          <span className="emoji lg">⛅</span>
          <Column gap={1}>
            <Metric value={18} unit="°C" size="sm" />
            <Text size="caption" color="faint">Partly Cloudy</Text>
          </Column>
        </Row>
        <Column gap={1} align="end">
          <Text size="caption">Feels like 16°</Text>
          <Text size="caption" color="faint">Humidity 62%</Text>
        </Column>
      </Row>
      <Row justify="between">
        {NEXT_HOURS.map(({ hour, icon, temp, rain }) => (
          <Column key={hour} gap={1} align="center">
            <Text size="caption" mono>{hour}</Text>
            <span>{icon}</span>
            <Text mono>{temp}°</Text>
            <Text size="caption" color="faint" mono>{rain}%</Text>
          </Column>
        ))}
      </Row>
      <Grid variant="tiles">
        <Column gap={1}>
          <Text size="caption" color="faint">UV</Text>
          <Text>4</Text>
          <Badge className="green">Mod.</Badge>
        </Column>
        <Column gap={1}>
          <Text size="caption" color="faint">Wind</Text>
          <Text>14</Text>
          <Badge className="blue">km/h</Badge>
        </Column>
        <Column gap={1}>
          <Text size="caption" color="faint">Rain</Text>
          <Text>20%</Text>
          <Badge className="amber">Low</Badge>
        </Column>
        <Column gap={1}>
          <Text size="caption" color="faint">Vis.</Text>
          <Text>12km</Text>
          <Badge className="green">Clear</Badge>
        </Column>
      </Grid>
      <Row justify="between" align="center" gap={1}>
        <Text size="caption">Run conditions — mild temp, low wind</Text>
        <Badge className="green">Go</Badge>
      </Row>
    </Column></Surface>
  );
}

// ── Calendar ─────────────────────────────────────────────────────────────────

const DAY_HEADERS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function monthCells(year: number, month: number): Array<number | null> {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
}

export function CalendarDashWidget({ size, appointments }: { size: WidgetSize; appointments: Appointment[] }) {
  const now = new Date();
  const today = now.getDate();
  const month = now.getMonth();
  const year = now.getFullYear();
  const monthName = now.toLocaleDateString(undefined, { month: 'long' });

  if (size === '1x1') {
    return (
      <Surface><Column gap={1} justify="center" align="center" className="h-full">
        <Metric value={today} size="lg" />
        <Text size="caption" color="faint">{monthName}</Text>
        {appointments.length > 0 && (
          <Badge className={appointments.length > 0 ? 'blue' : ''}>{appointments.length} event{appointments.length !== 1 ? 's' : ''}</Badge>
        )}
      </Column></Surface>
    );
  }

  if (size === '2x1') {
    return (
      <Surface><Column gap={1} className="h-full">
        <Row justify="between" align="center">
          <Text size="caption">{now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
        </Row>
        {appointments.length === 0 ? (
          <Text size="caption" color="faint">Nothing scheduled today</Text>
        ) : (
          <Column gap={1}>
            {appointments.slice(0, 3).map(a => (
              <Row key={a.id} align="center" gap={1}>
                <div className="dot bg-primary" />
                <Text size="caption" className="grow">{a.title}</Text>
                <time className="caption faint">
                  {new Date(a.scheduledAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </time>
              </Row>
            ))}
          </Column>
        )}
      </Column></Surface>
    );
  }

  const cells = monthCells(year, month);

  return (
    <Surface><Column gap={1} className="h-full">
      <Text size="caption">{monthName} {year}</Text>
      <Grid variant="cal">
        {DAY_HEADERS.map(d => (
          <Text as="div" key={d} size="caption" color="faint" className="text-center">{d}</Text>
        ))}
        {cells.map((day, i) => (
          <Text as="div" key={i} size="caption" className={`text-center${day === today ? ' badge blue' : ' faint'}`}>
            {day ?? ''}
          </Text>
        ))}
      </Grid>
      {appointments.length > 0 && (
        <Column gap={1}>
          {appointments.slice(0, 2).map(a => (
            <Row key={a.id} gap={1} align="center">
              <div className="dot bg-primary" />
              <Text size="caption" className="grow">{a.title}</Text>
            </Row>
          ))}
        </Column>
      )}
    </Column></Surface>
  );
}

// ── Readiness + Recovery (combined) ──────────────────────────────────────────

export function ReadinessRecoveryWidget({ size, score, scoreClass }: { size: WidgetSize; score: number; scoreClass: ScoreClass }) {
  const ringColor = scoreClass === 'good' ? 'var(--ok)' : scoreClass === 'warning' ? 'var(--warn)' : 'var(--bad)';

  if (size === '1x1') {
    return (
      <Surface><Column gap={1} className="h-full">
        <Text size="caption">Readiness</Text>
        <Metric value={score} size="lg" />
        <Badge className={BADGE_CLASS[scoreClass]}>{RECOVERY_LABEL[scoreClass]}</Badge>
      </Column></Surface>
    );
  }

  if (size === '2x1') {
    return (
      <Surface><Column gap={1} className="h-full">
        <Row justify="between" align="center">
          <Text size="caption">Readiness · Recovery</Text>
          <Badge className={BADGE_CLASS[scoreClass]}>{RECOVERY_LABEL[scoreClass]}</Badge>
        </Row>
        <Row align="center">
          <Metric value={score} size="lg" className="grow" />
          <Text size="detail" color="faint">{RECOVERY_DETAIL[scoreClass]}</Text>
        </Row>
      </Column></Surface>
    );
  }

  return (
    <Surface><Column gap={1} className="h-full">
      <Row justify="between" align="center">
        <Text size="caption">Readiness · Recovery</Text>
        <Badge className={BADGE_CLASS[scoreClass]}>{RECOVERY_LABEL[scoreClass]}</Badge>
      </Row>
      <Row align="center">
        <ScoreRing score={score} color={ringColor} subtitle="score" size={72} />
        <Column gap={1} className="grow">
          <Text size="detail">{RECOVERY_DETAIL[scoreClass]}</Text>
          <Text size="caption" color="faint">{RECOVERY_TIP[scoreClass]}</Text>
        </Column>
      </Row>
    </Column></Surface>
  );
}

// ── HR + HRV (combined) ───────────────────────────────────────────────────────

export function HeartStatsWidget({ size, bpm, hrv, history }: { size: WidgetSize; bpm: number | null; hrv: number | null; history: HealthMetricsView[] }) {
  const hrData = history
    .filter(h => h.restingHr !== null)
    .slice(0, 14)
    .reverse()
    .map(h => ({ x: new Date(h.loggedAt).toLocaleDateString('en', { day: 'numeric', month: 'short' }), y: h.restingHr as number }));

  const hrvData = history
    .filter(h => h.hrv !== null)
    .slice(0, 14)
    .reverse()
    .map(h => ({ x: new Date(h.loggedAt).toLocaleDateString('en', { day: 'numeric', month: 'short' }), y: h.hrv as number }));

  if (size === '1x1') {
    return (
      <Surface><Column gap={1} className="h-full">
        <Text size="caption">Heart</Text>
        <Row justify="between" align="center">
          <Column gap={1}>
            <Metric value={bpm ?? '—'} unit="bpm" />
            <Text size="caption" color="faint">HR</Text>
          </Column>
          <Column gap={1} align="end">
            <Metric value={hrv ?? '—'} unit="ms" />
            <Text size="caption" color="faint">HRV</Text>
          </Column>
        </Row>
      </Column></Surface>
    );
  }

  if (size === '2x1') {
    return (
      <Surface><Column gap={1} className="h-full">
        <Text size="caption">Heart</Text>
        <Row justify="between" align="center">
          <Column gap={1}>
            <Metric value={bpm ?? '—'} unit="bpm" />
            <Text size="caption" color="faint">Resting HR</Text>
          </Column>
          <Column gap={1} align="end">
            <Metric value={hrv ?? '—'} unit="ms" />
            <Text size="caption" color="faint">HRV</Text>
          </Column>
        </Row>
      </Column></Surface>
    );
  }

  return (
    <Surface><Column gap={1} className="h-full">
      <Text size="caption">Heart</Text>
      <Row justify="between" align="center">
        <Column gap={1}>
          <Metric value={bpm ?? '—'} unit="bpm" />
          <Text size="caption" color="faint">Resting HR</Text>
        </Column>
        <Column gap={1} align="end">
          <Metric value={hrv ?? '—'} unit="ms" />
          <Text size="caption" color="faint">HRV</Text>
        </Column>
      </Row>
      {hrData.length > 0 && (
        <SparklineArea
          data={hrData}
          color="var(--color-warning)"
          height={40}
          id="dash-hr"
          yDomain={[35, 70]}
          showTooltip
          tooltipFormatter={(v) => `${v} bpm HR`}
        />
      )}
      {hrvData.length > 0 && (
        <SparklineArea
          data={hrvData}
          color="var(--color-primary)"
          height={40}
          id="dash-hrv"
          yDomain={[30, 140]}
          showTooltip
          tooltipFormatter={(v) => `${v} ms HRV`}
        />
      )}
    </Column></Surface>
  );
}
