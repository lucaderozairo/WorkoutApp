import type { HealthEvent, HealthChartMap } from '../domain/types';
import { ProjectionBuilder, projectionRegistry } from '@data/projections/builders';

export const healthChartsProjection = new ProjectionBuilder<HealthChartMap, HealthEvent>(
  'health_charts',
  {},
  {
    HealthChartsSeeded: (_state, event) => {
      return event.payload.charts;
    },
  },
);

projectionRegistry.register('health_charts', healthChartsProjection);
