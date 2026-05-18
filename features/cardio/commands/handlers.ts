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
import { eventBus } from "@core/events/bus";
import { inMemoryEventStore } from "@data/store";
import { projectionRegistry } from "@data/projections/builders";
import { viewStore } from "@data/projections/views";
import { loadFromStorage } from "@data/sources/local/persistence";
import {
  recentCardioProjection,
  monthlyCardioProjection,
  type RecentCardioView,
} from "../projections";
import {
  registerGoalProjections,
  registerGoalUpdatePolicy,
} from "@features/goals";
import { registerTrainingLoadProjection } from "@features/progress_analysis";
import {
  registerBodyProjections,
  registerEquipmentMileagePolicy,
} from "@features/profile";

// Register projections
projectionRegistry.register("recent_cardio_sessions", recentCardioProjection);
projectionRegistry.register(
  "monthly_cardio_progression",
  monthlyCardioProjection,
);
registerGoalProjections();
registerGoalUpdatePolicy();
registerTrainingLoadProjection();
registerBodyProjections();
registerEquipmentMileagePolicy();

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

export async function handleRecordCardioSession(
  cmd: RecordCardioSession,
): Promise<Result<void, string>> {
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

  for (const e of events) await inMemoryEventStore.append(e);
  applyAndStore(events);

  // Notify other features via event bus
  await eventBus.publish({
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
      recordedAt: systemClock.now(),
    },
  });

  return ok(undefined);
}

export async function handleUpdateCardioSession(
  cmd: UpdateCardioSession,
): Promise<Result<void, string>> {
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

  for (const e of events) await inMemoryEventStore.append(e);
  applyAndStore(events);
  return ok(undefined);
}

export async function handleDeleteCardioSession(
  cmd: DeleteCardioSession,
): Promise<Result<void, string>> {
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

  for (const e of events) await inMemoryEventStore.append(e);
  applyAndStore(events);
  return ok(undefined);
}

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

export async function handleImportGpsTrack(
  cmd: import("../domain/types").ImportGpsTrack,
): Promise<Result<void, string>> {
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

  for (const e of events) await inMemoryEventStore.append(e);
  applyAndStore(events);
  return ok(undefined);
}
