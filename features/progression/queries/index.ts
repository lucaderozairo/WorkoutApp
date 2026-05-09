import { viewStore } from '@data/projections/views';
import type { ExerciseProgression, ProgressionState } from '../domain/types';

export function getProgressionForExercise(exerciseName: string): ExerciseProgression | null {
  const state = viewStore.get<ProgressionState>('exercise_progressions');
  return state?.[exerciseName] ?? null;
}

export function getAllProgressions(): ExerciseProgression[] {
  const state = viewStore.get<ProgressionState>('exercise_progressions');
  if (!state) return [];
  return Object.values(state).sort((a, b) => a.exerciseName.localeCompare(b.exerciseName));
}
