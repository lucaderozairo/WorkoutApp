export type {
  ReadinessEntry,
  ReadinessState,
  ReadinessEvent,
  LogReadiness,
  HealthMetricsEntry,
  LogHealthMetrics,
  HealthMetricsLoggedPayload,
  SleepEntry,
  SleepState,
  SleepLoggedPayload,
  LogSleep,
  ImportSleepFromCSV,
  WeeklySleepTrend,
  RestingHREntry,
  RestingHRLoggedPayload,
  LogRestingHR,
  SubjectiveRPEEntry,
  SubjectiveRPELoggedPayload,
  LogSubjectiveRPE,
} from './domain/types';

export type {
  TodayReadinessView,
  HealthMetricsView,
  SleepEntryView,
  RestingHRView,
  SubjectiveRPEView,
} from './projections';

export {
  todayReadinessProjection,
  healthMetricsProjection,
  sleepHistoryProjection,
  restingHRProjection,
  subjectiveRPEProjection,
} from './projections';

export {
  handleLogReadiness,
  handleLogHealthMetrics,
  handleLogSleep,
  handleImportSleepFromCSV,
  handleLogRestingHR,
  handleLogSubjectiveRPE,
} from './commands/handlers';

export { parseGarminSleepYearCSV } from './domain/parseGarminSleepYearCSV';

export {
  getTodayReadiness,
  getSleepHistory,
  getHealthMetrics,
  getRestingHRHistory,
  getSubjectiveRPEHistory,
  getTodaySubjectiveRPE,
  sleepEntryToSession,
} from './queries';

export type { SleepSession } from './domain/mock-types';

export type { SleepTrendView, WeeklyTrendEntry, SleepScorePoint } from './projections/sleepTrendTypes';
export { registerSleepTrendProjection } from './projections/sleepTrend';
