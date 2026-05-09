import type { Id } from '@shared/types';
import type { ReadinessEvent } from '../domain/types';
import { ProjectionBuilder } from '@data/projections/builders';
import {
  applyReadinessLogged,
  applyHealthMetricsLogged,
  applySleepLogged,
  applyRestingHRLogged,
  applySubjectiveRPELogged,
} from '../domain/reducers';
import type {
  TodayReadinessView,
  HealthMetricsView,
  SleepEntryView,
  RestingHRView,
  SubjectiveRPEView,
} from '../domain/reducers';

export type { TodayReadinessView, HealthMetricsView, SleepEntryView };
export type { RestingHRView, SubjectiveRPEView };

export const todayReadinessProjection = new ProjectionBuilder<
  TodayReadinessView,
  ReadinessEvent
>(
  'today_readiness',
  { score: 0, sleep: 0, energy: 0, soreness: 0, mood: 0, hasEntry: false },
  {
    ReadinessLogged: applyReadinessLogged,
  }
);

/** `health_metrics` — latest 30 health metrics entries, newest first */
export const healthMetricsProjection = new ProjectionBuilder<
  HealthMetricsView[],
  ReadinessEvent
>(
  'health_metrics',
  [],
  {
    HealthMetricsLogged: applyHealthMetricsLogged,
  }
);

/** `sleep_history` — sleep entries, newest first */
export const sleepHistoryProjection = new ProjectionBuilder<
  SleepEntryView[],
  ReadinessEvent
>(
  'sleep_history',
  [],
  {
    SleepLogged: applySleepLogged,
  }
);

export const restingHRProjection = new ProjectionBuilder<
  RestingHRView[],
  ReadinessEvent
>(
  'resting_hr_history',
  [],
  {
    RestingHRLogged: applyRestingHRLogged,
  }
);

export const subjectiveRPEProjection = new ProjectionBuilder<
  SubjectiveRPEView[],
  ReadinessEvent
>(
  'subjective_rpe_history',
  [],
  {
    SubjectiveRPELogged: applySubjectiveRPELogged,
  }
);
