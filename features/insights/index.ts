export type { Insight, InsightSeverity, InsightEvent, InsightsState } from './domain/types';
export { insightsProjection } from './projections';
export { getInsights, getInsightsForSport, getInsightsForExercise } from './queries';
export { emitPRAchieved, emitPlateauDetected, emitVolumeSpike, emitFrequencyDrop, emitOvertrainingRisk } from './commands/handlers';
