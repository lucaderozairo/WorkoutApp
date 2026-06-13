import type { InsightEvent, Insight, InsightType, InsightSeverity } from './types';

const SEVERITY_MAP: Record<InsightType, InsightSeverity> = {
  PlateauDetected: 'warning',
  PRAchieved: 'success',
  VolumeSpike: 'warning',
  FrequencyDrop: 'info',
  OvertrainingRisk: 'warning',
};

/** Keep the projection bounded — insights are a rolling feed, not an archive. */
const MAX_INSIGHTS = 50;

function makeInsight(event: InsightEvent): Insight {
  const p = event.payload;
  return {
    id: p.insightId,
    type: event.type,
    severity: SEVERITY_MAP[event.type] ?? 'info',
    title: p.title,
    message: p.message,
    sport: p.sport,
    exerciseId: p.exerciseId,
    detectedAt: event.timestamp,
  };
}

/**
 * Single reducer for every insight type: append the newest insight and cap the
 * feed. The projection's event-type → reducer map gates dispatch, so a per-type
 * guard here would be dead code.
 */
export function appendInsight(state: Insight[], event: InsightEvent): Insight[] {
  return [makeInsight(event), ...state].slice(0, MAX_INSIGHTS);
}
