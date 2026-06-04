// Public contract for the training_log feature.
// External consumers (UI, screens, cross-feature policies, shared utils) import
// only the types declared here. Runtime values (handlers, queries, projections)
// remain in index.ts.

// Domain events this feature publishes + the payloads consumed cross-feature.
export type {
  TrainingLogEvent,
  SessionFinishedPayload,
} from './domain/types';

// Commands this feature accepts.
export type {
  TrainingLogCommand,
  StartSession,
  AddBlock,
  LogStrengthSet,
  LogCardioSet,
  FinishSession,
  DeleteSession,
} from './domain/types';

// Domain types consumed by UI components, screens, policies and shared utils.
export type {
  SportType,
  ExerciseCategory,
  SetEntry,
  StrengthSet,
  CardioSet,
} from './domain/types';

// Projection / view-model types consumed by UI, screens and shared utils.
export type {
  ActivityView,
  ActivitiesState,
  ActivityHistoryItem,
  SegmentView,
  RecentExercise,
} from './projections';

// UI view types consumed by session/log components.
export type {
  UISet,
  UICardioSet,
  UIExercise,
  UIBlock,
  UIBlockType,
  UICondition,
  DeleteTarget,
} from './projections/viewTypes';

// Calendar helper types consumed by log/calendar components.
export type { CombinedSession, TypeFilter } from './queries/calendarUtils';

// ─── Typed event manifest ────────────────────────────────────
import type { SessionFinishedPayload } from './domain/types';

/** All event-bus topics this feature publishes, namespaced to prevent collisions. */
export const TrainingLogEvents = {
  SessionFinished: 'SessionFinished',
} as const;

export type TrainingLogEventPayloads = {
  [TrainingLogEvents.SessionFinished]: SessionFinishedPayload;
};
