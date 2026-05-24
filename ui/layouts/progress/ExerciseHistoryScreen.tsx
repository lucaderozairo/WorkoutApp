import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { CHART_H, TICK, TOOLTIP_STYLE } from '@ui/patterns/charts/domain-charts';
import { ScreenHeader } from '@ui/components/shared';
import { formatDate, formatDateFull, useExerciseHistory } from './useExerciseHistory';

export function ExerciseHistoryScreen() {
  const {
    exerciseName,
    navigate,
    notFound,
    progression,
    points,
    bands,
    dividers,
    yMax,
    xMax,
    maxSets,
    reversed,
  } = useExerciseHistory();

  if (notFound) {
    return (
      <div className="column">
        <ScreenHeader title={exerciseName} back={() => navigate(-1)} />
        <section className="surface tight">
          <p className="caption">No history found for "{exerciseName}".</p>
        </section>
      </div>
    );
  }

  return (
    <div className="column">
      <ScreenHeader
        title={exerciseName}
        back={() => navigate(-1)}
        primary={progression?.plateauDetected ? <span className="pill warn">⚠ Plateau</span> : undefined}
      />

      {points.length >= 1 && (
        <section className="surface tight column">
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

      <section className="surface tight column">
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
                <td className="caption nowrap">{formatDateFull(entry.date)}</td>
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
