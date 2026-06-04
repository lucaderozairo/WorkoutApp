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
export const HabitEvents = {
  HabitCreated:       'habits/HabitCreated',
  HabitCompleted:     'habits/HabitCompleted',
  HabitStreakBroken:  'habits/HabitStreakBroken',
  HabitDeleted:       'habits/HabitDeleted',
  AchievementUnlocked: 'habits/AchievementUnlocked',
} as const;

export type HabitEventPayloads = {
  [HabitEvents.HabitCreated]:        HabitCreatedPayload;
  [HabitEvents.HabitCompleted]:      HabitCompletedPayload;
  [HabitEvents.HabitStreakBroken]:   HabitStreakBrokenPayload;
  [HabitEvents.HabitDeleted]:        HabitDeletedPayload;
  [HabitEvents.AchievementUnlocked]: HabitAchievementUnlockedPayload;
};
