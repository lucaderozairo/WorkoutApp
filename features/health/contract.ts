// Public contract for the health feature.

// Domain events this feature publishes.
export type { HealthEvent } from './domain/types';

// Commands this feature accepts.
export type { HealthCommand, SeedHealthCharts } from './domain/types';

// Domain types consumed by UI, screens and data/projections.
export type {
  HealthCategorySlug,
  HealthChartDef,
  HealthChartMap,
  RestingHREntry,
  HRVEntry,
} from './domain/types';
