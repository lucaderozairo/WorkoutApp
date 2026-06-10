import type { Result } from '@shared/types';
import { ok, err } from '@shared/types';
import type {
  StartSession,
  AddBlock,
  LogStrengthSet,
  LogCardioSet,
  FinishSession,
  DeleteSession,
  UpdateBlockNote,
  UpdateSessionNote,
  ChangeSetType,
  LogRPE,
  ToggleSetFailed,
  SetBlockType,
  SetBlockRounds,
  RemoveSet,
  UpdateSet,
  UpdateSetComment,
  SetBlockRest,
  RenameSession,
  UpdateSessionStartTime,
  ReorderBlocks,
  AddToSuperset,
  LeaveSuperset,
  RemoveBlock,
  UpdateSessionDetails,
  FinishSessionWithDetails,
  TrainingLogEvent,
  ExerciseSummary,
  SetEntry,
  SessionFinishedPayload,
} from '../domain/types';
import type { ActivityView, ActivitiesState } from '../projections';
import { cryptoIdGenerator } from '@core/id-generator';
import { systemClock } from '@core/clock';
import { defineCommand } from '@data/define-command';
import { projectionRegistry } from '@data/projections/builders';
import { viewStore } from '@data/projections/views';
import {
  sessionProjection,
  recentExercisesProjection,
} from '../projections';

// Cross-feature policies/projections are wired centrally in app/registry/bootstrap.ts.
// This handler registers only training_log's own projections.
projectionRegistry.register('sessions', sessionProjection);
projectionRegistry.register('recent_exercises', recentExercisesProjection);


export function applyAll(events: TrainingLogEvent[]): void {
  events.forEach(e => {
    sessionProjection.apply(e);
    recentExercisesProjection.apply(e);
  });
  const sessions = sessionProjection.getState();
  viewStore.set('sessions', sessions);
  viewStore.set('active_session', sessions.activeId ? sessions.byId[sessions.activeId] ?? null : null);
  viewStore.set('recent_exercises', recentExercisesProjection.getState());
}

const commitTrainingLogEvents = defineCommand<TrainingLogEvent[], Result<void, string>>({
  execute: async (events) => {
    applyAll(events);
    return { events, result: ok(undefined) };
  },
});

const commitSessionStartedEvents = defineCommand<
  { events: TrainingLogEvent[]; sessionId: string },
  Result<{ sessionId: string }, string>
>({
  execute: async ({ events, sessionId }) => {
    applyAll(events);
    return { events, result: ok({ sessionId }) };
  },
});

// ─── Command Handlers ────────────────────────────────────────

export async function handleStartSession(cmd: StartSession): Promise<Result<{ sessionId: string }, string>> {
  if (!cmd.name.trim()) return err('Session name is required');

  const sessionId = cryptoIdGenerator.next<'Session'>();

  const events: TrainingLogEvent[] = [{
    type: 'SessionStarted',
    aggregateId: cmd.userId,
    aggregateType: 'User',
    timestamp: systemClock.now(),
    version: 1,
    payload: {
      sessionId,
      userId: cmd.userId,
      name: cmd.name.trim(),
      primarySport: cmd.primarySport,
    },
  }];

  return commitSessionStartedEvents({ events, sessionId });
}

export async function handleAddBlock(cmd: AddBlock): Promise<Result<void, string>> {
  if (!cmd.exerciseName.trim()) return err('Exercise name is required');

  const sessionsState = viewStore.get<ActivitiesState>('sessions');
  const order = sessionsState?.byId[cmd.sessionId]?.segments.length ?? 0;

  const blockId = cmd.blockId ?? cryptoIdGenerator.next<'Block'>();
  const exerciseId = cryptoIdGenerator.next<'Exercise'>();

  const events: TrainingLogEvent[] = [{
    type: 'BlockAdded',
    aggregateId: cmd.sessionId,
    aggregateType: 'Session',
    timestamp: systemClock.now(),
    version: 1,
    payload: {
      sessionId: cmd.sessionId,
      blockId,
      exerciseId,
      exerciseName: cmd.exerciseName.trim(),
      exerciseCategory: cmd.exerciseCategory,
      order,
    },
  }];

  return commitTrainingLogEvents(events);
}

