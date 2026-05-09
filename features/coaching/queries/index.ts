import { viewStore } from '@data/projections/views';
import type { CoachingInsight } from '../domain/types';

export function getActiveInsights(): CoachingInsight[] {
  return viewStore.get<CoachingInsight[]>('active_insights') ?? [];
}

export function getInsightHistory(): CoachingInsight[] {
  return viewStore.get<CoachingInsight[]>('insight_history') ?? [];
}
