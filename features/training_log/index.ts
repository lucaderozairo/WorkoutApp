export type {
  // New types
  Activity,
  ActivityStatus,
  ActivityPartner,
  ActivityComment,
  ActivityLogState,
  SportType,
  SetEntry,
  SetMeasure,
  Segment,
  StrengthSegment,
  CompositeSegment,
  CardioSegment,
  TransitionSegment,
  SourceContribution,
  DataProvider,
  DataSourceId,
  ActivityMetrics,
  MetricKey,
  ExerciseCategory,
  Exercise,
  StrengthSet,
  CardioSet,
  Block,
  TrainingSession,
  TrainingLogEvent,
  TrainingLogCommand,
  StartSession,
  StartSessionFromTemplate,
  AddBlock,
  LogStrengthSet,
  LogCardioSet,
  FinishSession,
  DeleteSession,
  UpdateBlockNote,
  UpdateSessionNote,
  ChangeSetType,
  LogRPE,
  ToggleSetFailed,
  SetBlockType,
  SetBlockRounds,
  RemoveSet,
  UpdateSet,
  UpdateSetComment,
  SetBlockRest,
  RenameSession,
  UpdateSessionStartTime,
  ReorderBlocks,
  AddToSuperset,
  LeaveSuperset,
  RemoveBlock,
  UpdateSessionDetails,
  FinishSessionWithDetails,
} from './domain/types';

export type {
  ActivityView,
  ActivitiesState,
  ActivityHistoryItem,
  SegmentView,
  RecentExercise,
} from './projections';

export { applyAll as replayTrainingLogEvents } from './commands/handlers';

export {
  handleStartSession,
  handleStartSessionFromTemplate,
  handleAddBlock,
  handleLogStrengthSet,
  handleLogCardioSet,
  handleFinishSession,
  handleDeleteSession,
  handleUpdateBlockNote,
  handleUpdateSessionNote,
  handleChangeSetType,
  handleLogRPE,
  handleToggleSetFailed,
  handleSetBlockType,
  handleSetBlockRounds,
  handleRemoveSet,
  handleUpdateSet,
  handleUpdateSetComment,
  handleSetBlockRest,
  handleRenameSession,
  handleUpdateSessionStartTime,
  handleReorderBlocks,
  handleAddToSuperset,
  handleLeaveSuperset,
  handleRemoveBlock,
  handleUpdateSessionDetails,
  handleFinishSessionWithDetails,
} from './commands/handlers';

export {
  getActiveSession,
  getActivity,
  getActivityHistory,
  getRecentExercises,
} from './queries';

export { isActivityView, isActivityHistoryItem, isStrengthSet } from './guards';

export {
  sessionProjection,
  recentExercisesProjection,
} from './projections';

export type { TrainingDashboardView } from './projections/dashboardTypes';
export { registerTrainingDashboardProjection } from './projections/dashboard';

export type {
  UISet,
  UICardioSet,
  UIExercise,
  UIBlock,
  UIBlockType,
  UICondition,
  DeleteTarget,
} from './projections/viewTypes';
export { EXERCISE_GROUPS, BT_OPTIONS } from './projections/viewTypes';

export {
  domainBlocksToUIBlocks,
  sessionDateLabel,
  getWarnings,
  worstSev,
  worstActiveCondition,
} from './projections/mappers';

export type { CombinedSession, TypeFilter } from './queries/calendarUtils';
export {
  toDateKey,
  buildDateMap,
  getWeekStart,
  formatWeekRange,
  getMonthGrid,
} from './queries/calendarUtils';
