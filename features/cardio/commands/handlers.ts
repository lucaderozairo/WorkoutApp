import type { Result } from "@shared/types";
import { ok, err } from "@shared/types";
import type {
  RecordCardioSession,
  UpdateCardioSession,
  DeleteCardioSession,
  CardioEvent,
} from "../domain/types";
import { cryptoIdGenerator } from "@core/id-generator";
import { systemClock } from "@core/clock";
import { defineCommand } from "@data/define-command";
import { projectionRegistry } from "@data/projections/builders";
import { viewStore } from "@data/projections/views";
import { loadFromStorage } from "@data/sources/local/persistence";
import {
  recentCardioProjection,
  monthlyCardioProjection,
  type RecentCardioView,
} from "../projections";

// Cross-feature policies/projections are wired centrally in app/registry/bootstrap.ts.
// This handler registers only cardio's own projections.
projectionRegistry.register("recent_cardio_sessions", recentCardioProjection);
projectionRegistry.register(
  "monthly_cardio_progression",
  monthlyCardioProjection,
);

function applyAndStore(events: CardioEvent[]): void {
  // Sync projection from the live state before applying. viewStore is preferred
  // (most up-to-date), but falls back to localStorage in case viewStore was
  // reset by HMR or hasn't been populated yet (e.g. seed bypassed the projection).
  const liveCardio =
    viewStore.get<RecentCardioView>("recent_cardio_sessions") ??
    loadFromStorage<RecentCardioView>("recent_cardio_sessions");
  if (liveCardio) recentCardioProjection.setState(liveCardio);

  events.forEach((e) => {
    recentCardioProjection.apply(e);
    monthlyCardioProjection.apply(e);
  });
  viewStore.set("recent_cardio_sessions", recentCardioProjection.getState());
  viewStore.set(
    "monthly_cardio_progression",
    monthlyCardioProjection.getState(),
  );
}

export const handleRecordCardioSession = defineCommand<RecordCardioSession, Result<void, string>>({
  execute: async (cmd) => {
    if (cmd.durationSeconds < 1) return { events: [], result: err("Duration must be at least 1 second") };
    if (cmd.distanceMeters < 0) return { events: [], result: err("Distance must be non-negative") };

    const sessionId = cmd.sessionId ?? cryptoIdGenerator.next<"CardioSession">();
    const events: CardioEvent[] = [
      {
        type: "CardioSessionRecorded",
        aggregateId: cmd.userId,
        aggregateType: "User",
        timestamp: systemClock.now(),
        version: 1,
        payload: {
          sessionId,
          userId: cmd.userId,
          sport: cmd.sport,
          durationSeconds: cmd.durationSeconds,
          distanceMeters: cmd.distanceMeters,
          notes: cmd.notes,
        },
      },
    ];

    applyAndStore(events);

    return { events, result: ok(undefined) };
  },
});

export const handleUpdateCardioSession = defineCommand<UpdateCardioSession, Result<void, string>>({
  execute: async (cmd) => {
    const events: CardioEvent[] = [
      {
        type: "CardioSessionUpdated",
        aggregateId: cmd.sessionId,
        aggregateType: "CardioSession",
        timestamp: systemClock.now(),
        version: 1,
        payload: {
          sessionId: cmd.sessionId,
          durationSeconds: cmd.durationSeconds,
          distanceMeters: cmd.distanceMeters,
          notes:     cmd.notes,
          title:     cmd.title,
          location:  cmd.location,
          ranWith:   cmd.ranWith,
        },
      },
    ];

    applyAndStore(events);
    return { events, result: ok(undefined) };
  },
});

export const handleDeleteCardioSession = defineCommand<DeleteCardioSession, Result<void, string>>({
  execute: async (cmd) => {
    const events: CardioEvent[] = [
      {
        type: "CardioSessionDeleted",
        aggregateId: cmd.sessionId,
        aggregateType: "CardioSession",
        timestamp: systemClock.now(),
        version: 1,
        payload: { sessionId: cmd.sessionId },
      },
    ];

    applyAndStore(events);
    return { events, result: ok(undefined) };
  },
});

export async function handleUpdateCardioSessionFull(cmd: {
  sessionId: string;
  title?: string;
  notes?: string;
  distanceMeters?: number;
  durationSeconds?: number;
  startedAt?: number;
  comments?: import('../domain/types').SessionComment[];
  media?: string[];
}): Promise<void> {
  const view = viewStore.get<import('../projections').RecentCardioView>('recent_cardio_sessions') ?? { sessions: [] };
  viewStore.set('recent_cardio_sessions', {
    sessions: view.sessions.map(s =>
      s.id !== cmd.sessionId ? s : {
        ...s,
        title:           cmd.title           ?? s.title,
        notes:           cmd.notes           ?? s.notes,
        distanceMeters:  cmd.distanceMeters  ?? s.distanceMeters,
        durationSeconds: cmd.durationSeconds ?? s.durationSeconds,
        startedAt:       cmd.startedAt       ?? s.startedAt,
        comments:        cmd.comments        ?? s.comments,
        media:           cmd.media           ?? s.media,
      }
    ),
  });
}

export const handleImportGpsTrack = defineCommand<import("../domain/types").ImportGpsTrack, Result<void, string>>({
  execute: async (cmd) => {
    const events: CardioEvent[] = [
      {
        type: "GpsTrackImported",
        aggregateId: cmd.sessionId,
        aggregateType: "CardioSession",
        timestamp: systemClock.now(),
        version: 1,
        payload: {
          sessionId: cmd.sessionId,
          track: cmd.track,
        },
      },
    ];

    applyAndStore(events);
    return { events, result: ok(undefined) };
  },
});
