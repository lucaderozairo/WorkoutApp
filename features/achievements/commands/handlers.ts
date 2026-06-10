import type { Result } from '@shared/types';
import { ok } from '@shared/types';
import type {
  CheckAchievements,
  AchievementEvent,
  AchievementDef,
  UserAchievement,
  SessionSnapshot,
  CardioSnapshot,
} from '../domain/types';
import {
  ACHIEVEMENT_DEFINITIONS,
} from '../domain/types';
import { systemClock } from '@core/clock';
import { defineCommand } from '@data/define-command';
import { projectionRegistry } from '@data/projections/builders';
import { viewStore } from '@data/projections/views';
import { achievementsProjection } from '../projections';

projectionRegistry.register('user_achievements', achievementsProjection);

// ─── Achievement Checking Logic ──────────────────────────────

function checkSessionCount(
  def: AchievementDef,
  sessions: SessionSnapshot[],
): { unlocked: boolean; progress: number } {
  let count: number;

  const cond = def.condition;
  if (cond.sport === 'strength') {
    count = sessions.filter(s => s.category === 'strength').length;
  } else {
    count = sessions.length;
  }

  return {
    unlocked: count >= def.condition.threshold,
    progress: Math.min(count, def.condition.threshold),
  };
}

function checkPRWeight(
  def: AchievementDef,
  sessions: SessionSnapshot[],
): { unlocked: boolean; progress: number } {
  const exerciseName = def.condition.exerciseName!;

  let maxWeight = 0;
  for (const session of sessions) {
    if (session.hasPR && session.name.toLowerCase().includes(exerciseName.toLowerCase())) {
      maxWeight = def.condition.threshold;
    }
  }

  return {
    unlocked: maxWeight >= def.condition.threshold,
    progress: maxWeight,
  };
}

function checkCardioDistance(
  def: AchievementDef,
  cardioSessions: CardioSnapshot[],
): { unlocked: boolean; progress: number } {
  const sport = def.condition.sport;

  let maxDistance = 0;
  for (const s of cardioSessions) {
    if (s.sport === sport) {
      maxDistance = Math.max(maxDistance, s.distanceMeters);
    }
  }

  return {
    unlocked: maxDistance >= def.condition.threshold,
    progress: maxDistance,
  };
}

function checkConsecutiveDays(
  def: AchievementDef,
  sessions: SessionSnapshot[],
): { unlocked: boolean; progress: number } {
  if (sessions.length === 0) return { unlocked: false, progress: 0 };

  const daySet = new Set<string>();
  const now = new Date();
  for (const session of sessions) {
    const d = new Date(session.startedAt);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    daySet.add(key);
  }

  let streak = 0;
  for (let i = 0; i < def.condition.threshold + 10; i++) {
    const checkDate = new Date(now);
    checkDate.setDate(checkDate.getDate() - i);
    const key = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;
    if (daySet.has(key)) {
      streak++;
    } else {
      break;
    }
  }

  return {
    unlocked: streak >= def.condition.threshold,
    progress: streak,
  };
}

function checkAchievement(
  def: AchievementDef,
  currentAchievement: UserAchievement | undefined,
  sessions: SessionSnapshot[],
  cardioSessions: CardioSnapshot[],
): AchievementEvent[] {
  // Skip if already unlocked
  if (currentAchievement?.unlockedAt) return [];

  let result: { unlocked: boolean; progress: number };

  switch (def.condition.type) {
    case 'session_count':
      result = checkSessionCount(def, sessions);
      break;
    case 'pr_weight':
      result = checkPRWeight(def, sessions);
      break;
    case 'cardio_distance':
      result = checkCardioDistance(def, cardioSessions);
      break;
    case 'consecutive_days':
      result = checkConsecutiveDays(def, sessions);
      break;
    default:
      return [];
  }

  const events: AchievementEvent[] = [];

  if (result.unlocked && !currentAchievement?.unlockedAt) {
    events.push({
      type: 'AchievementUnlocked',
      aggregateId: 'user-001' as import('@shared/types').Id<'User'>,
      aggregateType: 'User',
      timestamp: systemClock.now(),
      version: 1,
      payload: {
        userId: 'user-001' as import('@shared/types').Id<'User'>,
        achievementId: def.id,
        unlockedAt: systemClock.now(),
      },
    });
  } else {
    events.push({
      type: 'AchievementProgressUpdated',
      aggregateId: 'user-001' as import('@shared/types').Id<'User'>,
      aggregateType: 'User',
      timestamp: systemClock.now(),
      version: 1,
      payload: {
        userId: 'user-001' as import('@shared/types').Id<'User'>,
        achievementId: def.id,
        progress: result.progress,
      },
    });
  }

  return events;
}

// ─── Command Handler ─────────────────────────────────────────

export const handleCheckAchievements = defineCommand<CheckAchievements, Result<void, string>>({
  execute: async (cmd) => {
    const currentState = viewStore.get<UserAchievement[]>('user_achievements') ?? [];
    const allEvents: AchievementEvent[] = [];

    for (const def of ACHIEVEMENT_DEFINITIONS) {
      const current = currentState.find(a => a.achievementId === def.id);
      const events = checkAchievement(def, current, cmd.sessionHistory, cmd.cardioSessions);
      allEvents.push(...events);
    }

    // Apply all events to projection
    for (const event of allEvents) {
      achievementsProjection.apply(event);
    }

    viewStore.set('user_achievements', achievementsProjection.getState());

    return { events: allEvents, result: ok(undefined) };
  },
});
