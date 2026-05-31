import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { CHART_H, TICK, TOOLTIP_STYLE } from '@ui/patterns/charts/domain-charts';
import { Badge, Surface, Text, Table, TableCell, TableHead, TableRow } from '@ui/atoms';
import { ScreenHeader } from '@ui/molecules';
import { Grid, Row } from '@ui/layout';
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
      <Grid>
        <ScreenHeader title={exerciseName} back={() => navigate(-1)} />
        <Surface as="section" className="tight">
          <Text as="p" size="caption">No history found for "{exerciseName}".</Text>
        </Surface>
      </Grid>
    );
  }

  return (
    <Grid>
      <ScreenHeader
        title={exerciseName}
        back={() => navigate(-1)}
        primary={progression?.plateauDetected ? <Badge variant="warn">Plateau</Badge> : undefined}
      />

      {points.length >= 1 && (
        <Surface as="section" className="tight column">
          <Text size="caption">Weight over time</Text>
          <Row align="center">
            <Text className="chart-ylabel">kg</Text>
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
                    return pt ? `${formatDate(pt.date)} - Set ${pt.setNum}` : '';
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
          </Row>
        </Surface>
      )}

      <Surface as="section" className="tight column">
        <Text size="caption">Session history</Text>
        <Table className="center">
          <TableHead>
            <TableRow>
              <TableCell header className="caption">Date</TableCell>
              {Array.from({ length: maxSets }, (_, i) => (
                <TableCell key={i} header className="caption">S{i + 1}</TableCell>
              ))}
              <TableCell header className="caption">1RM</TableCell>
            </TableRow>
          </TableHead>
          <tbody>
            {reversed.map((entry, i) => (
              <TableRow key={i}>
                <TableCell className="caption nowrap">{formatDateFull(entry.date)}</TableCell>
                {Array.from({ length: maxSets }, (_, s) => {
                  const kg = entry.setWeights?.[s];
                  const reps = entry.setReps?.[s];
                  if (kg == null) return <TableCell key={s}>-</TableCell>;
                  return (
                    <TableCell key={s}>
                      {kg}<Text size="caption"> x{reps ?? '?'}</Text>
                    </TableCell>
                  );
                })}
                <TableCell>{entry.oneRepMaxEstimate.toFixed(1)}</TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </Surface>
    </Grid>
  );
}
