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
