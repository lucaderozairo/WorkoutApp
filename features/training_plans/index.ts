// features/training_plans/index.ts
export type {
  TrainingPlan, PlanWeek, PlanDay, PlanDayAssignment, DayOfWeek,
  PlanAdherence, TrainingPlanEvent, TrainingPlanCommand,
  CreatePlan, UpdatePlan, AssignWorkoutToDay, DeletePlan,
} from './domain/types';

export {
  handleCreatePlan,
  handleUpdatePlan,
  handleAssignWorkoutToDay,
  handleDeletePlan,
} from './commands/handlers';

export {
  activePlanProjection,
  planListProjection,
  planAdherenceProjection,
  registerTrainingPlanProjections,
} from './projections';

export { registerAdherencePolicy } from './policies/trackAdherence';

export {
  getActivePlan,
  getPlanList,
  getPlanById,
  getPlanAdherence,
} from './queries';
