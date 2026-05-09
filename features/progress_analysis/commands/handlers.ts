import type { Result } from '@shared/types';
import { ok, err } from '@shared/types';
import type { RecordPR, AddAnnotation, DeleteAnnotation, PREvent } from '../domain/types';
import { cryptoIdGenerator } from '@core/id-generator';
import { systemClock } from '@core/clock';
import { projectionRegistry } from '@data/projections/builders';
import { viewStore } from '@data/projections/views';
import { personalRecordsProjection, chartAnnotationsProjection } from '../projections';

projectionRegistry.register('personal_records', personalRecordsProjection);
projectionRegistry.register('chart_annotations', chartAnnotationsProjection);

export async function handleRecordPR(cmd: RecordPR): Promise<Result<void, string>> {
  const events: PREvent[] = [{
    type: 'PRRecorded',
    aggregateId: cmd.userId,
    aggregateType: 'User',
    timestamp: systemClock.now(),
    version: 1,
    payload: {
      exerciseName: cmd.exerciseName,
      category: cmd.category,
      valueKg: cmd.valueKg,
      valueTime: cmd.valueTime,
      valueDistance: cmd.valueDistance,
    },
  }];

  events.forEach(e => personalRecordsProjection.apply(e));
  viewStore.set('personal_records', personalRecordsProjection.getState());
  return ok(undefined);
}

export async function handleAddAnnotation(cmd: AddAnnotation): Promise<Result<void, string>> {
  if (!cmd.exerciseName.trim()) return err('Exercise name is required');
  if (!cmd.label.trim()) return err('Label is required');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(cmd.dateIso)) return err('Date must be YYYY-MM-DD');

  const annotationId = cryptoIdGenerator.next<'Annotation'>();

  const events: PREvent[] = [{
    type: 'AnnotationAdded',
    aggregateId: cmd.userId,
    aggregateType: 'User',
    timestamp: systemClock.now(),
    version: 1,
    payload: {
      annotationId,
      userId: cmd.userId,
      exerciseName: cmd.exerciseName.trim(),
      dateIso: cmd.dateIso,
      label: cmd.label.trim(),
      color: cmd.color,
    },
  }];

  events.forEach(e => chartAnnotationsProjection.apply(e));
  viewStore.set('chart_annotations', chartAnnotationsProjection.getState());
  return ok(undefined);
}

export async function handleDeleteAnnotation(cmd: DeleteAnnotation): Promise<Result<void, string>> {
  const events: PREvent[] = [{
    type: 'AnnotationDeleted',
    aggregateId: '' as import('@shared/types').Id<'User'>,
    aggregateType: 'User',
    timestamp: systemClock.now(),
    version: 1,
    payload: { annotationId: cmd.annotationId },
  }];

  events.forEach(e => chartAnnotationsProjection.apply(e));
  viewStore.set('chart_annotations', chartAnnotationsProjection.getState());
  return ok(undefined);
}