export async function handleLogStrengthSet(cmd: LogStrengthSet): Promise<Result<void, string>> {
  if (cmd.weightKg < 0) return err('Weight must be non-negative');
  if (cmd.reps < 1) return err('Reps must be at least 1');

  const sessionsStrength = viewStore.get<ActivitiesState>('sessions');
  const blockStrength = sessionsStrength?.byId[cmd.sessionId]?.segments.find(s => s.id === cmd.blockId);
  const setNumber = (blockStrength?.sets.length ?? 0) + 1;

  const events: TrainingLogEvent[] = [{
    type: 'SetLogged',
    aggregateId: cmd.sessionId,
    aggregateType: 'Session',
    timestamp: systemClock.now(),
    version: 1,
    payload: {
      sessionId: cmd.sessionId,
      blockId: cmd.blockId,
      set: {
        setNumber,
        measure: 'weight_reps',
        weightKg: cmd.weightKg,
        reps: cmd.reps,
        isWarmup: cmd.isWarmup,
        isPR: false,
        completedAt: systemClock.now(),
      },
    },
  }];

  return commitTrainingLogEvents(events);
}

export async function handleLogCardioSet(cmd: LogCardioSet): Promise<Result<void, string>> {
  if (cmd.distanceMeters < 0) return err('Distance must be non-negative');
  if (cmd.durationSeconds < 0) return err('Duration must be non-negative');

  const sessionsCardio = viewStore.get<ActivitiesState>('sessions');
  const blockCardio = sessionsCardio?.byId[cmd.sessionId]?.segments.find(s => s.id === cmd.blockId);
  const setNumber = (blockCardio?.sets.length ?? 0) + 1;

  const events: TrainingLogEvent[] = [{
    type: 'SetLogged',
    aggregateId: cmd.sessionId,
    aggregateType: 'Session',
    timestamp: systemClock.now(),
    version: 1,
    payload: {
      sessionId: cmd.sessionId,
      blockId: cmd.blockId,
      set: {
        setNumber,
        measure: 'distance',
        distanceMeters: cmd.distanceMeters,
        durationSeconds: cmd.durationSeconds,
        completedAt: systemClock.now(),
        ...(cmd.avgPowerWatts !== undefined && { avgPowerWatts: cmd.avgPowerWatts }),
        ...(cmd.resistance    !== undefined && { resistance:    cmd.resistance    }),
      },
    },
  }];

  return commitTrainingLogEvents(events);
}

export async function handleFinishSession(cmd: FinishSession): Promise<Result<void, string>> {
  const sessionsState = viewStore.get<ActivitiesState>('sessions');
  const session = sessionsState?.byId[cmd.sessionId];

  if (!session || session.status !== 'active') return err('No active session found');

  const finishedAt = cmd.finishedAt ?? systemClock.now();

  // Build exercise summaries for downstream consumers (progression, coaching)
  const exerciseSummaries: ExerciseSummary[] = session.segments
    .filter(seg => seg.exerciseCategory === 'strength')
    .map(seg => ({
      exerciseName: seg.exerciseName,
      exerciseCategory: seg.exerciseCategory,
      sets: seg.sets.filter((s): s is SetEntry => !s.isWarmup),
    }))
    .filter(s => s.sets.length > 0);

  const enrichedPayload: SessionFinishedPayload = {
    sessionId: cmd.sessionId,
    finishedAt,
    sessionRpe: cmd.sessionRpe,
    tags: cmd.tags,
    exerciseSummaries,
  };

  const events: TrainingLogEvent[] = [{
    type: 'SessionFinished',
    aggregateId: cmd.sessionId,
    aggregateType: 'Session',
    timestamp: finishedAt,
    version: 1,
    payload: enrichedPayload,
  }];

  // sessionProjection.SessionFinished marks status='finished', sets finishedAt, rpe, tags
  // session_history is derived at query time from sessions.byId — no manual push needed
  return commitTrainingLogEvents(events);
}

export async function handleDeleteSession(cmd: DeleteSession): Promise<Result<void, string>> {
  const events: TrainingLogEvent[] = [{
    type: 'SessionDeleted',
    aggregateId: cmd.sessionId,
    aggregateType: 'Session',
    timestamp: systemClock.now(),
    version: 1,
    payload: { sessionId: cmd.sessionId },
  }];

  // sessionProjection.SessionDeleted removes from byId — getSessionHistory() auto-excludes it
  return commitTrainingLogEvents(events);
}

