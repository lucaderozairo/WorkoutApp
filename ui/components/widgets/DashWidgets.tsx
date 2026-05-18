import {
  ResponsiveContainer,
  RadialBarChart, RadialBar,
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip,
} from 'recharts';
import { TOOLTIP_STYLE, TICK } from '../shared/Charts';

type WidgetSize = '1x1' | '2x1' | '2x2';

/* ── Mock data ──────────────────────────────────────────────────────────────── */

const MOCK = {
  readiness: { score: 76, sleep: 8, energy: 7, soreness: 3, mood: 8 },
  sleepHistory: [
    { date: 'Mon', deepMin:  88, lightMin: 200, remMin: 102 },
    { date: 'Tue', deepMin:  72, lightMin: 190, remMin:  90 },
    { date: 'Wed', deepMin: 105, lightMin: 210, remMin: 110 },
    { date: 'Thu', deepMin:  65, lightMin: 180, remMin:  85 },
    { date: 'Fri', deepMin:  98, lightMin: 205, remMin: 108 },
    { date: 'Sat', deepMin: 120, lightMin: 235, remMin: 120 },
    { date: 'Sun', deepMin:  90, lightMin: 195, remMin: 100 },
  ],
  healthMetrics: [
    { date: 'Mon', hrv: 58, restingHr: 56, bodyBattery: 65 },
    { date: 'Tue', hrv: 54, restingHr: 58, bodyBattery: 58 },
    { date: 'Wed', hrv: 65, restingHr: 53, bodyBattery: 74 },
    { date: 'Thu', hrv: 49, restingHr: 61, bodyBattery: 52 },
    { date: 'Fri', hrv: 63, restingHr: 54, bodyBattery: 70 },
    { date: 'Sat', hrv: 71, restingHr: 51, bodyBattery: 82 },
    { date: 'Sun', hrv: 62, restingHr: 54, bodyBattery: 71 },
  ],
  activityFeed: [
    { type: 'lift',  date: 'Today', title: 'Upper A',        metric: '75 min · 18 sets 🏆' },
    { type: 'run',   date: 'May 8', title: 'Morning Run',    metric: '5.2 km · 26:14'      },
    { type: 'lift',  date: 'May 7', title: 'Lower B',        metric: '60 min · 14 sets'    },
    { type: 'cycle', date: 'May 5', title: 'Endurance Ride', metric: '42 km · 1:38'        },
    { type: 'lift',  date: 'May 4', title: 'Upper B',        metric: '68 min · 16 sets'    },
  ],
  activeGoals: [
    { name: 'Squat 140 kg',   target: 140, current: 120, unit: 'kg'   },
    { name: 'Run 100 km/mo',  target: 100, current:  84, unit: 'km'   },
    { name: '30-day streak',  target:  30, current:  22, unit: 'days' },
    { name: '10% body fat',   target:  10, current:  13, unit: '%', inverted: true },
  ],
  habitsToday: [
    { name: 'Morning mobility', streak: 12, done: true  },
    { name: 'Cold shower',      streak:  5, done: true  },
    { name: 'Protein goal',     streak:  3, done: false },
    { name: '8h sleep',         streak:  8, done: true  },
    { name: 'No alcohol',       streak: 21, done: true  },
  ],
  nutrition: { kcal: 1940, target: 2400, protein: 148, carbs: 210, fat: 62 },
  insights: [
    { severity: 'ok',   message: 'New squat estimated 1RM — 122.5 kg 🏆' },
    { severity: 'warn', message: 'Training load 18% above 4-week average' },
    { severity: 'info', message: 'No cardio logged in 9 days' },
  ],
  planAdherence: { adherenceRate: 0.83, currentStreak: 6 },
  monthlyProgression: [
    { month: 'Dec', kmRun:  28, kmCycle:  30 },
    { month: 'Jan', kmRun:  35, kmCycle:  52 },
    { month: 'Feb', kmRun:  42, kmCycle:  68 },
    { month: 'Mar', kmRun:  38, kmCycle:  85 },
    { month: 'Apr', kmRun:  55, kmCycle: 120 },
    { month: 'May', kmRun:  84, kmCycle: 210 },
  ],
  weeklyVolume: [
    { day: 'Mon', volume: 4200 },
    { day: 'Tue', volume:    0 },
    { day: 'Wed', volume: 5800 },
    { day: 'Thu', volume: 3100 },
    { day: 'Fri', volume: 6200 },
    { day: 'Sat', volume: 1800 },
    { day: 'Sun', volume:    0 },
  ],
};

