import { eventBus } from '@core/events/bus';
import { viewStore } from '@data/projections/views';
import { handleCheckAchievements } from '../commands/handlers';
import type { SessionSnapshot, CardioSnapshot } from '../domain/types';

/**
 * Achievement policies react to domain events from other features.
 * This is the sanctioned cross-feature communication path per LAYER_RULES.md:
 * features communicate through events, never direct imports.
 */

/** Local mirrors of view types — avoids importing from other features. */
interface SessionBlock {
  exerciseCategory: string;
  sets: Array<{ type: string; isPR?: boolean }>;
}

interface SessionView {
  status: string;
  name: string;
  startedAt: number | null;
  blocks: SessionBlock[];
}

interface SessionsState {
  byId: Record<string, SessionView>;
  activeId: string | null;
}

interface CardioSessionView {
  sport: string;
  distanceMeters: number;
}

function buildSnapshots(): { sessions: SessionSnapshot[]; cardio: CardioSnapshot[] } {
  const sessionsState = viewStore.get<SessionsState>('sessions') ?? { byId: {}, activeId: null };
  const sessionHistory = Object.values(sessionsState.byId)
    .filter((s): s is SessionView & { startedAt: number } => s.status === 'finished' && s.startedAt != null);
  const cardioView = viewStore.get<{ sessions: CardioSessionView[] }>('recent_cardio_sessions');

  const sessions: SessionSnapshot[] = sessionHistory.map(s => ({
    category: s.blocks.some(b => b.exerciseCategory === 'cardio') ? 'cardio' : 'strength',
    name: s.name,
    hasPR: s.blocks.some(b => b.sets.some(set => set.type === 'strength' && set.isPR)),
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
  eventBus.subscribe('SessionFinished', async () => {
    const { sessions, cardio } = buildSnapshots();
    await handleCheckAchievements({
      type: 'CheckAchievements',
      userId: 'user-001' as import('@shared/types').Id<'User'>,
      sessionHistory: sessions,
      cardioSessions: cardio,
    });
  });

  // When a cardio session is recorded, check achievements
  eventBus.subscribe('CardioSessionRecorded', async () => {
    const { sessions, cardio } = buildSnapshots();
    await handleCheckAchievements({
      type: 'CheckAchievements',
      userId: 'user-001' as import('@shared/types').Id<'User'>,
      sessionHistory: sessions,
      cardioSessions: cardio,
    });
  });
}
