import type { InsightEvent, Insight } from '../domain/types';

const SEVERITY_MAP: Record<string, Insight['severity']> = {
  PlateauDetected: 'warning',
  PRAchieved: 'success',
  VolumeSpike: 'warning',
  FrequencyDrop: 'info',
  OvertrainingRisk: 'warning',
};

function makeInsight(event: InsightEvent): Insight {
  const payload = event.payload as unknown as Record<string, unknown>;
  return {
    id: payload.insightId as Insight['id'],
    type: event.type as Insight['type'],
    severity: SEVERITY_MAP[event.type] ?? 'info',
    sport: payload.sport as string | undefined,
    exerciseId: payload.exerciseId as Insight['exerciseId'],
    message: payload.message as string,
    detectedAt: event.timestamp,
  };
}

export function applyPlateauDetected(state: Insight[], event: InsightEvent): Insight[] {
  if (event.type !== 'PlateauDetected') return state;
  return [...state, makeInsight(event)];
}

export function applyPRAchieved(state: Insight[], event: InsightEvent): Insight[] {
  if (event.type !== 'PRAchieved') return state;
  return [...state, makeInsight(event)];
}

export function applyVolumeSpike(state: Insight[], event: InsightEvent): Insight[] {
  if (event.type !== 'VolumeSpike') return state;
  return [...state, makeInsight(event)];
}

export function applyFrequencyDrop(state: Insight[], event: InsightEvent): Insight[] {
  if (event.type !== 'FrequencyDrop') return state;
  return [...state, makeInsight(event)];
}

export function applyOvertrainingRisk(state: Insight[], event: InsightEvent): Insight[] {
  if (event.type !== 'OvertrainingRisk') return state;
  return [...state, makeInsight(event)];
}
