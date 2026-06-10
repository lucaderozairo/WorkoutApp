import type { Id, DomainEvent } from "@shared/types";
import type { GpsTrack } from "@data/sources/files/gps";

export type CardioSport =
  | "run" | "cycle" | "swim" | "row" | "hike" | "ski"
  | "snowboard" | "climb" | "surf" | "kayak"
  | "yoga" | "boxing" | "stretch" | "hiit";

export interface SessionComment {
  text: string;
  createdAt: number;
}

export interface CardioSession {
  id: Id<"CardioSession">;
  userId: Id<"User">;
  sport: CardioSport;
  startedAt: number;
  durationSeconds: number;
  distanceMeters: number;
  notes: string;
  routeId: Id<"Route"> | null;
  rpe?: number;
  gpsTrack?: GpsTrack;
  title?: string;
  location?: string;
  ranWith?: string[];
  comments?: SessionComment[];
  media?: string[];
}

export interface CardioState {
  sessions: CardioSession[];
}

export type CardioEvent =
  | DomainEvent<"CardioSessionRecorded", CardioSessionRecordedPayload>
  | DomainEvent<"CardioSessionUpdated", CardioSessionUpdatedPayload>
  | DomainEvent<"CardioSessionDeleted", CardioSessionDeletedPayload>
  | DomainEvent<"GpsTrackImported", GpsTrackImportedPayload>
  | DomainEvent<"CardioSessionImported", CardioSessionImportedPayload>;

export interface CardioSessionRecordedPayload {
  sessionId: Id<"CardioSession">;
  userId: Id<"User">;
  sport: CardioSport;
  durationSeconds: number;
  distanceMeters: number;
  notes: string;
}

export interface CardioSessionUpdatedPayload {
  sessionId: Id<"CardioSession">;
  durationSeconds?: number;
  distanceMeters?: number;
  notes?: string;
  title?: string;
  location?: string;
  ranWith?: string[];
}

export interface CardioSessionDeletedPayload {
  sessionId: Id<"CardioSession">;
}

export interface RecordCardioSession {
  type: "RecordCardioSession";
  userId: Id<"User">;
  sport: CardioSport;
  durationSeconds: number;
  distanceMeters: number;
  notes: string;
  sessionId?: Id<"CardioSession">;
}

export interface UpdateCardioSession {
  type: "UpdateCardioSession";
  sessionId: Id<"CardioSession">;
  durationSeconds?: number;
  distanceMeters?: number;
  notes?: string;
  title?: string;
  location?: string;
  ranWith?: string[];
}

export interface DeleteCardioSession {
  type: "DeleteCardioSession";
  sessionId: Id<"CardioSession">;
}

export interface GpsTrackImportedPayload {
  sessionId: Id<"CardioSession">;
  track: GpsTrack;
}

export interface CardioSessionImportedPayload {
  sessionId: Id<"CardioSession">;
  sport: string;
  title: string;
  startedAt: number;
  durationSeconds: number;
  distanceMeters: number;
  notes: string;
}

export interface ImportGpsTrack {
  type: "ImportGpsTrack";
  sessionId: Id<"CardioSession">;
  track: GpsTrack;
}

export type CardioCommand =
  | RecordCardioSession
  | UpdateCardioSession
  | DeleteCardioSession
  | ImportGpsTrack;
