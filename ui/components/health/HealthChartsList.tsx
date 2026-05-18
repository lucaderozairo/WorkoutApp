import { useQuery } from '@ui/bindings';
import type { HealthChartMap } from '@features/health';
import { ChartContainer } from '../../patterns/charts/charts';

interface Props {
  slug: string;
  height?: number;
}

export function HealthChartsList({ slug, height = 120 }: Props) {
  const charts = useQuery<HealthChartMap>('health_charts') ?? {};
  const list = charts[slug] ?? [];
  if (list.length === 0) return null;
  return (
    <>
      {list.map(c => (
        <div key={c.label} className="surface tight stack compact">
          <div className="row space-between align-center">
            <span className="eyebrow">{c.label}</span>
            {c.currentValue && (
              <span className="pill"><span className="dot" />{c.currentValue}</span>
            )}
          </div>
          <ChartContainer
            chartType={c.chartType}
            data={c.data}
            height={height}
            axisShow={{ x: true, y: true }}
            color={c.color ?? 'var(--accent)'}
          />
        </div>
      ))}
    </>
  );
}
