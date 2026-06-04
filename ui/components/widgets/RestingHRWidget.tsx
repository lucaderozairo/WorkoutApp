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
