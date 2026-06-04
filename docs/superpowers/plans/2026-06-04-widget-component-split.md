# Widget Component Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the monolithic `DashWidgets.tsx` into one file per widget, extract shared primitives, and wire the existing `Toast` and `Modal` molecules into `HomeScreen`.

**Architecture:** `widgetPrimitives.tsx` holds `MiniBar`, `MiniRing`, `scoreBadge`, and the shared `WidgetSize` type. Each of the 14 widgets becomes its own focused file importing only what it needs from that module. `HomeScreen` switches from a custom `<dialog>` and inline toast div to `Modal` and `useToast()`. `Toaster` is added to the app root so `useToast()` is available everywhere.

**Tech Stack:** React 19, TypeScript, Recharts, phosphor-react, `@ui/layout`, `@ui/atoms`, `@ui/molecules` (Modal, Toaster/useToast), `@ui/patterns/charts/domain-charts` (TOOLTIP_STYLE, TICK).

---

## File Map

| Action | File |
|---|---|
| **Create** | `ui/components/widgets/widgetPrimitives.tsx` |
| **Create** | `ui/components/widgets/ReadinessWidget.tsx` |
| **Create** | `ui/components/widgets/BodyBatteryWidget.tsx` |
| **Create** | `ui/components/widgets/PlanAdherenceWidget.tsx` |
| **Create** | `ui/components/widgets/ActivityFeedWidget.tsx` |
| **Create** | `ui/components/widgets/InsightsWidget.tsx` |
| **Create** | `ui/components/widgets/HabitsWidget.tsx` |
| **Create** | `ui/components/widgets/ActiveGoalsWidget.tsx` |
| **Create** | `ui/components/widgets/MacrosWidget.tsx` |
| **Create** | `ui/components/widgets/CaloriesWidget.tsx` |
| **Create** | `ui/components/widgets/WeeklyVolumeWidget.tsx` |
| **Create** | `ui/components/widgets/SleepBreakdownWidget.tsx` |
| **Create** | `ui/components/widgets/HRVWidget.tsx` |
| **Create** | `ui/components/widgets/RestingHRWidget.tsx` |
| **Create** | `ui/components/widgets/MonthlyDistanceWidget.tsx` |
| **Delete** | `ui/components/widgets/DashWidgets.tsx` |
| **Modify** | `ui/screens/home/HomeScreen.tsx` |
| **Modify** | `ui/screens/_proto/WidgetPrototypeScreen.tsx` |
| **Modify** | `ui/screens/_proto/useWidgetPrototype.ts` |
| **Modify** | `app/registry/App.tsx` |
| **Modify** | `styling/overlays.css` |

---

## Task 1: widgetPrimitives.tsx

**Files:**
- Create: `ui/components/widgets/widgetPrimitives.tsx`

- [ ] **Create the file**

```tsx
// ui/components/widgets/widgetPrimitives.tsx
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, RadialBarChart, RadialBar } from 'recharts';

export type WidgetSize = '1x1' | '2x1' | '2x2';

export function MiniBar({ value, max, color = 'var(--accent)' }: {
  value: number;
  max: number;
  color?: string;
}) {
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

export function MiniRing({ value, color, size = 80 }: {
  value: number;
  color: string;
  size?: number;
}) {
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

export function scoreBadge(score: number): { label: string; cls: string } {
  if (score >= 80) return { label: 'Good', cls: 'green' };
  if (score >= 60) return { label: 'OK',   cls: 'amber' };
  return             { label: 'Low',  cls: '' };
}
```

- [ ] **Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Commit**

```bash
git add ui/components/widgets/widgetPrimitives.tsx
git commit -m "feat(widgets): extract shared widget primitives (MiniBar, MiniRing, scoreBadge, WidgetSize)"
```

---

## Task 2: Gauge widgets (ReadinessWidget, BodyBatteryWidget, PlanAdherenceWidget)

These three all use `MiniRing` and `scoreBadge` from `widgetPrimitives`.

**Files:**
- Create: `ui/components/widgets/ReadinessWidget.tsx`
- Create: `ui/components/widgets/BodyBatteryWidget.tsx`
- Create: `ui/components/widgets/PlanAdherenceWidget.tsx`

