// Public contract for the habits feature.

// Domain events this feature publishes.
export type { HabitEvent } from './domain/types';

// Commands this feature accepts.
export type {
  HabitCommand,
  CreateHabit,
  LogHabitCompletion,
  DeleteHabit,
} from './domain/types';

// Domain types consumed by UI and cross-feature code.
export type { Habit, HabitFrequency } from './domain/types';
