import { viewStore } from '@data/projections/views';
import type { RecentCardioView, MonthlyCardioEntry } from '../projections';
import type { CardioSport } from '../domain/types';

export function getRecentCardioSessions(sport?: CardioSport): RecentCardioView {
  const view = viewStore.get('recent_cardio_sessions');
  if (!view) return { sessions: [] };
  return sport ? { sessions: view.sessions.filter(s => s.sport === sport) } : view;
}

export function getMonthlyProgression(sport?: CardioSport): MonthlyCardioEntry[] {
  const all = viewStore.get('monthly_cardio_progression') ?? [];
  return sport ? all.filter(m => m.sport === sport) : all;
}
