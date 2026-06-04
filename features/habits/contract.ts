// Public contract for the habits feature.

// Domain events this feature publishes.
export type {
  HabitEvent,
  HabitCreatedPayload,
  HabitCompletedPayload,
  HabitStreakBrokenPayload,
  HabitDeletedPayload,
  HabitAchievementUnlockedPayload,
} from './domain/types';

// Commands this feature accepts.
export type {
  HabitCommand,
  CreateHabit,
  LogHabitCompletion,
  DeleteHabit,
} from './domain/types';

// Domain types consumed by UI and cross-feature code.
export type { Habit, HabitFrequency } from './domain/types';

// ─── Typed event manifest ────────────────────────────────────
import type {
  HabitCreatedPayload,
  HabitCompletedPayload,
  HabitStreakBrokenPayload,
  HabitDeletedPayload,
  HabitAchievementUnlockedPayload,
} from './domain/types';

/** All event-bus topics this feature publishes, namespaced to prevent collisions. */
export const HabitsEvents = {
  HabitCreated:       'HabitCreated',
  HabitCompleted:     'HabitCompleted',
  HabitStreakBroken:  'HabitStreakBroken',
  HabitDeleted:       'HabitDeleted',
  AchievementUnlocked: 'AchievementUnlocked',
} as const;

export type HabitsEventPayloads = {
  [HabitsEvents.HabitCreated]:        HabitCreatedPayload;
  [HabitsEvents.HabitCompleted]:      HabitCompletedPayload;
  [HabitsEvents.HabitStreakBroken]:   HabitStreakBrokenPayload;
  [HabitsEvents.HabitDeleted]:        HabitDeletedPayload;
  [HabitsEvents.AchievementUnlocked]: HabitAchievementUnlockedPayload;
};