- [ ] **Create ReadinessWidget.tsx**

```tsx
// ui/components/widgets/ReadinessWidget.tsx
import { Row, Column } from '@ui/layout';
import { Surface, Text } from '@ui/atoms';
import { Badge } from '@ui/molecules';
import { MiniBar, MiniRing, scoreBadge, type WidgetSize } from './widgetPrimitives';

const MOCK = { score: 76, sleep: 8, energy: 7, soreness: 3, mood: 8 };

export function ReadinessWidget({ size }: { size: WidgetSize }) {
  const { score, sleep, energy, soreness, mood } = MOCK;
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
```

- [ ] **Create BodyBatteryWidget.tsx**

```tsx
// ui/components/widgets/BodyBatteryWidget.tsx
import { PieChart, Pie, Cell } from 'recharts';
import { Column } from '@ui/layout';
import { Surface, Text } from '@ui/atoms';
import { Badge } from '@ui/molecules';
import { MiniRing, scoreBadge, type WidgetSize } from './widgetPrimitives';

const MOCK_VALUE = 71;

export function BodyBatteryWidget({ size: _ }: { size: WidgetSize }) {
  const val   = MOCK_VALUE;
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
```

- [ ] **Create PlanAdherenceWidget.tsx**

```tsx
// ui/components/widgets/PlanAdherenceWidget.tsx
import { Flame } from 'phosphor-react';
import { Row, Column } from '@ui/layout';
import { Surface, Text } from '@ui/atoms';
import { Badge } from '@ui/molecules';
import { MiniRing, scoreBadge, type WidgetSize } from './widgetPrimitives';

const MOCK = { adherenceRate: 0.83, currentStreak: 6 };

export function PlanAdherenceWidget({ size }: { size: WidgetSize }) {
  const { adherenceRate, currentStreak } = MOCK;
  const pct       = Math.round(adherenceRate * 100);
  const badge     = scoreBadge(pct);
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
```

- [ ] **Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Commit**

```bash
git add ui/components/widgets/ReadinessWidget.tsx ui/components/widgets/BodyBatteryWidget.tsx ui/components/widgets/PlanAdherenceWidget.tsx
git commit -m "feat(widgets): split ReadinessWidget, BodyBatteryWidget, PlanAdherenceWidget"
```

---

## Task 3: List/feed widgets (ActivityFeedWidget, InsightsWidget, HabitsWidget)

**Files:**
- Create: `ui/components/widgets/ActivityFeedWidget.tsx`
- Create: `ui/components/widgets/InsightsWidget.tsx`
- Create: `ui/components/widgets/HabitsWidget.tsx`

- [ ] **Create ActivityFeedWidget.tsx**

```tsx
// ui/components/widgets/ActivityFeedWidget.tsx
import { Row, Column } from '@ui/layout';
import { Surface, Text } from '@ui/atoms';
import { Badge } from '@ui/molecules';
import type { WidgetSize } from './widgetPrimitives';

const MOCK_FEED = [
  { type: 'lift',  date: 'Today', title: 'Upper A',        metric: '75 min · 18 sets' },
  { type: 'run',   date: 'May 8', title: 'Morning Run',    metric: '5.2 km · 26:14'   },
  { type: 'lift',  date: 'May 7', title: 'Lower B',        metric: '60 min · 14 sets'  },
  { type: 'cycle', date: 'May 5', title: 'Endurance Ride', metric: '42 km · 1:38'      },
  { type: 'lift',  date: 'May 4', title: 'Upper B',        metric: '68 min · 16 sets'  },
];

export function ActivityFeedWidget({ size }: { size: WidgetSize }) {
  const items = size === '2x2' ? MOCK_FEED : MOCK_FEED.slice(0, 3);
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
```

- [ ] **Create InsightsWidget.tsx**