export async function handleUpdateBlockNote(cmd: UpdateBlockNote): Promise<Result<void, string>> {
  const events: TrainingLogEvent[] = [{
    type: 'BlockNoteUpdated',
    aggregateId: cmd.sessionId,
    aggregateType: 'Session',
    timestamp: systemClock.now(),
    version: 1,
    payload: { sessionId: cmd.sessionId, blockId: cmd.blockId, notes: cmd.notes },
  }];

  return commitTrainingLogEvents(events);
}

export async function handleChangeSetType(cmd: ChangeSetType): Promise<Result<void, string>> {
  const events: TrainingLogEvent[] = [{
    type: 'SetTypeChanged',
    aggregateId: cmd.sessionId,
    aggregateType: 'Session',
    timestamp: systemClock.now(),
    version: 1,
    payload: { sessionId: cmd.sessionId, blockId: cmd.blockId, setNumber: cmd.setNumber, setType: cmd.setType },
  }];

  return commitTrainingLogEvents(events);
}

export async function handleLogRPE(cmd: LogRPE): Promise<Result<void, string>> {
  if (cmd.rpe < 1 || cmd.rpe > 10) return err('RPE must be between 1 and 10');

  const events: TrainingLogEvent[] = [{
    type: 'RPELogged',
    aggregateId: cmd.sessionId,
    aggregateType: 'Session',
    timestamp: systemClock.now(),
    version: 1,
    payload: { sessionId: cmd.sessionId, blockId: cmd.blockId, setNumber: cmd.setNumber, rpe: cmd.rpe },
  }];

  return commitTrainingLogEvents(events);
}

export async function handleToggleSetFailed(cmd: ToggleSetFailed): Promise<Result<void, string>> {
  const events: TrainingLogEvent[] = [{
    type: 'SetFailed',
    aggregateId: cmd.sessionId,
    aggregateType: 'Session',
    timestamp: systemClock.now(),
    version: 1,
    payload: { sessionId: cmd.sessionId, blockId: cmd.blockId, setNumber: cmd.setNumber, failed: cmd.failed },
  }];

  return commitTrainingLogEvents(events);
}

export async function handleSetBlockType(cmd: SetBlockType): Promise<Result<void, string>> {
  const events: TrainingLogEvent[] = [{
    type: 'BlockTypeSet',
    aggregateId: cmd.sessionId,
    aggregateType: 'Session',
    timestamp: systemClock.now(),
    version: 1,
    payload: { sessionId: cmd.sessionId, blockId: cmd.blockId, blockType: cmd.blockType },
  }];

  return commitTrainingLogEvents(events);
}

export async function handleSetBlockRounds(cmd: SetBlockRounds): Promise<Result<void, string>> {
  if (cmd.rounds < 1) return err('Rounds must be at least 1');

  const events: TrainingLogEvent[] = [{
    type: 'BlockRoundsSet',
    aggregateId: cmd.sessionId,
    aggregateType: 'Session',
    timestamp: systemClock.now(),
    version: 1,
    payload: { sessionId: cmd.sessionId, blockId: cmd.blockId, rounds: cmd.rounds },
  }];

  return commitTrainingLogEvents(events);
}

async function commit(events: TrainingLogEvent[]): Promise<Result<void, string>> {
  return commitTrainingLogEvents(events);
}

export async function handleRemoveSet(cmd: RemoveSet): Promise<Result<void, string>> {
  return commit([{
    type: 'SetRemoved',
    aggregateId: cmd.sessionId,
    aggregateType: 'Session',
    timestamp: systemClock.now(),
    version: 1,
    payload: { sessionId: cmd.sessionId, blockId: cmd.blockId, setNumber: cmd.setNumber },
  }]);
}

