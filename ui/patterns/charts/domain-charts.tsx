import { useId } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart, Bar,
  AreaChart, Area,
  LineChart, Line,
  PieChart, Pie, Cell, Label,
  XAxis, YAxis, Tooltip,
  ReferenceLine,
} from 'recharts';
import type { WeeklySleepTrend } from '@features/readiness';
import type { DailyLoad } from '@features/progress_analysis';
import type { GpsPoint } from '@data/sources/files/gps';
import { haversineDistanceMeters } from '@data/sources/files/gps';

// ─── Shared chart constants ───────────────────────────────────────────────────

export const CHART_H = {
  xs:  80,   // ElevationProfileChart
  sm: 120,   // PaceOverTimeChart, PositiveNegativeChart
  md: 140,   // HROverTimeChart, BodyweightChart, ExerciseProgressionChart
  lg: 160,   // HRZonesChart, SleepTrendChart
  xl: 180,   // TrainingLoadChart, PeriodComparisonChart
} as const;

export const TICK = { fontSize: 10, fill: 'var(--ink-faint)' } as const;

export const TOOLTIP_STYLE = {
  background: 'var(--surface-1)',
  border: '1px solid var(--line-strong)',
  borderRadius: 'var(--r-sm)',
  fontSize: 12,
} as const;

// ─── Shared utilities ─────────────────────────────────────────────────────────