```tsx
// ui/components/widgets/InsightsWidget.tsx
import { Row, Column } from '@ui/layout';
import { Surface, Text } from '@ui/atoms';
import { Badge } from '@ui/molecules';
import type { WidgetSize } from './widgetPrimitives';

const MOCK_INSIGHTS = [
  { severity: 'ok',   message: 'New squat estimated 1RM — 122.5 kg' },
  { severity: 'warn', message: 'Training load 18% above 4-week average' },
  { severity: 'info', message: 'No cardio logged in 9 days' },
];

const SEVERITY_BADGE: Record<string, string> = { ok: 'green', warn: 'amber', info: 'blue' };

export function InsightsWidget({ size }: { size: WidgetSize }) {
  const items = size === '2x2' ? MOCK_INSIGHTS : MOCK_INSIGHTS.slice(0, 2);
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
```

- [ ] **Create HabitsWidget.tsx**

```tsx
// ui/components/widgets/HabitsWidget.tsx
import { Flame } from 'phosphor-react';
import { Row, Column } from '@ui/layout';
import { Surface, Text } from '@ui/atoms';
import { Badge } from '@ui/molecules';
import type { WidgetSize } from './widgetPrimitives';

const MOCK_HABITS = [
  { name: 'Morning mobility', streak: 12, done: true  },
  { name: 'Cold shower',      streak:  5, done: true  },
  { name: 'Protein goal',     streak:  3, done: false },
  { name: '8h sleep',         streak:  8, done: true  },
  { name: 'No alcohol',       streak: 21, done: true  },
];

export function HabitsWidget({ size }: { size: WidgetSize }) {
  const habits = size === '2x1' ? MOCK_HABITS : MOCK_HABITS.slice(0, 3);
  const done   = habits.filter(h => h.done).length;

  if (size === '1x1') return (
    <Surface pad="sm"><Column justify="center" align="center" className="h-full">
      <Text size="eyebrow">Habits</Text>
      <Text as="h3" mono>{done}/{habits.length}</Text>
      <Text size="caption" color="faint">done today</Text>
    </Column></Surface>
  );

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
```

- [ ] **Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Commit**

```bash
git add ui/components/widgets/ActivityFeedWidget.tsx ui/components/widgets/InsightsWidget.tsx ui/components/widgets/HabitsWidget.tsx
git commit -m "feat(widgets): split ActivityFeedWidget, InsightsWidget, HabitsWidget"
```

---

## Task 4: Goal and nutrition widgets (ActiveGoalsWidget, MacrosWidget, CaloriesWidget)

**Files:**
- Create: `ui/components/widgets/ActiveGoalsWidget.tsx`
- Create: `ui/components/widgets/MacrosWidget.tsx`
- Create: `ui/components/widgets/CaloriesWidget.tsx`

- [ ] **Create ActiveGoalsWidget.tsx**

```tsx
// ui/components/widgets/ActiveGoalsWidget.tsx
import { Row, Column } from '@ui/layout';
import { Surface, Text } from '@ui/atoms';
import { MiniBar, type WidgetSize } from './widgetPrimitives';

const MOCK_GOALS = [
  { name: 'Squat 140 kg',  target: 140, current: 120, unit: 'kg'  },
  { name: 'Run 100 km/mo', target: 100, current:  84, unit: 'km'  },
  { name: '30-day streak', target:  30, current:  22, unit: 'days'},
  { name: '10% body fat',  target:  10, current:  13, unit: '%', inverted: true },
];

export function ActiveGoalsWidget({ size }: { size: WidgetSize }) {
  const goals = size === '2x2' ? MOCK_GOALS : MOCK_GOALS.slice(0, 2);
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
```

- [ ] **Create MacrosWidget.tsx**

```tsx
// ui/components/widgets/MacrosWidget.tsx
import { PieChart, Pie, Cell } from 'recharts';
import { Row, Column } from '@ui/layout';
import { Surface, Text } from '@ui/atoms';
import type { WidgetSize } from './widgetPrimitives';

const MOCK_NUTRITION = { kcal: 1940, target: 2400, protein: 148, carbs: 210, fat: 62 };

export function MacrosWidget({ size }: { size: WidgetSize }) {
  const { protein, carbs, fat, kcal } = MOCK_NUTRITION;
  const macroData = [
    { name: 'Protein', value: protein, color: 'var(--accent)' },
    { name: 'Carbs',   value: carbs,   color: 'var(--warn)'   },
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
              <span
                className="dot shrink-0"
                style={{ '--dot-color': d.color } as React.CSSProperties}
              />
              <Text size="caption" className="grow">{d.name}</Text>
              <Text size="caption" mono>{d.value}g</Text>
            </Row>
          ))}
        </Column>
      </Row>
    </Column></Surface>
  );
}
```

