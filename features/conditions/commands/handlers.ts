import type { Result, Id } from '@shared/types';
import { ok } from '@shared/types';
import type { RefreshConditions, ConditionsEvent, SuitabilityEntry } from '../domain/types';
import { systemClock } from '@core/clock';
import { defineCommand } from '@data/define-command';
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

export const handleRefreshConditions = defineCommand<RefreshConditions, Result<void, string>>({
  execute: async (_cmd) => {
    const weather = await fetchWeather();
    if (!weather) return { events: [], result: ok(undefined) };

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

    const events = [forecastEvent, suitabilityEvent];
    applyAndStore(events);
    return { events, result: ok(undefined) };
  },
});
