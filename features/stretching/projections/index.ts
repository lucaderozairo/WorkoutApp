import type { StretchingEvent } from '../domain/types';
import { ProjectionBuilder } from '@data/projections/builders';
import { applyStretchingLogged } from '../domain/reducers';
import type { StretchingSessionView } from '../domain/reducers';

export type { StretchingSessionView };

/** `stretching_log` — sorted session history, newest first */
export const stretchingLogProjection = new ProjectionBuilder<
  StretchingSessionView[],
  StretchingEvent
>(
  'stretching_log',
  [],
  {
    StretchingLogged: applyStretchingLogged,
  }
);