export function fmtMin(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function fmtPace(minPerKm: number): string {
  const m = Math.floor(minPerKm);
  const s = Math.round((minPerKm - m) * 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

// Format a distance in metres for axis labels
function fmtDist(m: number): string {
  if (m === 0) return '0';
  if (m < 1000) return `${m}m`;
  const km = m / 1000;
  return `${km % 1 === 0 ? km.toFixed(0) : km.toFixed(1)}km`;
}

function distanceTicks(totalMeters: number): number[] {
  const ticks: number[] = [];
  for (let m = 0; m <= totalMeters; m += 500) ticks.push(m);
  return ticks;
}

// ─── ScoreRing ────────────────────────────────────────────────────────────────

type ScoreRingProps = {
  score: number;
  color?: string;
  subtitle?: string;
  size?: number;
};

function RingCenterLabel({
  viewBox,
  score,
  subtitle,
}: {
  viewBox?: { cx: number; cy: number };
  score: number;
  subtitle?: string;
}) {
  if (!viewBox) return null;
  const { cx, cy } = viewBox;
  return (
    <g>
      <text x={cx} y={cy - 4} textAnchor="middle"
        fill="var(--color-text-primary)" fontSize="var(--t-sm)"
        fontFamily="var(--font-mono)" fontWeight="600">
        {score}
      </text>
      {subtitle && (
        <text x={cx} y={cy + 11} textAnchor="middle"
          fill="var(--color-text-secondary)" fontSize="var(--t-xs)" fontFamily="sans-serif">
          {subtitle}
        </text>
      )}
    </g>
  );
}

export function ScoreRing({
  score,
  color = 'var(--color-primary)',
  subtitle = 'score',
  size = 80,
}: ScoreRingProps) {
  const data = [{ value: score }, { value: 100 - score }];
  return (
    <PieChart width={size} height={size}>
      <Pie
        data={data}
        cx="50%" cy="50%"
        innerRadius="65%" outerRadius="85%"
        startAngle={90} endAngle={-270}
        dataKey="value"
        strokeWidth={0}
        isAnimationActive={false}
      >
        <Cell fill={color} />
        <Cell fill="var(--color-background)" />
        <Label
          content={(props: any) =>
            <RingCenterLabel {...props} score={score} subtitle={subtitle} />
          }
        />
      </Pie>
    </PieChart>
  );
}

// ─── SleepStagesBar ───────────────────────────────────────────────────────────

type SleepStages = { deep: number; light: number; rem: number; awake: number };

export function SleepStagesBar({
  stages,
  height = 12,
}: {
  stages: SleepStages;
  height?: number;
}) {
  const { deep, light, rem, awake } = stages;
  const total = deep + light + rem + awake;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        layout="vertical"
        data={[{ deep, light, rem, awake }]}
        margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
      >
        <XAxis type="number" hide domain={[0, total]} />
        <YAxis type="category" hide />
        <Bar dataKey="deep"  stackId="s" fill="var(--color-sleep-deep)"  radius={[3, 0, 0, 3]} isAnimationActive={false} />
        <Bar dataKey="light" stackId="s" fill="var(--color-sleep-light)"                        isAnimationActive={false} />
        <Bar dataKey="rem"   stackId="s" fill="var(--color-sleep-rem)"                          isAnimationActive={false} />
        <Bar dataKey="awake" stackId="s" fill="var(--color-sleep-awake)" radius={[0, 3, 3, 0]} fillOpacity={0.4} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── SparklineArea ────────────────────────────────────────────────────────────

type SparklineAreaProps = {
  data: Array<{ x: string; y: number }>;
  color?: string;
  height?: number;
  id?: string;
  showXAxis?: boolean;
  showYAxis?: boolean;
  showTooltip?: boolean;
  yDomain?: [number | string, number | string];
  tooltipFormatter?: (value: number) => string;
};

export function SparklineArea({
  data,
  color = 'var(--color-primary)',
  height = 60,
  id = 'sparkline',
  showXAxis = false,
  showYAxis = false,
  showTooltip = false,
  yDomain = ['auto', 'auto'],
  tooltipFormatter,
}: SparklineAreaProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const gradId = `sg-${id}-${uid}`;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {showXAxis
          ? <XAxis dataKey="x" tick={{ fontSize: 8, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} />
          : <XAxis dataKey="x" hide />
        }
        {showYAxis
          ? <YAxis domain={yDomain} tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} width={28} />
          : <YAxis hide domain={yDomain} />
        }
        {showTooltip && (
          <Tooltip
            contentStyle={{ fontSize: 12 }}
            formatter={(v: any) => [tooltipFormatter ? tooltipFormatter(Number(v)) : v, '']}
          />
        )}
        <Area
          type="monotone"
          dataKey="y"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#${gradId})`}
          dot={false}
          activeDot={showTooltip ? { r: 4 } : false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── HRZonesChart ─────────────────────────────────────────────────────────────

export function HRZonesChart({ zones }: { zones: Array<{ name: string; minutes: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={CHART_H.lg}>
      <BarChart data={zones} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <XAxis dataKey="name" tick={TICK} axisLine={false} tickLine={false} />
        <YAxis tick={TICK} axisLine={false} tickLine={false} />
        <Tooltip formatter={(v) => [`${v ?? 0}m`, 'Time']} contentStyle={TOOLTIP_STYLE} />
        <Bar dataKey="minutes" fill="var(--color-primary)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── TrainingLoadChart ────────────────────────────────────────────────────────

export function TrainingLoadChart({ series }: { series: DailyLoad[] }) {
  return (
    <ResponsiveContainer width="100%" height={CHART_H.xl}>
      <AreaChart data={series} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <XAxis
          dataKey="date"
          tick={TICK}
          tickFormatter={(v: string) => v.slice(5)}
          axisLine={false}
          tickLine={false}
        />
        <YAxis tick={TICK} axisLine={false} tickLine={false} />
        <Tooltip formatter={(v) => [v ?? 0, 'Load']} contentStyle={TOOLTIP_STYLE} />
        <Area
          type="monotone"
          dataKey="load"
          stroke="var(--color-primary)"
          fill="var(--color-primary)"
          fillOpacity={0.15}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── PeriodComparisonChart ────────────────────────────────────────────────────

type ComparisonRow = { label: string; a: number; b: number };

export function PeriodComparisonChart({
  data,
  labelA,
  labelB,
}: {
  data: ComparisonRow[];
  labelA: string;
  labelB: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={CHART_H.xl}>
      <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <XAxis dataKey="label" tick={TICK} axisLine={false} tickLine={false} />
        <YAxis tick={TICK} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Bar dataKey="a" name={labelA} fill="var(--color-primary)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
        <Bar dataKey="b" name={labelB} fill="var(--color-info)"    radius={[4, 4, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── PositiveNegativeChart ────────────────────────────────────────────────────

export type PositiveNegativeEntry = {
  day: string;
  value: number;
};

type PositiveNegativeChartProps = {
  data: PositiveNegativeEntry[];
  baselineLabel?: string;
};

export function PositiveNegativeChart({
  data,
  baselineLabel = '0',
}: PositiveNegativeChartProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const debtGradId    = `pn-debt-${uid}`;
  const surplusGradId = `pn-surplus-${uid}`;

  let cum = 0;
  const chartData = data.map(entry => {
    cum += entry.value;
    return {
      day: entry.day,
      value: entry.value,
      cumulative: cum,
      cumPos: Math.max(cum, 0),
      cumNeg: Math.min(cum, 0),
    };
  });

  return (
    <ResponsiveContainer width="100%" height={CHART_H.sm}>
      <ComposedChart data={chartData} margin={{ top: 8, right: 4, bottom: 0, left: -28 }}>
        <defs>
          <linearGradient id={surplusGradId} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%"   stopColor="var(--color-success)" stopOpacity={0.3} />
            <stop offset="100%" stopColor="var(--color-success)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id={debtGradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="var(--color-warning)" stopOpacity={0.3} />
            <stop offset="100%" stopColor="var(--color-warning)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="day" tick={TICK} axisLine={false} tickLine={false} />
        <YAxis tick={TICK} axisLine={false} tickLine={false} />
        <ReferenceLine
          y={0}
          stroke="var(--color-text-secondary)"
          strokeDasharray="4 3"
          strokeOpacity={0.5}
          label={{ value: baselineLabel, position: 'insideRight', fontSize: 8, fill: 'var(--color-text-secondary)', dx: 4 }}
        />
        <Area type="linear" dataKey="cumPos" baseValue={0} stroke="none" fill={`url(#${surplusGradId})`} isAnimationActive={false} legendType="none" />
        <Area type="linear" dataKey="cumNeg" baseValue={0} stroke="none" fill={`url(#${debtGradId})`}    isAnimationActive={false} legendType="none" />
        <Bar dataKey="value" barSize={20} isAnimationActive={false} radius={[2, 2, 2, 2]}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.value >= 0 ? 'var(--color-success)' : 'var(--color-warning)'} />
          ))}
        </Bar>
        <Line
          type="linear"
          dataKey="cumulative"
          stroke="var(--color-primary)"
          strokeWidth={1.5}
          dot={{ r: 2.5, fill: 'var(--color-primary)', strokeWidth: 0 }}
          activeDot={false}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ─── SleepTrendChart ──────────────────────────────────────────────────────────

export function SleepTrendChart({ trend }: { trend: WeeklySleepTrend[] }) {
  return (
    <ResponsiveContainer width="100%" height={CHART_H.lg}>
      <LineChart data={trend} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <XAxis dataKey="weekLabel" tick={false} axisLine={false} tickLine={false} />
        <YAxis yAxisId="score" domain={[0, 100]} width={28} tick={TICK} axisLine={false} tickLine={false} />
        <YAxis
          yAxisId="dur"
          orientation="right"
          tickFormatter={(v: number) => fmtMin(v)}
          width={42}
          tick={TICK}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(value: any, name: any) =>
            name === 'avgDurationMin'
              ? [fmtMin(value as number), 'Duration']
              : [value, 'Score']
          }
          labelFormatter={(label: any) => (typeof label === 'string' ? label : '')}
          contentStyle={TOOLTIP_STYLE}
        />
        <Line yAxisId="score" type="monotone" dataKey="avgScore"       stroke="var(--color-primary)"        dot={false} strokeWidth={2} isAnimationActive={false} />
        <Line yAxisId="dur"   type="monotone" dataKey="avgDurationMin"  stroke="var(--color-text-secondary)" dot={false} strokeWidth={2} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── GPS data transformers ─────────────────────────────────────────────────────
// x is cumulative distance in metres for all GPS series.

export function gpsPointsToHRSeries(
  points: GpsPoint[],
): Array<{ x: number; y: number }> {
  if (points.length === 0) return [];
  let distM = 0;
  const result: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < points.length; i++) {
    if (i > 0) distM += haversineDistanceMeters(points[i - 1].lat, points[i - 1].lng, points[i].lat, points[i].lng);
    if (points[i].heartRate != null) result.push({ x: Math.round(distM), y: points[i].heartRate! });
  }
  return result;
}

export function gpsPointsToPaceSeries(
  points: GpsPoint[],
): Array<{ x: number; y: number }> {
  if (points.length === 0) return [];
  let distM = 0;
  const raw: Array<{ x: number; y: number }> = [];

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const d = haversineDistanceMeters(prev.lat, prev.lng, curr.lat, curr.lng);
    distM += d;
    // Prefer the recorded speed field (TCX); fall back to deriving it from
    // segment distance / elapsed time (GPX and any format without speed data).
    const segTimeSec =
      (new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime()) / 1000;
    const speedMs = curr.speed != null
      ? curr.speed
      : segTimeSec > 0 ? d / segTimeSec : 0;
    if (speedMs < 0.5) continue; // filter stationary/stopped
    const paceMinPerKm = 1000 / speedMs / 60;
    if (paceMinPerKm < 2 || paceMinPerKm > 20) continue; // drop unrealistic values
    raw.push({ x: Math.round(distM), y: paceMinPerKm });
  }

  // Smooth with a simple 7-point moving average to reduce GPS noise
  const win = 7;
  return raw.map((_, i) => {
    const lo = Math.max(0, i - Math.floor(win / 2));
    const hi = Math.min(raw.length - 1, i + Math.floor(win / 2));
    const slice = raw.slice(lo, hi + 1);
    const avg = slice.reduce((s, p) => s + p.y, 0) / slice.length;
    return { x: raw[i].x, y: Math.round(avg * 10) / 10 };
  });
}

export function gpsPointsToElevationSeries(
  points: GpsPoint[],
): Array<{ x: number; y: number }> {
  if (points.length === 0) return [];
  let distM = 0;
  return points.map((p, i) => {
    if (i > 0) distM += haversineDistanceMeters(points[i - 1].lat, points[i - 1].lng, p.lat, p.lng);
    return { x: Math.round(distM), y: p.elevation };
  });
}

// ─── 1 km splits ─────────────────────────────────────────────────────────────

export type KmSplit = {
  km: number;
  paceMinPerKm: number;
  avgHr: number | null;
  elevDeltaM: number;
  partial?: true;
  distanceM?: number;
};

export function gpsPointsToKmSplits(points: GpsPoint[]): KmSplit[] {
  if (points.length < 2) return [];

  const splits: KmSplit[] = [];
  let distM = 0;
  let nextBoundary = 1000;
  let bucketStartTime = new Date(points[0].timestamp).getTime();
  let bucketStartElev = points[0].elevation ?? 0;
  let bucketHrs: number[] = points[0].heartRate != null ? [points[0].heartRate] : [];

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    distM += haversineDistanceMeters(prev.lat, prev.lng, curr.lat, curr.lng);
    if (curr.heartRate != null) bucketHrs.push(curr.heartRate);

    if (distM >= nextBoundary) {
      const currTime = new Date(curr.timestamp).getTime();
      const durationSec = (currTime - bucketStartTime) / 1000;
      splits.push({
        km: splits.length + 1,
        paceMinPerKm: durationSec / 60,
        avgHr: bucketHrs.length > 0
          ? Math.round(bucketHrs.reduce((a, b) => a + b, 0) / bucketHrs.length)
          : null,
        elevDeltaM: Math.round((curr.elevation ?? 0) - bucketStartElev),
      });
      bucketStartTime = currTime;
      bucketStartElev = curr.elevation ?? 0;
      bucketHrs = [];
      nextBoundary += 1000;
    }
  }

  // Flush the partial km remainder (ignore tiny tails < 50m)
  const remainderM = distM - splits.length * 1000;
  if (remainderM >= 50) {
    const lastTime = new Date(points[points.length - 1].timestamp).getTime();
    const durationSec = (lastTime - bucketStartTime) / 1000;
    const lastElev = points[points.length - 1].elevation ?? 0;
    splits.push({
      km: splits.length + 1,
      paceMinPerKm: durationSec / 60 / (remainderM / 1000),
      avgHr: bucketHrs.length > 0
        ? Math.round(bucketHrs.reduce((a, b) => a + b, 0) / bucketHrs.length)
        : null,
      elevDeltaM: Math.round(lastElev - bucketStartElev),
      partial: true,
      distanceM: Math.round(remainderM),
    });
  }

  return splits;
}

// ─── HROverTimeChart ──────────────────────────────────────────────────────────

export function HROverTimeChart({ points }: { points: GpsPoint[] }) {
  const data = gpsPointsToHRSeries(points);
  if (data.length === 0) return null;
  const totalDist = data[data.length - 1].x;
  const ticks = distanceTicks(totalDist);

  return (
    <ResponsiveContainer width="100%" height={CHART_H.md}>
      <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <XAxis
          dataKey="x"
          type="number"
          domain={[0, totalDist]}
          ticks={ticks}
          tickFormatter={fmtDist}
          tick={TICK}
          axisLine={false}
          tickLine={false}
        />
        <YAxis domain={['auto', 'auto']} tick={TICK} axisLine={false} tickLine={false} width={32} />
        <Tooltip
          formatter={(v: any) => [`${v} bpm`, 'HR']}
          labelFormatter={(v: any) => fmtDist(Number(v))}
          contentStyle={{ background: 'var(--surface-1)', border: '1px solid var(--line-strong)', borderRadius: 'var(--r-sm)', fontSize: 12 }}
        />
        <Line type="monotone" dataKey="y" stroke="var(--c-cardio)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── PaceOverTimeChart ────────────────────────────────────────────────────────

export function PaceOverTimeChart({ points }: { points: GpsPoint[] }) {
  const data = gpsPointsToPaceSeries(points);
  if (data.length === 0) return null;
  const totalDist = data[data.length - 1].x;
  const ticks = distanceTicks(totalDist);

  return (
    <ResponsiveContainer width="100%" height={CHART_H.sm}>
      <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <XAxis
          dataKey="x"
          type="number"
          domain={[0, totalDist]}
          ticks={ticks}
          tickFormatter={fmtDist}
          tick={TICK}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          reversed
          domain={['auto', 'auto']}
          tick={TICK}
          tickFormatter={fmtPace}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip
          formatter={(v: any) => [`${fmtPace(Number(v))}/km`, 'Pace']}
          labelFormatter={(v: any) => fmtDist(Number(v))}
          contentStyle={{ background: 'var(--surface-1)', border: '1px solid var(--line-strong)', borderRadius: 'var(--r-sm)', fontSize: 12 }}
        />
        <Line type="monotone" dataKey="y" stroke="var(--accent)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── ElevationProfileChart ────────────────────────────────────────────────────

export function ElevationProfileChart({ points }: { points: GpsPoint[] }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const gradId = `elev-${uid}`;
  const data = gpsPointsToElevationSeries(points);
  if (data.length === 0) return null;
  const totalDist = data[data.length - 1].x;
  const ticks = distanceTicks(totalDist);
  return (
    <ResponsiveContainer width="100%" height={CHART_H.xs}>
      <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="var(--color-success)" stopOpacity={0.4} />
            <stop offset="100%" stopColor="var(--color-success)" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="x"
          type="number"
          domain={[0, totalDist]}
          ticks={ticks}
          tickFormatter={fmtDist}
          tick={TICK}
          axisLine={false}
          tickLine={false}
        />
        <YAxis hide domain={['auto', 'auto']} />
        <Tooltip
          formatter={(v: any) => [`${Math.round(Number(v))} m`, 'Elevation']}
          labelFormatter={(v: any) => fmtDist(Number(v))}
          contentStyle={{ background: 'var(--surface-1)', border: '1px solid var(--line-strong)', borderRadius: 'var(--r-sm)', fontSize: 12 }}
        />
        <Area type="monotone" dataKey="y" stroke="var(--color-success)" strokeWidth={1.5} fill={`url(#${gradId})`} dot={false} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── KmSplitsTable ────────────────────────────────────────────────────────────

export function KmSplitsTable({ points }: { points: GpsPoint[] }) {
  const splits = gpsPointsToKmSplits(points);
  if (splits.length === 0) return null;

  return (
    <table className="splits-table">
      <thead>
        <tr>
          <th>KM</th>
          <th>PACE</th>
          <th>AVG HR</th>
          <th>ELEV</th>
        </tr>
      </thead>
      <tbody>
        {splits.map(s => (
          <tr key={s.km}>
            <td>{s.partial ? fmtDist(s.distanceM!) : s.km}</td>
            <td>{fmtPace(s.paceMinPerKm)}/km</td>
            <td>{s.avgHr != null ? `${s.avgHr} bpm` : '—'}</td>
            <td className={s.elevDeltaM > 0 ? 'elev-up' : s.elevDeltaM < 0 ? 'elev-down' : ''}>
              {s.elevDeltaM > 0 ? `+${s.elevDeltaM}` : s.elevDeltaM}m
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
