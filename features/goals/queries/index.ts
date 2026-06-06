import { viewStore } from '@data/projections/views';
import type { Id } from '@shared/types';
import type { Goal } from '../domain/types';

export function getActiveGoals(): Goal[] {
  return viewStore.get('active_goals') ?? [];
}

export function getCompletedGoals(): Goal[] {
  return viewStore.get('completed_goals') ?? [];
}

export function getGoalById(goalId: Id<'Goal'>): Goal | undefined {
  return [...getActiveGoals(), ...getCompletedGoals()].find((goal) => goal.id === goalId);
}
