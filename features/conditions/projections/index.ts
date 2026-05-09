import type { ConditionsEvent, WeatherCondition, SuitabilityEntry } from '../domain/types';
import { ProjectionBuilder } from '@data/projections/builders';
import { projectionRegistry } from '@data/projections/builders';
import {
  applyForecastFetched,
  applySuitabilityComputedCurrent,
  applySuitabilityComputed,
  applyForecastFetchedSuitability,
} from '../domain/reducers';

export const currentConditionsProjection = new ProjectionBuilder<WeatherCondition | null, ConditionsEvent>(
  'current_conditions',
  null,
  {
    ForecastFetched: applyForecastFetched,
    SuitabilityComputed: applySuitabilityComputedCurrent,
  }
);

export const suitabilityProjection = new ProjectionBuilder<SuitabilityEntry[], ConditionsEvent>(
  'suitability_by_sport',
  [],
  {
    ForecastFetched: applyForecastFetchedSuitability,
    SuitabilityComputed: applySuitabilityComputed,
  }
);

projectionRegistry.register('current_conditions', currentConditionsProjection);
projectionRegistry.register('suitability_by_sport', suitabilityProjection);