export async function handleUpdateSet(cmd: UpdateSet): Promise<Result<void, string>> {
  if (cmd.weightKg !== undefined && cmd.weightKg < 0) return err('Weight must be non-negative');
  if (cmd.reps !== undefined && cmd.reps < 1) return err('Reps must be at least 1');
  if (cmd.distanceMeters !== undefined && cmd.distanceMeters < 0) return err('Distance must be non-negative');
  if (cmd.durationSeconds !== undefined && cmd.durationSeconds < 0) return err('Duration must be non-negative');

  return commit([{
    type: 'SetUpdated',
    aggregateId: cmd.sessionId,
    aggregateType: 'Session',
    timestamp: systemClock.now(),
    version: 1,
    payload: {
      sessionId: cmd.sessionId,
      blockId: cmd.blockId,
      setNumber: cmd.setNumber,
      weightKg: cmd.weightKg,
      reps: cmd.reps,
      distanceMeters: cmd.distanceMeters,
      durationSeconds: cmd.durationSeconds,
      avgPowerWatts: cmd.avgPowerWatts,
      resistance: cmd.resistance,
      isWarmup: cmd.isWarmup,
      done: cmd.done,
    },
  }]);
}

export async function handleUpdateSetComment(cmd: UpdateSetComment): Promise<Result<void, string>> {
  return commit([{
    type: 'SetCommentUpdated',
    aggregateId: cmd.sessionId,
    aggregateType: 'Session',
    timestamp: systemClock.now(),
    version: 1,
    payload: {
      sessionId: cmd.sessionId,
      blockId: cmd.blockId,
      setNumber: cmd.setNumber,
      comment: cmd.comment,
    },
  }]);
}

export async function handleSetBlockRest(cmd: SetBlockRest): Promise<Result<void, string>> {
  if (cmd.restSeconds < 0 || cmd.restSeconds > 600) return err('Rest must be between 0 and 600 seconds');
  return commit([{
    type: 'BlockRestSet',
    aggregateId: cmd.sessionId,
    aggregateType: 'Session',
    timestamp: systemClock.now(),
    version: 1,
    payload: { sessionId: cmd.sessionId, blockId: cmd.blockId, restSeconds: cmd.restSeconds },
  }]);
}

export async function handleRenameSession(cmd: RenameSession): Promise<Result<void, string>> {
  if (!cmd.name.trim()) return err('Session name is required');
  return commit([{
    type: 'SessionRenamed',
    aggregateId: cmd.sessionId,
    aggregateType: 'Session',
    timestamp: systemClock.now(),
    version: 1,
    payload: { sessionId: cmd.sessionId, name: cmd.name.trim() },
  }]);
}

export async function handleUpdateSessionStartTime(cmd: UpdateSessionStartTime): Promise<Result<void, string>> {
  if (!Number.isFinite(cmd.startedAt) || cmd.startedAt <= 0) return err('Invalid start time');
  return commit([{
    type: 'SessionStartTimeUpdated',
    aggregateId: cmd.sessionId,
    aggregateType: 'Session',
    timestamp: systemClock.now(),
    version: 1,
    payload: { sessionId: cmd.sessionId, startedAt: cmd.startedAt },
  }]);
}

export async function handleReorderBlocks(cmd: ReorderBlocks): Promise<Result<void, string>> {
  if (cmd.blockIds.length === 0) return err('blockIds is required');
  return commit([{
    type: 'BlocksReordered',
    aggregateId: cmd.sessionId,
    aggregateType: 'Session',
    timestamp: systemClock.now(),
    version: 1,
    payload: { sessionId: cmd.sessionId, blockIds: cmd.blockIds },
  }]);
}

export async function handleAddToSuperset(cmd: AddToSuperset): Promise<Result<void, string>> {
  return commit([{
    type: 'BlockAddedToSuperset',
    aggregateId: cmd.sessionId,
    aggregateType: 'Session',
    timestamp: systemClock.now(),
    version: 1,
    payload: { sessionId: cmd.sessionId, blockId: cmd.blockId, groupId: cmd.groupId },
  }]);
}

export async function handleLeaveSuperset(cmd: LeaveSuperset): Promise<Result<void, string>> {
  return commit([{
    type: 'BlockLeftSuperset',
    aggregateId: cmd.sessionId,
    aggregateType: 'Session',
    timestamp: systemClock.now(),
    version: 1,
    payload: { sessionId: cmd.sessionId, blockId: cmd.blockId },
  }]);
}

export async function handleRemoveBlock(cmd: RemoveBlock): Promise<Result<void, string>> {
  return commit([{
    type: 'BlockRemoved',
    aggregateId: cmd.sessionId,
    aggregateType: 'Session',
    timestamp: systemClock.now(),
    version: 1,
    payload: { sessionId: cmd.sessionId, blockId: cmd.blockId },
  }]);
}

