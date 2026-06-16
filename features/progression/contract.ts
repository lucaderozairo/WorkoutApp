// Public contract for the progression feature.

// Domain types consumed by UI, screens and data/projections.
export type {
  VolumeEntry,
  ExerciseProgression,
  ProgressionState,
} from './domain/types';

// Session tool types consumed by UI and screens.
export type {
  PreviousExercisePerformance,
  PreviousExerciseSet,
  ProgressiveOverloadHint,
  PlateCalculation,
} from '@shared/contracts';
