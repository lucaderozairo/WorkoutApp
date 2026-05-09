import { viewStore } from '@data/projections/views';
import type { Id } from '@shared/types';
import type { Goal } from '../domain/types';

export function getActiveGoals(): Goal[] {
  return viewStore.get<Goal[]>('active_goals') ?? [];
}

export function getCompletedGoals(): Goal[] {
  return viewStore.get<Goal[]>('completed_goals') ?? [];
}

export function getGoalById(goalId: Id<'Goal'>): Goal | undefined {
  return [...getActiveGoals(), ...getCompletedGoals()].find((goal) => goal.id === goalId);
}