/* ── Primitives ─────────────────────────────────────────────────────────────── */

function MiniBar({ value, max, color = 'var(--accent)' }: { value: number; max: number; color?: string }) {
  return (
    <ResponsiveContainer width="100%" height={8}>
      <BarChart
        data={[{ v: value }]}
        layout="vertical"
        barCategoryGap={0}
        margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
      >
        <XAxis type="number" domain={[0, max]} hide />
        <YAxis type="category" dataKey="name" hide />
        <Bar dataKey="v" fill={color} background={{ fill: 'var(--surface-3)' }} radius={3} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function MiniRing({ value, color, size = 80 }: { value: number; color: string; size?: number }) {
  return (
    <RadialBarChart
      width={size} height={size}
      innerRadius="60%" outerRadius="90%"
      data={[{ value, fill: color }]}
      startAngle={90} endAngle={-270}
    >
      <RadialBar dataKey="value" background={{ fill: 'var(--surface-3)' }} cornerRadius={3} />
    </RadialBarChart>
  );
}

function scoreBadge(score: number) {
  if (score >= 80) return { label: 'Good', cls: 'green' };
  if (score >= 60) return { label: 'OK',   cls: 'amber' };
  return             { label: 'Low',  cls: '' };
}

/* ── Readiness ──────────────────────────────────────────────────────────────── */

export function ReadinessWidget({ size }: { size: WidgetSize }) {
  const { score, sleep, energy, soreness, mood } = MOCK.readiness;
  const badge     = scoreBadge(score);
  const ringColor = score >= 75 ? 'var(--ok)' : score >= 50 ? 'var(--warn)' : 'var(--bad)';
  const ringSize  = size === '2x2' ? 96 : 72;

  if (size === '1x1') return (
    <div className="surface tight column center align-center h-full">
      <span className="eyebrow">Readiness</span>
      <MiniRing value={score} color={ringColor} size={72} />
    </div>
  );

  const factors = [
    { label: 'Sleep',    val: sleep,         max: 10 },
    { label: 'Energy',   val: energy,        max: 10 },
    { label: 'Mood',     val: mood,          max: 10 },
    { label: 'Recovery', val: 10 - soreness, max: 10 },
  ];

  return (
    <div className="surface tight column h-full">
      <div className="row space-between align-center">
        <span className="eyebrow">Readiness</span>
        <span className={`badge ${badge.cls}`}>{badge.label}</span>
      </div>
      <div className="row align-center">
        <MiniRing value={score} color={ringColor} size={ringSize} />
        <div className="column compact grow">
          <h3 className="mono">{score}</h3>
          <span className="caption faint">out of 100</span>
        </div>
      </div>
      {size === '2x2' && (
        <div className="column compact">
          {factors.map(({ label, val, max }) => (
            <div key={label} className="column compact">
              <div className="row space-between align-center">
                <span className="caption">{label}</span>
                <span className="mono caption">{val}/{max}</span>
              </div>
              <MiniBar value={val} max={max} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Sleep Breakdown ────────────────────────────────────────────────────────── */

export function SleepBreakdownWidget({ size }: { size: WidgetSize }) {
  return (
    <div className="surface tight column h-full">
      <span className="eyebrow">Sleep Stages</span>
      <div className="grow">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={MOCK.sleepHistory} barSize={10} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
            <XAxis dataKey="date" tick={TICK} axisLine={false} tickLine={false} />
            {size === '2x2' && <YAxis tick={TICK} axisLine={false} tickLine={false} />}
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Bar dataKey="deepMin"  stackId="s" fill="var(--color-sleep-deep)"  name="Deep"  />
            <Bar dataKey="lightMin" stackId="s" fill="var(--color-sleep-light)" name="Light" />
            <Bar dataKey="remMin"   stackId="s" fill="var(--color-sleep-rem)"   name="REM"   radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ── HRV Trend ──────────────────────────────────────────────────────────────── */

export function HRVWidget({ size }: { size: WidgetSize }) {
  return (
    <div className="surface tight column h-full">
      <span className="eyebrow">HRV Trend</span>
      <div className="grow">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={MOCK.healthMetrics} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
            <XAxis dataKey="date" tick={TICK} axisLine={false} tickLine={false} />
            {size === '2x2' && <YAxis tick={TICK} axisLine={false} tickLine={false} />}
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`${v} ms`, 'HRV'] as [string, string]} />
            <Line dataKey="hrv" stroke="var(--color-sleep-light)" strokeWidth={2} dot={{ r: 3, fill: 'var(--color-sleep-light)' }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ── Resting HR ─────────────────────────────────────────────────────────────── */

export function RestingHRWidget({ size }: { size: WidgetSize }) {
  const current = MOCK.healthMetrics[6].restingHr;
  return (
    <div className="surface tight column h-full">
      <span className="eyebrow">Resting HR</span>
      <div className="row align-center">
        <h3 className="mono">{current}</h3>
        <span className="caption faint">&nbsp;bpm</span>
      </div>
      {size === '2x1' && (
        <div className="grow">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={MOCK.healthMetrics} margin={{ top: 4, right: 4, left: -40, bottom: 0 }}>
              <XAxis dataKey="date" tick={TICK} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`${v} bpm`, 'HR'] as [string, string]} />
              <Line dataKey="restingHr" stroke="var(--c-cardio)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

/* ── Body Battery ───────────────────────────────────────────────────────────── */

export function BodyBatteryWidget({ size: _ }: { size: WidgetSize }) {
  const val   = MOCK.healthMetrics[6].bodyBattery;
  const color = val >= 70 ? 'var(--ok)' : val >= 40 ? 'var(--warn)' : 'var(--bad)';
  const badge = scoreBadge(val);
  const track = [
    { value: val,       fill: color },
    { value: 100 - val, fill: 'var(--surface-3)' },
  ];
  return (
    <div className="surface tight column center align-center h-full">
      <span className="eyebrow">Body Battery</span>
      <PieChart width={100} height={56}>
        <Pie
          data={track}
          cx="50%" cy="100%"
          startAngle={180} endAngle={0}
          innerRadius={28} outerRadius={48}
          dataKey="value"
          strokeWidth={0}
          isAnimationActive={false}
        >
          {track.map((d, i) => <Cell key={i} fill={d.fill} />)}
        </Pie>
      </PieChart>
      <h3 className="mono">{val}<span className="caption faint">%</span></h3>
      <span className={`badge ${badge.cls}`}>{badge.label}</span>
    </div>
  );
}

/* ── Plan Adherence ─────────────────────────────────────────────────────────── */

export function PlanAdherenceWidget({ size }: { size: WidgetSize }) {
  const { adherenceRate, currentStreak } = MOCK.planAdherence;
  const pct   = Math.round(adherenceRate * 100);
  const badge = scoreBadge(pct);
  const ringColor = pct >= 80 ? 'var(--ok)' : pct >= 60 ? 'var(--warn)' : 'var(--bad)';

  if (size === '1x1') return (
    <div className="surface tight column center align-center h-full">
      <span className="eyebrow">Adherence</span>
      <MiniRing value={pct} color={ringColor} size={72} />
    </div>
  );

  return (
    <div className="surface tight column h-full">
      <div className="row space-between align-center">
        <span className="eyebrow">Plan Adherence</span>
        <span className={`badge ${badge.cls}`}>{badge.label}</span>
      </div>
      <div className="row align-center">
        <MiniRing value={pct} color={ringColor} size={80} />
        <div className="column compact grow">
          <h3 className="mono">{pct}<span className="caption faint">%</span></h3>
          <span className="caption faint">adherence</span>
          <span className="mono">{currentStreak} 🔥</span>
          <span className="caption faint">day streak</span>
        </div>
      </div>
    </div>
  );
}

/* ── Weekly Volume ──────────────────────────────────────────────────────────── */

export function WeeklyVolumeWidget({ size }: { size: WidgetSize }) {
  return (
    <div className="surface tight column h-full">
      <span className="eyebrow">Weekly Volume</span>
      <div className="grow">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={MOCK.weeklyVolume} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <XAxis dataKey="day" tick={TICK} axisLine={false} tickLine={false} />
            {size === '2x2' && <YAxis tick={TICK} axisLine={false} tickLine={false} />}
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`${v} kg`, 'Volume'] as [string, string]} />
            <Bar dataKey="volume" fill="var(--c-strength)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ── Activity Feed ──────────────────────────────────────────────────────────── */

export function ActivityFeedWidget({ size }: { size: WidgetSize }) {
  const items = size === '2x2' ? MOCK.activityFeed : MOCK.activityFeed.slice(0, 3);
  return (
    <div className="surface tight column h-full">
      <span className="eyebrow">Recent Sessions</span>
      <div className="column compact grow scroll-y">
        {items.map((item, i) => (
          <div key={i} className="row align-center compact list-divider">
            <span className={`pill ${item.type} plain`}>{item.type}</span>
            <div className="column compact grow">
              <span className="detail truncate">{item.title}</span>
              <span className="caption faint">{item.date}</span>
            </div>
            <span className="mono caption">{item.metric}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Active Goals ───────────────────────────────────────────────────────────── */

export function ActiveGoalsWidget({ size }: { size: WidgetSize }) {
  const goals = size === '2x2' ? MOCK.activeGoals : MOCK.activeGoals.slice(0, 2);
  return (
    <div className="surface tight column h-full">
      <span className="eyebrow">Active Goals</span>
      <div className="column compact grow scroll-y">
        {goals.map((g) => {
          const pct = Math.min(100, 'inverted' in g && g.inverted
            ? Math.round((g.target / g.current) * 100)
            : Math.round((g.current / g.target) * 100));
          const barColor = pct >= 100 ? 'var(--ok)' : pct >= 60 ? 'var(--accent)' : 'var(--warn)';
          return (
            <div key={g.name} className="column compact">
              <div className="row space-between align-center">
                <span className="detail">{g.name}</span>
                <span className="mono caption">{g.current}/{g.target} {g.unit}</span>
              </div>
              <MiniBar value={pct} max={100} color={barColor} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Macros ─────────────────────────────────────────────────────────────────── */

export function MacrosWidget({ size }: { size: WidgetSize }) {
  const { protein, carbs, fat, kcal } = MOCK.nutrition;
  const macroData = [
    { name: 'Protein', value: protein, color: 'var(--accent)' },
    { name: 'Carbs',   value: carbs,   color: 'var(--warn)' },
    { name: 'Fat',     value: fat,     color: 'var(--c-strength)' },
  ];
  const pieSize = size === '2x1' ? 90 : 110;

  return (
    <div className="surface tight column h-full">
      <span className="eyebrow">Macros</span>
      <div className="row align-center">
        <PieChart width={pieSize} height={pieSize}>
          <Pie
            data={macroData}
            dataKey="value"
            innerRadius="60%" outerRadius="88%"
            paddingAngle={2}
            startAngle={90} endAngle={-270}
            strokeWidth={0}
            isAnimationActive={false}
          >
            {macroData.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Pie>
        </PieChart>
        <div className="column compact grow">
          <span className="mono">{kcal}<span className="caption faint"> kcal</span></span>
          {macroData.map(d => (
            <div key={d.name} className="row align-center compact">
              <span className="dot" style={{ background: d.color, flexShrink: 0 }} />
              <span className="caption grow">{d.name}</span>
              <span className="mono caption">{d.value}g</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Calories ───────────────────────────────────────────────────────────────── */

export function CaloriesWidget({ size: _ }: { size: WidgetSize }) {
  const { kcal, target } = MOCK.nutrition;
  const pct = Math.round((kcal / target) * 100);
  return (
    <div className="surface tight column h-full">
      <span className="eyebrow">Calories</span>
      <div className="row align-center">
        <h3 className="mono">{kcal}</h3>
        <span className="caption faint">&nbsp;/ {target}</span>
      </div>
      <MiniBar value={kcal} max={target} color="var(--c-nutrition)" />
      <span className="caption faint">{pct}% of goal</span>
    </div>
  );
}

/* ── Habits ─────────────────────────────────────────────────────────────────── */

export function HabitsWidget({ size }: { size: WidgetSize }) {
  const habits = size === '2x1' ? MOCK.habitsToday : MOCK.habitsToday.slice(0, 3);
  const done   = habits.filter(h => h.done).length;

  if (size === '1x1') {
    return (
      <div className="surface tight column center align-center h-full">
        <span className="eyebrow">Habits</span>
        <h3 className="mono">{done}/{habits.length}</h3>
        <span className="caption faint">done today</span>
      </div>
    );
  }

  return (
    <div className="surface tight column h-full">
      <div className="row space-between align-center">
        <span className="eyebrow">Today's Habits</span>
        <span className="caption faint">{done}/{habits.length}</span>
      </div>
      <div className="column compact grow scroll-y">
        {habits.map((h, i) => (
          <div key={i} className="row align-center compact list-divider-sm">
            <span className={`badge ${h.done ? 'green' : ''}`}>{h.done ? '✓' : '·'}</span>
            <span className="detail grow">{h.name}</span>
            {h.streak > 0 && <span className="mono caption">{h.streak}🔥</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Monthly Distance ───────────────────────────────────────────────────────── */

export function MonthlyDistanceWidget({ size }: { size: WidgetSize }) {
  return (
    <div className="surface tight column h-full">
      <span className="eyebrow">Monthly Distance</span>
      <div className="row">
        <div className="row compact align-center">
          <div className="dot run" />
          <span className="caption">Run</span>
        </div>
        <div className="row compact align-center">
          <div className="dot cycle" />
          <span className="caption">Cycle</span>
        </div>
      </div>
      <div className="grow">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={MOCK.monthlyProgression} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <XAxis dataKey="month" tick={TICK} axisLine={false} tickLine={false} />
            {size === '2x2' && <YAxis tick={TICK} axisLine={false} tickLine={false} />}
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`${v} km`] as [string]} />
            <Line dataKey="kmRun"   stroke="var(--c-cardio)"    strokeWidth={2} dot={{ r: 3, fill: 'var(--c-cardio)' }}    name="Run"   />
            <Line dataKey="kmCycle" stroke="var(--c-nutrition)" strokeWidth={2} dot={{ r: 3, fill: 'var(--c-nutrition)' }} name="Cycle" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ── Insights ───────────────────────────────────────────────────────────────── */

const SEVERITY_BADGE: Record<string, string> = { ok: 'green', warn: 'amber', info: 'blue' };

export function InsightsWidget({ size }: { size: WidgetSize }) {
  const items = size === '2x2' ? MOCK.insights : MOCK.insights.slice(0, 2);
  return (
    <div className="surface tight column h-full">
      <span className="eyebrow">Insights</span>
      <div className="column compact grow scroll-y">
        {items.map((ins, i) => (
          <div key={i} className="row compact alert">
            <span className={`badge ${SEVERITY_BADGE[ins.severity] ?? ''}`}>{ins.severity}</span>
            <span className="detail grow">{ins.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
