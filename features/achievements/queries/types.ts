import type { AchievementDef } from '../domain/types';

export interface AchievementView {
  id: string;
  name: string;
  description: string;
  rarity: AchievementDef['rarity'];
  unlocked: boolean;
  unlockedAt: number | null;
  progress: number;
}
