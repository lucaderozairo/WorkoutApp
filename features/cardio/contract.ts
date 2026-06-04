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

// ─── Typed event manifest ────────────────────────────────────
import type { CardioSessionRecordedPayload } from './domain/types';

/** All event-bus topics this feature publishes, namespaced to prevent collisions. */
export const CardioEvents = {
  CardioSessionRecorded: 'CardioSessionRecorded',
} as const;

export type CardioEventPayloads = {
  [CardioEvents.CardioSessionRecorded]: CardioSessionRecordedPayload;
};
