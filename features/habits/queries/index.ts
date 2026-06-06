import { viewStore } from '@data/projections/views';
import type { Id } from '@shared/types';
import type { Habit } from '../domain/types';

export function getHabitsToday(): Habit[] {
  return viewStore.get('habits_today') ?? [];
}

export function getHabitById(habitId: Id<'Habit'>): Habit | undefined {
  return getHabitsToday().find((habit) => habit.id === habitId);
}
