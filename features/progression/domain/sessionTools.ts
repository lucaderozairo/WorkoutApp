import type { ExerciseProgression } from './types';
import type {
  PreviousExercisePerformance,
  ProgressiveOverloadHint,
} from '@shared/contracts';

export function findPreviousPerformance(
  exerciseName: string,
  progressions: Record<string, ExerciseProgression>,
): PreviousExercisePerformance | undefined {
  const prog = progressions[exerciseName];
  if (!prog || prog.history.length === 0) return undefined;

  const lastSession = prog.history[prog.history.length - 1];
  const sets = lastSession.setWeights.map((w, i) => ({
    weightKg: w,
    reps: lastSession.setReps[i],
    done: true,
  }));

  return {
    exerciseName,
    lastSessionDate: lastSession.date,
    sets,
    maxWeightKg: lastSession.maxWeightKg,
    estimatedOneRepMax: lastSession.oneRepMaxEstimate,
  };
}

export function generateOverloadHint(
  prev: PreviousExercisePerformance | undefined,
  currentWeightKg?: number,
): ProgressiveOverloadHint {
  if (!prev) {
    return {
      exerciseName: '',
      kind: 'no_history',
      message: 'No previous data — log this session to start tracking progression',
    };
  }

  const prevMax = prev.maxWeightKg ?? 0;
  const currentMax = currentWeightKg ?? 0;

  if (currentMax >= prevMax && prevMax > 0) {
    const suggestedWeightKg = roundToNearest(prevMax + 2.5, 2.5);
    return {
      exerciseName: prev.exerciseName,
      kind: 'increase_weight',
      message: `You matched or exceeded last session's max (${prevMax}kg) — try ${suggestedWeightKg}kg`,
      suggestedWeightKg,
    };
  }

  return {
    exerciseName: prev.exerciseName,
    kind: 'repeat_weight',
    message: `Last session you hit ${prevMax}kg — repeat this weight before increasing`,
  };
}

function roundToNearest(value: number, nearest: number): number {
  return Math.round(value / nearest) * nearest;
}
