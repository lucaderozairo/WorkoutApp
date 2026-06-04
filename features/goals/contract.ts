// Public contract for the goals feature.

// Domain events this feature publishes.
export type { GoalEvent } from './domain/types';

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
