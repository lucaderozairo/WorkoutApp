export type {
  AchievementRarity,
  AchievementDef,
  AchievementCondition,
  UserAchievement,
  AchievementsState,
  AchievementEvent,
  AchievementUnlockedPayload,
  AchievementProgressUpdatedPayload,
  AchievementCheckRequestedPayload,
  AchievementCommand,
  CheckAchievements,
  SessionSnapshot,
  CardioSnapshot,
} from './domain/types';

export { ACHIEVEMENT_DEFINITIONS } from './domain/types';

export type { AchievementView } from './queries/types';

export { achievementsProjection } from './projections';

export { handleCheckAchievements } from './commands/handlers';

export { getAchievements, getUnlockedCount, getAchievementById } from './queries';

export { registerAchievementPolicies } from './policies';
