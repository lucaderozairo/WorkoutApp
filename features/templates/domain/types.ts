import type { DomainEvent, ExerciseCategory, Id, Result, SportType } from '@shared/types';
import type { WorkoutTemplate, WorkoutTemplateExercise, RecentRoutine } from '@shared/contracts/templates';

export type { WorkoutTemplate, WorkoutTemplateExercise, RecentRoutine };

export interface TemplateState {
  byId: Record<string, WorkoutTemplate>;
  order: string[];
}

export interface TemplateCreatedPayload {
  template: WorkoutTemplate;
}

export interface TemplateRenamedPayload {
  templateId: string;
  name: string;
  updatedAt: number;
}

export interface TemplateDuplicatedPayload {
  sourceTemplateId: string;
  template: WorkoutTemplate;
}

export interface TemplateDeletedPayload {
  templateId: string;
  deletedAt: number;
}

export interface TemplateFavoriteChangedPayload {
  templateId: string;
  favorite: boolean;
  updatedAt: number;
}

export interface TemplateExerciseAddedPayload {
  templateId: string;
  exercise: WorkoutTemplateExercise;
  updatedAt: number;
}

export interface TemplateExerciseUpdatedPayload {
  templateId: string;
  exerciseId: string;
  patch: Partial<Omit<WorkoutTemplateExercise, 'id'>>;
  updatedAt: number;
}

export interface TemplateExerciseRemovedPayload {
  templateId: string;
  exerciseId: string;
  updatedAt: number;
}

export interface TemplateExercisesReorderedPayload {
  templateId: string;
  exerciseIds: string[];
  updatedAt: number;
}

export interface SessionStartedFromTemplatePayload {
  templateId: string;
  sessionId: Id<'Activity'>;
  userId: Id<'User'>;
}

export type TemplateEvent =
  | DomainEvent<'TemplateCreated', TemplateCreatedPayload>
  | DomainEvent<'TemplateRenamed', TemplateRenamedPayload>
  | DomainEvent<'TemplateDuplicated', TemplateDuplicatedPayload>
  | DomainEvent<'TemplateDeleted', TemplateDeletedPayload>
  | DomainEvent<'TemplateFavoriteChanged', TemplateFavoriteChangedPayload>
  | DomainEvent<'TemplateExerciseAdded', TemplateExerciseAddedPayload>
  | DomainEvent<'TemplateExerciseUpdated', TemplateExerciseUpdatedPayload>
  | DomainEvent<'TemplateExerciseRemoved', TemplateExerciseRemovedPayload>
  | DomainEvent<'TemplateExercisesReordered', TemplateExercisesReorderedPayload>
  | DomainEvent<'SessionStartedFromTemplate', SessionStartedFromTemplatePayload>;

export interface CreateTemplate {
  type: 'CreateTemplate';
  name: string;
  primarySport: SportType;
  exercises: Array<{
    name: string;
    category: ExerciseCategory;
    targetSets?: number;
    targetReps?: number;
    targetWeightKg?: number;
    restSeconds?: number;
    notes?: string;
  }>;
}

export interface RenameTemplate {
  type: 'RenameTemplate';
  templateId: string;
  name: string;
}

export interface DuplicateTemplate {
  type: 'DuplicateTemplate';
  templateId: string;
}

export interface DeleteTemplate {
  type: 'DeleteTemplate';
  templateId: string;
}

export interface SetTemplateFavorite {
  type: 'SetTemplateFavorite';
  templateId: string;
  favorite: boolean;
}

export interface AddTemplateExercise {
  type: 'AddTemplateExercise';
  templateId: string;
  name: string;
  category: ExerciseCategory;
  targetSets?: number;
  targetReps?: number;
  targetWeightKg?: number;
  restSeconds?: number;
  notes?: string;
}

export interface UpdateTemplateExercise {
  type: 'UpdateTemplateExercise';
  templateId: string;
  exerciseId: string;
  patch: Partial<Omit<WorkoutTemplateExercise, 'id'>>;
}

export interface RemoveTemplateExercise {
  type: 'RemoveTemplateExercise';
  templateId: string;
  exerciseId: string;
}

export interface ReorderTemplateExercises {
  type: 'ReorderTemplateExercises';
  templateId: string;
  exerciseIds: string[];
}

export type TemplateCommand =
  | CreateTemplate
  | RenameTemplate
  | DuplicateTemplate
  | DeleteTemplate
  | SetTemplateFavorite
  | AddTemplateExercise
  | UpdateTemplateExercise
  | RemoveTemplateExercise
  | ReorderTemplateExercises;

export type TemplateResult<T = void> = Result<T, string>;
