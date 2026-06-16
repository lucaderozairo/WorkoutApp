import type { SetMode } from '@data/static/exercises';

export interface UISet {
  id: string;
  setNumber: number;
  w: string;
  r: string;
  done: boolean;
  warmup: boolean;
  comment: string | null;
  setType?: 'normal' | 'dropset' | 'emom' | 'amrap';
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
  cardioSets?: UICardioSet[];
}

export type UIBlockType = 'single' | 'superset' | 'circuit' | 'emom' | 'amrap' | 'stretch' | 'cardio' | 'transition';

export interface UIBlock {
  id: string;
  type: UIBlockType;
  label?: string;
  tag?: string;
  exercises: UIExercise[];
  memberBlockIds?: string[];
  restSeconds?: number;
  rounds?: number;
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

export const BT_OPTIONS = ['Standard', 'Superset', 'Circuit', 'EMOM', 'AMRAP'] as const;
