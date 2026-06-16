import { viewStore } from '@data/projections/views';
import { findPreviousPerformance, generateOverloadHint } from '../domain/sessionTools';
import type { ProgressiveOverloadHint } from '@shared/contracts';
import type { PreviousExercisePerformance } from '@shared/contracts';

export function getPreviousPerformance(exerciseName: string): PreviousExercisePerformance | undefined {
  const state = viewStore.get('exercise_progressions');
  if (!state) return undefined;
  return findPreviousPerformance(exerciseName, state);
}

export function getOverloadHint(
  exerciseName: string,
  currentWeightKg?: number,
): ProgressiveOverloadHint {
  const state = viewStore.get('exercise_progressions');
  const prev = state ? findPreviousPerformance(exerciseName, state) : undefined;
  return generateOverloadHint(prev, currentWeightKg);
}
