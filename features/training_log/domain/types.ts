import type { Id, DomainEvent, ExerciseCategory, SportType } from '@shared/types';
import type { GpsTrack } from '@data/sources/files/gps';

// ─── Re-export ────────────────────────────────────────────────
export type { ExerciseCategory, SportType };

// ─── Exercise ────────────────────────────────────────────────

export interface Exercise {
  id: Id<'Exercise'>;
  name: string;
  category: ExerciseCategory;
}

// ─── SetEntry ────────────────────────────────────────────────
// Flexible single-type for all set measurements.
// measure is a UI hint per set — does not restrict which fields are populated.

export type SetMeasure = 'weight_reps' | 'reps' | 'duration' | 'distance';

export interface SetEntry {
  id?: string;
  setNumber: number;
  completedAt: number;
  done?: boolean;
  isWarmup?: boolean;
  isPR?: boolean;
  rpe?: number | null;
  failed?: boolean;
  comment?: string;
  setType?: 'normal' | 'dropset' | 'emom' | 'amrap';
  measure?: SetMeasure;
  weightKg?: number;
  reps?: number;
  durationSeconds?: number;
  distanceMeters?: number;
  avgPowerWatts?: number;
  resistance?: number;
}

// ─── Segments ────────────────────────────────────────────────

export interface BaseSegment {
  id: Id<'Segment'>;
  order: number;
  label?: string;
}

export interface StrengthSegment extends BaseSegment {
  sport: 'strength';
  exercise: { id: Id<'Exercise'>; name: string; category: ExerciseCategory };
  sets: SetEntry[];
  notes?: string;
}

// CompositeSegment must be an interface (not type) to allow self-referencing children: Segment[]
export interface CompositeSegment extends BaseSegment {
  sport: 'composite';
  kind: 'superset' | 'circuit' | 'emom' | 'amrap';
  rounds?: number;
  restSeconds?: number;
  children: Segment[];
}

export interface CardioSegment extends BaseSegment {
  sport: Exclude<SportType, 'strength' | 'composite' | 'transition'>;
  routeId?: Id<'Route'>;
}

export interface TransitionSegment extends BaseSegment {
  sport: 'transition';
}

export type Segment = StrengthSegment | CompositeSegment | CardioSegment | TransitionSegment;

// ─── Source Contributions ─────────────────────────────────────

export type DataProvider =
  | 'app'
  | 'garmin'
  | 'polar'
  | 'whoop'
  | 'apple_health'
  | 'strava'
  | 'manual';

export type DataSourceId = string;

export interface ActivityMetrics {
  durationSeconds?: number;
  distanceMeters?: number;
  elevationMeters?: number;
  avgHr?: number;
  maxHr?: number;
  calories?: number;
  avgCadence?: number;
  avgPowerWatts?: number;
  hrStream?: number[];
  gpsTrack?: GpsTrack;
}

export type MetricKey = keyof ActivityMetrics;

export interface SourceContribution {
  sourceId: DataSourceId;
  provider: DataProvider;
  deviceLabel?: string;
  importedAt: number;
  metrics: Partial<ActivityMetrics>;
  segmentMetrics?: {
    segmentId: Id<'Segment'>;
    metrics: Partial<ActivityMetrics>;
  }[];
}

// ─── Activity ────────────────────────────────────────────────

export type ActivityStatus = 'active' | 'finished';

export interface ActivityPartner {
  name: string;
  userId?: Id<'User'>;
}

export interface ActivityComment {
  text: string;
  createdAt: number;
}

export interface Activity {
  id: Id<'Activity'>;
  userId: Id<'User'>;
  primarySport: SportType;
  customSport?: string;
  status: ActivityStatus;
  startedAt: number | null;
  finishedAt: number | null;
  title?: string;
  notes: string;
  tags?: string[];
  rpe?: number;
  with?: ActivityPartner[];
  comments?: ActivityComment[];
  media?: string[];
  segments: Segment[];
  sources: SourceContribution[];
  preferredSources?: Partial<Record<MetricKey, DataSourceId>>;
}

export interface ActivityLogState {
  activities: Activity[];
}

// ─── Internal Reducer Types ───────────────────────────────────
// Used exclusively inside reducers.ts — not for general use.
// Property shapes differ from the canonical Segment/Activity types.

export type StrengthSet = SetEntry & {
  type: 'strength';
  weightKg: number;
  reps: number;
  isWarmup: boolean;
  isPR: boolean;
};

export type CardioSet = SetEntry & {
  type: 'cardio';
  distanceMeters: number;
  durationSeconds: number;
};

export type Block = StrengthSegment & {
  sessionId: Id<'Session'>;
  exerciseId: Id<'Exercise'>;
  exerciseName: string;
  exerciseCategory: ExerciseCategory;
  blockType?: 'straight' | 'superset' | 'circuit' | 'emom' | 'amrap';
  rounds?: number;
  restSeconds?: number;
  supersetGroupId?: Id<'SupersetGroup'>;
};

