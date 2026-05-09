export type {
  Habit,
  HabitFrequency,
  HabitEvent,
  HabitCommand,
  CreateHabit,
  LogHabitCompletion,
  DeleteHabit,
} from './domain/types';
export {
  handleCreateHabit,
  handleLogHabitCompletion,
  handleDeleteHabit,
} from './commands/handlers';
export { habitsTodayProjection, registerHabitProjections } from './projections';
export { registerStreakMilestonePolicy } from './policies/streakMilestones';
export { getHabitsToday, getHabitById } from './queries';
