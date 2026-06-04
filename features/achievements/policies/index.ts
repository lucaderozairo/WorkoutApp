import { eventBus } from '@core/events/bus';
import { viewStore } from '@data/projections/views';
import { handleCheckAchievements } from '../commands/handlers';
import type { SessionSnapshot, CardioSnapshot } from '../domain/types';
import { TrainingLogEvents } from '@features/training_log/contract';
import type { ActivitiesState, ActivityView } from '@features/training_log/contract';
import { CardioEvents } from '@features/cardio/contract';
import type { RecentCardioView } from '@features/cardio/contract';

/**
 * Achievement policies react to domain events from other features.
 * This is the sanctioned cross-feature communication path per LAYER_RULES.md:
 * features communicate through events, never direct imports.
 */

function buildSnapshots(): { sessions: SessionSnapshot[]; cardio: CardioSnapshot[] } {
  const sessionsState = viewStore.get<ActivitiesState>('sessions') ?? { byId: {}, activeId: null };
  const sessionHistory = Object.values(sessionsState.byId)
    .filter((s): s is ActivityView & { startedAt: number } => s.status === 'finished' && s.startedAt != null);
  const cardioView = viewStore.get<RecentCardioView>('recent_cardio_sessions');

  const sessions: SessionSnapshot[] = sessionHistory.map(s => ({
    category: s.segments.some(seg => seg.exerciseCategory === 'cardio') ? 'cardio' : 'strength',
    name: s.name,
    hasPR: s.segments.some(seg => seg.sets.some(set => set.isPR === true)),
    startedAt: s.startedAt,
  }));

  const cardio: CardioSnapshot[] = (cardioView?.sessions ?? []).map(s => ({
    sport: s.sport,
    distanceMeters: s.distanceMeters,
  }));

  return { sessions, cardio };
}

/**
 * Register event bus subscriptions for achievement checking.
 * Call this once during app initialization.
 */
export function registerAchievementPolicies(): void {
  // When a training session finishes, check achievements
  eventBus.subscribe(TrainingLogEvents.SessionFinished, async () => {
    const { sessions, cardio } = buildSnapshots();
    await handleCheckAchievements({
      type: 'CheckAchievements',
      userId: 'user-001' as import('@shared/types').Id<'User'>,
      sessionHistory: sessions,
      cardioSessions: cardio,
    });
  });

  // When a cardio session is recorded, check achievements
  eventBus.subscribe(CardioEvents.CardioSessionRecorded, async () => {
    const { sessions, cardio } = buildSnapshots();
    await handleCheckAchievements({
      type: 'CheckAchievements',
      userId: 'user-001' as import('@shared/types').Id<'User'>,
      sessionHistory: sessions,
      cardioSessions: cardio,
    });
  });
}
