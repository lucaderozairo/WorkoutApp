import type { DomainEvent } from '@shared/types';
import type { SportSuitability, SuitabilityEntry, WeatherCondition } from '@shared/contracts';

export type { SportSuitability, SuitabilityEntry, WeatherCondition } from '@shared/contracts';

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
