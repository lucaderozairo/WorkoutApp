import type { Id, DomainEvent, ExerciseCategory } from '@shared/types';
import type { SessionComment } from '@features/cardio/domain/types';

// ─── Value Types ─────────────────────────────────────────────

export type { ExerciseCategory };

export interface Exercise {
  id: Id<'Exercise'>;
  name: string;
  category: ExerciseCategory;
}

export interface StrengthSet {
  type: 'strength';
  setNumber: number;
  weightKg: number;
  reps: number;
  isWarmup: boolean;
  isPR: boolean;
  completedAt: number;
  done?: boolean;
  setType?: 'normal' | 'dropset' | 'giant' | 'emom' | 'amrap';
  rpe?: number | null;
  failed?: boolean;
  comment?: string;
}

export interface CardioSet {
  type: 'cardio';
  setNumber: number;
  distanceMeters: number;
  durationSeconds: number;
  completedAt: number;
  avgPowerWatts?: number;
  resistance?: number;
}

export type SetEntry = StrengthSet | CardioSet;

export interface Block {
  id: Id<'Block'>;
  sessionId: Id<'Session'>;
  exerciseId: Id<'Exercise'>;
  exerciseName: string;
  exerciseCategory: ExerciseCategory;
  sets: SetEntry[];
  notes: string;
  order: number;
  blockType?: 'straight' | 'superset' | 'circuit' | 'emom' | 'amrap';
  rounds?: number;
  restSeconds?: number;
  supersetGroupId?: Id<'SupersetGroup'>;
}

export type SessionStatus = 'active' | 'finished';

export interface TrainingSession {
  id: Id<'Session'>;
  userId: Id<'User'>;
  name: string;
  startedAt: number | null;
  finishedAt: number | null;
  status: SessionStatus;
  blocks: Block[];
  notes: string;
  comments?: SessionComment[];
  media?: string[];
}

export interface TrainingLogState {
  sessions: TrainingSession[];
}

// ─── Events ──────────────────────────────────────────────────

export type TrainingLogEvent =
  | DomainEvent<'SessionStarted', SessionStartedPayload>
  | DomainEvent<'BlockAdded', BlockAddedPayload>
  | DomainEvent<'SetLogged', SetLoggedPayload>
  | DomainEvent<'BlockNoteUpdated', BlockNoteUpdatedPayload>
  | DomainEvent<'SessionNoteUpdated', SessionNoteUpdatedPayload>
  | DomainEvent<'SessionFinished', SessionFinishedPayload>
  | DomainEvent<'SessionDeleted', SessionDeletedPayload>
  | DomainEvent<'PRFlagged', PRFlaggedPayload>
  | DomainEvent<'SetTypeChanged', SetTypeChangedPayload>
  | DomainEvent<'RPELogged', RPELoggedPayload>
  | DomainEvent<'SetFailed', SetFailedPayload>
  | DomainEvent<'BlockTypeSet', BlockTypeSetPayload>
  | DomainEvent<'BlockRoundsSet', BlockRoundsSetPayload>
  | DomainEvent<'SetRemoved', SetRemovedPayload>
  | DomainEvent<'SetUpdated', SetUpdatedPayload>
  | DomainEvent<'SetCommentUpdated', SetCommentUpdatedPayload>
  | DomainEvent<'BlockRestSet', BlockRestSetPayload>
  | DomainEvent<'SessionRenamed', SessionRenamedPayload>
  | DomainEvent<'SessionStartTimeUpdated', SessionStartTimeUpdatedPayload>
  | DomainEvent<'BlocksReordered', BlocksReorderedPayload>
  | DomainEvent<'BlockAddedToSuperset', BlockAddedToSupersetPayload>
  | DomainEvent<'BlockLeftSuperset', BlockLeftSupersetPayload>
  | DomainEvent<'BlockRemoved', BlockRemovedPayload>;

export interface SessionStartedPayload {
  sessionId: Id<'Session'>;
  userId: Id<'User'>;
  name: string;
}

export interface BlockAddedPayload {
  sessionId: Id<'Session'>;
  blockId: Id<'Block'>;
  exerciseId: Id<'Exercise'>;
  exerciseName: string;
  exerciseCategory: ExerciseCategory;
  order: number;
}