export async function handleUpdateSessionNote(cmd: UpdateSessionNote): Promise<Result<void, string>> {
  return commit([{
    type: 'SessionNoteUpdated',
    aggregateId: cmd.sessionId,
    aggregateType: 'Session',
    timestamp: systemClock.now(),
    version: 1,
    payload: { sessionId: cmd.sessionId, notes: cmd.notes },
  }]);
}

export async function handleUpdateSessionDetails(cmd: UpdateSessionDetails): Promise<Result<void, string>> {
  return commit([{
    type: 'SessionUpdated',
    aggregateId: cmd.sessionId,
    aggregateType: 'Session',
    timestamp: systemClock.now(),
    version: 1,
    payload: {
      sessionId: cmd.sessionId,
      ...(cmd.finishedAt !== undefined ? { finishedAt: cmd.finishedAt } : {}),
      ...(cmd.rpe !== undefined ? { rpe: cmd.rpe } : {}),
      ...(cmd.tags !== undefined ? { tags: cmd.tags } : {}),
      ...(cmd.media !== undefined ? { media: cmd.media } : {}),
    },
  }]);
}

export async function handleFinishSessionWithDetails(
  cmd: FinishSessionWithDetails,
): Promise<Result<void, string>> {
  const sessionsState = viewStore.get<ActivitiesState>('sessions');
  const session = sessionsState?.byId[cmd.sessionId];
  if (!session) return err(`Session ${cmd.sessionId} not found`);

  const exerciseSummaries: ExerciseSummary[] = session.segments
    .filter(seg => seg.exerciseCategory === 'strength')
    .map(seg => ({
      exerciseName: seg.exerciseName,
      exerciseCategory: seg.exerciseCategory,
      sets: seg.sets.filter((s): s is SetEntry => !s.isWarmup),
    }))
    .filter(s => s.sets.length > 0);

  const events: TrainingLogEvent[] = [];

  if (cmd.notes !== undefined && cmd.notes !== session.notes) {
    events.push({
      type: 'SessionNoteUpdated',
      aggregateId: cmd.sessionId,
      aggregateType: 'Session',
      timestamp: systemClock.now(),
      version: 1,
      payload: { sessionId: cmd.sessionId, notes: cmd.notes },
    });
  }

  events.push({
    type: 'SessionFinished',
    aggregateId: cmd.sessionId,
    aggregateType: 'Session',
    timestamp: systemClock.now(),
    version: 1,
    payload: {
      sessionId: cmd.sessionId,
      finishedAt: cmd.finishedAt ?? systemClock.now(),
      ...(cmd.sessionRpe !== undefined ? { sessionRpe: cmd.sessionRpe } : {}),
      ...(cmd.tags !== undefined ? { tags: cmd.tags } : {}),
      exerciseSummaries,
    },
  });

  if (cmd.name !== undefined && cmd.name !== session.name) {
    events.push({
      type: 'SessionRenamed',
      aggregateId: cmd.sessionId,
      aggregateType: 'Session',
      timestamp: systemClock.now(),
      version: 1,
      payload: { sessionId: cmd.sessionId, name: cmd.name },
    });
  }

  if (cmd.startedAt !== undefined && cmd.startedAt !== session.startedAt) {
    events.push({
      type: 'SessionStartTimeUpdated',
      aggregateId: cmd.sessionId,
      aggregateType: 'Session',
      timestamp: systemClock.now(),
      version: 1,
      payload: { sessionId: cmd.sessionId, startedAt: cmd.startedAt },
    });
  }

  const hasDetails = cmd.finishedAt !== undefined || cmd.sessionRpe !== undefined || cmd.tags !== undefined || (cmd.media && cmd.media.length > 0);
  if (hasDetails) {
    events.push({
      type: 'SessionUpdated',
      aggregateId: cmd.sessionId,
      aggregateType: 'Session',
      timestamp: systemClock.now(),
      version: 1,
      payload: {
        sessionId: cmd.sessionId,
        ...(cmd.finishedAt !== undefined ? { finishedAt: cmd.finishedAt } : {}),
        ...(cmd.sessionRpe !== undefined ? { rpe: cmd.sessionRpe } : {}),
        ...(cmd.tags !== undefined ? { tags: cmd.tags } : {}),
        ...(cmd.media !== undefined ? { media: cmd.media } : {}),
      },
    });
  }

  return commitTrainingLogEvents(events);
}
