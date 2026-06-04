// Public contract for the stretching feature.

// Domain events this feature publishes.
export type { StretchingEvent, StretchingLoggedPayload } from './domain/types';

// Commands this feature accepts.
export type { StretchingCommand, LogStretching } from './domain/types';

// Domain types consumed by UI and screens.
export type { StretchingMode, StretchingSession } from './domain/types';

// Projection / view-model types consumed by data/projections and screens.
export type { StretchingSessionView } from './projections';
