// Public contract for the training_plans feature.

// Domain events this feature publishes.
export type {
  TrainingPlanEvent,
  PlanCreatedPayload,
  PlanUpdatedPayload,
  DayAssignedPayload,
  PlanDeletedPayload,
  PlannedSessionCompletedPayload,
} from './domain/types';

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

// ─── Typed event manifest ────────────────────────────────────
import type {
  PlanCreatedPayload,
  PlanUpdatedPayload,
  DayAssignedPayload,
  PlanDeletedPayload,
  PlannedSessionCompletedPayload,
} from './domain/types';

/** All event-bus topics this feature publishes, namespaced to prevent collisions. */
export const TrainingPlansEvents = {
  PlanCreated:               'training_plans/PlanCreated',
  PlanUpdated:               'training_plans/PlanUpdated',
  DayAssigned:               'training_plans/DayAssigned',
  PlanDeleted:               'training_plans/PlanDeleted',
  PlannedSessionCompleted:   'training_plans/PlannedSessionCompleted',
} as const;

export type TrainingPlansEventPayloads = {
  [TrainingPlansEvents.PlanCreated]:             PlanCreatedPayload;
  [TrainingPlansEvents.PlanUpdated]:             PlanUpdatedPayload;
  [TrainingPlansEvents.DayAssigned]:             DayAssignedPayload;
  [TrainingPlansEvents.PlanDeleted]:             PlanDeletedPayload;
  [TrainingPlansEvents.PlannedSessionCompleted]: PlannedSessionCompletedPayload;
};
