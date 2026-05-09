export type {
  Goal,
  GoalMetric,
  GoalEvent,
  GoalCommand,
  CreateGoal,
  UpdateGoalProgress,
  CompleteGoal,
  DeleteGoal,
} from './domain/types';
export {
  handleCreateGoal,
  handleUpdateGoalProgress,
  handleCompleteGoal,
  handleDeleteGoal,
} from './commands/handlers';
export {
  activeGoalsProjection,
  completedGoalsProjection,
  registerGoalProjections,
} from './projections';
export { registerGoalUpdatePolicy } from './policies/updateGoals';
export { getActiveGoals, getCompletedGoals, getGoalById } from './queries';
