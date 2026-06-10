import type { ReactNode } from 'react';
import { Bar, BarChart, RadialBar, RadialBarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { Badge } from '@ui/molecules';
import { Divider, Metric, Surface, Text } from '@ui/atoms';
import { Cluster, Column, Grid, Row, Spacer } from '@ui/layout';

export type WidgetSize = 'sm' | 'wide' | 'md' | 'lg';

export interface DemoWidgetProps {
  size: WidgetSize;
}

export interface MetricSpec {
  label: string;
  value: string | number;
  unit?: string;
}

export function MiniBar({ value, max, color = 'var(--accent)' }: {
  value: number;
  max: number;
  color?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={8}>
      <BarChart
        data={[{ name: 'value', v: value }]}
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
      width={size}
      height={size}
      innerRadius="60%"
      outerRadius="90%"
      data={[{ value, fill: color }]}
      startAngle={90}
      endAngle={-270}
    >
      <RadialBar dataKey="value" background={{ fill: 'var(--surface-3)' }} cornerRadius={3} />
    </RadialBarChart>
  );
}

export function scoreBadge(score: number): { label: string; cls: string } {
  if (score >= 80) return { label: 'Good', cls: 'green' };
  if (score >= 60) return { label: 'OK', cls: 'amber' };
  return { label: 'Low', cls: '' };
}

export function WidgetShell({
  title,
  badge,
  size,
  children,
}: {
  title: string;
  badge?: string;
  size: WidgetSize;
  children: ReactNode;
}) {
  return (
    <Surface>
      <Column gap={2} className="h-full">
        <Row align="center" justify="between" gap={2}>
          <Text size="caption" color="muted">{title}</Text>
          {badge && <Badge>{badge}</Badge>}
        </Row>
        {children}
        {size !== 'sm' && <Spacer />}
      </Column>
    </Surface>
  );
}

function MetricList({ items }: { items: MetricSpec[] }) {
  const cols = items.length > 2 ? 2 : items.length === 1 ? 1 : 2;

  return (
    <Grid cols={cols} gap={2}>
      {items.map((item) => (
        <Column key={item.label} gap={1}>
          <Metric value={item.value} unit={item.unit} size="sm" />
          <Text size="caption" color="muted">{item.label}</Text>
        </Column>
      ))}
    </Grid>
  );
}

export function DemoWidget({
  title,
  badge,
  size,
  metrics,
  detail,
}: DemoWidgetProps & {
  title: string;
  badge?: string;
  metrics: MetricSpec[];
  detail?: ReactNode;
}) {
  const primary = metrics[0];

  return (
    <WidgetShell title={title} badge={badge} size={size}>
      {size === 'sm' ? (
        <Column gap={1}>
          <Metric value={primary.value} unit={primary.unit} size="lg" />
          <Text size="caption" color="muted">{primary.label}</Text>
        </Column>
      ) : (
        <>
          <MetricList items={metrics} />
          {detail && (
            <>
              <Divider />
              {detail}
            </>
          )}
        </>
      )}
    </WidgetShell>
  );
}

export { Cluster, Column, Row, Text };