export type TrainingSession = Activity & {
  name: string;
  blocks: Block[];
};

// ─── Events ──────────────────────────────────────────────────

export interface ExerciseSummary {
  exerciseName: string;
  exerciseCategory: ExerciseCategory;
  sets: SetEntry[];
}

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
  | DomainEvent<'BlockRemoved', BlockRemovedPayload>
  | DomainEvent<'SessionUpdated', SessionUpdatedPayload>
  | DomainEvent<'SessionImported', SessionImportedPayload>;

export interface SessionStartedPayload {
  sessionId: Id<'Activity'>;
  userId: Id<'User'>;
  name: string;
  primarySport?: SportType;
}

export interface BlockAddedPayload {
  sessionId: Id<'Activity'>;
  blockId: Id<'Segment'>;
  exerciseId: Id<'Exercise'>;
  exerciseName: string;
  exerciseCategory: ExerciseCategory;
  order: number;
}

export interface SetLoggedPayload {
  sessionId: Id<'Activity'>;
  blockId: Id<'Segment'>;
  set: SetEntry;
}

export interface BlockNoteUpdatedPayload {
  sessionId: Id<'Activity'>;
  blockId: Id<'Segment'>;
  notes: string;
}

export interface SessionNoteUpdatedPayload {
  sessionId: Id<'Activity'>;
  notes: string;
}

export interface SessionFinishedPayload {
  sessionId: Id<'Activity'>;
  finishedAt: number;
  sessionRpe?: number;
  tags?: string[];
  exerciseSummaries: ExerciseSummary[];
}

export interface SessionDeletedPayload {
  sessionId: Id<'Activity'>;
}

export interface PRFlaggedPayload {
  sessionId: Id<'Activity'>;
  blockId: Id<'Segment'>;
  setNumber: number;
}

export interface SetTypeChangedPayload {
  sessionId: Id<'Activity'>;
  blockId: Id<'Segment'>;
  setNumber: number;
  setType: NonNullable<SetEntry['setType']>;
}

export interface RPELoggedPayload {
  sessionId: Id<'Activity'>;
  blockId: Id<'Segment'>;
  setNumber: number;
  rpe: number;
}

export interface SetFailedPayload {
  sessionId: Id<'Activity'>;
  blockId: Id<'Segment'>;
  setNumber: number;
  failed: boolean;
}

export interface BlockTypeSetPayload {
  sessionId: Id<'Activity'>;
  blockId: Id<'Segment'>;
  blockType: 'straight' | 'superset' | 'circuit' | 'emom' | 'amrap';
}

export interface BlockRoundsSetPayload {
  sessionId: Id<'Activity'>;
  blockId: Id<'Segment'>;
  rounds: number;
}

export interface SetRemovedPayload {
  sessionId: Id<'Activity'>;
  blockId: Id<'Segment'>;
  setNumber: number;
}

export interface SetUpdatedPayload {
  sessionId: Id<'Activity'>;
  blockId: Id<'Segment'>;
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
  sessionId: Id<'Activity'>;
  blockId: Id<'Segment'>;
  setNumber: number;
  comment: string;
}

export interface BlockRestSetPayload {
  sessionId: Id<'Activity'>;
  blockId: Id<'Segment'>;
  restSeconds: number;
}

export interface SessionRenamedPayload {
  sessionId: Id<'Activity'>;
  name: string;
}

export interface SessionStartTimeUpdatedPayload {
  sessionId: Id<'Activity'>;
  startedAt: number;
}

export interface BlocksReorderedPayload {
  sessionId: Id<'Activity'>;
  blockIds: Id<'Segment'>[];
}

export interface BlockAddedToSupersetPayload {
  sessionId: Id<'Activity'>;
  blockId: Id<'Segment'>;
  groupId: Id<'SupersetGroup'>;
}

export interface BlockLeftSupersetPayload {
  sessionId: Id<'Activity'>;
  blockId: Id<'Segment'>;
}

export interface BlockRemovedPayload {
  sessionId: Id<'Activity'>;
  blockId: Id<'Segment'>;
}

export interface SessionUpdatedPayload {
  sessionId: Id<'Activity'>;
  finishedAt?: number;
  rpe?: number | null;
  tags?: string[];
  media?: string[];
}

export interface SessionImportedPayload {
  sessionId: Id<'Activity'>;
  name: string;
  startedAt: number;
  finishedAt: number;
  notes: string;
  primarySport: string;
  segments: Array<{
    id: Id<'Segment'>;
    exerciseName: string;
    exerciseCategory: string;
    sets: SetEntry[];
    notes?: string;
    order: number;
  }>;
}

// ─── Commands ────────────────────────────────────────────────

