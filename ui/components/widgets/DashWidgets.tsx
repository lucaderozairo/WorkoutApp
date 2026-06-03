import {
  ResponsiveContainer,
  RadialBarChart, RadialBar,
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip,
} from 'recharts';
import { Flame } from 'lucide-react';
import { TOOLTIP_STYLE, TICK } from '@ui/patterns/charts/domain-charts';
import { Grid, Row, Column } from '@ui/layout';
import { Surface, Text, Metric } from '@ui/atoms';
import { Badge } from '@ui/molecules';

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
    <Surface pad="sm"><Column justify="center" align="center" className="h-full">
      <Text size="eyebrow">Readiness</Text>
      <MiniRing value={score} color={ringColor} size={72} />
    </Column></Surface>
  );

  const factors = [
    { label: 'Sleep',    val: sleep,         max: 10 },
    { label: 'Energy',   val: energy,        max: 10 },
    { label: 'Mood',     val: mood,          max: 10 },
    { label: 'Recovery', val: 10 - soreness, max: 10 },
  ];

  return (
    <Surface pad="sm"><Column className="h-full">
      <Row justify="between" align="center">
        <Text size="eyebrow">Readiness</Text>
        <Badge className={badge.cls}>{badge.label}</Badge>
      </Row>
      <Row align="center">
        <MiniRing value={score} color={ringColor} size={ringSize} />
        <Column gap={1} className="grow">
          <Text as="h3" mono>{score}</Text>
          <Text size="caption" color="faint">out of 100</Text>
        </Column>
      </Row>
      {size === '2x2' && (
        <Column gap={1}>
          {factors.map(({ label, val, max }) => (
            <Column key={label} gap={1}>
              <Row justify="between" align="center">
                <Text size="caption">{label}</Text>
                <Text size="caption" mono>{val}/{max}</Text>
              </Row>
              <MiniBar value={val} max={max} />
            </Column>
          ))}
        </Column>
      )}
    </Column></Surface>
  );
}

/* ── Sleep Breakdown ────────────────────────────────────────────────────────── */

export function SleepBreakdownWidget({ size }: { size: WidgetSize }) {
  return (
    <Surface pad="sm"><Column className="h-full">
      <Text size="eyebrow">Sleep Stages</Text>
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
    </Column></Surface>
  );
}

/* ── HRV Trend ──────────────────────────────────────────────────────────────── */

export function HRVWidget({ size }: { size: WidgetSize }) {
  return (
    <Surface pad="sm"><Column className="h-full">
      <Text size="eyebrow">HRV Trend</Text>
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
    </Column></Surface>
  );
}

/* ── Resting HR ─────────────────────────────────────────────────────────────── */

export function RestingHRWidget({ size }: { size: WidgetSize }) {
  const current = MOCK.healthMetrics[6].restingHr;
  return (
    <Surface pad="sm"><Column className="h-full">
      <Text size="eyebrow">Resting HR</Text>
      <Row align="center">
        <Text as="h3" mono>{current}</Text>
        <Text size="caption" color="faint">&nbsp;bpm</Text>
      </Row>
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
    </Column></Surface>
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
    <Surface pad="sm"><Column justify="center" align="center" className="h-full">
      <Text size="eyebrow">Body Battery</Text>
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
      <Text as="h3" mono>{val}<Text as="span" size="caption" color="faint">%</Text></Text>
      <Badge className={badge.cls}>{badge.label}</Badge>
    </Column></Surface>
  );
}

/* ── Plan Adherence ─────────────────────────────────────────────────────────── */

