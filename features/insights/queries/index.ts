import { viewStore } from '@data/projections/views';
import type { Insight } from '../domain/types';
import type { Id } from '@shared/types';

export function getInsights(): Insight[] {
  return viewStore.get<Insight[]>('insights') ?? [];
}

export function getInsightsForSport(sport: string): Insight[] {
  return getInsights().filter(i => i.sport === sport);
}

export function getInsightsForExercise(exerciseId: Id<'Exercise'>): Insight[] {
  return getInsights().filter(i => i.exerciseId === exerciseId);
}