- [ ] **Create CaloriesWidget.tsx**

```tsx
// ui/components/widgets/CaloriesWidget.tsx
import { Column } from '@ui/layout';
import { Surface, Text } from '@ui/atoms';
import { MiniBar, type WidgetSize } from './widgetPrimitives';

const MOCK_NUTRITION = { kcal: 1940, target: 2400 };

export function CaloriesWidget({ size: _ }: { size: WidgetSize }) {
  const { kcal, target } = MOCK_NUTRITION;
  const pct = Math.round((kcal / target) * 100);
  return (
    <Surface pad="sm"><Column className="h-full">
      <Text size="eyebrow">Calories</Text>
      <Text as="h3" mono>{kcal}<Text as="span" size="caption" color="faint"> / {target}</Text></Text>
      <MiniBar value={kcal} max={target} color="var(--c-nutrition)" />
      <Text size="caption" color="faint">{pct}% of goal</Text>
    </Column></Surface>
  );
}
```

- [ ] **Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Commit**

```bash
git add ui/components/widgets/ActiveGoalsWidget.tsx ui/components/widgets/MacrosWidget.tsx ui/components/widgets/CaloriesWidget.tsx
git commit -m "feat(widgets): split ActiveGoalsWidget, MacrosWidget, CaloriesWidget"
```

---

## Task 5: Health chart widgets (WeeklyVolumeWidget, SleepBreakdownWidget, HRVWidget, RestingHRWidget)

These four share chart boilerplate — `TOOLTIP_STYLE` and `TICK` from `@ui/patterns/charts/domain-charts`.

**Files:**
- Create: `ui/components/widgets/WeeklyVolumeWidget.tsx`
- Create: `ui/components/widgets/SleepBreakdownWidget.tsx`
- Create: `ui/components/widgets/HRVWidget.tsx`
- Create: `ui/components/widgets/RestingHRWidget.tsx`

- [ ] **Create WeeklyVolumeWidget.tsx**

```tsx
// ui/components/widgets/WeeklyVolumeWidget.tsx
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { TOOLTIP_STYLE, TICK } from '@ui/patterns/charts/domain-charts';
import { Column } from '@ui/layout';
import { Surface, Text } from '@ui/atoms';
import type { WidgetSize } from './widgetPrimitives';

const MOCK_VOLUME = [
  { day: 'Mon', volume: 4200 },
  { day: 'Tue', volume:    0 },
  { day: 'Wed', volume: 5800 },
  { day: 'Thu', volume: 3100 },
  { day: 'Fri', volume: 6200 },
  { day: 'Sat', volume: 1800 },
  { day: 'Sun', volume:    0 },
];

export function WeeklyVolumeWidget({ size }: { size: WidgetSize }) {
  return (
    <Surface pad="sm"><Column className="h-full">
      <Text size="eyebrow">Weekly Volume</Text>
      <div className="grow">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={MOCK_VOLUME} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
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
```

- [ ] **Create SleepBreakdownWidget.tsx**

```tsx
// ui/components/widgets/SleepBreakdownWidget.tsx
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { TOOLTIP_STYLE, TICK } from '@ui/patterns/charts/domain-charts';
import { Column } from '@ui/layout';
import { Surface, Text } from '@ui/atoms';
import type { WidgetSize } from './widgetPrimitives';

const MOCK_SLEEP_HISTORY = [
  { date: 'Mon', deepMin:  88, lightMin: 200, remMin: 102 },
  { date: 'Tue', deepMin:  72, lightMin: 190, remMin:  90 },
  { date: 'Wed', deepMin: 105, lightMin: 210, remMin: 110 },
  { date: 'Thu', deepMin:  65, lightMin: 180, remMin:  85 },
  { date: 'Fri', deepMin:  98, lightMin: 205, remMin: 108 },
  { date: 'Sat', deepMin: 120, lightMin: 235, remMin: 120 },
  { date: 'Sun', deepMin:  90, lightMin: 195, remMin: 100 },
];

export function SleepBreakdownWidget({ size }: { size: WidgetSize }) {
  return (
    <Surface pad="sm"><Column className="h-full">
      <Text size="eyebrow">Sleep Stages</Text>
      <div className="grow">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={MOCK_SLEEP_HISTORY} barSize={10} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
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
```

