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
  TrainingLogEvent,
  ExerciseSummary,
  StrengthSet,
  SessionFinishedPayload,
} from '../domain/types';
import type { ActiveSessionView, SessionHistoryItem } from '../projections';
import { cryptoIdGenerator } from '@core/id-generator';
import { systemClock } from '@core/clock';
import { eventBus } from '@core/events/bus';
import { AggregateRepository } from '@data/repositories';
import { projectionRegistry } from '@data/projections/builders';
import { viewStore } from '@data/projections/views';
import { trainingLogReducers, initialTrainingLogState } from '../domain/reducers';
import {
  activeSessionProjection,
  sessionHistoryProjection,
  editingSessionProjection,
  recentExercisesProjection,
} from '../projections';
import { registerProgressionPolicy } from '@features/progression';
import { registerCoachingPolicy } from '@features/coaching';
import { registerTrainingPlanProjections, registerAdherencePolicy } from '@features/training_plans';
import { registerGoalProjections, registerGoalUpdatePolicy } from '@features/goals';
import { registerHabitProjections, registerStreakMilestonePolicy } from '@features/habits';
import { registerTrainingLoadProjection } from '@features/progress_analysis';
import { registerBodyProjections, registerEquipmentMileagePolicy } from '@features/profile';

// Register cross-feature policies
registerProgressionPolicy();
registerCoachingPolicy();
registerTrainingPlanProjections();
registerAdherencePolicy();
registerGoalProjections();
registerGoalUpdatePolicy();
registerHabitProjections();
registerStreakMilestonePolicy();
registerTrainingLoadProjection();
registerBodyProjections();
registerEquipmentMileagePolicy();

// Register projections
projectionRegistry.register('active_session', activeSessionProjection);
projectionRegistry.register('session_history', sessionHistoryProjection);
projectionRegistry.register('editing_session', editingSessionProjection);
projectionRegistry.register('recent_exercises', recentExercisesProjection);

const repository = new AggregateRepository(
  initialTrainingLogState,
  trainingLogReducers
);

function applyAll(events: TrainingLogEvent[]): void {
  events.forEach(e => {
    activeSessionProjection.apply(e);
    editingSessionProjection.apply(e);
    recentExercisesProjection.apply(e);
  });
  viewStore.set('active_session', activeSessionProjection.getState());
  viewStore.set('editing_session', editingSessionProjection.getState());
  viewStore.set('recent_exercises', recentExercisesProjection.getState());
}

// ─── Command Handlers ────────────────────────────────────────

export async function handleStartSession(cmd: StartSession): Promise<Result<void, string>> {
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
    },
  }];

  await repository.save(events);
  applyAll(events);
  return ok(undefined);
}

export async function handleAddBlock(cmd: AddBlock): Promise<Result<void, string>> {
  if (!cmd.exerciseName.trim()) return err('Exercise name is required');

  const current = viewStore.get<{ blocks: Array<{ id: string }> }>('active_session');
  const order = current?.blocks.length ?? 0;

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

  await repository.save(events);
  applyAll(events);
  return ok(undefined);
}

export async function handleLogStrengthSet(cmd: LogStrengthSet): Promise<Result<void, string>> {
  if (cmd.weightKg < 0) return err('Weight must be non-negative');
  if (cmd.reps < 1) return err('Reps must be at least 1');

  const current = viewStore.get<{ blocks: Array<{ id: string; sets: unknown[] }> }>('active_session');
  const block = current?.blocks.find(b => b.id === cmd.blockId);
  const setNumber = (block?.sets.length ?? 0) + 1;

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
        type: 'strength',
        setNumber,
        weightKg: cmd.weightKg,
        reps: cmd.reps,
        isWarmup: cmd.isWarmup,
        isPR: false,
        completedAt: systemClock.now(),
      },
    },
  }];

  await repository.save(events);
  applyAll(events);
  return ok(undefined);
}

