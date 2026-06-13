import type { InsightEvent, Insight, InsightType } from '../domain/types';
import { INSIGHT_TYPES } from '../domain/types';
import { ProjectionBuilder } from '@data/projections/builders';
import { projectionRegistry } from '@data/projections/builders';
import { appendInsight } from '../domain/reducers';

// Every insight type uses the same append reducer; build the map from the
// taxonomy so adding a type can't drift out of sync with the projection.
const reducers = Object.fromEntries(
  INSIGHT_TYPES.map((type) => [type, appendInsight]),
) as Record<InsightType, typeof appendInsight>;

export const insightsProjection = new ProjectionBuilder<Insight[], InsightEvent>(
  'insights',
  [],
  reducers,
);

projectionRegistry.register('insights', insightsProjection);
