// Public contract for the goals feature.

// Domain events this feature publishes.
export type {
  GoalEvent,
  GoalCreatedPayload,
  GoalProgressUpdatedPayload,
  GoalCompletedPayload,
  GoalDeletedPayload,
} from './domain/types';

// Commands this feature accepts.
export type {
  GoalCommand,
  CreateGoal,
  UpdateGoalProgress,
  CompleteGoal,
  DeleteGoal,
} from './domain/types';

// Domain types consumed by UI and cross-feature code.
export type { Goal, GoalMetric } from './domain/types';

// ─── Typed event manifest ────────────────────────────────────
import type {
  GoalCreatedPayload,
  GoalProgressUpdatedPayload,
  GoalCompletedPayload,
  GoalDeletedPayload,
} from './domain/types';

/** All event-bus topics this feature publishes, namespaced to prevent collisions. */
export const GoalsEvents = {
  GoalCreated:         'goals/GoalCreated',
  GoalProgressUpdated: 'goals/GoalProgressUpdated',
  GoalCompleted:       'goals/GoalCompleted',
  GoalDeleted:         'goals/GoalDeleted',
} as const;

export type GoalsEventPayloads = {
  [GoalsEvents.GoalCreated]:         GoalCreatedPayload;
  [GoalsEvents.GoalProgressUpdated]: GoalProgressUpdatedPayload;
  [GoalsEvents.GoalCompleted]:       GoalCompletedPayload;
  [GoalsEvents.GoalDeleted]:         GoalDeletedPayload;
};
