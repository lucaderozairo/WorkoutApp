import { viewStore } from '@data/projections/views';
import type { Id } from '@shared/types';
import type {
  ActiveSessionView,
  SessionHistoryItem,
  EditingSessionsView,
  RecentExercise,
} from '../projections';
import { findEditingSession } from '../projections';
import type { TrainingSession } from '../domain/types';

export function getActiveSession(): ActiveSessionView | null {
  return viewStore.get<ActiveSessionView>('active_session') ?? null;
}

export function getSessionHistory(): SessionHistoryItem[] {
  return viewStore.get<SessionHistoryItem[]>('session_history') ?? [];
}

export function getEditingSession(sessionId: Id<'Session'>): TrainingSession | undefined {
  const view = viewStore.get<EditingSessionsView>('editing_session');
  if (!view) return undefined;
  return findEditingSession(view, sessionId);
}

export function getRecentExercises(limit?: number): RecentExercise[] {
  const all = viewStore.get<RecentExercise[]>('recent_exercises') ?? [];
  return typeof limit === 'number' ? all.slice(0, limit) : all;
}