export interface SetLoggedPayload {
  sessionId: Id<'Session'>;
  blockId: Id<'Block'>;
  set: SetEntry;
}

export interface BlockNoteUpdatedPayload {
  sessionId: Id<'Session'>;
  blockId: Id<'Block'>;
  notes: string;
}

export interface SessionNoteUpdatedPayload {
  sessionId: Id<'Session'>;
  notes: string;
}

// ─── Exercise Summary (enriched payload for downstream consumers) ──

export interface ExerciseSummary {
  exerciseName: string;
  exerciseCategory: ExerciseCategory;
  sets: StrengthSet[];  // only strength sets; cardio sets excluded from progression
}

export interface SessionFinishedPayload {
  sessionId: Id<'Session'>;
  finishedAt: number;
  sessionRpe?: number;   // 1–10 overall session feeling
  tags?: string[];       // e.g. ["deload", "legs", "heavy"]
  exerciseSummaries: ExerciseSummary[];
}

export interface SessionDeletedPayload {
  sessionId: Id<'Session'>;
}

export interface PRFlaggedPayload {
  sessionId: Id<'Session'>;
  blockId: Id<'Block'>;
  setNumber: number;
}

export interface SetTypeChangedPayload {
  sessionId: Id<'Session'>;
  blockId: Id<'Block'>;
  setNumber: number;
  setType: NonNullable<StrengthSet['setType']>;
}

export interface RPELoggedPayload {
  sessionId: Id<'Session'>;
  blockId: Id<'Block'>;
  setNumber: number;
  rpe: number;
}

export interface SetFailedPayload {
  sessionId: Id<'Session'>;
  blockId: Id<'Block'>;
  setNumber: number;
  failed: boolean;
}

export interface BlockTypeSetPayload {
  sessionId: Id<'Session'>;
  blockId: Id<'Block'>;
  blockType: NonNullable<Block['blockType']>;
}

export interface BlockRoundsSetPayload {
  sessionId: Id<'Session'>;
  blockId: Id<'Block'>;
  rounds: number;
}

export interface SetRemovedPayload {
  sessionId: Id<'Session'>;
  blockId: Id<'Block'>;
  setNumber: number;
}

export interface SetUpdatedPayload {
  sessionId: Id<'Session'>;
  blockId: Id<'Block'>;
  setNumber: number;
  weightKg?: number;
  reps?: number;
  distanceMeters?: number;
  durationSeconds?: number;
  avgPowerWatts?: number;
  resistance?: number;
  isWarmup?: boolean;
  done?: boolean;
}

export interface SetCommentUpdatedPayload {
  sessionId: Id<'Session'>;
  blockId: Id<'Block'>;
  setNumber: number;
  comment: string;
}

export interface BlockRestSetPayload {
  sessionId: Id<'Session'>;
  blockId: Id<'Block'>;
  restSeconds: number;
}

export interface SessionRenamedPayload {
  sessionId: Id<'Session'>;
  name: string;
}

export interface SessionStartTimeUpdatedPayload {
  sessionId: Id<'Session'>;
  startedAt: number;
}

export interface BlocksReorderedPayload {
  sessionId: Id<'Session'>;
  blockIds: Id<'Block'>[];
}

export interface BlockAddedToSupersetPayload {
  sessionId: Id<'Session'>;
  blockId: Id<'Block'>;
  groupId: Id<'SupersetGroup'>;
}

export interface BlockLeftSupersetPayload {
  sessionId: Id<'Session'>;
  blockId: Id<'Block'>;
}

export interface BlockRemovedPayload {
  sessionId: Id<'Session'>;
  blockId: Id<'Block'>;
}

// ─── Commands ────────────────────────────────────────────────

export interface StartSession {
  type: 'StartSession';
  userId: Id<'User'>;
  name: string;
}

export interface AddBlock {
  type: 'AddBlock';
  sessionId: Id<'Session'>;
  exerciseName: string;
  exerciseCategory: ExerciseCategory;
  blockId?: Id<'Block'>;
}

export interface LogStrengthSet {
  type: 'LogStrengthSet';
  sessionId: Id<'Session'>;
  blockId: Id<'Block'>;
  weightKg: number;
  reps: number;
  isWarmup: boolean;
}

