import type { Result, Id } from '@shared/types';
import { ok } from '@shared/types';
import type { SeedHealthCharts, HealthEvent } from '../domain/types';
import { systemClock } from '@core/clock';
import { inMemoryEventStore } from '@data/store';
import { viewStore } from '@data/projections/views';
import { healthChartsProjection } from '../projections';

function applyAndStore(events: HealthEvent[]): void {
  events.forEach(e => healthChartsProjection.apply(e));
  viewStore.set('health_charts', healthChartsProjection.getState());
}

export async function handleSeedHealthCharts(cmd: SeedHealthCharts): Promise<Result<void, string>> {
  const event: HealthEvent = {
    type: 'HealthChartsSeeded',
    aggregateId: 'health-catalog' as Id<'HealthCatalog'>,
    aggregateType: 'HealthCatalog',
    timestamp: systemClock.now(),
    version: 1,
    payload: { charts: cmd.charts },
  };

  await inMemoryEventStore.append(event);
  applyAndStore([event]);
  return ok(undefined);
}
