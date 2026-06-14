export interface PreviousExerciseSet {
  weightKg?: number;
  reps?: number;
  done?: boolean;
}

export interface PreviousExercisePerformance {
  exerciseName: string;
  lastSessionDate: string;
  sets: PreviousExerciseSet[];
  maxWeightKg?: number;
  estimatedOneRepMax?: number;
}

export interface ProgressiveOverloadHint {
  exerciseName: string;
  kind: 'increase_weight' | 'repeat_weight' | 'no_history';
  message: string;
  suggestedWeightKg?: number;
}

export interface PlateCalculation {
  targetWeightKg: number;
  barWeightKg: number;
  perSide: number[];
  remainderKg: number;
}
