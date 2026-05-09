import type { Id, ExerciseCategory } from '@shared/types';
import type {
  PREvent,
  PersonalRecord,
  PRRecordedPayload,
  AnnotationAddedPayload,
  AnnotationDeletedPayload,
  ChartAnnotation,
} from './types';

export function applyPRRecorded(state: PersonalRecord[], event: PREvent): PersonalRecord[] {
  if (event.type !== 'PRRecorded') return state;
  const p = event.payload as PRRecordedPayload;
  const existing = state.findIndex(r => r.exerciseName === p.exerciseName);
  const record: PersonalRecord = {
    exerciseName: p.exerciseName,
    category: p.category,
    valueKg: p.valueKg,
    valueTime: p.valueTime,
    valueDistance: p.valueDistance,
    setAt: event.timestamp,
  };
  if (existing === -1) return [...state, record];
  return state.map((r, i) => (i === existing ? record : r));
}

export function applyAnnotationAdded(
  state: Record<string, ChartAnnotation[]>,
  event: PREvent,
): Record<string, ChartAnnotation[]> {
  if (event.type !== 'AnnotationAdded') return state;
  const p = event.payload as AnnotationAddedPayload;
  const annotation: ChartAnnotation = {
    id: p.annotationId,
    userId: p.userId,
    exerciseName: p.exerciseName,
    dateIso: p.dateIso,
    label: p.label,
    color: p.color,
  };
  const existing = state[p.exerciseName] ?? [];
  return { ...state, [p.exerciseName]: [...existing, annotation] };
}

export function applyAnnotationDeleted(
  state: Record<string, ChartAnnotation[]>,
  event: PREvent,
): Record<string, ChartAnnotation[]> {
  if (event.type !== 'AnnotationDeleted') return state;
  const p = event.payload as AnnotationDeletedPayload;
  const updated: Record<string, ChartAnnotation[]> = {};
  for (const [exercise, annotations] of Object.entries(state)) {
    const filtered = annotations.filter(a => a.id !== p.annotationId);
    if (filtered.length > 0) updated[exercise] = filtered;
  }
  return updated;
}
