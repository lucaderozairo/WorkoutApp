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
