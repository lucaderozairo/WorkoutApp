import type { AchievementEvent, UserAchievement } from '../domain/types';
import { ProjectionBuilder } from '@data/projections/builders';
import {
  applyAchievementUnlocked,
  applyAchievementProgressUpdated,
  applyAchievementCheckRequested,
} from '../domain/reducers';

/** `user_achievements` — all user achievements with unlock status */
export const achievementsProjection = new ProjectionBuilder<
  UserAchievement[],
  AchievementEvent
>(
  'user_achievements',
  [],
  {
    AchievementUnlocked: applyAchievementUnlocked,
    AchievementProgressUpdated: applyAchievementProgressUpdated,
    AchievementCheckRequested: applyAchievementCheckRequested,
  }
);
