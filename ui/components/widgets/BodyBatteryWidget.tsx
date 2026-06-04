import { PieChart, Pie, Cell } from 'recharts';
import { Column } from '@ui/layout';
import { Surface, Text } from '@ui/atoms';
import { Badge } from '@ui/molecules';
import { scoreBadge, type WidgetSize } from './widgetPrimitives';

const MOCK_VALUE = 71;

export function BodyBatteryWidget({ size: _ }: { size: WidgetSize }) {
  const val   = MOCK_VALUE;
  const color = val >= 70 ? 'var(--ok)' : val >= 40 ? 'var(--warn)' : 'var(--bad)';
  const badge = scoreBadge(val);
  const track = [
    { value: val,       fill: color },
    { value: 100 - val, fill: 'var(--surface-3)' },
  ];
  return (
    <Surface pad="sm"><Column justify="center" align="center" className="h-full">
      <Text size="eyebrow">Body Battery</Text>
      <PieChart width={100} height={56}>
        <Pie
          data={track}
          cx="50%" cy="100%"
          startAngle={180} endAngle={0}
          innerRadius={28} outerRadius={48}
          dataKey="value"
          strokeWidth={0}
          isAnimationActive={false}
        >
          {track.map((d, i) => <Cell key={i} fill={d.fill} />)}
        </Pie>
      </PieChart>
      <Text as="h3" mono>{val}<Text as="span" size="caption" color="faint">%</Text></Text>
      <Badge className={badge.cls}>{badge.label}</Badge>
    </Column></Surface>
  );
}
