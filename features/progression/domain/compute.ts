import type { StrengthSet } from '@features/training_log/domain/types';
import type { VolumeEntry } from './types';
import type { Id } from '@shared/types';

/** Epley formula. Returns 0 if weight or reps is 0. */
export function epleyOneRepMax(weight: number, reps: number): number {
  if (weight === 0 || reps === 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

/** Derives a VolumeEntry from a session's strength sets for one exercise. */
export function computeVolumeEntry(
  date: string,
  sets: StrengthSet[],
  sessionId: Id<'Session'>,
): VolumeEntry {
  const workingSets = sets.filter(s => !s.isWarmup);

  const warmupSets = sets.filter(s => s.isWarmup);
  if (workingSets.length === 0) {
    return { date, sessionId, sets: 0, totalReps: 0, maxWeightKg: 0, volume: 0, oneRepMaxEstimate: 0, setWeights: [], setReps: [], warmupWeights: warmupSets.map(s => s.weightKg) };
  }

  const volume = workingSets.reduce((sum, s) => sum + s.weightKg * s.reps, 0);
  const totalReps = workingSets.reduce((sum, s) => sum + s.reps, 0);
  const maxWeightKg = Math.max(...workingSets.map(s => s.weightKg));
  const oneRepMaxEstimate = Math.max(
    ...workingSets.map(s => epleyOneRepMax(s.weightKg, s.reps)),
  );

  return {
    date,
    sessionId,
    sets: workingSets.length,
    totalReps,
    maxWeightKg,
    volume,
    oneRepMaxEstimate,
    setWeights: workingSets.map(s => s.weightKg),
    setReps: workingSets.map(s => s.reps),
    warmupWeights: warmupSets.map(s => s.weightKg),
  };
}

/**
 * Returns true if the last 3 entries in history show < 2% total volume increase.
 * Requires at least 3 entries.
 */
export function detectPlateau(history: VolumeEntry[]): boolean {
  if (history.length < 3) return false;
  const last3 = history.slice(-3);
  const first = last3[0].volume;
  const last = last3[2].volume;
  if (first === 0) return false;
  const pctIncrease = (last - first) / first;
  return pctIncrease < 0.02;
}
