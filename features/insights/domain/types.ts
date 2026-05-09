import type { Id, DomainEvent } from '@shared/types';

export type InsightSeverity = 'info' | 'warning' | 'success';

export interface Insight {
  id: Id<'Insight'>;
  type: 'PlateauDetected' | 'PRAchieved' | 'VolumeSpike' | 'FrequencyDrop' | 'OvertrainingRisk';
  severity: InsightSeverity;
  sport?: string;
  exerciseId?: Id<'Exercise'>;
  message: string;
  detectedAt: number;
}

export interface InsightsState {
  insights: Insight[];
}

export type InsightEvent =
  | DomainEvent<'PlateauDetected', PlateauDetectedPayload>
  | DomainEvent<'PRAchieved', PRAchievedPayload>
  | DomainEvent<'VolumeSpike', VolumeSpikePayload>
  | DomainEvent<'FrequencyDrop', FrequencyDropPayload>
  | DomainEvent<'OvertrainingRisk', OvertrainingRiskPayload>;

export interface PlateauDetectedPayload {
  insightId: Id<'Insight'>;
  exerciseId: Id<'Exercise'>;
  message: string;
}

export interface PRAchievedPayload {
  insightId: Id<'Insight'>;
  exerciseId: Id<'Exercise'>;
  sport?: string;
  message: string;
}

export interface VolumeSpikePayload {
  insightId: Id<'Insight'>;
  sport?: string;
  message: string;
}

export interface FrequencyDropPayload {
  insightId: Id<'Insight'>;
  sport?: string;
  message: string;
}

export interface OvertrainingRiskPayload {
  insightId: Id<'Insight'>;
  message: string;
}
