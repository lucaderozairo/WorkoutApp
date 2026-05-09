import type { ConditionsEvent, ForecastFetchedPayload, SuitabilityComputedPayload, WeatherCondition, SuitabilityEntry } from './types';

export function applyForecastFetched(_state: WeatherCondition | null, event: ConditionsEvent): WeatherCondition | null {
  if (event.type !== 'ForecastFetched') return _state;
  const p = event.payload as ForecastFetchedPayload;
  return {
    tempCelsius: p.tempCelsius,
    humidity: p.humidity,
    windKph: p.windKph,
    description: p.description,
    icon: p.icon,
    fetchedAt: event.timestamp,
  };
}

export function applySuitabilityComputedCurrent(state: WeatherCondition | null): WeatherCondition | null {
  return state;
}

export function applySuitabilityComputed(_state: SuitabilityEntry[], event: ConditionsEvent): SuitabilityEntry[] {
  if (event.type !== 'SuitabilityComputed') return _state;
  const p = event.payload as SuitabilityComputedPayload;
  return p.suitability;
}

export function applyForecastFetchedSuitability(state: SuitabilityEntry[]): SuitabilityEntry[] {
  return state;
}
