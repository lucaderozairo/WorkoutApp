import type { ExerciseCategory, SportType } from '@shared/types';

export interface WorkoutTemplateExercise {
  id: string;
  exerciseId?: string;
  name: string;
  category: ExerciseCategory;
  order: number;
  targetSets?: number;
  targetReps?: number;
  targetWeightKg?: number;
  restSeconds?: number;
  notes?: string;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  primarySport: SportType;
  favorite: boolean;
  exercises: WorkoutTemplateExercise[];
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
}

export interface RecentRoutine {
  id: string;
  name: string;
  primarySport: SportType;
  exercises: WorkoutTemplateExercise[];
  finishedAt: number;
  sourceSessionId: string;
}
