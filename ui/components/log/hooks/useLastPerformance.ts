import { useMemo } from 'react';
import { getProgressionForExercise } from '@features/progression';
import type { VolumeEntry } from '@features/progression/domain/types';

export interface LastPerformance {
  date: string;
  maxWeightKg: number;
  totalReps: number;
  sets: number;
}

export function useLastPerformance(exerciseName: string | null | undefined): LastPerformance | null {
  return useMemo(() => {
    if (!exerciseName) return null;
    const progression = getProgressionForExercise(exerciseName);
    if (!progression || progression.history.length === 0) return null;
    const last: VolumeEntry = progression.history[progression.history.length - 1]!;
    return {
      date: last.date,
      maxWeightKg: last.maxWeightKg,
      totalReps: last.totalReps,
      sets: last.sets,
    };
  }, [exerciseName]);
}
