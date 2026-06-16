// Public contract for the progress_analysis feature.

// Domain events this feature publishes.
export type { PREvent } from './domain/types';

// Commands this feature accepts.
export type {
  RecordPR,
  AddAnnotation,
  DeleteAnnotation,
} from './domain/types';

// Domain types consumed by UI, screens and data/projections.
export type {
  PersonalRecord,
  ChartAnnotation,
  AnnotationColor,
} from './domain/types';

// Training-load domain types consumed by charts and data/projections.
export type { DailyLoad, AcuteChronicResult, HRZone } from './domain/trainingLoad';

// Query / view-model types consumed by screens.
export type { StatsSummary, ActivityFeedEntry } from './queries/types';
