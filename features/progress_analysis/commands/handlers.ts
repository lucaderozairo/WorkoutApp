import type { Result } from '@shared/types';
import { ok, err } from '@shared/types';
import type { RecordPR, AddAnnotation, DeleteAnnotation, PREvent } from '../domain/types';
import { cryptoIdGenerator } from '@core/id-generator';
import { systemClock } from '@core/clock';
import { defineCommand } from '@data/define-command';
import { projectionRegistry } from '@data/projections/builders';
import { viewStore } from '@data/projections/views';
import { personalRecordsProjection, chartAnnotationsProjection } from '../projections';

projectionRegistry.register('personal_records', personalRecordsProjection);
projectionRegistry.register('chart_annotations', chartAnnotationsProjection);

export const handleRecordPR = defineCommand<RecordPR, Result<void, string>>({
  execute: async (cmd) => {
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
    return { events, result: ok(undefined) };
  },
});

export const handleAddAnnotation = defineCommand<AddAnnotation, Result<void, string>>({
  execute: async (cmd) => {
    if (!cmd.exerciseName.trim()) return { events: [], result: err('Exercise name is required') };
    if (!cmd.label.trim()) return { events: [], result: err('Label is required') };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(cmd.dateIso)) return { events: [], result: err('Date must be YYYY-MM-DD') };

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
    return { events, result: ok(undefined) };
  },
});

export const handleDeleteAnnotation = defineCommand<DeleteAnnotation, Result<void, string>>({
  execute: async (cmd) => {
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
    return { events, result: ok(undefined) };
  },
});