- [ ] **Create HRVWidget.tsx**

```tsx
// ui/components/widgets/HRVWidget.tsx
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { TOOLTIP_STYLE, TICK } from '@ui/patterns/charts/domain-charts';
import { Column } from '@ui/layout';
import { Surface, Text } from '@ui/atoms';
import type { WidgetSize } from './widgetPrimitives';

const MOCK_HEALTH = [
  { date: 'Mon', hrv: 58 },
  { date: 'Tue', hrv: 54 },
  { date: 'Wed', hrv: 65 },
  { date: 'Thu', hrv: 49 },
  { date: 'Fri', hrv: 63 },
  { date: 'Sat', hrv: 71 },
  { date: 'Sun', hrv: 62 },
];

export function HRVWidget({ size }: { size: WidgetSize }) {
  return (
    <Surface pad="sm"><Column className="h-full">
      <Text size="eyebrow">HRV Trend</Text>
      <div className="grow">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={MOCK_HEALTH} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
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
```

- [ ] **Create RestingHRWidget.tsx**

```tsx
// ui/components/widgets/RestingHRWidget.tsx
import { ResponsiveContainer, LineChart, Line, XAxis, Tooltip } from 'recharts';
import { TOOLTIP_STYLE, TICK } from '@ui/patterns/charts/domain-charts';
import { Row, Column } from '@ui/layout';
import { Surface, Text } from '@ui/atoms';
import type { WidgetSize } from './widgetPrimitives';

const MOCK_HEALTH = [
  { date: 'Mon', restingHr: 56 },
  { date: 'Tue', restingHr: 58 },
  { date: 'Wed', restingHr: 53 },
  { date: 'Thu', restingHr: 61 },
  { date: 'Fri', restingHr: 54 },
  { date: 'Sat', restingHr: 51 },
  { date: 'Sun', restingHr: 54 },
];

export function RestingHRWidget({ size }: { size: WidgetSize }) {
  const current = MOCK_HEALTH[6].restingHr;
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
            <LineChart data={MOCK_HEALTH} margin={{ top: 4, right: 4, left: -40, bottom: 0 }}>
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
```

- [ ] **Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Commit**

```bash
git add ui/components/widgets/WeeklyVolumeWidget.tsx ui/components/widgets/SleepBreakdownWidget.tsx ui/components/widgets/HRVWidget.tsx ui/components/widgets/RestingHRWidget.tsx
git commit -m "feat(widgets): split WeeklyVolumeWidget, SleepBreakdownWidget, HRVWidget, RestingHRWidget"
```

---

## Task 6: MonthlyDistanceWidget

**Files:**
- Create: `ui/components/widgets/MonthlyDistanceWidget.tsx`

- [ ] **Create MonthlyDistanceWidget.tsx**

```tsx
// ui/components/widgets/MonthlyDistanceWidget.tsx
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { TOOLTIP_STYLE, TICK } from '@ui/patterns/charts/domain-charts';
import { Row, Column } from '@ui/layout';
import { Surface, Text } from '@ui/atoms';
import type { WidgetSize } from './widgetPrimitives';

const MOCK_PROGRESSION = [
  { month: 'Dec', kmRun:  28, kmCycle:  30 },
  { month: 'Jan', kmRun:  35, kmCycle:  52 },
  { month: 'Feb', kmRun:  42, kmCycle:  68 },
  { month: 'Mar', kmRun:  38, kmCycle:  85 },
  { month: 'Apr', kmRun:  55, kmCycle: 120 },
  { month: 'May', kmRun:  84, kmCycle: 210 },
];

export function MonthlyDistanceWidget({ size }: { size: WidgetSize }) {
  return (
    <Surface pad="sm"><Column className="h-full">
      <Text size="eyebrow">Monthly Distance</Text>
      <Row gap={1} align="center">
        <div className="dot run" />
        <Text size="caption">Run</Text>
        <div className="dot cycle" />
        <Text size="caption">Cycle</Text>
      </Row>
      <div className="grow">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={MOCK_PROGRESSION} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
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
```