export function PlanAdherenceWidget({ size }: { size: WidgetSize }) {
  const { adherenceRate, currentStreak } = MOCK.planAdherence;
  const pct   = Math.round(adherenceRate * 100);
  const badge = scoreBadge(pct);
  const ringColor = pct >= 80 ? 'var(--ok)' : pct >= 60 ? 'var(--warn)' : 'var(--bad)';

  if (size === '1x1') return (
    <Surface pad="sm"><Column justify="center" align="center" className="h-full">
      <Text size="eyebrow">Adherence</Text>
      <MiniRing value={pct} color={ringColor} size={72} />
    </Column></Surface>
  );

  return (
    <Surface pad="sm"><Column className="h-full">
      <Row justify="between" align="center">
        <Text size="eyebrow">Plan Adherence</Text>
        <Badge className={badge.cls}>{badge.label}</Badge>
      </Row>
      <Row align="center">
        <MiniRing value={pct} color={ringColor} size={80} />
        <Column gap={1} className="grow">
          <Text as="h3" mono>{pct}<Text as="span" size="caption" color="faint">%</Text></Text>
          <Text size="caption" color="faint">adherence</Text>
        </Column>
      </Row>
      <Row align="center" gap={1}>
        <Row align="center" gap={1} className="mono caption">{currentStreak} <Flame size={12} /></Row>
        <Text size="caption" color="faint">day streak</Text>
      </Row>
    </Column></Surface>
  );
}

/* ── Weekly Volume ──────────────────────────────────────────────────────────── */

export function WeeklyVolumeWidget({ size }: { size: WidgetSize }) {
  return (
    <Surface pad="sm"><Column className="h-full">
      <Text size="eyebrow">Weekly Volume</Text>
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
    </Column></Surface>
  );
}

/* ── Activity Feed ──────────────────────────────────────────────────────────── */

export function ActivityFeedWidget({ size }: { size: WidgetSize }) {
  const items = size === '2x2' ? MOCK.activityFeed : MOCK.activityFeed.slice(0, 3);
  return (
    <Surface pad="sm"><Column className="h-full">
      <Text size="eyebrow">Recent Sessions</Text>
      <Column gap={1} className="grow scroll-y">
        {items.map((item, i) => (
          <Row key={i} align="center" gap={1} className="list-divider">
            <Badge className={`pill ${item.type} plain`}>{item.type}</Badge>
            <Column gap={1} className="grow">
              <Text size="detail" className="truncate">{item.title}</Text>
              <Text size="caption" color="faint">{item.date}</Text>
            </Column>
            <Text size="caption" mono>{item.metric}</Text>
          </Row>
        ))}
      </Column>
    </Column></Surface>
  );
}

/* ── Active Goals ───────────────────────────────────────────────────────────── */

export function ActiveGoalsWidget({ size }: { size: WidgetSize }) {
  const goals = size === '2x2' ? MOCK.activeGoals : MOCK.activeGoals.slice(0, 2);
  return (
    <Surface pad="sm"><Column className="h-full">
      <Text size="eyebrow">Active Goals</Text>
      <Column gap={1} className="grow scroll-y">
        {goals.map((g) => {
          const pct = Math.min(100, 'inverted' in g && g.inverted
            ? Math.round((g.target / g.current) * 100)
            : Math.round((g.current / g.target) * 100));
          const barColor = pct >= 100 ? 'var(--ok)' : pct >= 60 ? 'var(--accent)' : 'var(--warn)';
          return (
            <Column key={g.name} gap={1}>
              <Row justify="between" align="center">
                <Text size="detail">{g.name}</Text>
                <Text size="caption" mono>{g.current}/{g.target} {g.unit}</Text>
              </Row>
              <MiniBar value={pct} max={100} color={barColor} />
            </Column>
          );
        })}
      </Column>
    </Column></Surface>
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
    <Surface pad="sm"><Column className="h-full">
      <Text size="eyebrow">Macros</Text>
      <Row align="center">
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
        <Column gap={1} className="grow">
          <Text mono>{kcal}<Text as="span" size="caption" color="faint"> kcal</Text></Text>
          {macroData.map(d => (
            <Row key={d.name} align="center" gap={1}>
              <span className="dot shrink-0" style={{ '--dot-color': d.color } as React.CSSProperties} />
              <Text size="caption" className="grow">{d.name}</Text>
              <Text size="caption" mono>{d.value}g</Text>
            </Row>
          ))}
        </Column>
      </Row>
    </Column></Surface>
  );
}

