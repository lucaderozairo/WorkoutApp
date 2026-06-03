// Public contract for the achievements feature.

// Domain events this feature publishes.
export type {
  AchievementEvent,
  AchievementUnlockedPayload,
  AchievementProgressUpdatedPayload,
  AchievementCheckRequestedPayload,
} from './domain/types';

// Commands this feature accepts.
export type { AchievementCommand, CheckAchievements } from './domain/types';

// Domain types consumed by UI and cross-feature code.
export type {
  AchievementRarity,
  AchievementDef,
  AchievementCondition,
  UserAchievement,
  SessionSnapshot,
  CardioSnapshot,
} from './domain/types';

// Query / view-model types consumed by UI.
export type { AchievementView } from './queries';
