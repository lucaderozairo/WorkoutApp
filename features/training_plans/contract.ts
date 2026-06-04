// Public contract for the training_plans feature.

// Domain events this feature publishes.
export type { TrainingPlanEvent } from './domain/types';

// Commands this feature accepts.
export type {
  TrainingPlanCommand,
  CreatePlan,
  UpdatePlan,
  AssignWorkoutToDay,
  DeletePlan,
} from './domain/types';

// Domain types consumed by UI, screens and data/projections.
export type {
  TrainingPlan,
  PlanWeek,
  PlanDay,
  PlanDayAssignment,
  DayOfWeek,
  PlanAdherence,
} from './domain/types';