/* ── Calories ───────────────────────────────────────────────────────────────── */

export function CaloriesWidget({ size: _ }: { size: WidgetSize }) {
  const { kcal, target } = MOCK.nutrition;
  const pct = Math.round((kcal / target) * 100);
  return (
    <Surface pad="sm"><Column className="h-full">
      <Text size="eyebrow">Calories</Text>
      <Row align="center">
        <Text as="h3" mono>{kcal}</Text>
        <Text size="caption" color="faint">&nbsp;/ {target}</Text>
      </Row>
      <MiniBar value={kcal} max={target} color="var(--c-nutrition)" />
      <Text size="caption" color="faint">{pct}% of goal</Text>
    </Column></Surface>
  );
}

/* ── Habits ─────────────────────────────────────────────────────────────────── */

export function HabitsWidget({ size }: { size: WidgetSize }) {
  const habits = size === '2x1' ? MOCK.habitsToday : MOCK.habitsToday.slice(0, 3);
  const done   = habits.filter(h => h.done).length;

  if (size === '1x1') {
    return (
      <Surface pad="sm"><Column justify="center" align="center" className="h-full">
        <Text size="eyebrow">Habits</Text>
        <Text as="h3" mono>{done}/{habits.length}</Text>
        <Text size="caption" color="faint">done today</Text>
      </Column></Surface>
    );
  }

  return (
    <Surface pad="sm"><Column className="h-full">
      <Row justify="between" align="center">
        <Text size="eyebrow">Today's Habits</Text>
        <Text size="caption" color="faint">{done}/{habits.length}</Text>
      </Row>
      <Column gap={1} className="grow scroll-y">
        {habits.map((h, i) => (
          <Row key={i} align="center" gap={1} className="list-divider-sm">
            <Badge className={h.done ? 'green' : ''}>{h.done ? '✓' : '·'}</Badge>
            <Text size="detail" className="grow">{h.name}</Text>
            {h.streak > 0 && <Row align="center" gap={1} className="mono caption">{h.streak}<Flame size={11} /></Row>}
          </Row>
        ))}
      </Column>
    </Column></Surface>
  );
}

/* ── Monthly Distance ───────────────────────────────────────────────────────── */

export function MonthlyDistanceWidget({ size }: { size: WidgetSize }) {
  return (
    <Surface pad="sm"><Column className="h-full">
      <Text size="eyebrow">Monthly Distance</Text>
      <Row>
        <Row gap={1} align="center">
          <div className="dot run" />
          <Text size="caption">Run</Text>
        </Row>
        <Row gap={1} align="center">
          <div className="dot cycle" />
          <Text size="caption">Cycle</Text>
        </Row>
      </Row>
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
    </Column></Surface>
  );
}

/* ── Insights ───────────────────────────────────────────────────────────────── */

const SEVERITY_BADGE: Record<string, string> = { ok: 'green', warn: 'amber', info: 'blue' };

export function InsightsWidget({ size }: { size: WidgetSize }) {
  const items = size === '2x2' ? MOCK.insights : MOCK.insights.slice(0, 2);
  return (
    <Surface pad="sm"><Column className="h-full">
      <Text size="eyebrow">Insights</Text>
      <Column gap={1} className="grow scroll-y">
        {items.map((ins, i) => (
          <Row key={i} gap={1} className="alert">
            <Badge className={SEVERITY_BADGE[ins.severity] ?? ''}>{ins.severity}</Badge>
            <Text size="detail" className="grow">{ins.message}</Text>
          </Row>
        ))}
      </Column>
    </Column></Surface>
  );
}
