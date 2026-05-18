import {
  ResponsiveContainer,
  BarChart, Bar,
  XAxis, YAxis, Tooltip, Cell,
} from 'recharts';

import { ScoreRing, fmtMin, TOOLTIP_STYLE, TICK } from '../shared/Charts';
import type { SleepSession } from '@features/readiness';

type WidgetSize = '1x1' | '2x1' | '2x2';

/*
  Correct order:
  0 = Awake
  1 = Light
  2 = Deep
  3 = REM
*/
const STAGE_LABELS = ['Awake', 'Light', 'Deep', 'REM'] as const;

const STAGE_PILLS = ['deep', 'light', 'rem', 'awake'] as const;
const STAGE_KEYS  = ['deep', 'light', 'rem', 'awake'] as const;

const STAGE_COLORS = [
  'var(--color-sleep-awake)', // 0
  'var(--color-sleep-light)', // 1
  'var(--color-sleep-deep)',  // 2
  'var(--color-sleep-rem)',   // 3
] as const;

/* ── Sleep bar builder ──────────────────────────────────────────────────────── */

function buildSleepBar(session: SleepSession): Array<{ t: string; stage: number }> {
  const totalMin = Object.values(session.stages).reduce((a, b) => a + b, 0);
  const slots    = Math.ceil(totalMin / 15);

  /*
    Stage mapping:
    0 = Awake
    1 = Light
    2 = Deep
    3 = REM
  */

  // realistic sleep cycle
  const BASE = [
    1, 2, 2, 2, 1,
    1, 3, 3, 1, 2,
    2, 1, 1, 3, 3,
    1, 3, 3, 1, 0,
    1, 3, 1, 0, 0, 1,
  ];

  const budget: Record<number, number> = {
    0: Math.max(1, Math.round(session.stages.awake / 15)),
    1: Math.max(1, Math.round(session.stages.light  / 15)),
    2: Math.max(1, Math.round(session.stages.deep   / 15)),
    3: Math.max(1, Math.round(session.stages.rem    / 15)),
  };

  const result: Array<{ t: string; stage: number }> = [];

  for (let i = 0; i < slots; i++) {
    const idx   = Math.round((i / Math.max(slots - 1, 1)) * (BASE.length - 1));
    let   stage = BASE[idx];

    if ((budget[stage] ?? 0) <= 0) {
      stage = [1, 2, 3, 0].find(s => (budget[s] ?? 0) > 0) ?? 1;
    }

    budget[stage] = Math.max(0, (budget[stage] ?? 0) - 1);

    const ms = session.start.getTime() + i * 15 * 60_000;
    const d  = new Date(ms);

    result.push({
      t: `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`,
      stage,
    });
  }

  return result;
}

/* ── Score helpers ──────────────────────────────────────────────────────────── */

function scoreColor(score: number): string {
  if (score >= 80) return 'var(--ok)';
  if (score >= 60) return 'var(--warn)';
  return 'var(--bad)';
}

function scoreBadge(score: number) {
  if (score >= 80) return { label: 'Good', cls: 'green' };
  if (score >= 60) return { label: 'OK', cls: 'amber' };
  return { label: 'Poor', cls: '' };
}

/* ── Component ──────────────────────────────────────────────────────────────── */

export function SleepReviewWidget({
  size,
  session,
}: {
  size: WidgetSize;
  session: SleepSession;
}) {
  const totalMin = Math.floor(
    (session.end.getTime() - session.start.getTime()) / 60_000
  );

  const duration = `${Math.floor(totalMin / 60)}h ${totalMin % 60}m`;

  const badge = scoreBadge(session.score);
  const color = scoreColor(session.score);

  /* 1x1 ───────────────────────────────────────────────────────────────────── */

  if (size === '1x1') {
    return (
      <div className="surface tight column center align-center h-full">
        <span className="eyebrow">Sleep</span>
        <h2 className="mono">{session.score}</h2>
        <span className="caption faint">{duration}</span>
        <span className={`badge ${badge.cls}`}>{badge.label}</span>
      </div>
    );
  }

  /* Shared stage rows ─────────────────────────────────────────────────────── */

  const stageRows = STAGE_KEYS.map((key, i) => (
    <div key={key} className="row align-center compact space-between">
      <span className={`pill ${STAGE_PILLS[i]}`}>
        {['Deep', 'Light', 'REM', 'Awake'][i]}
      </span>

      <span className="grow" />

      <span className="mono caption">
        {fmtMin(session.stages[key])}
      </span>

      <div>
        <ResponsiveContainer width="100%">
          <BarChart
            data={[{ v: session.stages[key] }]}
            layout="vertical"
            barCategoryGap={0}
          >
            <XAxis type="number" domain={[0, totalMin]} hide />
            <YAxis type="category" dataKey="name" hide />

            <Bar
              dataKey="v"
              fill={
                i === 0
                  ? 'var(--color-sleep-deep)'
                  : i === 1
                  ? 'var(--color-sleep-light)'
                  : i === 2
                  ? 'var(--color-sleep-rem)'
                  : 'var(--color-sleep-awake)'
              }
              background={{ fill: 'var(--surface-3)' }}
              radius={3}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  ));

  /* 2x1 ───────────────────────────────────────────────────────────────────── */

  if (size === '2x1') {
    return (
      <div className="surface tight column h-full">
        <div className="row space-between align-center">
          <span className="eyebrow">Sleep</span>
          <span className={`badge ${badge.cls}`}>{badge.label}</span>
        </div>

        <div className="row align-center">
          <h2 className="mono">{session.score}</h2>
          <span className="caption faint grow">
            &nbsp;· {duration}
          </span>
        </div>

        {stageRows}
      </div>
    );
  }

  /* 2x2 ───────────────────────────────────────────────────────────────────── */

  const sleepBar      = buildSleepBar(session);
  const labelInterval = Math.max(1, Math.floor(sleepBar.length / 6));

  return (
    <div className="surface tight column h-full">
      <div className="row space-between align-center">
        <span className="eyebrow">Sleep Review</span>
        <span className={`badge ${badge.cls}`}>{badge.label}</span>
      </div>

      <div className="row align-center space-between">
        <ScoreRing
          score={session.score}
          color={color}
          subtitle="score"
          size={100}
        />
<div className="column compact">{stageRows}</div>
        </div>
        
        

      <ResponsiveContainer>
        <BarChart data={sleepBar} barCategoryGap={0}>
          <XAxis
            dataKey="t"
            tick={TICK}
            interval={labelInterval}
            axisLine={false}
            tickLine={false}
            
          />

          <YAxis
            type="number"
            domain={[0, 3]}
            ticks={[0, 1, 2, 3]}
            tickFormatter={(v: number) => STAGE_LABELS[v] ?? ''}
            tick={TICK}
            axisLine={false}
            tickLine={false}
            width={50}
          />

          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(v: unknown) =>
              [STAGE_LABELS[v as number] ?? '', 'Stage'] as [string, string]
            }
          />

          <Bar
            dataKey="stage"
            radius={[2, 2, 0, 0]}
            isAnimationActive={false}
          >
            {sleepBar.map((entry, index) => (
              <Cell
                key={index}
                fill={STAGE_COLORS[entry.stage]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}