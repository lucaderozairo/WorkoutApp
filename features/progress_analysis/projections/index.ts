import type { Id } from '@shared/types';
import type { PREvent, PersonalRecord, ChartAnnotation } from '../domain/types';
import { ProjectionBuilder } from '@data/projections/builders';
import {
  applyPRRecorded,
  applyAnnotationAdded,
  applyAnnotationDeleted,
} from '../domain/reducers';

export const personalRecordsProjection = new ProjectionBuilder<
  PersonalRecord[],
  PREvent
>(
  'personal_records',
  [],
  {
    PRRecorded: applyPRRecorded,
  }
);

/** `chart_annotations` — annotations grouped by exercise */
export const chartAnnotationsProjection = new ProjectionBuilder<
  Record<string, ChartAnnotation[]>,
  PREvent
>(
  'chart_annotations',
  {},
  {
    AnnotationAdded: applyAnnotationAdded,
    AnnotationDeleted: applyAnnotationDeleted,
  }
);
