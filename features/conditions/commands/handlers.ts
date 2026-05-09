import type { Result, Id } from '@shared/types';
import { ok } from '@shared/types';
import type { RefreshConditions, ConditionsEvent, SuitabilityEntry } from '../domain/types';
import { systemClock } from '@core/clock';
import { inMemoryEventStore } from '@data/store';
import { viewStore } from '@data/projections/views';
import { currentConditionsProjection, suitabilityProjection } from '../projections';
import { fetchWeather, computeSuitability } from '@data/sources/remote/weather';

function applyAndStore(events: ConditionsEvent[]): void {
  events.forEach(e => {
    currentConditionsProjection.apply(e);
    suitabilityProjection.apply(e);
  });
  viewStore.set('current_conditions', currentConditionsProjection.getState());
  viewStore.set('suitability_by_sport', suitabilityProjection.getState());
}

export async function handleRefreshConditions(_cmd: RefreshConditions): Promise<Result<void, string>> {
  const weather = await fetchWeather();
  if (!weather) return ok(undefined);

  const forecastEvent: ConditionsEvent = {
    type: 'ForecastFetched',
    aggregateId: 'conditions' as unknown as Id,
    aggregateType: 'Conditions',
    timestamp: systemClock.now(),
    version: 1,
    payload: weather,
  };

  const suitability = computeSuitability(weather);
  const suitabilityEvent: ConditionsEvent = {
    type: 'SuitabilityComputed',
    aggregateId: 'conditions' as unknown as Id,
    aggregateType: 'Conditions',
    timestamp: systemClock.now(),
    version: 1,
    payload: { suitability },
  };

  await inMemoryEventStore.append(forecastEvent);
  await inMemoryEventStore.append(suitabilityEvent);
  applyAndStore([forecastEvent, suitabilityEvent]);
  return ok(undefined);
}
