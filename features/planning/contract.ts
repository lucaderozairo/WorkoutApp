// Public contract for the planning feature.

// Domain events this feature publishes.
export type { PlanningEvent } from './domain/types';

// Commands this feature accepts.
export type {
  PlanningCommand,
  PlanSession,
  DeletePlannedSession,
  SaveRoute,
  DeleteSavedRoute,
  SaveTemplate,
  DeleteSavedTemplate,
} from './domain/types';

// Domain types consumed by UI, screens and cross-feature code.
export type {
  PlanType,
  PlannedExercise,
  DistanceMarker,
  PlannedSession,
  SavedRoute,
  TemplateExercise,
  SavedTemplate,
} from './domain/types';
