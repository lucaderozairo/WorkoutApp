import type { Id, DomainEvent, ExerciseCategory } from '@shared/types';

export interface PersonalRecord {
  exerciseName: string;
  category: ExerciseCategory;
  valueKg?: number;
  valueTime?: number;       // seconds
  valueDistance?: number;   // meters
  setAt: number;
}

export interface PRState {
  records: PersonalRecord[];
}

export interface PRRecordedPayload {
  exerciseName: string;
  category: ExerciseCategory;
  valueKg?: number;
  valueTime?: number;
  valueDistance?: number;
}

export interface RecordPR {
  type: 'RecordPR';
  userId: Id<'User'>;
  exerciseName: string;
  category: ExerciseCategory;
  valueKg?: number;
  valueTime?: number;
  valueDistance?: number;
}

// ─── Chart Annotations ───────────────────────────────────────

export type AnnotationColor = 'success' | 'warning' | 'info';

export interface ChartAnnotation {
  id: Id<'Annotation'>;
  userId: Id<'User'>;
  exerciseName: string;
  dateIso: string;        // YYYY-MM-DD — aligned to x-axis date
  label: string;
  color: AnnotationColor;
}

export type PREvent =
  | DomainEvent<'PRRecorded', PRRecordedPayload>
  | DomainEvent<'AnnotationAdded', AnnotationAddedPayload>
  | DomainEvent<'AnnotationDeleted', AnnotationDeletedPayload>;

export interface AnnotationAddedPayload {
  annotationId: Id<'Annotation'>;
  userId: Id<'User'>;
  exerciseName: string;
  dateIso: string;
  label: string;
  color: AnnotationColor;
}

export interface AnnotationDeletedPayload {
  annotationId: Id<'Annotation'>;
}

export interface AddAnnotation {
  type: 'AddAnnotation';
  userId: Id<'User'>;
  exerciseName: string;
  dateIso: string;
  label: string;
  color: AnnotationColor;
}

export interface DeleteAnnotation {
  type: 'DeleteAnnotation';
  annotationId: Id<'Annotation'>;
}