export interface LogCardioSet {
  type: 'LogCardioSet';
  sessionId: Id<'Session'>;
  blockId: Id<'Block'>;
  distanceMeters: number;
  durationSeconds: number;
  avgPowerWatts?: number;
  resistance?: number;
}

export interface FinishSession {
  type: 'FinishSession';
  sessionId: Id<'Session'>;
  sessionRpe?: number;
  tags?: string[];
}

export interface DeleteSession {
  type: 'DeleteSession';
  sessionId: Id<'Session'>;
}

export interface UpdateBlockNote {
  type: 'UpdateBlockNote';
  sessionId: Id<'Session'>;
  blockId: Id<'Block'>;
  notes: string;
}

export interface ChangeSetType {
  type: 'ChangeSetType';
  sessionId: Id<'Session'>;
  blockId: Id<'Block'>;
  setNumber: number;
  setType: NonNullable<StrengthSet['setType']>;
}

export interface LogRPE {
  type: 'LogRPE';
  sessionId: Id<'Session'>;
  blockId: Id<'Block'>;
  setNumber: number;
  rpe: number;
}

export interface ToggleSetFailed {
  type: 'ToggleSetFailed';
  sessionId: Id<'Session'>;
  blockId: Id<'Block'>;
  setNumber: number;
  failed: boolean;
}

export interface SetBlockType {
  type: 'SetBlockType';
  sessionId: Id<'Session'>;
  blockId: Id<'Block'>;
  blockType: NonNullable<Block['blockType']>;
}

export interface SetBlockRounds {
  type: 'SetBlockRounds';
  sessionId: Id<'Session'>;
  blockId: Id<'Block'>;
  rounds: number;
}

export interface RemoveSet {
  type: 'RemoveSet';
  sessionId: Id<'Session'>;
  blockId: Id<'Block'>;
  setNumber: number;
}

export interface UpdateSet {
  type: 'UpdateSet';
  sessionId: Id<'Session'>;
  blockId: Id<'Block'>;
  setNumber: number;
  weightKg?: number;
  reps?: number;
  distanceMeters?: number;
  durationSeconds?: number;
  avgPowerWatts?: number;
  resistance?: number;
  isWarmup?: boolean;
  done?: boolean;
}

export interface UpdateSetComment {
  type: 'UpdateSetComment';
  sessionId: Id<'Session'>;
  blockId: Id<'Block'>;
  setNumber: number;
  comment: string;
}

export interface SetBlockRest {
  type: 'SetBlockRest';
  sessionId: Id<'Session'>;
  blockId: Id<'Block'>;
  restSeconds: number;
}

export interface RenameSession {
  type: 'RenameSession';
  sessionId: Id<'Session'>;
  name: string;
}

export interface UpdateSessionStartTime {
  type: 'UpdateSessionStartTime';
  sessionId: Id<'Session'>;
  startedAt: number;
}

export interface ReorderBlocks {
  type: 'ReorderBlocks';
  sessionId: Id<'Session'>;
  blockIds: Id<'Block'>[];
}

export interface AddToSuperset {
  type: 'AddToSuperset';
  sessionId: Id<'Session'>;
  blockId: Id<'Block'>;
  groupId: Id<'SupersetGroup'>;
}

export interface LeaveSuperset {
  type: 'LeaveSuperset';
  sessionId: Id<'Session'>;
  blockId: Id<'Block'>;
}

export interface RemoveBlock {
  type: 'RemoveBlock';
  sessionId: Id<'Session'>;
  blockId: Id<'Block'>;
}

export interface UpdateSessionNote {
  type: 'UpdateSessionNote';
  sessionId: Id<'Session'>;
  notes: string;
}

export type TrainingLogCommand =
  | StartSession
  | AddBlock
  | LogStrengthSet
  | LogCardioSet
  | FinishSession
  | DeleteSession
  | UpdateBlockNote
  | UpdateSessionNote
  | ChangeSetType
  | LogRPE
  | ToggleSetFailed
  | SetBlockType
  | SetBlockRounds
  | RemoveSet
  | UpdateSet
  | UpdateSetComment
  | SetBlockRest
  | RenameSession
  | UpdateSessionStartTime
  | ReorderBlocks
  | AddToSuperset
  | LeaveSuperset
  | RemoveBlock;
