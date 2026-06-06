import { viewStore } from '@data/projections/views';
import type { PlannedSession, SavedRoute } from '../domain/types';

export function getPlannedSessions(): PlannedSession[] {
  return viewStore.get('planned_sessions') ?? [];
}

export function getUpcomingPlans(nowMs = Date.now()): PlannedSession[] {
  return getPlannedSessions().filter(p => p.scheduledAt >= nowMs);
}

export function getSavedRoutes(): SavedRoute[] {
  return viewStore.get('saved_routes') ?? [];
}
