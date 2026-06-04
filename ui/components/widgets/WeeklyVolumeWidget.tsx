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
