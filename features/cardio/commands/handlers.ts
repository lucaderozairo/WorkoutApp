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
import {
  recentCardioProjection,
  monthlyCardioProjection,
} from "../projections";

// Cross-feature policies/projections are wired centrally in app/registry/bootstrap.ts.
// This handler registers only cardio's own projections.
projectionRegistry.register("recent_cardio_sessions", recentCardioProjection);
projectionRegistry.register(
  "monthly_cardio_progression",
  monthlyCardioProjection,
);

const cardioProjectionSlots = [
  { key: "recent_cardio_sessions", projection: recentCardioProjection },
  { key: "monthly_cardio_progression", projection: monthlyCardioProjection },
] as const;

export const handleRecordCardioSession = defineCommand<RecordCardioSession, Result<void, string>>({
  projections: cardioProjectionSlots,
  execute: async (cmd, ctx) => {
    if (cmd.durationSeconds < 1) return err("Duration must be at least 1 second");
    if (cmd.distanceMeters < 0) return err("Distance must be non-negative");

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

    await ctx.commit(events);
    return ok(undefined);
  },
});

export const handleUpdateCardioSession = defineCommand<UpdateCardioSession, Result<void, string>>({
  projections: cardioProjectionSlots,
  execute: async (cmd, ctx) => {
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

    await ctx.commit(events);
    return ok(undefined);
  },
});

export const handleDeleteCardioSession = defineCommand<DeleteCardioSession, Result<void, string>>({
  projections: cardioProjectionSlots,
  execute: async (cmd, ctx) => {
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

    await ctx.commit(events);
    return ok(undefined);
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
  const view = viewStore.get('recent_cardio_sessions') ?? { sessions: [] };
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
  projections: cardioProjectionSlots,
  execute: async (cmd, ctx) => {
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

    await ctx.commit(events);
    return ok(undefined);
  },
});
