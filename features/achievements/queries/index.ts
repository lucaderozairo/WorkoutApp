import type { UserAchievement } from '../domain/types';
import { viewStore } from '@data/projections/views';
import { ACHIEVEMENT_DEFINITIONS, AchievementDef } from '../domain/types';

export interface AchievementView {
  id: string;
  name: string;
  description: string;
  rarity: AchievementDef['rarity'];
  unlocked: boolean;
  unlockedAt: number | null;
  progress: number;
}

export function getAchievements(): AchievementView[] {
  const userAchievements = viewStore.get('user_achievements') ?? [];

  return ACHIEVEMENT_DEFINITIONS.map(def => {
    const user = userAchievements.find(a => a.achievementId === def.id);
    return {
      id: def.id,
      name: def.name,
      description: def.description,
      rarity: def.rarity,
      unlocked: !!user?.unlockedAt,
      unlockedAt: user?.unlockedAt ?? null,
      progress: user?.progress ?? 0,
    };
  });
}

export function getUnlockedCount(): number {
  const userAchievements = viewStore.get('user_achievements') ?? [];
  return userAchievements.filter(a => a.unlockedAt).length;
}

export function getAchievementById(id: string): AchievementView | null {
  const achievements = getAchievements();
  return achievements.find(a => a.id === id) ?? null;
}
