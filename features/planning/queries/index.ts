import { viewStore } from '@data/projections/views';
import type { PlannedSession } from '../domain/types';

export function getPlannedSessions(): PlannedSession[] {
  return viewStore.get<PlannedSession[]>('planned_sessions') ?? [];
}

export function getUpcomingPlans(nowMs = Date.now()): PlannedSession[] {
  return getPlannedSessions().filter(p => p.scheduledAt >= nowMs);
}
