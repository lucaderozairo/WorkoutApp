import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { CHART_H, TICK, TOOLTIP_STYLE } from '@ui/components/charts/domain-charts';
import { Surface, Text } from '@ui/atoms';
import { Row } from '@ui/layout';

export interface ChartSetPoint {
  x: number;
  workingY: number | null;
  warmupY: number | null;
  reps: number;
  date: string;
  setNum: number;
}

export interface ChartSessionBand {
  x: number;
  label: string;
}

interface ExerciseHistoryChartProps {
  points: ChartSetPoint[];
  bands: ChartSessionBand[];
  dividers: number[];
  xMax: number;
  yMax: number;
  formatDate: (iso: string) => string;
}

export function ExerciseHistoryChart({ points, bands, dividers, xMax, yMax, formatDate }: ExerciseHistoryChartProps) {
  return (
    <Surface as="section" className="pad-sm column">
      <Text size="caption">Weight over time</Text>
      <Row align="center">
        <Text size="caption" color="faint" className="chart-ylabel">kg</Text>
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
  );
}
