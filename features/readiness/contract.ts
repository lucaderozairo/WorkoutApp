// Public contract for the readiness feature.

// Domain events this feature publishes.
export type { ReadinessEvent } from './domain/types';

// Commands this feature accepts.
export type {
  LogReadiness,
  LogHealthMetrics,
  LogSleep,
  ImportSleepFromCSV,
  LogRestingHR,
  LogSubjectiveRPE,
} from './domain/types';

// Domain types consumed by UI, screens and widgets.
export type { WeeklySleepTrend } from './domain/types';
export type { SleepSession } from './domain/mock-types';

// Projection / view-model types consumed by screens and widgets.
export type {
  TodayReadinessView,
  HealthMetricsView,
  SleepEntryView,
  RestingHRView,
  SubjectiveRPEView,
} from './projections';

// Sleep trend view-model types consumed by screens and infrastructure.
export type { SleepTrendView, WeeklyTrendEntry, SleepScorePoint } from './projections/sleepTrend';
