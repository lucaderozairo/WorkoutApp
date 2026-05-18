import { viewStore } from '@data/projections/views';
import type { HealthChartMap, HealthChartDef } from '../domain/types';

export function getHealthCharts(): HealthChartMap {
  return viewStore.get<HealthChartMap>('health_charts') ?? {};
}

export function getHealthChartsForCategory(slug: string): HealthChartDef[] {
  return getHealthCharts()[slug] ?? [];
}
