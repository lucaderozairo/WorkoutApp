// Public contract for the cardio feature.

// Domain events this feature publishes.
export type { CardioEvent, GpsTrackImportedPayload } from './domain/types';

// Commands this feature accepts.
export type {
  CardioCommand,
  RecordCardioSession,
  UpdateCardioSession,
  DeleteCardioSession,
  ImportGpsTrack,
} from './domain/types';

// Domain types consumed by UI, screens, shared utils and cross-feature code.
export type { CardioSport, CardioSession, SessionComment } from './domain/types';

// Projection / view-model types consumed by screens and widgets.
export type { RecentCardioView, MonthlyCardioEntry } from './projections';
