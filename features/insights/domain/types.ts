import type { Id, DomainEvent } from '@shared/types';

export type InsightSeverity = 'info' | 'warning' | 'success';

export type InsightType =
  | 'PlateauDetected'
  | 'PRAchieved'
  | 'VolumeSpike'
  | 'FrequencyDrop'
  | 'OvertrainingRisk';

/** The full taxonomy of insight kinds, used to wire the projection generically. */
export const INSIGHT_TYPES: readonly InsightType[] = [
  'PlateauDetected',
  'PRAchieved',
  'VolumeSpike',
  'FrequencyDrop',
  'OvertrainingRisk',
];

export interface Insight {
  id: Id<'Insight'>;
  type: InsightType;
  severity: InsightSeverity;
  /** Human-readable headline (e.g. "High training load"). */
  title: string;
  message: string;
  sport?: string;
  exerciseId?: Id<'Exercise'>;
  detectedAt: number;
}

/**
 * Every insight event shares one payload shape. `severity` is derived from
 * `type` at projection time, so it is not carried on the wire.
 */
export interface InsightEventPayload {
  insightId: Id<'Insight'>;
  title: string;
  message: string;
  sport?: string;
  exerciseId?: Id<'Exercise'>;
}

export type InsightEvent = DomainEvent<InsightType, InsightEventPayload>;

export interface InsightsState {
  insights: Insight[];
}