export interface StartSession {
  type: 'StartSession';
  userId: Id<'User'>;
  name: string;
  primarySport?: SportType;
}

export interface AddBlock {
  type: 'AddBlock';
  sessionId: Id<'Activity'>;
  exerciseName: string;
  exerciseCategory: ExerciseCategory;
  blockId?: Id<'Segment'>;
}

export interface LogStrengthSet {
  type: 'LogStrengthSet';
  sessionId: Id<'Activity'>;
  blockId: Id<'Segment'>;
  weightKg: number;
  reps: number;
  isWarmup: boolean;
}

export interface LogCardioSet {
  type: 'LogCardioSet';
  sessionId: Id<'Activity'>;
  blockId: Id<'Segment'>;
  distanceMeters: number;
  durationSeconds: number;
  avgPowerWatts?: number;
  resistance?: number;
}

export interface FinishSession {
  type: 'FinishSession';
  sessionId: Id<'Activity'>;
  finishedAt?: number;
  sessionRpe?: number;
  tags?: string[];
}

export interface DeleteSession {
  type: 'DeleteSession';
  sessionId: Id<'Activity'>;
}

export interface UpdateBlockNote {
  type: 'UpdateBlockNote';
  sessionId: Id<'Activity'>;
  blockId: Id<'Segment'>;
  notes: string;
}

export interface ChangeSetType {
  type: 'ChangeSetType';
  sessionId: Id<'Activity'>;
  blockId: Id<'Segment'>;
  setNumber: number;
  setType: NonNullable<SetEntry['setType']>;
}

export interface LogRPE {
  type: 'LogRPE';
  sessionId: Id<'Activity'>;
  blockId: Id<'Segment'>;
  setNumber: number;
  rpe: number;
}

export interface ToggleSetFailed {
  type: 'ToggleSetFailed';
  sessionId: Id<'Activity'>;
  blockId: Id<'Segment'>;
  setNumber: number;
  failed: boolean;
}

export interface SetBlockType {
  type: 'SetBlockType';
  sessionId: Id<'Activity'>;
  blockId: Id<'Segment'>;
  blockType: 'straight' | 'superset' | 'circuit' | 'emom' | 'amrap';
}

export interface SetBlockRounds {
  type: 'SetBlockRounds';
  sessionId: Id<'Activity'>;
  blockId: Id<'Segment'>;
  rounds: number;
}

export interface RemoveSet {
  type: 'RemoveSet';
  sessionId: Id<'Activity'>;
  blockId: Id<'Segment'>;
  setNumber: number;
}

export interface UpdateSet {
  type: 'UpdateSet';
  sessionId: Id<'Activity'>;
  blockId: Id<'Segment'>;
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
  sessionId: Id<'Activity'>;
  blockId: Id<'Segment'>;
  setNumber: number;
  comment: string;
}

export interface SetBlockRest {
  type: 'SetBlockRest';
  sessionId: Id<'Activity'>;
  blockId: Id<'Segment'>;
  restSeconds: number;
}

export interface RenameSession {
  type: 'RenameSession';
  sessionId: Id<'Activity'>;
  name: string;
}

export interface UpdateSessionStartTime {
  type: 'UpdateSessionStartTime';
  sessionId: Id<'Activity'>;
  startedAt: number;
}

export interface ReorderBlocks {
  type: 'ReorderBlocks';
  sessionId: Id<'Activity'>;
  blockIds: Id<'Segment'>[];
}

export interface AddToSuperset {
  type: 'AddToSuperset';
  sessionId: Id<'Activity'>;
  blockId: Id<'Segment'>;
  groupId: Id<'SupersetGroup'>;
}

export interface LeaveSuperset {
  type: 'LeaveSuperset';
  sessionId: Id<'Activity'>;
  blockId: Id<'Segment'>;
}

export interface RemoveBlock {
  type: 'RemoveBlock';
  sessionId: Id<'Activity'>;
  blockId: Id<'Segment'>;
}

export interface UpdateSessionNote {
  type: 'UpdateSessionNote';
  sessionId: Id<'Activity'>;
  notes: string;
}

export interface UpdateSessionDetails {
  type: 'UpdateSessionDetails';
  sessionId: Id<'Activity'>;
  finishedAt?: number;
  rpe?: number | null;
  tags?: string[];
  media?: string[];
}

/** Bundles all finish-session edits into one atomic command. */
export interface FinishSessionWithDetails {
  type: 'FinishSessionWithDetails';
  sessionId: Id<'Activity'>;
  name?: string;
  startedAt?: number;
  finishedAt?: number;
  notes?: string;
  sessionRpe?: number;
  tags?: string[];
  media?: string[];
}

export interface ImportSession {
  type: 'ImportSession';
  parsedData: import('@shared/utils/importCsv').ParsedCsvData;
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
  | RemoveBlock
  | UpdateSessionDetails
  | FinishSessionWithDetails
  | ImportSession;
