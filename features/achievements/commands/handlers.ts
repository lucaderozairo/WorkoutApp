import type { Result } from '@shared/types';
import { ok } from '@shared/types';
import type {
  CheckAchievements,
  AchievementEvent,
  AchievementDef,
  UserAchievement,
} from '../domain/types';
import {
  ACHIEVEMENT_DEFINITIONS,
} from '../domain/types';
import { systemClock } from '@core/clock';
import { defineCommand } from '@data/define-command';
import { projectionRegistry } from '@data/projections/builders';
import { viewStore } from '@data/projections/views';
import { achievementsProjection } from '../projections';
import { checkAchievementCondition } from '../domain/evaluators';
import type { EvalContext } from '../domain/evaluators';

projectionRegistry.register('user_achievements', achievementsProjection);

// ─── Achievement Checking Logic ──────────────────────────────

function checkAchievement(
  def: AchievementDef,
  currentAchievement: UserAchievement | undefined,
  ctx: EvalContext,
): AchievementEvent[] {
  if (currentAchievement?.unlockedAt) return [];

  const result = checkAchievementCondition(def, ctx);
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

    const ctx: EvalContext = {
      sessions: cmd.sessionHistory,
      cardioSessions: cmd.cardioSessions,
    };

    for (const def of ACHIEVEMENT_DEFINITIONS) {
      const current = currentState.find(a => a.achievementId === def.id);
      const events = checkAchievement(def, current, ctx);
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
