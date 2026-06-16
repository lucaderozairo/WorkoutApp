export type { VolumeEntry, ExerciseProgression, ProgressionState } from './domain/types';
export type {
  PreviousExercisePerformance,
  PreviousExerciseSet,
  ProgressiveOverloadHint,
  PlateCalculation,
} from '@shared/contracts';
export { registerProgressionPolicy } from './policies/updateProgression';
export { getProgressionForExercise, getAllProgressions } from './queries';
export { getPreviousPerformance, getOverloadHint } from './queries/sessionProgressionQueries';
export { calculatePlates } from './domain/plateCalculator';
