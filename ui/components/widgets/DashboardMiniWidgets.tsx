import { ScoreRing, SleepStagesBar, SparklineArea, fmtMin } from '@ui/patterns/charts/domain-charts';
import { Grid, Row, Column, Cluster, Spacer } from '@ui/layout';
import { Surface } from '@ui/atoms';
import type { SleepSession } from '@features/readiness';
import type { HealthMetricsView } from '@features/readiness';
import type { Appointment } from '@features/scheduling';

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
        <span className="caption">Sleep</span>
        <span className="caption faint">No data</span>
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
        <span className="caption">Sleep</span>
        <span className="metric lg">{session.score}</span>
      </Column></Surface>
    );
  }

  if (size === '2x1') {
    return (
      <Surface><Column gap={1} className="h-full">
        <Row justify="between" align="center">
          <span className="caption">Sleep</span>
          <span className={`badge ${badge.cls}`}>{badge.label}</span>
        </Row>
        <Row align="center">
          <span className="metric">{session.score}<span className="muted">/ 100</span></span>
          <Spacer />
          <span className="detail">{duration}</span>
        </Row>
        <SleepStagesBar stages={session.stages} height={10} />
      </Column></Surface>
    );
  }

  return (
    <Surface><Column gap={1} className="h-full">
      <Row justify="between" align="center">
        <span className="caption">Sleep</span>
        <span className={`badge ${badge.cls}`}>{badge.label}</span>
      </Row>
      <Row align="center">
        <ScoreRing score={session.score} subtitle="score" size={72} />
        <Column gap={1} className="grow">
          <span className="detail">{duration}</span>
          <span className="caption faint">{debtLabel}</span>
        </Column>
      </Row>
      <SleepStagesBar stages={session.stages} height={10} />
      <Cluster gap={1}>
        <span className="pill deep">Deep {fmtMin(session.stages.deep)}</span>
        <span className="pill light">Light {fmtMin(session.stages.light)}</span>
        <span className="pill rem">REM {fmtMin(session.stages.rem)}</span>
        <span className="pill awake">Awake {fmtMin(session.stages.awake)}</span>
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
        <span className="emoji-sm">⛅</span>
        <span className="metric">18<span className="muted">°C</span></span>
        <span className="caption faint">Kingston</span>
      </Column></Surface>
    );
  }

  if (size === '2x1') {
    return (
      <Surface><Column gap={1} className="h-full">
        <Row justify="between" align="center">
          <span className="caption">Kingston, UK</span>
          <span className="caption faint">15m ago</span>
        </Row>
        <Row align="center">
          <span className="emoji-md">⛅</span>
          <Column gap={1} className="grow">
            <span className="metric sm">18<span className="muted">°</span></span>
            <span className="caption faint">Partly Cloudy · Feels 16°</span>
          </Column>
        </Row>
        <Row justify="between">
          {NEXT_HOURS.map(({ hour, icon, temp, rain }) => (
            <Column key={hour} gap={1} align="center">
              <span className="mono caption">{hour}</span>
              <span>{icon}</span>
              <span className="mono">{temp}°</span>
              <span className="mono caption faint">{rain}%</span>
            </Column>
          ))}
        </Row>
      </Column></Surface>
    );
  }

  return (
    <Surface><Column gap={1} className="h-full">
      <Row justify="between" align="center">
        <span className="caption">Kingston, UK</span>
        <span className="caption faint">15m ago</span>
      </Row>
      <Row justify="between" align="center">
        <Row align="center">
          <span className="emoji-lg">⛅</span>
          <Column gap={1}>
            <span className="metric sm">18<span className="muted">°C</span></span>
            <span className="caption faint">Partly Cloudy</span>
          </Column>
        </Row>
        <Column gap={1} align="end">
          <span className="caption">Feels like 16°</span>
          <span className="caption faint">Humidity 62%</span>
        </Column>
      </Row>
      <Row justify="between">
        {NEXT_HOURS.map(({ hour, icon, temp, rain }) => (
          <Column key={hour} gap={1} align="center">
            <span className="mono caption">{hour}</span>
            <span>{icon}</span>
            <span className="mono">{temp}°</span>
            <span className="mono caption faint">{rain}%</span>
          </Column>
        ))}
      </Row>
      <Grid variant="tiles">
        <Column gap={1}>
          <span className="caption faint">UV</span>
          <span>4</span>
          <span className="badge green">Mod.</span>
        </Column>
        <Column gap={1}>
          <span className="caption faint">Wind</span>
          <span>14</span>
          <span className="badge blue">km/h</span>
        </Column>
        <Column gap={1}>
          <span className="caption faint">Rain</span>
          <span>20%</span>
          <span className="badge amber">Low</span>
        </Column>
        <Column gap={1}>
          <span className="caption faint">Vis.</span>
          <span>12km</span>
          <span className="badge green">Clear</span>
        </Column>
      </Grid>
      <Row justify="between" align="center" gap={1}>
        <span className="caption">Run conditions — mild temp, low wind</span>
        <span className="badge green">Go</span>
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
        <span className="metric lg">{today}</span>
        <span className="caption faint">{monthName}</span>
        {appointments.length > 0 && (
          <span className={`badge ${appointments.length > 0 ? 'blue' : ''}`}>{appointments.length} event{appointments.length !== 1 ? 's' : ''}</span>
        )}
      </Column></Surface>
    );
  }

  if (size === '2x1') {
    return (
      <Surface><Column gap={1} className="h-full">
        <Row justify="between" align="center">
          <span className="caption">{now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </Row>
        {appointments.length === 0 ? (
          <span className="caption faint">Nothing scheduled today</span>
        ) : (
          <Column gap={1}>
            {appointments.slice(0, 3).map(a => (
              <Row key={a.id} align="center" gap={1}>
                <div className="dot bg-primary" />
                <span className="caption grow">{a.title}</span>
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
      <span className="caption">{monthName} {year}</span>
      <Grid variant="cal">
        {DAY_HEADERS.map(d => (
          <div key={d} className="caption faint text-center">{d}</div>
        ))}
        {cells.map((day, i) => (
          <div key={i} className={`caption text-center${day === today ? ' badge blue' : ' faint'}`}>
            {day ?? ''}
          </div>
        ))}
      </Grid>
      {appointments.length > 0 && (
        <Column gap={1}>
          {appointments.slice(0, 2).map(a => (
            <Row key={a.id} gap={1} align="center">
              <div className="dot bg-primary" />
              <span className="caption grow">{a.title}</span>
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
        <span className="caption">Readiness</span>
        <span className="metric lg">{score}</span>
        <span className={`badge ${BADGE_CLASS[scoreClass]}`}>{RECOVERY_LABEL[scoreClass]}</span>
      </Column></Surface>
    );
  }

  if (size === '2x1') {
    return (
      <Surface><Column gap={1} className="h-full">
        <Row justify="between" align="center">
          <span className="caption">Readiness · Recovery</span>
          <span className={`badge ${BADGE_CLASS[scoreClass]}`}>{RECOVERY_LABEL[scoreClass]}</span>
        </Row>
        <Row align="center">
          <span className="metric lg grow">{score}</span>
          <p className="detail faint">{RECOVERY_DETAIL[scoreClass]}</p>
        </Row>
      </Column></Surface>
    );
  }

  return (
    <Surface><Column gap={1} className="h-full">
      <Row justify="between" align="center">
        <span className="caption">Readiness · Recovery</span>
        <span className={`badge ${BADGE_CLASS[scoreClass]}`}>{RECOVERY_LABEL[scoreClass]}</span>
      </Row>
      <Row align="center">
        <ScoreRing score={score} color={ringColor} subtitle="score" size={72} />
        <Column gap={1} className="grow">
          <p className="detail">{RECOVERY_DETAIL[scoreClass]}</p>
          <p className="caption faint">{RECOVERY_TIP[scoreClass]}</p>
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
        <span className="caption">Heart</span>
        <Row justify="between" align="center">
          <Column gap={1}>
            <span className="metric">{bpm ?? '—'}<span className="muted">bpm</span></span>
            <span className="caption faint">HR</span>
          </Column>
          <Column gap={1} align="end">
            <span className="metric">{hrv ?? '—'}<span className="muted">ms</span></span>
            <span className="caption faint">HRV</span>
          </Column>
        </Row>
      </Column></Surface>
    );
  }

  if (size === '2x1') {
    return (
      <Surface><Column gap={1} className="h-full">
        <span className="caption">Heart</span>
        <Row justify="between" align="center">
          <Column gap={1}>
            <Column gap={1}>
              <span className="metric">{bpm ?? '—'}<span className="muted">bpm</span></span>
            </Column>
            <span className="caption faint">Resting HR</span>
          </Column>
          <Column gap={1} align="end">
            <Column gap={1}>
              <span className="metric">{hrv ?? '—'}<span className="muted">ms</span></span>
            </Column>
            <span className="caption faint">HRV</span>
          </Column>
        </Row>
      </Column></Surface>
    );
  }

  return (
    <Surface><Column gap={1} className="h-full">
      <span className="caption">Heart</span>
      <Row justify="between" align="center">
        <Column gap={1}>
          <Column gap={1}>
            <span className="metric">{bpm ?? '—'}<span className="muted">bpm</span></span>
          </Column>
          <span className="caption faint">Resting HR</span>
        </Column>
        <Column gap={1} align="end">
          <Column gap={1}>
            <span className="metric">{hrv ?? '—'}<span className="muted">ms</span></span>
          </Column>
          <span className="caption faint">HRV</span>
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
