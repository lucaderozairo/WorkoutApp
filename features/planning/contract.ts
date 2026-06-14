// Public contract for the planning feature.

// Domain events this feature publishes.
export type { PlanningEvent } from './domain/types';

// Commands this feature accepts.
export type {
  PlanningCommand,
  PlanSession,
  DeletePlannedSession,
  SaveTemplate,
  DeleteSavedTemplate,
} from './domain/types';

// Domain types consumed by UI, screens and cross-feature code.
export type {
  PlanType,
  PlannedExercise,
  DistanceMarker,
  PaceTarget,
  PlannedSession,
  TemplateExercise,
  SavedTemplate,
} from './domain/types';
