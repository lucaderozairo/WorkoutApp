import { ScoreRing, SleepStagesBar, SparklineArea, fmtMin } from '@ui/patterns/charts/domain-charts';
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
      <div className="surface column compact h-full">
        <span className="caption">Sleep</span>
        <span className="caption faint">No data</span>
      </div>
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
      <div className="surface column compact h-full">
        <span className="caption">Sleep</span>
        <span className="metric lg">{session.score}</span>
      </div>
    );
  }

  if (size === '2x1') {
    return (
      <div className="surface column compact h-full">
        <div className="row space-between align-center">
          <span className="caption">Sleep</span>
          <span className={`badge ${badge.cls}`}>{badge.label}</span>
        </div>
        <div className="row align-center">
          <span className="metric">{session.score}<span className="muted">/ 100</span></span>
          <span className="grow" />
          <span className="detail">{duration}</span>
        </div>
        <SleepStagesBar stages={session.stages} height={10} />
      </div>
    );
  }

  return (
    <div className="surface column compact h-full">
      <div className="row space-between align-center">
        <span className="caption">Sleep</span>
        <span className={`badge ${badge.cls}`}>{badge.label}</span>
      </div>
      <div className="row align-center">
        <ScoreRing score={session.score} subtitle="score" size={72} />
        <div className="column compact grow">
          <span className="detail">{duration}</span>
          <span className="caption faint">{debtLabel}</span>
        </div>
      </div>
      <SleepStagesBar stages={session.stages} height={10} />
      <div className="cluster compact">
        <span className="pill deep">Deep {fmtMin(session.stages.deep)}</span>
        <span className="pill light">Light {fmtMin(session.stages.light)}</span>
        <span className="pill rem">REM {fmtMin(session.stages.rem)}</span>
        <span className="pill awake">Awake {fmtMin(session.stages.awake)}</span>
      </div>
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
    </div>
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
      <div className="surface column compact h-full center align-center">
        <span className="emoji-sm">⛅</span>
        <span className="metric">18<span className="muted">°C</span></span>
        <span className="caption faint">Kingston</span>
      </div>
    );
  }

  if (size === '2x1') {
    return (
      <div className="surface column compact h-full">
        <div className="row space-between align-center">
          <span className="caption">Kingston, UK</span>
          <span className="caption faint">15m ago</span>
        </div>
        <div className="row align-center">
          <span className="emoji-md">⛅</span>
          <div className="column compact grow">
            <span className="metric sm">18<span className="muted">°</span></span>
            <span className="caption faint">Partly Cloudy · Feels 16°</span>
          </div>
        </div>
        <div className="row space-between">
          {NEXT_HOURS.map(({ hour, icon, temp, rain }) => (
            <div key={hour} className="column compact align-center">
              <span className="mono caption">{hour}</span>
              <span>{icon}</span>
              <span className="mono">{temp}°</span>
              <span className="mono caption faint">{rain}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="surface column compact h-full">
      <div className="row space-between align-center">
        <span className="caption">Kingston, UK</span>
        <span className="caption faint">15m ago</span>
      </div>
      <div className="row space-between align-center">
        <div className="row align-center">
          <span className="emoji-lg">⛅</span>
          <div className="column compact">
            <span className="metric sm">18<span className="muted">°C</span></span>
            <span className="caption faint">Partly Cloudy</span>
          </div>
        </div>
        <div className="column compact align-right">
          <span className="caption">Feels like 16°</span>
          <span className="caption faint">Humidity 62%</span>
        </div>
      </div>
      <div className="row space-between">
        {NEXT_HOURS.map(({ hour, icon, temp, rain }) => (
          <div key={hour} className="column compact align-center">
            <span className="mono caption">{hour}</span>
            <span>{icon}</span>
            <span className="mono">{temp}°</span>
            <span className="mono caption faint">{rain}%</span>
          </div>
        ))}
      </div>
      <div className="grid">
        <div className="column compact">
          <span className="caption faint">UV</span>
          <span>4</span>
          <span className="badge green">Mod.</span>
        </div>
        <div className="column compact">
          <span className="caption faint">Wind</span>
          <span>14</span>
          <span className="badge blue">km/h</span>
        </div>
        <div className="column compact">
          <span className="caption faint">Rain</span>
          <span>20%</span>
          <span className="badge amber">Low</span>
        </div>
        <div className="column compact">
          <span className="caption faint">Vis.</span>
          <span>12km</span>
          <span className="badge green">Clear</span>
        </div>
      </div>
      <div className="row space-between align-center compact">
        <span className="caption">Run conditions — mild temp, low wind</span>
        <span className="badge green">Go</span>
      </div>
    </div>
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
      <div className="surface column compact h-full center align-center">
        <span className="metric lg">{today}</span>
        <span className="caption faint">{monthName}</span>
        {appointments.length > 0 && (
          <span className={`badge ${appointments.length > 0 ? 'blue' : ''}`}>{appointments.length} event{appointments.length !== 1 ? 's' : ''}</span>
        )}
      </div>
    );
  }

  if (size === '2x1') {
    return (
      <div className="surface column compact h-full">
        <div className="row space-between align-center">
          <span className="caption">{now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </div>
        {appointments.length === 0 ? (
          <span className="caption faint">Nothing scheduled today</span>
        ) : (
          <div className="column compact">
            {appointments.slice(0, 3).map(a => (
              <div key={a.id} className="row align-center compact">
                <div className="dot bg-primary" />
                <span className="caption grow">{a.title}</span>
                <time className="caption faint">
                  {new Date(a.scheduledAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </time>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const cells = monthCells(year, month);

  return (
    <div className="surface column compact h-full">
      <span className="caption">{monthName} {year}</span>
      <div className="cal">
        {DAY_HEADERS.map(d => (
          <div key={d} className="caption faint text-center">{d}</div>
        ))}
        {cells.map((day, i) => (
          <div key={i} className={`caption text-center${day === today ? ' badge blue' : ' faint'}`}>
            {day ?? ''}
          </div>
        ))}
      </div>
      {appointments.length > 0 && (
        <div className="column compact">
          {appointments.slice(0, 2).map(a => (
            <div key={a.id} className="row compact align-center">
              <div className="dot bg-primary" />
              <span className="caption grow">{a.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Readiness + Recovery (combined) ──────────────────────────────────────────

export function ReadinessRecoveryWidget({ size, score, scoreClass }: { size: WidgetSize; score: number; scoreClass: ScoreClass }) {
  const ringColor = scoreClass === 'good' ? 'var(--ok)' : scoreClass === 'warning' ? 'var(--warn)' : 'var(--bad)';

  if (size === '1x1') {
    return (
      <div className="surface column compact h-full">
        <span className="caption">Readiness</span>
        <span className="metric lg">{score}</span>
        <span className={`badge ${BADGE_CLASS[scoreClass]}`}>{RECOVERY_LABEL[scoreClass]}</span>
      </div>
    );
  }

  if (size === '2x1') {
    return (
      <div className="surface column compact h-full">
        <div className="row space-between align-center">
          <span className="caption">Readiness · Recovery</span>
          <span className={`badge ${BADGE_CLASS[scoreClass]}`}>{RECOVERY_LABEL[scoreClass]}</span>
        </div>
        <div className="row align-center">
          <span className="metric lg grow">{score}</span>
          <p className="detail faint">{RECOVERY_DETAIL[scoreClass]}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="surface column compact h-full">
      <div className="row space-between align-center">
        <span className="caption">Readiness · Recovery</span>
        <span className={`badge ${BADGE_CLASS[scoreClass]}`}>{RECOVERY_LABEL[scoreClass]}</span>
      </div>
      <div className="row align-center">
        <ScoreRing score={score} color={ringColor} subtitle="score" size={72} />
        <div className="column compact grow">
          <p className="detail">{RECOVERY_DETAIL[scoreClass]}</p>
          <p className="caption faint">{RECOVERY_TIP[scoreClass]}</p>
        </div>
      </div>
    </div>
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
      <div className="surface column compact h-full">
        <span className="caption">Heart</span>
        <div className="row space-between align-center">
          <div className="column compact">
            <span className="metric">{bpm ?? '—'}<span className="muted">bpm</span></span>
            <span className="caption faint">HR</span>
          </div>
          <div className="column compact align-right">
            <span className="metric">{hrv ?? '—'}<span className="muted">ms</span></span>
            <span className="caption faint">HRV</span>
          </div>
        </div>
      </div>
    );
  }

  if (size === '2x1') {
    return (
      <div className="surface column compact h-full">
        <span className="caption">Heart</span>
        <div className="row space-between align-center">
          <div className="column compact">
            <div className="column compact">
              <span className="metric">{bpm ?? '—'}<span className="muted">bpm</span></span>
            </div>
            <span className="caption faint">Resting HR</span>
          </div>
          <div className="column compact align-right">
            <div className="column compact">
              <span className="metric">{hrv ?? '—'}<span className="muted">ms</span></span>
            </div>
            <span className="caption faint">HRV</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="surface column compact h-full">
      <span className="caption">Heart</span>
      <div className="row space-between align-center">
        <div className="column compact">
          <div className="column compact">
            <span className="metric">{bpm ?? '—'}<span className="muted">bpm</span></span>
          </div>
          <span className="caption faint">Resting HR</span>
        </div>
        <div className="column compact align-right">
          <div className="column compact">
            <span className="metric">{hrv ?? '—'}<span className="muted">ms</span></span>
          </div>
          <span className="caption faint">HRV</span>
        </div>
      </div>
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
    </div>
  );
}
