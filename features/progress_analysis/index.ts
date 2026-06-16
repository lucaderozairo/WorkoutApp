export type { PersonalRecord, PRState, PREvent, RecordPR, ChartAnnotation, AnnotationColor, AddAnnotation, DeleteAnnotation } from './domain/types';
export { personalRecordsProjection, chartAnnotationsProjection } from './projections';
export { handleRecordPR, handleAddAnnotation, handleDeleteAnnotation } from './commands/handlers';
export { getPersonalRecords, getStatsSummary, getActivityFeed, getAnnotations } from './queries';
export type { StatsSummary, ActivityFeedEntry } from './queries/types';
export type { DailyLoad, AcuteChronicResult, HRZone } from './domain/trainingLoad';
export { computeSessionLoad, computeAcuteChronic, computeHRZones } from './domain/trainingLoad';
export { registerTrainingLoadProjection } from './projections/trainingLoad';
