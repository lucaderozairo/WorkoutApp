import type { NutritionEvent } from '../domain/types';
import { ProjectionBuilder } from '@data/projections/builders';
import { applyNutritionLogged, applyNutritionEntryDeleted } from '../domain/reducers';
import type { NutritionEntryView } from '../domain/reducers';

export type { NutritionEntryView };

/** `nutrition_log` — all nutrition entries, newest first */
export const nutritionLogProjection = new ProjectionBuilder<
  NutritionEntryView[],
  NutritionEvent
>(
  'nutrition_log',
  [],
  {
    NutritionLogged: applyNutritionLogged,
    NutritionEntryDeleted: applyNutritionEntryDeleted,
  }
);