export async function handleLogCardioSet(cmd: LogCardioSet): Promise<Result<void, string>> {
  if (cmd.distanceMeters < 0) return err('Distance must be non-negative');
  if (cmd.durationSeconds < 0) return err('Duration must be non-negative');

  const current = viewStore.get<{ blocks: Array<{ id: string; sets: unknown[] }> }>('active_session');
  const block = current?.blocks.find(b => b.id === cmd.blockId);
  const setNumber = (block?.sets.length ?? 0) + 1;

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
        type: 'cardio',
        setNumber,
        distanceMeters: cmd.distanceMeters,
        durationSeconds: cmd.durationSeconds,
        completedAt: systemClock.now(),
        ...(cmd.avgPowerWatts !== undefined && { avgPowerWatts: cmd.avgPowerWatts }),
        ...(cmd.resistance    !== undefined && { resistance:    cmd.resistance    }),
      },
    },
  }];

  await repository.save(events);
  applyAll(events);
  return ok(undefined);
}

export async function handleFinishSession(cmd: FinishSession): Promise<Result<void, string>> {
  const session = viewStore.get<ActiveSessionView>('active_session');

  if (!session || !session.id || session.id !== cmd.sessionId) return err('No active session found');

  const finishedAt = systemClock.now();

  // Build exercise summaries for downstream consumers (progression, coaching)
  const exerciseSummaries: ExerciseSummary[] = session.blocks
    .filter(b => b.exerciseCategory === 'strength')
    .map(b => ({
      exerciseName: b.exerciseName,
      exerciseCategory: b.exerciseCategory,
      sets: b.sets.filter((s): s is StrengthSet => s.type === 'strength'),
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

  await repository.save(events);

  // Build history item and push to session_history view
  const totalSets = session.blocks.reduce((acc, b) => acc + b.sets.length, 0);
  const durationSeconds = session.startedAt
    ? Math.floor((finishedAt - session.startedAt) / 1000)
    : 0;
  const dominantCategory = session.blocks[0]?.exerciseCategory ?? 'strength';

  const historyItem: SessionHistoryItem = {
    id: cmd.sessionId,
    name: session.name,
    startedAt: session.startedAt ?? finishedAt,
    finishedAt,
    durationSeconds,
    totalSets,
    exerciseCount: session.blocks.length,
    hasPR: false,
    category: (dominantCategory === 'cardio' ? 'cardio' : dominantCategory === 'mobility' ? 'mobility' : 'strength') as 'strength' | 'cardio' | 'mobility',
  };

  const existing = viewStore.get<SessionHistoryItem[]>('session_history') ?? [];
  viewStore.set('session_history', [historyItem, ...existing]);

  applyAll(events);

  // Notify other features via event bus with enriched payload
  await eventBus.publish({
    type: 'SessionFinished',
    aggregateId: cmd.sessionId,
    aggregateType: 'Session',
    timestamp: finishedAt,
    version: 1,
    payload: enrichedPayload,
  });

  return ok(undefined);
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

  await repository.save(events);
  applyAll(events);

  const existing = viewStore.get<SessionHistoryItem[]>('session_history') ?? [];
  viewStore.set('session_history', existing.filter(s => s.id !== cmd.sessionId));

  return ok(undefined);
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

  await repository.save(events);
  applyAll(events);
  return ok(undefined);
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

  await repository.save(events);
  applyAll(events);
  return ok(undefined);
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

  await repository.save(events);
  applyAll(events);
  return ok(undefined);
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

  await repository.save(events);
  applyAll(events);
  return ok(undefined);
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

  await repository.save(events);
  applyAll(events);
  return ok(undefined);
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

  await repository.save(events);
  applyAll(events);
  return ok(undefined);
}

async function commit(events: TrainingLogEvent[]): Promise<Result<void, string>> {
  await repository.save(events);
  applyAll(events);
  return ok(undefined);
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

export async function handleUpdateTrainingSession(cmd: {
  sessionId: string;
  name?: string;
  notes?: string;
  startedAt?: number;
  comments?: import('@features/cardio/domain/types').SessionComment[];
  media?: string[];
}): Promise<void> {
  const history = viewStore.get<SessionHistoryItem[]>('session_history') ?? [];
  viewStore.set('session_history', history.map(s =>
    s.id !== cmd.sessionId ? s : {
      ...s,
      name:      cmd.name      ?? s.name,
      notes:     cmd.notes     ?? (s as unknown as { notes?: string }).notes,
      startedAt: cmd.startedAt ?? s.startedAt,
      comments:  cmd.comments,
      media:     cmd.media,
    }
  ));
}
