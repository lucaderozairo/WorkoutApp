import type { ReactNode } from 'react';
import { useQuery } from '@ui/bindings';
import type { HealthChartMap } from '@features/health';
import { ChartContainer } from '../../patterns/charts/charts';
import { Row, Column } from '@ui/layout';
import { Surface } from '@ui/atoms';

interface Props {
  slug: string;
  height?: number;
  fallback?: ReactNode;
}

export function HealthChartsList({ slug, height = 120, fallback = null }: Props) {
  const charts = useQuery<HealthChartMap>('health_charts') ?? {};
  const list = charts[slug] ?? [];
  if (list.length === 0) return <>{fallback}</>;
  return (
    <>
      {list.map(c => (
        <Surface key={c.label} pad="sm">
          <Column gap={1}>
            <Row justify="between" align="center">
              <span className="eyebrow">{c.label}</span>
              {c.currentValue && (
                <span className="badge"><span className="dot" />{c.currentValue}</span>
              )}
            </Row>
            <ChartContainer
              chartType={c.chartType}
              data={c.data}
              height={height}
              axisShow={{ x: true, y: true }}
              color={c.color ?? 'var(--accent)'}
            />
          </Column>
        </Surface>
      ))}
    </>
  );
}
