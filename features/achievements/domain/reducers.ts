import type {
  AchievementEvent,
  AchievementUnlockedPayload,
  AchievementProgressUpdatedPayload,
  UserAchievement,
} from './types';

export function applyAchievementUnlocked(state: UserAchievement[], event: AchievementEvent): UserAchievement[] {
  if (event.type !== 'AchievementUnlocked') return state;
  const p = event.payload as AchievementUnlockedPayload;
  const existing = state.find(a => a.achievementId === p.achievementId);
  if (existing) {
    return state.map(a =>
      a.achievementId === p.achievementId
        ? { ...a, unlockedAt: p.unlockedAt, progress: 100 }
        : a
    );
  }
  return [
    ...state,
    { achievementId: p.achievementId, unlockedAt: p.unlockedAt, progress: 100 },
  ];
}

export function applyAchievementProgressUpdated(state: UserAchievement[], event: AchievementEvent): UserAchievement[] {
  if (event.type !== 'AchievementProgressUpdated') return state;
  const p = event.payload as AchievementProgressUpdatedPayload;
  const existing = state.find(a => a.achievementId === p.achievementId);
  if (existing) {
    return state.map(a =>
      a.achievementId === p.achievementId
        ? { ...a, progress: p.progress }
        : a
    );
  }
  return [
    ...state,
    { achievementId: p.achievementId, unlockedAt: null, progress: p.progress },
  ];
}

export function applyAchievementCheckRequested(state: UserAchievement[]): UserAchievement[] {
  return state;
}