- [ ] **Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Commit**

```bash
git add ui/components/widgets/MonthlyDistanceWidget.tsx
git commit -m "feat(widgets): split MonthlyDistanceWidget"
```

---

## Task 7: Update consumers + migrate WidgetSize type

Update the two files that import from `DashWidgets`, move `WidgetSize` ownership to `widgetPrimitives`, then delete `DashWidgets.tsx`.

**Files:**
- Modify: `ui/screens/_proto/useWidgetPrototype.ts`
- Modify: `ui/screens/_proto/WidgetPrototypeScreen.tsx`
- Modify: `ui/screens/home/HomeScreen.tsx`
- Delete: `ui/components/widgets/DashWidgets.tsx`

- [ ] **Update useWidgetPrototype.ts — import WidgetSize from widgetPrimitives**

Open `ui/screens/_proto/useWidgetPrototype.ts`. Find the line that defines or exports `WidgetSize`. Replace:

```ts
export type WidgetSize = '1x1' | '2x1' | '2x2';
```

with:

```ts
export type { WidgetSize } from '@ui/components/widgets/widgetPrimitives';
```

If `WidgetSize` is defined inline in that file (rather than re-exported), replace the definition with the re-export above so all callers get the same type from one source.

- [ ] **Update WidgetPrototypeScreen.tsx — swap DashWidgets import**

Replace the single `DashWidgets` import block in `ui/screens/_proto/WidgetPrototypeScreen.tsx`:

```tsx
// Remove this:
import {
  ReadinessWidget, SleepBreakdownWidget, HRVWidget, RestingHRWidget,
  BodyBatteryWidget, PlanAdherenceWidget, WeeklyVolumeWidget,
  ActivityFeedWidget, ActiveGoalsWidget, MacrosWidget, CaloriesWidget,
  HabitsWidget, MonthlyDistanceWidget, InsightsWidget,
} from '@ui/components/widgets/DashWidgets';

// Replace with:
import { ReadinessWidget }       from '@ui/components/widgets/ReadinessWidget';
import { SleepBreakdownWidget }  from '@ui/components/widgets/SleepBreakdownWidget';
import { HRVWidget }             from '@ui/components/widgets/HRVWidget';
import { RestingHRWidget }       from '@ui/components/widgets/RestingHRWidget';
import { BodyBatteryWidget }     from '@ui/components/widgets/BodyBatteryWidget';
import { PlanAdherenceWidget }   from '@ui/components/widgets/PlanAdherenceWidget';
import { WeeklyVolumeWidget }    from '@ui/components/widgets/WeeklyVolumeWidget';
import { ActivityFeedWidget }    from '@ui/components/widgets/ActivityFeedWidget';
import { ActiveGoalsWidget }     from '@ui/components/widgets/ActiveGoalsWidget';
import { MacrosWidget }          from '@ui/components/widgets/MacrosWidget';
import { CaloriesWidget }        from '@ui/components/widgets/CaloriesWidget';
import { HabitsWidget }          from '@ui/components/widgets/HabitsWidget';
import { MonthlyDistanceWidget } from '@ui/components/widgets/MonthlyDistanceWidget';
import { InsightsWidget }        from '@ui/components/widgets/InsightsWidget';
```

- [ ] **Update HomeScreen.tsx — swap DashWidgets import**

Replace the `DashWidgets` import block in `ui/screens/home/HomeScreen.tsx`:

