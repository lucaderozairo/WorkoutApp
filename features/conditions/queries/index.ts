import { viewStore } from '@data/projections/views';
import type { WeatherCondition, SuitabilityEntry } from '../domain/types';

export function getCurrentConditions(): WeatherCondition | null {
  return viewStore.get<WeatherCondition>('current_conditions') ?? null;
}

export function getSuitability(sport?: string): SuitabilityEntry[] {
  const all = viewStore.get<SuitabilityEntry[]>('suitability_by_sport') ?? [];
  return sport ? all.filter(s => s.sport === sport) : all;
}
