import type { SetMode } from '@data/static/exercises';

export interface UISet {
  id: string;
  setNumber: number;
  w: string;
  r: string;
  done: boolean;
  warmup: boolean;
  comment: string | null;
}

export interface UICardioSet {
  setNumber: number;
  durationSeconds: number;
  distanceMeters: number;
  avgPowerWatts: number;
  resistance: number;
}

export interface UIExercise {
  blockId?: string;
  label?: string;
  name: string;
  comment?: string | null;
  hold?: string;
  muscle?: string;
  setMode?: SetMode;
  sets?: UISet[];
  cardioSet?: UICardioSet | null;
}

export type UIBlockType = 'single' | 'superset' | 'circuit' | 'stretch' | 'cardio';

export interface UIBlock {
  id: string;
  type: UIBlockType;
  label?: string;
  tag?: string;
  exercises: UIExercise[];
  memberBlockIds?: string[];
  restSeconds?: number;
  exerciseName: string;
}

export interface UICondition {
  id: string;
  active: boolean;
  severity: 'mild' | 'moderate' | 'severe';
  fullName: string;
  bodyPart: string;
  affectedExercises: string[];
  advice: string;
}

export interface DeleteTarget {
  blockId: string;
  exIdx: number;
  setId: string;
  label: string;
}

export const EXERCISE_GROUPS = ['All', 'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Cardio', 'Mobility'] as const;

export const BT_OPTIONS = ['Standard', 'Superset', 'Circuit'] as const;