```tsx
// Remove this:
import {
  ReadinessWidget,
  ActivityFeedWidget,
  ActiveGoalsWidget,
  InsightsWidget,
  WeeklyVolumeWidget,
  SleepBreakdownWidget,
  HRVWidget,
  RestingHRWidget,
  BodyBatteryWidget,
  PlanAdherenceWidget,
  MacrosWidget,
  CaloriesWidget,
  HabitsWidget,
  MonthlyDistanceWidget,
} from "@ui/components/widgets/DashWidgets";

// Replace with:
import { ReadinessWidget }       from "@ui/components/widgets/ReadinessWidget";
import { ActivityFeedWidget }    from "@ui/components/widgets/ActivityFeedWidget";
import { ActiveGoalsWidget }     from "@ui/components/widgets/ActiveGoalsWidget";
import { InsightsWidget }        from "@ui/components/widgets/InsightsWidget";
import { WeeklyVolumeWidget }    from "@ui/components/widgets/WeeklyVolumeWidget";
import { SleepBreakdownWidget }  from "@ui/components/widgets/SleepBreakdownWidget";
import { HRVWidget }             from "@ui/components/widgets/HRVWidget";
import { RestingHRWidget }       from "@ui/components/widgets/RestingHRWidget";
import { BodyBatteryWidget }     from "@ui/components/widgets/BodyBatteryWidget";
import { PlanAdherenceWidget }   from "@ui/components/widgets/PlanAdherenceWidget";
import { MacrosWidget }          from "@ui/components/widgets/MacrosWidget";
import { CaloriesWidget }        from "@ui/components/widgets/CaloriesWidget";
import { HabitsWidget }          from "@ui/components/widgets/HabitsWidget";
import { MonthlyDistanceWidget } from "@ui/components/widgets/MonthlyDistanceWidget";
```

- [ ] **Delete DashWidgets.tsx**

```bash
rm "ui/components/widgets/DashWidgets.tsx"
```

- [ ] **Verify TypeScript — all consumers resolved**

```bash
npx tsc --noEmit
```

Expected: 0 errors. If any error mentions `DashWidgets`, there is an undiscovered consumer — grep for it: `grep -r "DashWidgets" --include="*.tsx" --include="*.ts" .`

- [ ] **Commit**

```bash
git add -A
git commit -m "feat(widgets): delete DashWidgets.tsx, update all consumers to individual imports"
```

---

## Task 8: Add Toaster to App.tsx

`Toaster` is not yet in the app tree. `useToast()` throws if called outside `<Toaster>`.

**Files:**
- Modify: `app/registry/App.tsx`

- [ ] **Add Toaster to App.tsx**

Open `app/registry/App.tsx`. Add the import and wrap the return:

```tsx
// Add to imports:
import { Toaster } from '@ui/molecules';

// Wrap the return JSX:
export function App() {
  const [showSettings, setShowSettings] = useState(false);
  const openSettings = () => setShowSettings(true);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <Toaster>
      <ErrorBoundaryRoot>
        <Grid className="layout web" gap={0}>
          {/* ...existing content unchanged... */}
        </Grid>
      </ErrorBoundaryRoot>
    </Toaster>
  );
}
```

The full inner content of `<ErrorBoundaryRoot>` does not change — only the wrapping `<Toaster>` is added.

- [ ] **Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Commit**

```bash
git add app/registry/App.tsx
git commit -m "feat(app): add Toaster provider to app root"
```

---

## Task 9: Update HomeScreen — useToast + Modal

Replace the custom inline toast div and the native `<dialog>` with the `useToast()` hook and the `Modal` molecule.

**Files:**
- Modify: `ui/screens/home/HomeScreen.tsx`

- [ ] **Replace toast state with useToast()**

In `HomeScreen.tsx`, make these changes to the imports section:

```tsx
// Remove:
import { Trophy, X } from "phosphor-react";

// Add to @ui/molecules import:
import { Button, Modal, useToast } from "@ui/molecules";
```

Remove the `UnlockedToast` interface and the `toast` state:

```tsx
// Remove these lines:
interface UnlockedToast {
  name: string;
  rarity: string;
  description: string;
}
// ...
const [toast, setToast] = useState<UnlockedToast | null>(null);
```

Add `useToast` at the top of the component body:

```tsx
const toast = useToast();
```

Update the `AchievementUnlocked` handler to call the hook instead of setting state:

```tsx
// Remove:
if (def) {
  setToast({ name: def.name, rarity: def.rarity, description: def.description });
}

// Replace with:
if (def) {
  toast.info(`Achievement unlocked: ${def.name}`);
}
```

