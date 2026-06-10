import type { Result, Id } from '@shared/types';
import { ok } from '@shared/types';
import type { SeedHealthCharts, HealthEvent } from '../domain/types';
import { systemClock } from '@core/clock';
import { defineCommand } from '@data/define-command';
import { viewStore } from '@data/projections/views';
import { healthChartsProjection } from '../projections';

function applyAndStore(events: HealthEvent[]): void {
  events.forEach(e => healthChartsProjection.apply(e));
  viewStore.set('health_charts', healthChartsProjection.getState());
}

export const handleSeedHealthCharts = defineCommand<SeedHealthCharts, Result<void, string>>({
  execute: async (cmd) => {
    const event: HealthEvent = {
      type: 'HealthChartsSeeded',
      aggregateId: 'health-catalog' as Id<'HealthCatalog'>,
      aggregateType: 'HealthCatalog',
      timestamp: systemClock.now(),
      version: 1,
      payload: { charts: cmd.charts },
    };

    applyAndStore([event]);
    return { events: [event], result: ok(undefined) };
  },
});
