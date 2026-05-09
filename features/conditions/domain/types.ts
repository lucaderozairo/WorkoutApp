import type { DomainEvent } from '@shared/types';

export interface WeatherCondition {
  tempCelsius: number;
  humidity: number;
  windKph: number;
  description: string;
  icon: string;
  fetchedAt: number;
}

export type SportSuitability = 'excellent' | 'good' | 'fair' | 'poor';

export interface SuitabilityEntry {
  sport: string;
  suitability: SportSuitability;
  reason: string;
}

export interface ConditionsState {
  current: WeatherCondition | null;
  suitability: SuitabilityEntry[];
}

export type ConditionsEvent =
  | DomainEvent<'ForecastFetched', ForecastFetchedPayload>
  | DomainEvent<'SuitabilityComputed', SuitabilityComputedPayload>;

export interface ForecastFetchedPayload {
  tempCelsius: number;
  humidity: number;
  windKph: number;
  description: string;
  icon: string;
}

export interface SuitabilityComputedPayload {
  suitability: SuitabilityEntry[];
}

export interface RefreshConditions {
  type: 'RefreshConditions';
}
