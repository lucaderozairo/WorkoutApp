import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { TOOLTIP_STYLE, TICK } from '@ui/patterns/charts/domain-charts';
import { Column } from '@ui/layout';
import { Surface, Text } from '@ui/atoms';
import type { WidgetSize } from './widgetPrimitives';

const MOCK_SLEEP_HISTORY = [
  { date: 'Mon', deepMin:  88, lightMin: 200, remMin: 102 },
  { date: 'Tue', deepMin:  72, lightMin: 190, remMin:  90 },
  { date: 'Wed', deepMin: 105, lightMin: 210, remMin: 110 },
  { date: 'Thu', deepMin:  65, lightMin: 180, remMin:  85 },
  { date: 'Fri', deepMin:  98, lightMin: 205, remMin: 108 },
  { date: 'Sat', deepMin: 120, lightMin: 235, remMin: 120 },
  { date: 'Sun', deepMin:  90, lightMin: 195, remMin: 100 },
];

export function SleepBreakdownWidget({ size }: { size: WidgetSize }) {
  return (
    <Surface pad="sm"><Column className="h-full">
      <Text size="eyebrow">Sleep Stages</Text>
      <div className="grow">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={MOCK_SLEEP_HISTORY} barSize={10} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
            <XAxis dataKey="date" tick={TICK} axisLine={false} tickLine={false} />
            {size === '2x2' && <YAxis tick={TICK} axisLine={false} tickLine={false} />}
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Bar dataKey="deepMin"  stackId="s" fill="var(--color-sleep-deep)"  name="Deep"  />
            <Bar dataKey="lightMin" stackId="s" fill="var(--color-sleep-light)" name="Light" />
            <Bar dataKey="remMin"   stackId="s" fill="var(--color-sleep-rem)"   name="REM"   radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Column></Surface>
  );
}
