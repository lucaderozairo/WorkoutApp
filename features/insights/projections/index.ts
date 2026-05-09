import type { InsightEvent, Insight } from '../domain/types';
import { ProjectionBuilder } from '@data/projections/builders';
import { projectionRegistry } from '@data/projections/builders';
import {
  applyPlateauDetected,
  applyPRAchieved,
  applyVolumeSpike,
  applyFrequencyDrop,
  applyOvertrainingRisk,
} from '../domain/reducers';

export const insightsProjection = new ProjectionBuilder<Insight[], InsightEvent>(
  'insights',
  [],
  {
    PlateauDetected: applyPlateauDetected,
    PRAchieved: applyPRAchieved,
    VolumeSpike: applyVolumeSpike,
    FrequencyDrop: applyFrequencyDrop,
    OvertrainingRisk: applyOvertrainingRisk,
  }
);

projectionRegistry.register('insights', insightsProjection);