Remove the toast JSX block entirely:

```tsx
// Remove:
{toast && (
  <div className="toast" role="status" aria-live="polite">
    <Surface>
      <Row align="center">
        <Trophy size={20} weight="fill" aria-hidden="true" />
        <Column gap={1} className="grow">
          <Text size="detail">Achievement unlocked: {toast.name}</Text>
          <Text size="caption" color="faint">{toast.description}</Text>
        </Column>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setToast(null)}
          aria-label="Dismiss"
        >
          <X size={14} />
        </Button>
      </Row>
    </Surface>
  </div>
)}
```

- [ ] **Replace dialog with Modal**

Replace the `editRef` and dialog with `editOpen` state and `Modal`:

```tsx
// Remove:
const editRef = useRef<HTMLDialogElement>(null);

// Add:
const [editOpen, setEditOpen] = useState(false);
```

Update the "Edit widgets" button:

```tsx
// Remove:
onClick={() => editRef.current?.showModal()}

// Replace with:
onClick={() => setEditOpen(true)}
```

Replace the `<dialog>` element with `<Modal>`:

```tsx
// Remove:
<dialog
  ref={editRef}
  className="modal-dialog"
  onClick={(e) => { if (e.target === editRef.current) editRef.current?.close(); }}
>
  <Column>
    <Row justify="between" align="center">
      <Text as="h3">Edit widgets</Text>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editRef.current?.close()}
        aria-label="Close"
      >
        <X size={16} />
      </Button>
    </Row>
    <Column gap={1}>
      {WIDGET_DEFS.map((def) => (
        <Row key={def.id} align="center" justify="between" className="list-divider-sm">
          <Text size="detail">{def.label}</Text>
          <input
            type="checkbox"
            checked={activeWidgets.includes(def.id)}
            onChange={(e) => toggleWidget(def.id, e.target.checked)}
            aria-label={`Show ${def.label}`}
          />
        </Row>
      ))}
    </Column>
  </Column>
</dialog>

// Replace with:
<Modal
  open={editOpen}
  onClose={() => setEditOpen(false)}
  title="Edit widgets"
  size="md"
  footer={<Button variant="ghost" onClick={() => setEditOpen(false)}>Done</Button>}
>
  <Column gap={1}>
    {WIDGET_DEFS.map((def) => (
      <Row key={def.id} align="center" justify="between" className="list-divider-sm">
        <Text size="detail">{def.label}</Text>
        <input
          type="checkbox"
          checked={activeWidgets.includes(def.id)}
          onChange={(e) => toggleWidget(def.id, e.target.checked)}
          aria-label={`Show ${def.label}`}
        />
      </Row>
    ))}
  </Column>
</Modal>
```

Also remove the `useRef` import if it is no longer used anywhere else in the file.

- [ ] **Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Commit**

```bash
git add ui/screens/home/HomeScreen.tsx
git commit -m "feat(home): replace inline toast/dialog with useToast() + Modal molecule"
```

---

## Task 10: CSS cleanup — remove .modal-dialog

**Files:**
- Modify: `styling/overlays.css`

- [ ] **Remove .modal-dialog from overlays.css**

Open `styling/overlays.css`. Find and delete the entire `.modal-dialog` block that was added during the polish pass:

```css
/* Remove this entire block: */
/* ── Native dialog modal — for JS-controlled modals via showModal() ── */
.modal-dialog {
  padding: var(--s-5);
  border-radius: var(--r-md);
  border: 1px solid var(--line);
  background: var(--surface-1);
  color: var(--ink);
  box-shadow: var(--shadow-2);
  max-width: min(90vw, var(--modal-lg));

  &::backdrop {
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);

    @media (prefers-reduced-transparency: reduce) {
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
    }
  }
}
```

- [ ] **Verify no remaining .modal-dialog references**

```bash
grep -r "modal-dialog" --include="*.tsx" --include="*.ts" --include="*.css" .
```

Expected: no output.

- [ ] **Verify TypeScript one final time**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Commit**

```bash
git add styling/overlays.css
git commit -m "chore(css): remove dead .modal-dialog class (Modal molecule uses Popover API)"
```
