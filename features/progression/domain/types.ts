import type { Id } from '@shared/types';

export interface VolumeEntry {
  date: string;           // ISO date string 'YYYY-MM-DD'
  sessionId: Id<'Session'>;
  sets: number;           // working sets count (excludes warmups)
  totalReps: number;
  maxWeightKg: number;
  volume: number;         // sum of weightKg * reps per working set
  oneRepMaxEstimate: number; // Epley: max(weight * (1 + reps/30)) across working sets
  setWeights: number[];   // working set weights in order (excludes warmups)
  setReps: number[];      // working set reps in order (excludes warmups)
  warmupWeights: number[]; // warmup set weights in order
}

export interface ExerciseProgression {
  exerciseName: string;
  history: VolumeEntry[];
  plateauDetected: boolean; // true if last 3 sessions show < 2% volume increase
}

export type ProgressionState = Record<string, ExerciseProgression>; // keyed by exerciseName
