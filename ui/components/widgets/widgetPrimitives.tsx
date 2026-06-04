// ui/components/widgets/widgetPrimitives.tsx
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, RadialBarChart, RadialBar } from 'recharts';

export type WidgetSize = '1x1' | '2x1' | '2x2';

export function MiniBar({ value, max, color = 'var(--accent)' }: {
  value: number;
  max: number;
  color?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={8}>
      <BarChart
        data={[{ v: value }]}
        layout="vertical"
        barCategoryGap={0}
        margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
      >
        <XAxis type="number" domain={[0, max]} hide />
        <YAxis type="category" dataKey="name" hide />
        <Bar dataKey="v" fill={color} background={{ fill: 'var(--surface-3)' }} radius={3} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MiniRing({ value, color, size = 80 }: {
  value: number;
  color: string;
  size?: number;
}) {
  return (
    <RadialBarChart
      width={size} height={size}
      innerRadius="60%" outerRadius="90%"
      data={[{ value, fill: color }]}
      startAngle={90} endAngle={-270}
    >
      <RadialBar dataKey="value" background={{ fill: 'var(--surface-3)' }} cornerRadius={3} />
    </RadialBarChart>
  );
}

export function scoreBadge(score: number): { label: string; cls: string } {
  if (score >= 80) return { label: 'Good', cls: 'green' };
  if (score >= 60) return { label: 'OK',   cls: 'amber' };
  return             { label: 'Low',  cls: '' };
}
