import { useParams, useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { useQuery } from '@ui/bindings';
import type { ProgressionState, VolumeEntry } from '@features/progression';
import { CHART_H, TICK, TOOLTIP_STYLE } from '@ui/components/shared/Charts';

// Gap in x-units inserted between sessions so they read as distinct groups
const SESSION_GAP = 2;

interface SetPoint {
  x: number;
  workingY: number | null;
  warmupY: number | null;
  reps: number;
  date: string;
  setNum: number;
}

interface SessionBand {
  x: number;
  label: string;
}

function buildFlatData(history: VolumeEntry[]): { points: SetPoint[]; bands: SessionBand[]; dividers: number[] } {
  const points: SetPoint[] = [];
  const bands: SessionBand[] = [];
  const dividers: number[] = [];
  let cursor = 0;

  for (let idx = 0; idx < history.length; idx++) {
    const entry = history[idx];
    const warmups = entry.warmupWeights ?? [];
    const working = entry.setWeights ?? [];
    if (warmups.length + working.length === 0) { cursor += SESSION_GAP; continue; }

    const start = cursor;
    warmups.forEach((w, i) => {
      points.push({ x: cursor, workingY: null, warmupY: w, reps: 0, date: entry.date, setNum: i + 1 });
      cursor++;
    });
    working.forEach((w, i) => {
      points.push({ x: cursor, workingY: w, warmupY: null, reps: entry.setReps?.[i] ?? 0, date: entry.date, setNum: warmups.length + i + 1 });
      cursor++;
    });

    bands.push({ x: (start + cursor - 1) / 2, label: formatDate(entry.date) });
    if (idx < history.length - 1) dividers.push(cursor + SESSION_GAP / 2);
    cursor += SESSION_GAP;
  }

  return { points, bands, dividers };
}

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function formatDateFull(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function ExerciseHistoryScreen() {
  const { exerciseName: rawParam } = useParams<{ exerciseName: string }>();
  const navigate = useNavigate();
  const exerciseName = rawParam ? decodeURIComponent(rawParam) : '';

  const progressions = useQuery<ProgressionState>('exercise_progressions');
  const progression = progressions?.[exerciseName];

  if (!progression || progression.history.length === 0) {
    return (
      <div className="column">
        <button type="button" className="ghost" onClick={() => navigate(-1)}>Back</button>
        <h2>{exerciseName}</h2>
        <section className="surface compact">
          <p className="caption">No history found for "{exerciseName}".</p>
        </section>
      </div>
    );
  }

  const history = progression.history;
  const { points, bands, dividers } = buildFlatData(history);

  const allWeights = points.map(p => p.workingY ?? p.warmupY ?? 0).filter(v => v > 0);
  const maxWeight = Math.max(...allWeights);
  const step = maxWeight <= 50 ? 10 : maxWeight <= 100 ? 20 : maxWeight <= 200 ? 40 : 50;
  const yMax = Math.ceil(maxWeight / step) * step + step;
  const xMax = points.length > 0 ? points[points.length - 1].x : 0;

  const maxSets = Math.max(...history.map(e => e.setWeights?.length ?? 0));
  const reversed = [...history].reverse();

  return (
    <div className="column">
      <button type="button" className="ghost" onClick={() => navigate(-1)}>Back</button>

      <div className="row align-center">
        <h2>{exerciseName}</h2>
        {progression.plateauDetected && (
          <span className="pill warn">⚠ Plateau</span>
        )}
      </div>

      {points.length >= 1 && (
        <section className="surface compact column">
          <span className="caption">Weight over time</span>
          <div className="row align-center">
            <span className="chart-ylabel">kg</span>
            <ResponsiveContainer width="100%" height={CHART_H.md}>
              <LineChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <XAxis
                  dataKey="x"
                  type="number"
                  domain={[-0.5, xMax + 0.5]}
                  ticks={bands.map(b => b.x)}
                  tickFormatter={(x: number) => bands.find(b => b.x === x)?.label ?? ''}
                  tick={TICK}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                />
                <YAxis
                  domain={[0, yMax]}
                  tick={TICK}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(value: any, name: any) => [
                    `${value} kg`,
                    name === 'workingY' ? 'Working' : 'Warmup',
                  ]}
                  labelFormatter={(x: any) => {
                    const pt = points.find(p => p.x === Number(x));
                    return pt ? `${formatDate(pt.date)} · Set ${pt.setNum}` : '';
                  }}
                />
                {dividers.map((x, i) => (
                  <ReferenceLine key={i} x={x} stroke="var(--line-faint)" strokeDasharray="3 3" />
                ))}
                <Line
                  type="monotone"
                  dataKey="workingY"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  dot={{ r: 3, strokeWidth: 0, fill: 'var(--color-primary)' }}
                  activeDot={{ r: 5 }}
                  connectNulls
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="warmupY"
                  stroke="var(--ink-faint)"
                  strokeWidth={0}
                  dot={{ r: 2.5, strokeWidth: 0, fill: 'var(--ink-faint)' }}
                  activeDot={{ r: 4 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      <section className="surface compact column">
        <span className="caption">Session history</span>
        <table className="center">
          <thead>
            <tr>
              <th className="caption">Date</th>
              {Array.from({ length: maxSets }, (_, i) => (
                <th key={i} className="caption">S{i + 1}</th>
              ))}
              <th className="caption">1RM</th>
            </tr>
          </thead>
          <tbody>
            {reversed.map((entry, i) => (
              <tr key={i}>
                <td className="caption" style={{ whiteSpace: 'nowrap' }}>{formatDateFull(entry.date)}</td>
                {Array.from({ length: maxSets }, (_, s) => {
                  const kg = entry.setWeights?.[s];
                  const reps = entry.setReps?.[s];
                  if (kg == null) return <td key={s}>—</td>;
                  return (
                    <td key={s}>
                      {kg}<span className="caption"> ×{reps ?? '?'}</span>
                    </td>
                  );
                })}
                <td>{entry.oneRepMaxEstimate.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
