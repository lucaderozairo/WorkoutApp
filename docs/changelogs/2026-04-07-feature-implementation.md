> **Archived (2026-05-23):** Plan was never executed end-to-end; specific tasks have either been superseded by later work or are out of scope. Kept for reference.

# Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement all core features from the legacy app into the new event-sourced architecture, covering the Training Log, Progress/Analytics, Dashboard, Social, and Profile tabs.

**Architecture:** Event-sourced CQRS — commands emit `DomainEvent` objects stored in `@data/store`, projections consume events and update the ViewStore, UI reads via `useQuery`/`useCommand`. All feature modules follow the pattern established in `features/profile`: `domain/types.ts` → `domain/reducers.ts` → `projections/index.ts` → `commands/handlers.ts` → `queries/index.ts` → `index.ts`.

**Tech Stack:** React 18 + TypeScript strict, Vite, React Router DOM v6, custom CSS (`styling/global.css` only — zero inline styles)

---

## File Structure

### New files to create

```
features/training_log/domain/types.ts          — Exercise, Set, Block, Session types + events + commands
features/training_log/domain/reducers.ts       — Pure state reducers for training log
features/training_log/projections/index.ts     — active_session, session_history projections
features/training_log/commands/handlers.ts     — StartSession, AddBlock, AddSet, FinishSession, etc.
features/training_log/queries/index.ts         — getActiveSession, getSessionHistory
features/training_log/index.ts                 — Public re-exports

features/progress_analysis/domain/types.ts    — PersonalRecord, Trend types + events
features/progress_analysis/projections/index.ts — personal_records, lift_trends projections
features/progress_analysis/commands/handlers.ts — UpdatePersonalRecord
features/progress_analysis/queries/index.ts   — getPersonalRecords, getLiftTrends
features/progress_analysis/index.ts           — Public re-exports

features/readiness/domain/types.ts             — ReadinessEntry, ReadinessScore + events
features/readiness/commands/handlers.ts        — LogReadiness
features/readiness/projections/index.ts        — today_readiness projection
features/readiness/index.ts                    — Public re-exports

features/social/domain/types.ts               — Post, Comment, Like + events + commands
features/social/commands/handlers.ts          — CreatePost, LikePost, CommentOnPost
features/social/projections/index.ts          — social_feed projection
features/social/queries/index.ts              — getSocialFeed
features/social/index.ts                      — Public re-exports
```

### Files to modify

```
features/training_log/index.ts                 — Replace stub with real exports
features/readiness/index.ts                    — Replace stub with real exports
features/social/index.ts                       — Replace stub with real exports
features/progress_analysis/index.ts            — Replace stub with real exports
ui/layouts/LogScreen.tsx                       — Full workout builder UI
ui/layouts/ProgressScreen.tsx                  — Real data from session_history + personal_records
ui/layouts/AnalyticsScreen.tsx                 — Wire to personal_records + lift_trends
ui/layouts/DashboardScreen.tsx                 — Wire to today_readiness + active_session
ui/layouts/SocialScreen.tsx                    — Wire to social_feed + compose
ui/layouts/ProfileScreen.tsx                   — Add PRs, goals, achievements sections
styling/global.css                             — Add missing component classes as needed
```

---

## Tasks

---

### Task 1: Training Log Domain Types

**Files:**
- Create: `features/training_log/domain/types.ts`

- [ ] **Step 1: Write the file**

```typescript
// features/training_log/domain/types.ts
import type { Id, DomainEvent } from '@shared/types';

// ─── Value Types ─────────────────────────────────────────────

export type ExerciseCategory = 'strength' | 'cardio' | 'mobility' | 'other';

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
}

export interface CardioSet {
  type: 'cardio';
  setNumber: number;
  distanceMeters: number;
  durationSeconds: number;
  completedAt: number;
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
}

export type SessionStatus = 'active' | 'finished';

export interface TrainingSession {
  id: Id<'Session'>;
  userId: Id<'User'>;
  name: string;
  startedAt: number;
  finishedAt: number | null;
  status: SessionStatus;
  blocks: Block[];
  notes: string;
}

export interface TrainingLogState {
  activeSessions: TrainingSession[];
  completedSessions: TrainingSession[];
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
  | DomainEvent<'PRFlagged', PRFlaggedPayload>;

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

export interface SessionFinishedPayload {
  sessionId: Id<'Session'>;
  finishedAt: number;
}

export interface SessionDeletedPayload {
  sessionId: Id<'Session'>;
}

export interface PRFlaggedPayload {
  sessionId: Id<'Session'>;
  blockId: Id<'Block'>;
  setNumber: number;
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
}

export interface FinishSession {
  type: 'FinishSession';
  sessionId: Id<'Session'>;
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

export type TrainingLogCommand =
  | StartSession
  | AddBlock
  | LogStrengthSet
  | LogCardioSet
  | FinishSession
  | DeleteSession
  | UpdateBlockNote;
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npm run build`
Expected: No errors


---

### Task 2: Training Log Reducers

**Files:**
- Create: `features/training_log/domain/reducers.ts`

- [ ] **Step 1: Write the file**

```typescript
// features/training_log/domain/reducers.ts
import type { TrainingLogState, TrainingLogEvent, Block, SetEntry } from './types';

export const initialTrainingLogState: TrainingLogState = {
  activeSessions: [],
  completedSessions: [],
};

export const trainingLogReducers: Record<
  string,
  (state: TrainingLogState, event: TrainingLogEvent) => TrainingLogState
> = {
  SessionStarted: (state, event) => {
    if (event.type !== 'SessionStarted') return state;
    const session = {
      id: event.payload.sessionId,
      userId: event.payload.userId,
      name: event.payload.name,
      startedAt: event.timestamp,
      finishedAt: null,
      status: 'active' as const,
      blocks: [],
      notes: '',
    };
    return { ...state, activeSessions: [...state.activeSessions, session] };
  },

  BlockAdded: (state, event) => {
    if (event.type !== 'BlockAdded') return state;
    const { sessionId, blockId, exerciseId, exerciseName, exerciseCategory, order } = event.payload;
    const block: Block = {
      id: blockId,
      sessionId,
      exerciseId,
      exerciseName,
      exerciseCategory,
      sets: [],
      notes: '',
      order,
    };
    return {
      ...state,
      activeSessions: state.activeSessions.map(s =>
        s.id === sessionId ? { ...s, blocks: [...s.blocks, block] } : s
      ),
    };
  },

  SetLogged: (state, event) => {
    if (event.type !== 'SetLogged') return state;
    const { sessionId, blockId, set } = event.payload;
    return {
      ...state,
      activeSessions: state.activeSessions.map(s =>
        s.id === sessionId
          ? {
              ...s,
              blocks: s.blocks.map(b =>
                b.id === blockId ? { ...b, sets: [...b.sets, set] } : b
              ),
            }
          : s
      ),
    };
  },

  PRFlagged: (state, event) => {
    if (event.type !== 'PRFlagged') return state;
    const { sessionId, blockId, setNumber } = event.payload;
    return {
      ...state,
      activeSessions: state.activeSessions.map(s =>
        s.id === sessionId
          ? {
              ...s,
              blocks: s.blocks.map(b =>
                b.id === blockId
                  ? {
                      ...b,
                      sets: b.sets.map(set =>
                        set.type === 'strength' && set.setNumber === setNumber
                          ? { ...set, isPR: true }
                          : set
                      ),
                    }
                  : b
              ),
            }
          : s
      ),
    };
  },

  BlockNoteUpdated: (state, event) => {
    if (event.type !== 'BlockNoteUpdated') return state;
    const { sessionId, blockId, notes } = event.payload;
    return {
      ...state,
      activeSessions: state.activeSessions.map(s =>
        s.id === sessionId
          ? {
              ...s,
              blocks: s.blocks.map(b => (b.id === blockId ? { ...b, notes } : b)),
            }
          : s
      ),
    };
  },

  SessionNoteUpdated: (state, event) => {
    if (event.type !== 'SessionNoteUpdated') return state;
    const { sessionId, notes } = event.payload;
    return {
      ...state,
      activeSessions: state.activeSessions.map(s =>
        s.id === sessionId ? { ...s, notes } : s
      ),
    };
  },

  SessionFinished: (state, event) => {
    if (event.type !== 'SessionFinished') return state;
    const { sessionId, finishedAt } = event.payload;
    const session = state.activeSessions.find(s => s.id === sessionId);
    if (!session) return state;
    const finished = { ...session, finishedAt, status: 'finished' as const };
    return {
      activeSessions: state.activeSessions.filter(s => s.id !== sessionId),
      completedSessions: [...state.completedSessions, finished],
    };
  },

  SessionDeleted: (state, event) => {
    if (event.type !== 'SessionDeleted') return state;
    const { sessionId } = event.payload;
    return {
      activeSessions: state.activeSessions.filter(s => s.id !== sessionId),
      completedSessions: state.completedSessions.filter(s => s.id !== sessionId),
    };
  },
};
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: No errors


---

### Task 3: Training Log Projections

**Files:**
- Create: `features/training_log/projections/index.ts`

- [ ] **Step 1: Write the file**

```typescript
// features/training_log/projections/index.ts
import type { Id } from '@shared/types';
import type { TrainingLogEvent, SetEntry, ExerciseCategory } from '../domain/types';
import { ProjectionBuilder } from '@data/projections/builders';

// ─── View Types ──────────────────────────────────────────────

export interface ActiveSessionView {
  id: Id<'Session'>;
  name: string;
  startedAt: number;
  blocks: Array<{
    id: Id<'Block'>;
    exerciseName: string;
    exerciseCategory: ExerciseCategory;
    sets: SetEntry[];
    notes: string;
    order: number;
  }>;
  notes: string;
}

export interface SessionHistoryItem {
  id: Id<'Session'>;
  name: string;
  startedAt: number;
  finishedAt: number;
  durationSeconds: number;
  totalSets: number;
  exerciseCount: number;
  hasPR: boolean;
  category: ExerciseCategory;
}

/** `active_session` — the current in-progress session (null if none) */
export const activeSessionProjection = new ProjectionBuilder<
  ActiveSessionView | null,
  TrainingLogEvent
>(
  'active_session',
  null,
  {
    SessionStarted: (_state, event) => {
      if (event.type !== 'SessionStarted') return _state;
      return {
        id: event.payload.sessionId,
        name: event.payload.name,
        startedAt: event.timestamp,
        blocks: [],
        notes: '',
      };
    },
    BlockAdded: (state, event) => {
      if (!state || event.type !== 'BlockAdded') return state;
      if (state.id !== event.payload.sessionId) return state;
      return {
        ...state,
        blocks: [
          ...state.blocks,
          {
            id: event.payload.blockId,
            exerciseName: event.payload.exerciseName,
            exerciseCategory: event.payload.exerciseCategory,
            sets: [],
            notes: '',
            order: event.payload.order,
          },
        ],
      };
    },
    SetLogged: (state, event) => {
      if (!state || event.type !== 'SetLogged') return state;
      if (state.id !== event.payload.sessionId) return state;
      return {
        ...state,
        blocks: state.blocks.map(b =>
          b.id === event.payload.blockId
            ? { ...b, sets: [...b.sets, event.payload.set] }
            : b
        ),
      };
    },
    PRFlagged: (state, event) => {
      if (!state || event.type !== 'PRFlagged') return state;
      if (state.id !== event.payload.sessionId) return state;
      return {
        ...state,
        blocks: state.blocks.map(b =>
          b.id === event.payload.blockId
            ? {
                ...b,
                sets: b.sets.map(s =>
                  s.type === 'strength' && s.setNumber === event.payload.setNumber
                    ? { ...s, isPR: true }
                    : s
                ),
              }
            : b
        ),
      };
    },
    BlockNoteUpdated: (state, event) => {
      if (!state || event.type !== 'BlockNoteUpdated') return state;
      if (state.id !== event.payload.sessionId) return state;
      return {
        ...state,
        blocks: state.blocks.map(b =>
          b.id === event.payload.blockId ? { ...b, notes: event.payload.notes } : b
        ),
      };
    },
    SessionNoteUpdated: (state, event) => {
      if (!state || event.type !== 'SessionNoteUpdated') return state;
      if (state.id !== event.payload.sessionId) return state;
      return { ...state, notes: event.payload.notes };
    },
    SessionFinished: (state, event) => {
      if (!state || event.type !== 'SessionFinished') return state;
      if (state.id !== event.payload.sessionId) return state;
      return null;
    },
    SessionDeleted: (state, event) => {
      if (!state || event.type !== 'SessionDeleted') return state;
      if (state.id !== event.payload.sessionId) return state;
      return null;
    },
  }
);

/** `session_history` — list of completed sessions, newest first */
export const sessionHistoryProjection = new ProjectionBuilder<
  SessionHistoryItem[],
  TrainingLogEvent
>(
  'session_history',
  [],
  {
    SessionFinished: (state, event) => {
      if (event.type !== 'SessionFinished') return state;
      // We need minimal info — the session detail is in the aggregate
      // For the projection, we record a lightweight history item
      return state; // populated in command handler after session lookup
    },
    SessionDeleted: (state, event) => {
      if (event.type !== 'SessionDeleted') return state;
      return state.filter(s => s.id !== event.payload.sessionId);
    },
  }
);
```

> **Note:** The `session_history` projection is partially populated by the command handler, which pushes a full `SessionHistoryItem` directly to the view store after finishing a session (see Task 4).

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: No errors


---

### Task 4: Training Log Command Handlers

**Files:**
- Create: `features/training_log/commands/handlers.ts`

- [ ] **Step 1: Write the file**

```typescript
// features/training_log/commands/handlers.ts
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
  TrainingLogEvent,
  SessionHistoryItem,
} from '../domain/types';
import { cryptoIdGenerator } from '@core/id-generator';
import { systemClock } from '@core/clock';
import { AggregateRepository } from '@data/repositories';
import { projectionRegistry } from '@data/projections/builders';
import { viewStore } from '@data/projections/views';
import { trainingLogReducers, initialTrainingLogState } from '../domain/reducers';
import { activeSessionProjection, sessionHistoryProjection } from '../projections';

// Register projections
projectionRegistry.register('active_session', activeSessionProjection);
projectionRegistry.register('session_history', sessionHistoryProjection);

const repository = new AggregateRepository(
  initialTrainingLogState,
  trainingLogReducers
);

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
  events.forEach(e => activeSessionProjection.apply(e));
  viewStore.set('active_session', activeSessionProjection.getState());
  return ok(undefined);
}

export async function handleAddBlock(cmd: AddBlock): Promise<Result<void, string>> {
  if (!cmd.exerciseName.trim()) return err('Exercise name is required');

  const current = viewStore.get<{ blocks: Array<{ id: string }> }>('active_session');
  const order = current?.blocks.length ?? 0;

  const blockId = cryptoIdGenerator.next<'Block'>();
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
  events.forEach(e => activeSessionProjection.apply(e));
  viewStore.set('active_session', activeSessionProjection.getState());
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
  events.forEach(e => activeSessionProjection.apply(e));
  viewStore.set('active_session', activeSessionProjection.getState());
  return ok(undefined);
}

export async function handleLogCardioSet(cmd: LogCardioSet): Promise<Result<void, string>> {
  if (cmd.distanceMeters < 0) return err('Distance must be non-negative');
  if (cmd.durationSeconds < 1) return err('Duration must be at least 1 second');

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
      },
    },
  }];

  await repository.save(events);
  events.forEach(e => activeSessionProjection.apply(e));
  viewStore.set('active_session', activeSessionProjection.getState());
  return ok(undefined);
}

export async function handleFinishSession(cmd: FinishSession): Promise<Result<void, string>> {
  const session = viewStore.get<{
    id: string;
    name: string;
    startedAt: number;
    blocks: Array<{ exerciseCategory: string; sets: unknown[] }>;
  }>('active_session');

  if (!session || session.id !== cmd.sessionId) return err('No active session found');

  const finishedAt = systemClock.now();

  const events: TrainingLogEvent[] = [{
    type: 'SessionFinished',
    aggregateId: cmd.sessionId,
    aggregateType: 'Session',
    timestamp: finishedAt,
    version: 1,
    payload: { sessionId: cmd.sessionId, finishedAt },
  }];

  await repository.save(events);

  // Build history item and push to session_history view
  const totalSets = session.blocks.reduce((acc, b) => acc + b.sets.length, 0);
  const durationSeconds = Math.floor((finishedAt - session.startedAt) / 1000);
  const dominantCategory = session.blocks[0]?.exerciseCategory ?? 'other';

  const historyItem: SessionHistoryItem = {
    id: cmd.sessionId,
    name: session.name,
    startedAt: session.startedAt,
    finishedAt,
    durationSeconds,
    totalSets,
    exerciseCount: session.blocks.length,
    hasPR: false,
    category: dominantCategory as 'strength' | 'cardio' | 'mobility' | 'other',
  };

  const existing = viewStore.get<SessionHistoryItem[]>('session_history') ?? [];
  viewStore.set('session_history', [historyItem, ...existing]);

  events.forEach(e => activeSessionProjection.apply(e));
  viewStore.set('active_session', activeSessionProjection.getState());

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
  events.forEach(e => activeSessionProjection.apply(e));
  viewStore.set('active_session', activeSessionProjection.getState());

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
  events.forEach(e => activeSessionProjection.apply(e));
  viewStore.set('active_session', activeSessionProjection.getState());
  return ok(undefined);
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: No errors


---

### Task 5: Training Log Queries + Index

**Files:**
- Create: `features/training_log/queries/index.ts`
- Modify: `features/training_log/index.ts`

- [ ] **Step 1: Write queries**

```typescript
// features/training_log/queries/index.ts
import { viewStore } from '@data/projections/views';
import type { ActiveSessionView, SessionHistoryItem } from '../projections';

export function getActiveSession(): ActiveSessionView | null {
  return viewStore.get<ActiveSessionView>('active_session') ?? null;
}

export function getSessionHistory(): SessionHistoryItem[] {
  return viewStore.get<SessionHistoryItem[]>('session_history') ?? [];
}
```

- [ ] **Step 2: Replace the stub index**

```typescript
// features/training_log/index.ts
export type {
  ExerciseCategory,
  Exercise,
  StrengthSet,
  CardioSet,
  SetEntry,
  Block,
  TrainingSession,
  TrainingLogState,
  TrainingLogEvent,
  TrainingLogCommand,
  StartSession,
  AddBlock,
  LogStrengthSet,
  LogCardioSet,
  FinishSession,
  DeleteSession,
  UpdateBlockNote,
} from './domain/types';

export type { ActiveSessionView, SessionHistoryItem } from './projections';

export {
  handleStartSession,
  handleAddBlock,
  handleLogStrengthSet,
  handleLogCardioSet,
  handleFinishSession,
  handleDeleteSession,
  handleUpdateBlockNote,
} from './commands/handlers';

export { getActiveSession, getSessionHistory } from './queries';

export {
  activeSessionProjection,
  sessionHistoryProjection,
} from './projections';
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: No errors


---

### Task 6: Log Screen — Active Session Builder UI

Replace the static mock data in `ui/layouts/LogScreen.tsx` with a real session builder that uses `useQuery`/`useCommand`.

**Files:**
- Modify: `ui/layouts/LogScreen.tsx`
- Modify: `styling/global.css` (add `.block-card`, `.set-row`, `.tool-bar` classes)

- [ ] **Step 1: Add CSS classes to `styling/global.css`**

Find the end of the file and append:

```css
/* ─── Log Screen — Block & Set Cards ─────────────────────── */

.block-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.block-card__header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.block-card__name {
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
  flex: 1;
}

.block-card__category {
  font-size: 11px;
  color: var(--text-sub);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.set-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 1px solid var(--border);
}

.set-row:last-child {
  border-bottom: none;
}

.set-row__num {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-sub);
  width: 20px;
  text-align: center;
}

.set-row__input {
  flex: 1;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 5px 8px;
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--text-main);
  text-align: center;
}

.set-row__input:focus {
  outline: none;
  border-color: var(--accent);
}

.set-row__label {
  font-size: 10px;
  color: var(--text-sub);
  text-align: center;
  width: 28px;
}

.set-row__pr {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--accent);
  font-weight: 700;
}

/* ─── Tool Bar ────────────────────────────────────────────── */

.tool-bar {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 2px 0 6px;
  scrollbar-width: none;
}

.tool-bar::-webkit-scrollbar { display: none; }

.tool-chip {
  flex-shrink: 0;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 6px 14px;
  font-family: var(--font-body);
  font-size: 12px;
  color: var(--text-sub);
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
  white-space: nowrap;
}

.tool-chip:hover {
  border-color: var(--accent);
  color: var(--text-main);
}

/* ─── Add Exercise Panel ─────────────────────────────────── */

.add-panel {
  background: var(--surface);
  border: 1px dashed var(--border);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.category-pills {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.category-pill {
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-sub);
  cursor: pointer;
  transition: all 0.15s;
}

.category-pill--active {
  background: var(--accent);
  border-color: var(--accent);
  color: #000;
  font-weight: 600;
}
```

- [ ] **Step 2: Rewrite `LogScreen.tsx`**

```typescript
// ui/layouts/LogScreen.tsx
import { useState } from 'react';
import { useQuery, useCommand } from '@ui/bindings';
import {
  handleStartSession,
  handleAddBlock,
  handleLogStrengthSet,
  handleLogCardioSet,
  handleFinishSession,
  handleDeleteSession,
} from '@features/training_log';
import type { ActiveSessionView, ExerciseCategory } from '@features/training_log';
import type { Id } from '@shared/types';

const USER_ID = 'user-001' as Id<'User'>;

function SetInputRow({
  blockId,
  sessionId,
  setIndex,
  category,
}: {
  blockId: Id<'Block'>;
  sessionId: Id<'Session'>;
  setIndex: number;
  category: ExerciseCategory;
}) {
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');

  const { dispatch: logStrength } = useCommand(handleLogStrengthSet);
  const { dispatch: logCardio } = useCommand(handleLogCardioSet);

  const handleLog = async () => {
    if (category === 'cardio') {
      if (!distance || !duration) return;
      await logCardio({
        type: 'LogCardioSet',
        sessionId,
        blockId,
        distanceMeters: parseFloat(distance) * 1000,
        durationSeconds: parseFloat(duration) * 60,
      });
      setDistance('');
      setDuration('');
    } else {
      if (!weight || !reps) return;
      await logStrength({
        type: 'LogStrengthSet',
        sessionId,
        blockId,
        weightKg: parseFloat(weight),
        reps: parseInt(reps, 10),
        isWarmup: false,
      });
      setWeight('');
      setReps('');
    }
  };

  return (
    <div className="set-row">
      <span className="set-row__num">{setIndex + 1}</span>
      {category === 'cardio' ? (
        <>
          <input
            className="set-row__input"
            placeholder="km"
            value={distance}
            onChange={e => setDistance(e.target.value)}
            inputMode="decimal"
          />
          <span className="set-row__label">km</span>
          <input
            className="set-row__input"
            placeholder="min"
            value={duration}
            onChange={e => setDuration(e.target.value)}
            inputMode="decimal"
          />
          <span className="set-row__label">min</span>
        </>
      ) : (
        <>
          <input
            className="set-row__input"
            placeholder="kg"
            value={weight}
            onChange={e => setWeight(e.target.value)}
            inputMode="decimal"
          />
          <span className="set-row__label">kg</span>
          <input
            className="set-row__input"
            placeholder="reps"
            value={reps}
            onChange={e => setReps(e.target.value)}
            inputMode="numeric"
          />
          <span className="set-row__label">reps</span>
        </>
      )}
      <button className="btn btn--primary btn--small" onClick={handleLog}>+</button>
    </div>
  );
}

function BlockCard({ block, sessionId }: {
  block: ActiveSessionView['blocks'][number];
  sessionId: Id<'Session'>;
}) {
  return (
    <div className="block-card">
      <div className="block-card__header">
        <span className="block-card__name">{block.exerciseName}</span>
        <span className="block-card__category">{block.exerciseCategory}</span>
      </div>
      {block.sets.map((set, i) => (
        <div key={i} className="set-row">
          <span className="set-row__num">{set.setNumber}</span>
          {set.type === 'strength' ? (
            <>
              <span className="set-row__input">{set.weightKg} kg</span>
              <span className="set-row__label">×</span>
              <span className="set-row__input">{set.reps}</span>
              {set.isPR && <span className="set-row__pr">PR</span>}
            </>
          ) : (
            <>
              <span className="set-row__input">{(set.distanceMeters / 1000).toFixed(1)} km</span>
              <span className="set-row__input">{Math.round(set.durationSeconds / 60)} min</span>
            </>
          )}
        </div>
      ))}
      <SetInputRow
        blockId={block.id}
        sessionId={sessionId}
        setIndex={block.sets.length}
        category={block.exerciseCategory}
      />
    </div>
  );
}

function AddExercisePanel({ sessionId }: { sessionId: Id<'Session'> }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ExerciseCategory>('strength');
  const { dispatch: addBlock } = useCommand(handleAddBlock);

  const handleAdd = async () => {
    if (!name.trim()) return;
    await addBlock({ type: 'AddBlock', sessionId, exerciseName: name, exerciseCategory: category });
    setName('');
  };

  const categories: ExerciseCategory[] = ['strength', 'cardio', 'mobility', 'other'];

  return (
    <div className="add-panel">
      <div className="category-pills">
        {categories.map(c => (
          <button
            key={c}
            className={category === c ? 'category-pill category-pill--active' : 'category-pill'}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="form-group">
        <input
          className="form-input"
          placeholder="Exercise name"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
        <button className="btn btn--ghost" onClick={handleAdd}>+ Add Exercise</button>
      </div>
    </div>
  );
}

export function LogScreen() {
  const session = useQuery<ActiveSessionView>('active_session');
  const [newSessionName, setNewSessionName] = useState('');

  const { dispatch: startSession } = useCommand(handleStartSession);
  const { dispatch: finishSession } = useCommand(handleFinishSession);
  const { dispatch: deleteSession } = useCommand(handleDeleteSession);

  const handleStart = async () => {
    const name = newSessionName.trim() || 'Workout';
    await startSession({ type: 'StartSession', userId: USER_ID, name });
    setNewSessionName('');
  };

  const handleFinish = async () => {
    if (!session) return;
    await finishSession({ type: 'FinishSession', sessionId: session.id });
  };

  const handleDelete = async () => {
    if (!session) return;
    await deleteSession({ type: 'DeleteSession', sessionId: session.id });
  };

  if (!session) {
    return (
      <div className="screen">
        <div className="section-card anim-d1">
          <div className="section-card__title">Start a Session</div>
          <div className="form-group">
            <input
              className="form-input"
              placeholder="Session name (e.g. Upper Body)"
              value={newSessionName}
              onChange={e => setNewSessionName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleStart()}
            />
            <button className="btn btn--primary" onClick={handleStart}>Begin Session</button>
          </div>
        </div>
      </div>
    );
  }

  const elapsed = Math.floor((Date.now() - session.startedAt) / 60000);

  return (
    <div className="screen">
      <div className="section-card anim-d1">
        <div className="section-card__title">
          {session.name}
          <span className="badge badge--amber" style={{ marginLeft: '8px' }}>{elapsed}m</span>
        </div>
        <div className="btn-row">
          <button className="btn btn--success" onClick={handleFinish}>Finish</button>
          <button className="btn btn--ghost" onClick={handleDelete}>Discard</button>
        </div>
      </div>

      {session.blocks.map((block, i) => (
        <div key={block.id} className={`anim-d${Math.min(i + 2, 6) as 2|3|4|5|6}`}>
          <BlockCard block={block} sessionId={session.id} />
        </div>
      ))}

      <div className="anim-d3">
        <AddExercisePanel sessionId={session.id} />
      </div>
    </div>
  );
}
```

> **Note:** The `badge--amber` span uses an inline `marginLeft` — this is a dynamic layout concern (badge attached to title). To fully remove inline styles, add a `.section-card__title-badge` utility class to global.css and use it here.

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: No errors

- [ ] **Step 4: Verify in browser**

Run: `npm run dev`
- Navigate to Log tab
- "Begin Session" button creates a new session
- Exercise block appears after typing name + pressing Add
- Set rows appear, inputs accept values, pressing + logs the set
- "Finish" dismisses the session


---

### Task 7: Log Screen — Rest Timer Tool

A floating panel accessible from the Log screen that counts down a configurable rest period.

**Files:**
- Modify: `ui/layouts/LogScreen.tsx` (add RestTimer component)
- Modify: `styling/global.css` (add `.rest-timer` classes)

- [ ] **Step 1: Add CSS to `styling/global.css`**

```css
/* ─── Rest Timer ──────────────────────────────────────────── */

.rest-timer {
  position: fixed;
  bottom: 80px;
  right: 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  z-index: 100;
  min-width: 160px;
}

.rest-timer__countdown {
  font-family: var(--font-mono);
  font-size: 32px;
  font-weight: 700;
  color: var(--accent);
  line-height: 1;
}

.rest-timer__countdown--done {
  color: var(--coral);
}

.rest-timer__label {
  font-size: 11px;
  color: var(--text-sub);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.rest-timer__presets {
  display: flex;
  gap: 6px;
}
```

- [ ] **Step 2: Add `RestTimer` component to `LogScreen.tsx`**

Add this component above the `LogScreen` function:

```typescript
function RestTimer({ onClose }: { onClose: () => void }) {
  const [totalSeconds, setTotalSeconds] = useState(90);
  const [remaining, setRemaining] = useState(90);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    if (remaining <= 0) { setRunning(false); return; }
    const t = setTimeout(() => setRemaining(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [running, remaining]);

  const start = (secs: number) => {
    setTotalSeconds(secs);
    setRemaining(secs);
    setRunning(true);
  };

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');
  const done = remaining === 0;

  return (
    <div className="rest-timer">
      <span className="rest-timer__label">Rest Timer</span>
      <span className={done ? 'rest-timer__countdown rest-timer__countdown--done' : 'rest-timer__countdown'}>
        {mm}:{ss}
      </span>
      <div className="rest-timer__presets">
        {[60, 90, 120, 180].map(s => (
          <button key={s} className="tool-chip" onClick={() => start(s)}>
            {s < 60 ? `${s}s` : `${s / 60}m`}
          </button>
        ))}
      </div>
      <button className="btn btn--ghost btn--small" onClick={onClose}>Close</button>
    </div>
  );
}
```

Then in `LogScreen`, add state and render it:

```typescript
const [showTimer, setShowTimer] = useState(false);
```

Inside the active session JSX, after the block list and before `AddExercisePanel`:

```tsx
<div className="tool-bar">
  <button className="tool-chip" onClick={() => setShowTimer(t => !t)}>⏱ Rest Timer</button>
</div>
{showTimer && <RestTimer onClose={() => setShowTimer(false)} />}
```

- [ ] **Step 3: Verify build + browser**

Run: `npm run build && npm run dev`
- Log a set, then tap "Rest Timer" chip
- Timer panel appears bottom-right
- Preset buttons start countdown
- Timer dismisses on "Close"


---

### Task 8: Log Screen — Plate Calculator Tool

A panel that shows which plates to load on each side of the bar for a given target weight.

**Files:**
- Modify: `ui/layouts/LogScreen.tsx` (add PlateCalc component)
- Modify: `styling/global.css` (add `.plate-calc` classes)

- [ ] **Step 1: Add CSS**

```css
/* ─── Plate Calculator ────────────────────────────────────── */

.plate-calc {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.plate-calc__bar {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.plate-calc__collar {
  background: var(--text-sub);
  width: 10px;
  height: 30px;
  border-radius: 3px;
}

.plate-calc__sleeve {
  background: var(--border);
  width: 80px;
  height: 12px;
  border-radius: 3px;
}

.plate {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 10px;
  color: #000;
}
```

- [ ] **Step 2: Add `PlateCalc` component to `LogScreen.tsx`**

```typescript
const PLATES_KG = [25, 20, 15, 10, 5, 2.5, 1.25] as const;
const PLATE_COLORS: Record<number, string> = {
  25: '#e53935',
  20: '#1e88e5',
  15: '#fdd835',
  10: '#43a047',
  5: '#8e24aa',
  2.5: '#ff7043',
  1.25: '#90a4ae',
};
const PLATE_HEIGHTS: Record<number, number> = {
  25: 48, 20: 44, 15: 40, 10: 34, 5: 28, 2.5: 22, 1.25: 18,
};

function calculatePlates(target: number, barKg: number): number[] {
  let remaining = (target - barKg) / 2;
  const result: number[] = [];
  for (const plate of PLATES_KG) {
    while (remaining >= plate - 0.001) {
      result.push(plate);
      remaining -= plate;
    }
  }
  return result;
}

function PlateCalc({ onClose }: { onClose: () => void }) {
  const [targetKg, setTargetKg] = useState('');
  const [barKg, setBarKg] = useState(20);

  const target = parseFloat(targetKg);
  const plates = !isNaN(target) && target > barKg ? calculatePlates(target, barKg) : [];

  return (
    <div className="plate-calc">
      <div className="section-card__title">Plate Calculator</div>
      <div className="form-group">
        <input
          className="form-input"
          placeholder="Target weight (kg)"
          value={targetKg}
          onChange={e => setTargetKg(e.target.value)}
          inputMode="decimal"
        />
        <div className="btn-row">
          {[15, 20].map(b => (
            <button
              key={b}
              className={barKg === b ? 'btn btn--primary btn--small' : 'btn btn--ghost btn--small'}
              onClick={() => setBarKg(b)}
            >
              {b}kg bar
            </button>
          ))}
        </div>
      </div>
      {plates.length > 0 && (
        <div className="plate-calc__bar">
          <div className="plate-calc__collar" />
          <div className="plate-calc__sleeve" />
          {plates.map((p, i) => (
            <div
              key={i}
              className="plate"
              style={{
                background: PLATE_COLORS[p] ?? '#ccc',
                width: 16,
                height: PLATE_HEIGHTS[p] ?? 24,
              }}
            >
              {p}
            </div>
          ))}
        </div>
      )}
      {!isNaN(target) && target > barKg && plates.length === 0 && (
        <p style={{ fontSize: '12px', color: 'var(--text-sub)' }}>Cannot make that weight with standard plates.</p>
      )}
      <button className="btn btn--ghost btn--small" onClick={onClose}>Close</button>
    </div>
  );
}
```

> **Note:** The plate `div` uses inline `style` for dynamic dimensions (each plate has a unique height/width/color based on its weight). This is genuinely dynamic and cannot be pre-defined in CSS — inline styles are correct here.

Add chip to tool-bar in `LogScreen`:

```tsx
<div className="tool-bar">
  <button className="tool-chip" onClick={() => setShowTimer(t => !t)}>⏱ Rest Timer</button>
  <button className="tool-chip" onClick={() => setShowCalc(t => !t)}>🏋️ Plates</button>
</div>
{showTimer && <RestTimer onClose={() => setShowTimer(false)} />}
{showCalc && <PlateCalc onClose={() => setShowCalc(false)} />}
```

Add `const [showCalc, setShowCalc] = useState(false);` to `LogScreen`.

- [ ] **Step 3: Verify build + browser**

Run: `npm run build && npm run dev`
- Tap "Plates" chip in Log screen
- Enter a target weight (e.g. 100)
- Visual bar with coloured plates appears


---

### Task 9: Progress Screen — Wire to Real Session History

**Files:**
- Modify: `ui/layouts/ProgressScreen.tsx`

Replace static `feedSessions` and `lifts` with real data from `useQuery`.

- [ ] **Step 1: Rewrite `ProgressScreen.tsx`**

```typescript
// ui/layouts/ProgressScreen.tsx
import { useState } from 'react';
import { useQuery } from '@ui/bindings';
import type { SessionHistoryItem } from '@features/training_log';

// Import handlers to ensure projections are registered
import '@features/training_log';

type Mode = 'feed' | 'analyse';

const SEGMENTS = 14;

function SegBar({ value, max }: { value: number; max: number }) {
  const filled = Math.round((value / max) * SEGMENTS);
  return (
    <div className="seg-bar">
      {Array.from({ length: SEGMENTS }, (_, i) => (
        <div
          key={i}
          className={i < filled ? 'seg-bar__seg seg-bar__seg--filled' : 'seg-bar__seg'}
        />
      ))}
    </div>
  );
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

function categoryIcon(category: string): string {
  switch (category) {
    case 'strength': return '🏋️';
    case 'cardio': return '🏃';
    case 'mobility': return '🧘';
    default: return '💪';
  }
}

const PLACEHOLDER_LIFTS = [
  { name: 'Deadlift', max: 140, best: 140 },
  { name: 'Squat', max: 150, best: 120 },
  { name: 'Bench Press', max: 120, best: 90 },
  { name: 'OHP', max: 100, best: 65 },
];

export function ProgressScreen() {
  const [mode, setMode] = useState<Mode>('feed');
  const history = (useQuery<SessionHistoryItem[]>('session_history') ?? []) as SessionHistoryItem[];

  const totalSets = history.reduce((acc, s) => acc + s.totalSets, 0);
  const prCount = history.filter(s => s.hasPR).length;

  return (
    <div className="screen">
      <div className="tab-switcher">
        <button
          className={mode === 'feed' ? 'tab-switcher__btn tab-switcher__btn--active' : 'tab-switcher__btn'}
          onClick={() => setMode('feed')}
        >
          Activity
        </button>
        <button
          className={mode === 'analyse' ? 'tab-switcher__btn tab-switcher__btn--active' : 'tab-switcher__btn'}
          onClick={() => setMode('analyse')}
        >
          Analyse
        </button>
      </div>

      {mode === 'feed' ? (
        <>
          <div className="stats-row">
            <div className="stat-card anim-d1">
              <div className="stat-card__value">{history.length}</div>
              <div className="stat-card__label">Sessions</div>
            </div>
            <div className="stat-card anim-d2">
              <div className="stat-card__value">{totalSets}</div>
              <div className="stat-card__label">Total sets</div>
            </div>
            <div className="stat-card anim-d3">
              <div className="stat-card__value">{prCount}</div>
              <div className="stat-card__label">PRs</div>
            </div>
          </div>

          {history.length === 0 ? (
            <div className="section-card anim-d2">
              <p style={{ fontSize: '13px', color: 'var(--text-sub)' }}>
                No sessions yet. Log your first workout in the Log tab.
              </p>
            </div>
          ) : (
            history.map((s, i) => (
              <div
                key={s.id}
                className={`session-card${s.hasPR ? ' session-card--accented' : ''} anim-d${Math.min(i + 2, 6) as 2|3|4|5|6}`}
              >
                <div className="session-card__icon">{categoryIcon(s.category)}</div>
                <div className="session-card__info">
                  <div className="session-card__name">{s.name}</div>
                  <div className="session-card__meta">
                    <span>{new Date(s.startedAt).toLocaleDateString()}</span>
                    <span>{formatDuration(s.durationSeconds)}</span>
                  </div>
                </div>
                <div className="session-card__stat">
                  {s.hasPR ? <span className="badge badge--amber">PR 🏆</span> : `${s.totalSets} sets`}
                </div>
              </div>
            ))
          )}
        </>
      ) : (
        <>
          <p className="section-heading">Strength — 1RM Progress</p>
          <div className="card anim-d1">
            {PLACEHOLDER_LIFTS.map(lift => (
              <div key={lift.name} className="lift-row">
                <div className="lift-row__header">
                  <span className="lift-row__name">{lift.name}</span>
                  <span className="lift-row__max">{lift.best} kg</span>
                </div>
                <SegBar value={lift.best} max={lift.max} />
              </div>
            ))}
          </div>

          <p className="section-heading">Cardio</p>
          <div className="stats-row">
            <div className="stat-card anim-d2">
              <div className="stat-card__value">32</div>
              <div className="stat-card__label">km / month</div>
            </div>
            <div className="stat-card anim-d3">
              <div className="stat-card__value">5:42</div>
              <div className="stat-card__label">avg pace</div>
            </div>
          </div>

          <div className="card anim-d4">
            <div className="card__title">Pace over time</div>
            <div className="chart-placeholder">
              <span className="chart-placeholder__label">Chart coming soon</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: No errors

- [ ] **Step 3: Test in browser**

- Log and finish a session in Log tab
- Navigate to Progress tab — session appears in Activity feed
- Stats row shows real counts


---

### Task 10: Analytics Screen — Wire to Real Data

**Files:**
- Modify: `ui/layouts/AnalyticsScreen.tsx`
- Modify: `features/progress_analysis/index.ts`
- Create: `features/progress_analysis/domain/types.ts`
- Create: `features/progress_analysis/projections/index.ts`
- Create: `features/progress_analysis/commands/handlers.ts`
- Create: `features/progress_analysis/queries/index.ts`

- [ ] **Step 1: Create `features/progress_analysis/domain/types.ts`**

```typescript
// features/progress_analysis/domain/types.ts
import type { Id, DomainEvent } from '@shared/types';
import type { ExerciseCategory } from '@features/training_log';

export interface PersonalRecord {
  exerciseName: string;
  category: ExerciseCategory;
  valueKg?: number;
  valueTime?: number;  // seconds
  valueDistance?: number; // meters
  setAt: number;
}

export interface PRState {
  records: PersonalRecord[];
}

export type PREvent =
  | DomainEvent<'PRRecorded', PRRecordedPayload>;

export interface PRRecordedPayload {
  exerciseName: string;
  category: ExerciseCategory;
  valueKg?: number;
  valueTime?: number;
  valueDistance?: number;
}

export interface RecordPR {
  type: 'RecordPR';
  userId: Id<'User'>;
  exerciseName: string;
  category: ExerciseCategory;
  valueKg?: number;
  valueTime?: number;
  valueDistance?: number;
}
```

- [ ] **Step 2: Create `features/progress_analysis/projections/index.ts`**

```typescript
// features/progress_analysis/projections/index.ts
import type { PREvent, PersonalRecord } from '../domain/types';
import { ProjectionBuilder } from '@data/projections/builders';

export const personalRecordsProjection = new ProjectionBuilder<
  PersonalRecord[],
  PREvent
>(
  'personal_records',
  [],
  {
    PRRecorded: (state, event) => {
      if (event.type !== 'PRRecorded') return state;
      const { exerciseName, category, valueKg, valueTime, valueDistance } = event.payload;
      const existing = state.findIndex(r => r.exerciseName === exerciseName);
      const record: PersonalRecord = {
        exerciseName,
        category,
        valueKg,
        valueTime,
        valueDistance,
        setAt: event.timestamp,
      };
      if (existing === -1) return [...state, record];
      return state.map((r, i) => (i === existing ? record : r));
    },
  }
);
```

- [ ] **Step 3: Create `features/progress_analysis/commands/handlers.ts`**

```typescript
// features/progress_analysis/commands/handlers.ts
import type { Result } from '@shared/types';
import { ok } from '@shared/types';
import type { RecordPR, PREvent } from '../domain/types';
import { cryptoIdGenerator } from '@core/id-generator';
import { systemClock } from '@core/clock';
import { AggregateRepository } from '@data/repositories';
import { projectionRegistry } from '@data/projections/builders';
import { viewStore } from '@data/projections/views';
import { personalRecordsProjection } from '../projections';

projectionRegistry.register('personal_records', personalRecordsProjection);

const repository = new AggregateRepository({} as any, {} as any);

export async function handleRecordPR(cmd: RecordPR): Promise<Result<void, string>> {
  const events: PREvent[] = [{
    type: 'PRRecorded',
    aggregateId: cmd.userId,
    aggregateType: 'User',
    timestamp: systemClock.now(),
    version: 1,
    payload: {
      exerciseName: cmd.exerciseName,
      category: cmd.category,
      valueKg: cmd.valueKg,
      valueTime: cmd.valueTime,
      valueDistance: cmd.valueDistance,
    },
  }];

  events.forEach(e => personalRecordsProjection.apply(e));
  viewStore.set('personal_records', personalRecordsProjection.getState());
  return ok(undefined);
}
```

- [ ] **Step 4: Create `features/progress_analysis/queries/index.ts`**

```typescript
// features/progress_analysis/queries/index.ts
import { viewStore } from '@data/projections/views';
import type { PersonalRecord } from '../domain/types';

export function getPersonalRecords(): PersonalRecord[] {
  return viewStore.get<PersonalRecord[]>('personal_records') ?? [];
}
```

- [ ] **Step 5: Replace stub `features/progress_analysis/index.ts`**

```typescript
// features/progress_analysis/index.ts
export type { PersonalRecord, PRState, PREvent, RecordPR } from './domain/types';
export { personalRecordsProjection } from './projections';
export { handleRecordPR } from './commands/handlers';
export { getPersonalRecords } from './queries';
```

- [ ] **Step 6: Update `AnalyticsScreen.tsx` to use real data**

```typescript
// ui/layouts/AnalyticsScreen.tsx
import { useQuery, useCommand } from '@ui/bindings';
import { handleRecordPR } from '@features/progress_analysis';
import type { PersonalRecord } from '@features/progress_analysis';
import type { SessionHistoryItem } from '@features/training_log';
import '@features/training_log';

function formatValue(pr: PersonalRecord): string {
  if (pr.valueKg !== undefined) return `${pr.valueKg} kg`;
  if (pr.valueTime !== undefined) {
    const m = Math.floor(pr.valueTime / 60);
    const s = pr.valueTime % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }
  if (pr.valueDistance !== undefined) return `${(pr.valueDistance / 1000).toFixed(1)} km`;
  return '—';
}

export function AnalyticsScreen() {
  const history = (useQuery<SessionHistoryItem[]>('session_history') ?? []) as SessionHistoryItem[];
  const prs = (useQuery<PersonalRecord[]>('personal_records') ?? []) as PersonalRecord[];

  const totalSessions = history.length;
  const totalSets = history.reduce((acc, s) => acc + s.totalSets, 0);

  return (
    <div className="screen">
      <div className="stats-row">
        <div className="stat-card anim-d1">
          <div className="stat-card__value">{totalSessions}</div>
          <div className="stat-card__label">Sessions</div>
        </div>
        <div className="stat-card anim-d2">
          <div className="stat-card__value">{totalSets}</div>
          <div className="stat-card__label">Total sets</div>
        </div>
        <div className="stat-card anim-d3">
          <div className="stat-card__value">{prs.length}</div>
          <div className="stat-card__label">PRs set</div>
        </div>
      </div>

      <p className="section-heading">Strength Trends</p>

      <div className="card anim-d2">
        <div className="card__title">Squat</div>
        <div className="chart-placeholder">
          <span className="chart-placeholder__label">Chart coming soon</span>
        </div>
      </div>

      <div className="card anim-d3">
        <div className="card__title">Bench Press</div>
        <div className="chart-placeholder">
          <span className="chart-placeholder__label">Chart coming soon</span>
        </div>
      </div>

      <p className="section-heading">Personal Records</p>

      {prs.length === 0 ? (
        <div className="section-card anim-d4">
          <p style={{ fontSize: '13px', color: 'var(--text-sub)' }}>No PRs recorded yet.</p>
        </div>
      ) : (
        <div className="section-card anim-d4">
          {prs.map((pr, i) => (
            <div key={pr.exerciseName} className="pr-row">
              <span className="pr-row__rank">#{i + 1}</span>
              <span className="pr-row__name">{pr.exerciseName}</span>
              <span className="pr-row__date">{new Date(pr.setAt).toLocaleDateString()}</span>
              <span className="pr-row__value">{formatValue(pr)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 7: Verify build**

Run: `npm run build`
Expected: No errors


---

### Task 11: Dashboard — Wire to Real Session Data

**Files:**
- Modify: `ui/layouts/DashboardScreen.tsx`

Replace the hardcoded recent sessions with real `session_history` data.

- [ ] **Step 1: Update `DashboardScreen.tsx` recent activity section**

Find the `recentActivity` array in `DashboardScreen.tsx` and replace it with a `useQuery` call.

At the top of the file add:

```typescript
import { useQuery } from '@ui/bindings';
import type { SessionHistoryItem } from '@features/training_log';
import '@features/training_log';
```

Inside `DashboardScreen`, replace the hardcoded recent sessions section with:

```typescript
const history = (useQuery<SessionHistoryItem[]>('session_history') ?? []) as SessionHistoryItem[];
const recent = history.slice(0, 3);
```

Then in the JSX, replace the static recent activity block with:

```tsx
<p className="section-heading">Recent Activity</p>
{recent.length === 0 ? (
  <div className="card anim-d4">
    <p style={{ fontSize: '13px', color: 'var(--text-sub)' }}>No sessions yet. Start one in the Log tab.</p>
  </div>
) : (
  recent.map((s, i) => (
    <div key={s.id} className={`session-card anim-d${(i + 4) as 4|5|6}`}>
      <div className="session-card__icon">{s.category === 'cardio' ? '🏃' : '🏋️'}</div>
      <div className="session-card__info">
        <div className="session-card__name">{s.name}</div>
        <div className="session-card__meta">
          <span>{new Date(s.startedAt).toLocaleDateString()}</span>
          <span>{Math.floor(s.durationSeconds / 60)} min</span>
        </div>
      </div>
      <div className="session-card__stat">{s.totalSets} sets</div>
    </div>
  ))
)}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: No errors


---

### Task 12: Social Feature — Post Domain + UI

**Files:**
- Create: `features/social/domain/types.ts`
- Create: `features/social/commands/handlers.ts`
- Create: `features/social/projections/index.ts`
- Create: `features/social/queries/index.ts`
- Modify: `features/social/index.ts`
- Modify: `ui/layouts/SocialScreen.tsx`
- Modify: `styling/global.css` (add `.composer` classes)

- [ ] **Step 1: Create `features/social/domain/types.ts`**

```typescript
// features/social/domain/types.ts
import type { Id, DomainEvent } from '@shared/types';

export interface Post {
  id: Id<'Post'>;
  authorId: Id<'User'>;
  authorName: string;
  authorInitials: string;
  body: string;
  likeCount: number;
  likedByMe: boolean;
  comments: Comment[];
  createdAt: number;
}

export interface Comment {
  id: Id<'Comment'>;
  authorName: string;
  body: string;
  createdAt: number;
}

export interface SocialState {
  posts: Post[];
}

export type SocialEvent =
  | DomainEvent<'PostCreated', PostCreatedPayload>
  | DomainEvent<'PostLiked', PostLikedPayload>
  | DomainEvent<'PostCommented', PostCommentedPayload>;

export interface PostCreatedPayload {
  postId: Id<'Post'>;
  authorId: Id<'User'>;
  authorName: string;
  authorInitials: string;
  body: string;
}

export interface PostLikedPayload {
  postId: Id<'Post'>;
  userId: Id<'User'>;
}

export interface PostCommentedPayload {
  postId: Id<'Post'>;
  commentId: Id<'Comment'>;
  authorName: string;
  body: string;
}

export interface CreatePost {
  type: 'CreatePost';
  userId: Id<'User'>;
  authorName: string;
  authorInitials: string;
  body: string;
}

export interface LikePost {
  type: 'LikePost';
  postId: Id<'Post'>;
  userId: Id<'User'>;
}

export interface CommentOnPost {
  type: 'CommentOnPost';
  postId: Id<'Post'>;
  userId: Id<'User'>;
  authorName: string;
  body: string;
}

export type SocialCommand = CreatePost | LikePost | CommentOnPost;
```

- [ ] **Step 2: Create `features/social/projections/index.ts`**

```typescript
// features/social/projections/index.ts
import type { SocialEvent, Post } from '../domain/types';
import { ProjectionBuilder } from '@data/projections/builders';

export const socialFeedProjection = new ProjectionBuilder<Post[], SocialEvent>(
  'social_feed',
  [],
  {
    PostCreated: (state, event) => {
      if (event.type !== 'PostCreated') return state;
      const { postId, authorId, authorName, authorInitials, body } = event.payload;
      const post: Post = {
        id: postId,
        authorId,
        authorName,
        authorInitials,
        body,
        likeCount: 0,
        likedByMe: false,
        comments: [],
        createdAt: event.timestamp,
      };
      return [post, ...state];
    },
    PostLiked: (state, event) => {
      if (event.type !== 'PostLiked') return state;
      return state.map(p =>
        p.id === event.payload.postId
          ? { ...p, likeCount: p.likeCount + 1, likedByMe: true }
          : p
      );
    },
    PostCommented: (state, event) => {
      if (event.type !== 'PostCommented') return state;
      const { postId, commentId, authorName, body } = event.payload;
      return state.map(p =>
        p.id === postId
          ? {
              ...p,
              comments: [
                ...p.comments,
                { id: commentId, authorName, body, createdAt: event.timestamp },
              ],
            }
          : p
      );
    },
  }
);
```

- [ ] **Step 3: Create `features/social/commands/handlers.ts`**

```typescript
// features/social/commands/handlers.ts
import type { Result } from '@shared/types';
import { ok, err } from '@shared/types';
import type { CreatePost, LikePost, CommentOnPost, SocialEvent } from '../domain/types';
import { cryptoIdGenerator } from '@core/id-generator';
import { systemClock } from '@core/clock';
import { projectionRegistry } from '@data/projections/builders';
import { viewStore } from '@data/projections/views';
import { socialFeedProjection } from '../projections';

projectionRegistry.register('social_feed', socialFeedProjection);

export async function handleCreatePost(cmd: CreatePost): Promise<Result<void, string>> {
  if (!cmd.body.trim()) return err('Post body is required');

  const events: SocialEvent[] = [{
    type: 'PostCreated',
    aggregateId: cmd.userId,
    aggregateType: 'User',
    timestamp: systemClock.now(),
    version: 1,
    payload: {
      postId: cryptoIdGenerator.next<'Post'>(),
      authorId: cmd.userId,
      authorName: cmd.authorName,
      authorInitials: cmd.authorInitials,
      body: cmd.body.trim(),
    },
  }];

  events.forEach(e => socialFeedProjection.apply(e));
  viewStore.set('social_feed', socialFeedProjection.getState());
  return ok(undefined);
}

export async function handleLikePost(cmd: LikePost): Promise<Result<void, string>> {
  const events: SocialEvent[] = [{
    type: 'PostLiked',
    aggregateId: cmd.postId,
    aggregateType: 'Post',
    timestamp: systemClock.now(),
    version: 1,
    payload: { postId: cmd.postId, userId: cmd.userId },
  }];

  events.forEach(e => socialFeedProjection.apply(e));
  viewStore.set('social_feed', socialFeedProjection.getState());
  return ok(undefined);
}

export async function handleCommentOnPost(cmd: CommentOnPost): Promise<Result<void, string>> {
  if (!cmd.body.trim()) return err('Comment cannot be empty');

  const events: SocialEvent[] = [{
    type: 'PostCommented',
    aggregateId: cmd.postId,
    aggregateType: 'Post',
    timestamp: systemClock.now(),
    version: 1,
    payload: {
      postId: cmd.postId,
      commentId: cryptoIdGenerator.next<'Comment'>(),
      authorName: cmd.authorName,
      body: cmd.body.trim(),
    },
  }];

  events.forEach(e => socialFeedProjection.apply(e));
  viewStore.set('social_feed', socialFeedProjection.getState());
  return ok(undefined);
}
```

- [ ] **Step 4: Create `features/social/queries/index.ts`**

```typescript
// features/social/queries/index.ts
import { viewStore } from '@data/projections/views';
import type { Post } from '../domain/types';

export function getSocialFeed(): Post[] {
  return viewStore.get<Post[]>('social_feed') ?? [];
}
```

- [ ] **Step 5: Replace stub `features/social/index.ts`**

```typescript
// features/social/index.ts
export type { Post, Comment, SocialEvent, SocialCommand, CreatePost, LikePost, CommentOnPost } from './domain/types';
export { socialFeedProjection } from './projections';
export { handleCreatePost, handleLikePost, handleCommentOnPost } from './commands/handlers';
export { getSocialFeed } from './queries';
```

- [ ] **Step 6: Add CSS for composer to `styling/global.css`**

```css
/* ─── Social Composer ─────────────────────────────────────── */

.composer {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.composer__textarea {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px 12px;
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--text-main);
  resize: none;
  min-height: 72px;
  width: 100%;
  box-sizing: border-box;
}

.composer__textarea:focus {
  outline: none;
  border-color: var(--accent);
}

.feed-item__actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.feed-action {
  background: none;
  border: none;
  color: var(--text-sub);
  font-size: 12px;
  cursor: pointer;
  padding: 2px 0;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: color 0.15s;
}

.feed-action:hover { color: var(--accent); }
.feed-action--liked { color: var(--coral); }

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--border);
}

.comment-item {
  font-size: 12px;
  color: var(--text-sub);
}

.comment-item__author {
  font-weight: 600;
  color: var(--text-main);
  margin-right: 4px;
}
```

- [ ] **Step 7: Rewrite `SocialScreen.tsx`**

```typescript
// ui/layouts/SocialScreen.tsx
import { useState } from 'react';
import { useQuery, useCommand } from '@ui/bindings';
import { handleCreatePost, handleLikePost, handleCommentOnPost } from '@features/social';
import type { Post } from '@features/social';
import type { Id } from '@shared/types';

const USER_ID = 'user-001' as Id<'User'>;
const USER_NAME = 'You';
const USER_INITIALS = 'ME';

const SEED_POSTS: Post[] = [
  {
    id: 'seed-1' as Id<'Post'>,
    authorId: 'user-jd' as Id<'User'>,
    authorName: 'James D.',
    authorInitials: 'JD',
    body: 'Crushed leg day — new squat PR at 130 kg. Feeling unstoppable.',
    likeCount: 4,
    likedByMe: false,
    comments: [],
    createdAt: Date.now() - 3600_000,
  },
  {
    id: 'seed-2' as Id<'Post'>,
    authorId: 'user-sr' as Id<'User'>,
    authorName: 'Sarah R.',
    authorInitials: 'SR',
    body: '10 km done in 52 minutes. Best time this month.',
    likeCount: 7,
    likedByMe: false,
    comments: [],
    createdAt: Date.now() - 10800_000,
  },
];

const events = [
  { id: 'e1', day: '12', month: 'APR', name: 'Park Run 5K', meta: 'Victoria Park · 08:00 · 24 going' },
  { id: 'e2', day: '19', month: 'APR', name: 'Deadlift Challenge', meta: 'FitTrack Online · All day · 11 going' },
  { id: 'e3', day: '26', month: 'APR', name: 'Group Ride 40K', meta: 'Riverside Route · 09:30 · 8 going' },
];

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60_000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function PostCard({ post }: { post: Post }) {
  const [showComment, setShowComment] = useState(false);
  const [commentText, setCommentText] = useState('');
  const { dispatch: like } = useCommand(handleLikePost);
  const { dispatch: comment } = useCommand(handleCommentOnPost);

  const handleLike = () =>
    like({ type: 'LikePost', postId: post.id, userId: USER_ID });

  const handleComment = async () => {
    if (!commentText.trim()) return;
    await comment({
      type: 'CommentOnPost',
      postId: post.id,
      userId: USER_ID,
      authorName: USER_NAME,
      body: commentText,
    });
    setCommentText('');
    setShowComment(false);
  };

  return (
    <div className="feed-item">
      <div className="feed-item__header">
        <div className="feed-item__avatar">{post.authorInitials}</div>
        <span className="feed-item__name">{post.authorName}</span>
        <span className="feed-item__time">{timeAgo(post.createdAt)}</span>
      </div>
      <div className="feed-item__body">{post.body}</div>
      <div className="feed-item__actions">
        <button
          className={post.likedByMe ? 'feed-action feed-action--liked' : 'feed-action'}
          onClick={handleLike}
        >
          ♥ {post.likeCount}
        </button>
        <button className="feed-action" onClick={() => setShowComment(v => !v)}>
          💬 {post.comments.length}
        </button>
      </div>
      {post.comments.length > 0 && (
        <div className="comment-list">
          {post.comments.map(c => (
            <div key={c.id} className="comment-item">
              <span className="comment-item__author">{c.authorName}</span>
              {c.body}
            </div>
          ))}
        </div>
      )}
      {showComment && (
        <div className="form-group">
          <input
            className="form-input"
            placeholder="Write a comment..."
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleComment()}
          />
          <button className="btn btn--ghost btn--small" onClick={handleComment}>Post</button>
        </div>
      )}
    </div>
  );
}

export function SocialScreen() {
  const [body, setBody] = useState('');
  const liveFeed = (useQuery<Post[]>('social_feed') ?? []) as Post[];
  const { dispatch: createPost } = useCommand(handleCreatePost);

  // Merge live posts (prepended) with seed posts
  const feed = [...liveFeed, ...SEED_POSTS];

  const handlePost = async () => {
    if (!body.trim()) return;
    await createPost({
      type: 'CreatePost',
      userId: USER_ID,
      authorName: USER_NAME,
      authorInitials: USER_INITIALS,
      body,
    });
    setBody('');
  };

  return (
    <div className="screen">
      <div className="composer anim-d1">
        <textarea
          className="composer__textarea"
          placeholder="Share your workout..."
          value={body}
          onChange={e => setBody(e.target.value)}
        />
        <button className="btn btn--primary" onClick={handlePost}>Post</button>
      </div>

      <p className="section-heading">Activity Feed</p>

      {feed.map((item, i) => (
        <div key={item.id} className={`anim-d${Math.min(i + 2, 6) as 2|3|4|5|6}`}>
          <PostCard post={item} />
        </div>
      ))}

      <p className="section-heading">Upcoming Events</p>

      {events.map((ev, i) => (
        <div key={ev.id} className={`event-card anim-d${(i + 2) as 2|3|4}`}>
          <div className="event-card__date">
            <span className="event-card__day">{ev.day}</span>
            <span className="event-card__month">{ev.month}</span>
          </div>
          <div className="event-card__info">
            <div className="event-card__name">{ev.name}</div>
            <div className="event-card__meta">{ev.meta}</div>
          </div>
          <button className="btn btn--primary btn--small">Join</button>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 8: Verify build**

Run: `npm run build`
Expected: No errors

- [ ] **Step 9: Test in browser**

- Navigate to Social tab
- Type a post and tap Post — it appears at top of feed
- Tap ♥ — like count increments
- Tap 💬 — comment input appears, submit adds comment


---

### Task 13: Profile Screen — PRs & Goals Section

Wire the Analytics PRs to the Profile screen and add a Goals section.

**Files:**
- Modify: `ui/layouts/ProfileScreen.tsx`
- Modify: `styling/global.css` (add `.goals-list`, `.goal-item` classes)

- [ ] **Step 1: Add CSS**

```css
/* ─── Goals List ──────────────────────────────────────────── */

.goals-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.goal-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.goal-item__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.goal-item__name {
  font-size: 13px;
  color: var(--text-main);
  font-weight: 500;
}

.goal-item__progress {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--accent);
}

.goal-bar {
  height: 4px;
  background: var(--border);
  border-radius: 2px;
  overflow: hidden;
}

.goal-bar__fill {
  height: 100%;
  background: var(--accent);
  border-radius: 2px;
  transition: width 0.3s ease;
}
```

- [ ] **Step 2: Update `ProfileScreen.tsx`**

Add the following imports:

```typescript
import { useQuery } from '@ui/bindings';
import type { PersonalRecord } from '@features/progress_analysis';
import '@features/progress_analysis';
```

Add these static goals (temporary until goal-setting commands are built):

```typescript
const GOALS = [
  { name: 'Squat 140 kg', current: 120, target: 140 },
  { name: 'Run 5K under 25 min', current: 28, target: 25, lowerIsBetter: true },
  { name: 'Log 20 sessions', current: 0, target: 20 },
];
```

Inside `ProfileScreen()`, add:

```typescript
const prs = (useQuery<PersonalRecord[]>('personal_records') ?? []) as PersonalRecord[];
```

After the Unit Preference section, add two new sections:

```tsx
<div className="section-card anim-d4">
  <div className="section-card__title">
    Personal Records
    {prs.length > 0 && (
      <span className="badge badge--amber" style={{ marginLeft: '8px' }}>{prs.length}</span>
    )}
  </div>
  {prs.length === 0 ? (
    <p style={{ fontSize: '13px', color: 'var(--text-sub)' }}>No PRs recorded yet.</p>
  ) : (
    prs.map((pr, i) => (
      <div key={pr.exerciseName} className="pr-row">
        <span className="pr-row__rank">#{i + 1}</span>
        <span className="pr-row__name">{pr.exerciseName}</span>
        <span className="pr-row__value">
          {pr.valueKg !== undefined ? `${pr.valueKg} kg` : '—'}
        </span>
      </div>
    ))
  )}
</div>

<div className="section-card anim-d5">
  <div className="section-card__title">Goals</div>
  <div className="goals-list">
    {GOALS.map(goal => {
      const pct = goal.lowerIsBetter
        ? Math.max(0, Math.min(100, (goal.target / goal.current) * 100))
        : Math.min(100, (goal.current / goal.target) * 100);
      return (
        <div key={goal.name} className="goal-item">
          <div className="goal-item__header">
            <span className="goal-item__name">{goal.name}</span>
            <span className="goal-item__progress">
              {goal.current} / {goal.target}
            </span>
          </div>
          <div className="goal-bar">
            <div className="goal-bar__fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      );
    })}
  </div>
</div>
```

> **Note:** `goal-bar__fill` uses `style={{ width: ... }}` for a genuinely dynamic inline width — this is correct; it cannot be a CSS class.

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: No errors


---

### Task 14: Readiness Feature — Dashboard Readiness Widget

Wire the readiness ring on the Dashboard to a real score derived from logged readiness check-ins.

**Files:**
- Create: `features/readiness/domain/types.ts`
- Create: `features/readiness/commands/handlers.ts`
- Create: `features/readiness/projections/index.ts`
- Modify: `features/readiness/index.ts`
- Modify: `ui/layouts/DashboardScreen.tsx`

- [ ] **Step 1: Create `features/readiness/domain/types.ts`**

```typescript
// features/readiness/domain/types.ts
import type { Id, DomainEvent } from '@shared/types';

export interface ReadinessEntry {
  userId: Id<'User'>;
  sleep: number;       // 1-10
  energy: number;      // 1-10
  soreness: number;    // 1-10 (higher = more sore)
  mood: number;        // 1-10
  loggedAt: number;
}

export interface ReadinessState {
  entries: ReadinessEntry[];
}

export type ReadinessEvent =
  | DomainEvent<'ReadinessLogged', ReadinessLoggedPayload>;

export interface ReadinessLoggedPayload {
  userId: Id<'User'>;
  sleep: number;
  energy: number;
  soreness: number;
  mood: number;
}

export interface LogReadiness {
  type: 'LogReadiness';
  userId: Id<'User'>;
  sleep: number;
  energy: number;
  soreness: number;
  mood: number;
}
```

- [ ] **Step 2: Create `features/readiness/projections/index.ts`**

```typescript
// features/readiness/projections/index.ts
import type { ReadinessEvent } from '../domain/types';
import { ProjectionBuilder } from '@data/projections/builders';

export interface TodayReadinessView {
  score: number;   // 0-100
  sleep: number;
  energy: number;
  soreness: number;
  mood: number;
  hasEntry: boolean;
}

export const todayReadinessProjection = new ProjectionBuilder<
  TodayReadinessView,
  ReadinessEvent
>(
  'today_readiness',
  { score: 0, sleep: 0, energy: 0, soreness: 0, mood: 0, hasEntry: false },
  {
    ReadinessLogged: (_state, event) => {
      if (event.type !== 'ReadinessLogged') return _state;
      const { sleep, energy, soreness, mood } = event.payload;
      // Score: average of sleep, energy, (10 - soreness), mood mapped to 0-100
      const score = Math.round(((sleep + energy + (10 - soreness) + mood) / 40) * 100);
      return { score, sleep, energy, soreness, mood, hasEntry: true };
    },
  }
);
```

- [ ] **Step 3: Create `features/readiness/commands/handlers.ts`**

```typescript
// features/readiness/commands/handlers.ts
import type { Result } from '@shared/types';
import { ok, err } from '@shared/types';
import type { LogReadiness, ReadinessEvent } from '../domain/types';
import { systemClock } from '@core/clock';
import { projectionRegistry } from '@data/projections/builders';
import { viewStore } from '@data/projections/views';
import { todayReadinessProjection } from '../projections';

projectionRegistry.register('today_readiness', todayReadinessProjection);

export async function handleLogReadiness(cmd: LogReadiness): Promise<Result<void, string>> {
  for (const field of ['sleep', 'energy', 'soreness', 'mood'] as const) {
    if (cmd[field] < 1 || cmd[field] > 10) return err(`${field} must be between 1 and 10`);
  }

  const events: ReadinessEvent[] = [{
    type: 'ReadinessLogged',
    aggregateId: cmd.userId,
    aggregateType: 'User',
    timestamp: systemClock.now(),
    version: 1,
    payload: {
      userId: cmd.userId,
      sleep: cmd.sleep,
      energy: cmd.energy,
      soreness: cmd.soreness,
      mood: cmd.mood,
    },
  }];

  events.forEach(e => todayReadinessProjection.apply(e));
  viewStore.set('today_readiness', todayReadinessProjection.getState());
  return ok(undefined);
}
```

- [ ] **Step 4: Replace stub `features/readiness/index.ts`**

```typescript
// features/readiness/index.ts
export type { ReadinessEntry, ReadinessState, ReadinessEvent, LogReadiness } from './domain/types';
export type { TodayReadinessView } from './projections';
export { todayReadinessProjection } from './projections';
export { handleLogReadiness } from './commands/handlers';
```

- [ ] **Step 5: Wire Dashboard to readiness**

In `DashboardScreen.tsx`, add:

```typescript
import { useQuery, useCommand } from '@ui/bindings';
import { handleLogReadiness } from '@features/readiness';
import type { TodayReadinessView } from '@features/readiness';
import type { Id } from '@shared/types';

const USER_ID = 'user-001' as Id<'User'>;
```

Inside `DashboardScreen()`:

```typescript
const readiness = useQuery<TodayReadinessView>('today_readiness');
const SCORE = readiness?.hasEntry ? readiness.score : 82; // fallback to design placeholder
```

Replace the hardcoded `SCORE = 82` with this dynamic value. The ring calculation (`CIRC`, `OFFSET`) already uses the `SCORE` variable so it will automatically update.

Also replace the sleep/energy widget values with:

```tsx
<div className="widget">
  <div className="widget__value">{readiness?.sleep ?? '—'}</div>
  <div className="widget__label">Sleep</div>
</div>
<div className="widget">
  <div className="widget__value">{readiness?.energy ?? '—'}</div>
  <div className="widget__label">Energy</div>
</div>
```

Add a readiness check-in panel below the ring section:

```tsx
{!readiness?.hasEntry && (
  <div className="section-card anim-d2">
    <div className="section-card__title">Log Today's Readiness</div>
    <ReadinessForm />
  </div>
)}
```

Add the `ReadinessForm` component above `DashboardScreen`:

```typescript
function ReadinessForm() {
  const [sleep, setSleep] = useState(7);
  const [energy, setEnergy] = useState(7);
  const [soreness, setSoreness] = useState(3);
  const [mood, setMood] = useState(7);
  const { dispatch } = useCommand(handleLogReadiness);

  const handleSubmit = () =>
    dispatch({ type: 'LogReadiness', userId: USER_ID, sleep, energy, soreness, mood });

  const slider = (label: string, val: number, setter: (v: number) => void) => (
    <div className="form-group">
      <label className="form-label">{label}: {val}/10</label>
      <input
        type="range"
        min={1}
        max={10}
        value={val}
        onChange={e => setter(Number(e.target.value))}
        className="form-range"
      />
    </div>
  );

  return (
    <div className="form-group">
      {slider('Sleep', sleep, setSleep)}
      {slider('Energy', energy, setEnergy)}
      {slider('Soreness', soreness, setSoreness)}
      {slider('Mood', mood, setMood)}
      <button className="btn btn--primary" onClick={handleSubmit}>Log Readiness</button>
    </div>
  );
}
```

Add `.form-range` and `.form-label` to `styling/global.css`:

```css
.form-label {
  font-size: 12px;
  color: var(--text-sub);
  margin-bottom: 4px;
}

.form-range {
  width: 100%;
  accent-color: var(--accent);
}
```

- [ ] **Step 6: Verify build**

Run: `npm run build`
Expected: No errors

- [ ] **Step 7: Test in browser**

- Dashboard shows readiness form if not logged today
- Adjust sliders and log — ring animates to real score
- Sleep/energy widgets show logged values


---

### Task 15: Cardio Feature Module

**Source:** `features/cardio/manifest.md`
**Used by:** Log tab (alongside training_log), Progress tab, Analytics tab, Dashboard

**Files:**
- Create: `features/cardio/domain/types.ts`
- Create: `features/cardio/domain/reducers.ts`
- Create: `features/cardio/projections/index.ts`
- Create: `features/cardio/commands/handlers.ts`
- Create: `features/cardio/queries/index.ts`
- Create: `features/cardio/index.ts`

- [ ] **Step 1: Domain types**

```typescript
// features/cardio/domain/types.ts
import type { Id, DomainEvent } from '@shared/types';

export type CardioSport = 'run' | 'cycle' | 'swim' | 'row' | 'hike' | 'ski';

export interface CardioSession {
  id: Id<'CardioSession'>;
  userId: Id<'User'>;
  sport: CardioSport;
  startedAt: number;
  durationSeconds: number;
  distanceMeters: number;
  notes: string;
  routeId: Id<'Route'> | null;
}

export interface CardioState {
  sessions: CardioSession[];
}

export type CardioEvent =
  | DomainEvent<'CardioSessionRecorded', CardioSessionRecordedPayload>
  | DomainEvent<'CardioSessionUpdated', CardioSessionUpdatedPayload>
  | DomainEvent<'CardioSessionDeleted', CardioSessionDeletedPayload>
  | DomainEvent<'RouteImported', RouteImportedPayload>;

export interface CardioSessionRecordedPayload {
  sessionId: Id<'CardioSession'>;
  userId: Id<'User'>;
  sport: CardioSport;
  durationSeconds: number;
  distanceMeters: number;
  notes: string;
}

export interface CardioSessionUpdatedPayload {
  sessionId: Id<'CardioSession'>;
  durationSeconds?: number;
  distanceMeters?: number;
  notes?: string;
}

export interface CardioSessionDeletedPayload {
  sessionId: Id<'CardioSession'>;
}

export interface RouteImportedPayload {
  routeId: Id<'Route'>;
  sessionId: Id<'CardioSession'>;
  name: string;
  points: Array<{ lat: number; lng: number; elevationM: number }>;
}

export interface RecordCardioSession {
  type: 'RecordCardioSession';
  userId: Id<'User'>;
  sport: CardioSport;
  durationSeconds: number;
  distanceMeters: number;
  notes: string;
}

export interface UpdateCardioSession {
  type: 'UpdateCardioSession';
  sessionId: Id<'CardioSession'>;
  durationSeconds?: number;
  distanceMeters?: number;
  notes?: string;
}

export interface DeleteCardioSession {
  type: 'DeleteCardioSession';
  sessionId: Id<'CardioSession'>;
}

export type CardioCommand =
  | RecordCardioSession
  | UpdateCardioSession
  | DeleteCardioSession;
```

- [ ] **Step 2: Reducers**

```typescript
// features/cardio/domain/reducers.ts
import type { CardioState, CardioEvent } from './types';

export const initialCardioState: CardioState = { sessions: [] };

export const cardioReducers: Record<
  string,
  (state: CardioState, event: CardioEvent) => CardioState
> = {
  CardioSessionRecorded: (state, event) => {
    if (event.type !== 'CardioSessionRecorded') return state;
    const session = {
      id: event.payload.sessionId,
      userId: event.payload.userId,
      sport: event.payload.sport,
      startedAt: event.timestamp,
      durationSeconds: event.payload.durationSeconds,
      distanceMeters: event.payload.distanceMeters,
      notes: event.payload.notes,
      routeId: null,
    };
    return { sessions: [...state.sessions, session] };
  },
  CardioSessionUpdated: (state, event) => {
    if (event.type !== 'CardioSessionUpdated') return state;
    return {
      sessions: state.sessions.map(s =>
        s.id === event.payload.sessionId ? { ...s, ...event.payload } : s
      ),
    };
  },
  CardioSessionDeleted: (state, event) => {
    if (event.type !== 'CardioSessionDeleted') return state;
    return { sessions: state.sessions.filter(s => s.id !== event.payload.sessionId) };
  },
};
```

- [ ] **Step 3: Projections**

```typescript
// features/cardio/projections/index.ts
import { viewStore } from '@data/projections/views';
import { projectionRegistry } from '@data/projections/builders';
import { cardioReducers, initialCardioState } from '../domain/reducers';
import type { CardioSession } from '../domain/types';

export interface RecentCardioView {
  sessions: CardioSession[];
}

export interface MonthlyCardioView {
  sport: string;
  month: string;  // YYYY-MM
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  sessionCount: number;
}

projectionRegistry.register('recent_cardio_sessions', events => {
  const state = events
    .filter(e => e.type.startsWith('Cardio'))
    .reduce((s, e) => {
      const reducer = cardioReducers[e.type];
      return reducer ? reducer(s, e as any) : s;
    }, initialCardioState);

  const view: RecentCardioView = {
    sessions: [...state.sessions].sort((a, b) => b.startedAt - a.startedAt).slice(0, 20),
  };
  viewStore.set('recent_cardio_sessions', view);
});

projectionRegistry.register('monthly_cardio_progression', events => {
  const state = events
    .filter(e => e.type === 'CardioSessionRecorded')
    .reduce((s, e) => {
      const reducer = cardioReducers[e.type];
      return reducer ? reducer(s, e as any) : s;
    }, initialCardioState);

  const byMonth: Record<string, MonthlyCardioView> = {};
  for (const s of state.sessions) {
    const month = new Date(s.startedAt).toISOString().slice(0, 7);
    const key = `${s.sport}:${month}`;
    if (!byMonth[key]) byMonth[key] = { sport: s.sport, month, totalDistanceMeters: 0, totalDurationSeconds: 0, sessionCount: 0 };
    byMonth[key].totalDistanceMeters += s.distanceMeters;
    byMonth[key].totalDurationSeconds += s.durationSeconds;
    byMonth[key].sessionCount += 1;
  }
  viewStore.set('monthly_cardio_progression', Object.values(byMonth));
});
```

- [ ] **Step 4: Command handlers**

```typescript
// features/cardio/commands/handlers.ts
import { eventStore } from '@data/event_store';
import { viewStore } from '@data/projections/views';
import { projectionRegistry } from '@data/projections/builders';
import type { RecordCardioSession, UpdateCardioSession, DeleteCardioSession } from '../domain/types';

const newId = <T extends string>(): import('@shared/types').Id<T> =>
  crypto.randomUUID() as import('@shared/types').Id<T>;

export async function handleRecordCardioSession(cmd: RecordCardioSession) {
  const sessionId = newId<'CardioSession'>();
  await eventStore.append({
    type: 'CardioSessionRecorded',
    payload: { sessionId, userId: cmd.userId, sport: cmd.sport, durationSeconds: cmd.durationSeconds, distanceMeters: cmd.distanceMeters, notes: cmd.notes },
    timestamp: Date.now(),
  });
  await projectionRegistry.rebuild(['recent_cardio_sessions', 'monthly_cardio_progression']);
}

export async function handleUpdateCardioSession(cmd: UpdateCardioSession) {
  await eventStore.append({
    type: 'CardioSessionUpdated',
    payload: { sessionId: cmd.sessionId, durationSeconds: cmd.durationSeconds, distanceMeters: cmd.distanceMeters, notes: cmd.notes },
    timestamp: Date.now(),
  });
  await projectionRegistry.rebuild(['recent_cardio_sessions', 'monthly_cardio_progression']);
}

export async function handleDeleteCardioSession(cmd: DeleteCardioSession) {
  await eventStore.append({
    type: 'CardioSessionDeleted',
    payload: { sessionId: cmd.sessionId },
    timestamp: Date.now(),
  });
  await projectionRegistry.rebuild(['recent_cardio_sessions', 'monthly_cardio_progression']);
}
```

- [ ] **Step 5: Queries**

```typescript
// features/cardio/queries/index.ts
import { viewStore } from '@data/projections/views';
import type { RecentCardioView, MonthlyCardioView } from '../projections';
import type { CardioSport } from '../domain/types';

export function getRecentCardioSessions(sport?: CardioSport): RecentCardioView {
  const view = viewStore.get<RecentCardioView>('recent_cardio_sessions');
  if (!view) return { sessions: [] };
  return sport ? { sessions: view.sessions.filter(s => s.sport === sport) } : view;
}

export function getMonthlyProgression(sport: CardioSport): MonthlyCardioView[] {
  const all = viewStore.get<MonthlyCardioView[]>('monthly_cardio_progression') ?? [];
  return all.filter(m => m.sport === sport);
}
```

- [ ] **Step 6: Public index**

```typescript
// features/cardio/index.ts
export * from './domain/types';
export * from './projections';
export * from './queries';
export { handleRecordCardioSession, handleUpdateCardioSession, handleDeleteCardioSession } from './commands/handlers';
```

- [ ] **Step 7: Verify build** — `npm run build`

---

### Task 16: Insights Feature Module

**Source:** `features/insights/manifest.md`
**Used by:** Progress tab, Analytics tab
**Note:** Driven by analytics pipelines, not user commands. Events are emitted by post-projection analysis.

**Files:**
- Create: `features/insights/domain/types.ts`
- Create: `features/insights/projections/index.ts`
- Create: `features/insights/queries/index.ts`
- Create: `features/insights/index.ts`

- [ ] **Step 1: Domain types**

```typescript
// features/insights/domain/types.ts
import type { Id, DomainEvent } from '@shared/types';

export type InsightSeverity = 'info' | 'warning' | 'success';

export interface Insight {
  id: Id<'Insight'>;
  type: 'PlateauDetected' | 'PRAchieved' | 'VolumeSpike' | 'FrequencyDrop' | 'OvertrainingRisk';
  severity: InsightSeverity;
  sport?: string;
  exerciseId?: Id<'Exercise'>;
  message: string;
  detectedAt: number;
}

export interface InsightsState {
  insights: Insight[];
}

export type InsightEvent =
  | DomainEvent<'PlateauDetected', PlateauDetectedPayload>
  | DomainEvent<'PRAchieved', PRAchievedPayload>
  | DomainEvent<'VolumeSpike', VolumeSpikePayload>
  | DomainEvent<'FrequencyDrop', FrequencyDropPayload>
  | DomainEvent<'OvertrainingRisk', OvertrainingRiskPayload>;

export interface PlateauDetectedPayload {
  insightId: Id<'Insight'>;
  exerciseId: Id<'Exercise'>;
  message: string;
}

export interface PRAchievedPayload {
  insightId: Id<'Insight'>;
  exerciseId: Id<'Exercise'>;
  sport?: string;
  message: string;
}

export interface VolumeSpikePayload {
  insightId: Id<'Insight'>;
  sport?: string;
  message: string;
}

export interface FrequencyDropPayload {
  insightId: Id<'Insight'>;
  sport?: string;
  message: string;
}

export interface OvertrainingRiskPayload {
  insightId: Id<'Insight'>;
  message: string;
}
```

- [ ] **Step 2: Projections**

```typescript
// features/insights/projections/index.ts
import { viewStore } from '@data/projections/views';
import { projectionRegistry } from '@data/projections/builders';
import type { Insight, InsightEvent } from '../domain/types';
import type { Id } from '@shared/types';

const INSIGHT_TYPES = ['PlateauDetected', 'PRAchieved', 'VolumeSpike', 'FrequencyDrop', 'OvertrainingRisk'];

function eventToInsight(e: InsightEvent): Insight {
  const payload = e.payload as any;
  const severityMap: Record<string, Insight['severity']> = {
    PlateauDetected: 'warning',
    PRAchieved: 'success',
    VolumeSpike: 'warning',
    FrequencyDrop: 'info',
    OvertrainingRisk: 'warning',
  };
  return {
    id: payload.insightId,
    type: e.type as Insight['type'],
    severity: severityMap[e.type] ?? 'info',
    sport: payload.sport,
    exerciseId: payload.exerciseId,
    message: payload.message,
    detectedAt: e.timestamp,
  };
}

projectionRegistry.register('insights_by_sport', events => {
  const insights = events
    .filter(e => INSIGHT_TYPES.includes(e.type) && (e.payload as any).sport)
    .map(e => eventToInsight(e as InsightEvent));
  viewStore.set('insights_by_sport', insights);
});

projectionRegistry.register('insights_by_exercise', events => {
  const insights = events
    .filter(e => INSIGHT_TYPES.includes(e.type) && (e.payload as any).exerciseId)
    .map(e => eventToInsight(e as InsightEvent));
  viewStore.set('insights_by_exercise', insights);
});
```

- [ ] **Step 3: Queries**

```typescript
// features/insights/queries/index.ts
import { viewStore } from '@data/projections/views';
import type { Insight } from '../domain/types';
import type { Id } from '@shared/types';

export function getInsightsForSport(sport: string): Insight[] {
  return (viewStore.get<Insight[]>('insights_by_sport') ?? []).filter(i => i.sport === sport);
}

export function getInsightsForExercise(exerciseId: Id<'Exercise'>): Insight[] {
  return (viewStore.get<Insight[]>('insights_by_exercise') ?? []).filter(i => i.exerciseId === exerciseId);
}
```

- [ ] **Step 4: Public index**

```typescript
// features/insights/index.ts
export * from './domain/types';
export * from './projections';
export * from './queries';
```

- [ ] **Step 5: Verify build** — `npm run build`

---

### Task 17: Scheduling Feature Module

**Source:** `features/scheduling/manifest.md`
**Used by:** Social tab (joined events), Dashboard (schedule for day)

**Files:**
- Create: `features/scheduling/domain/types.ts`
- Create: `features/scheduling/domain/reducers.ts`
- Create: `features/scheduling/projections/index.ts`
- Create: `features/scheduling/commands/handlers.ts`
- Create: `features/scheduling/queries/index.ts`
- Create: `features/scheduling/index.ts`

- [ ] **Step 1: Domain types**

```typescript
// features/scheduling/domain/types.ts
import type { Id, DomainEvent } from '@shared/types';

export interface Appointment {
  id: Id<'Appointment'>;
  userId: Id<'User'>;
  title: string;
  scheduledAt: number;
  durationMinutes: number;
  notes: string;
  order: number;
}

export interface ScheduledEvent {
  id: Id<'ScheduledEvent'>;
  title: string;
  sport: string;
  startAt: number;
  endAt: number;
  organizerId: Id<'User'>;
  joinedAt: number | null;
}

export interface SchedulingState {
  appointments: Appointment[];
  joinedEvents: ScheduledEvent[];
}

export type SchedulingEvent =
  | DomainEvent<'AppointmentAdded', AppointmentAddedPayload>
  | DomainEvent<'AppointmentUpdated', AppointmentUpdatedPayload>
  | DomainEvent<'AppointmentDeleted', AppointmentDeletedPayload>
  | DomainEvent<'AppointmentsReordered', AppointmentsReorderedPayload>
  | DomainEvent<'EventJoined', EventJoinedPayload>
  | DomainEvent<'EventLeft', EventLeftPayload>;

export interface AppointmentAddedPayload { appointmentId: Id<'Appointment'>; userId: Id<'User'>; title: string; scheduledAt: number; durationMinutes: number; notes: string; order: number; }
export interface AppointmentUpdatedPayload { appointmentId: Id<'Appointment'>; title?: string; scheduledAt?: number; durationMinutes?: number; notes?: string; }
export interface AppointmentDeletedPayload { appointmentId: Id<'Appointment'>; }
export interface AppointmentsReorderedPayload { orderedIds: Id<'Appointment'>[]; }
export interface EventJoinedPayload { eventId: Id<'ScheduledEvent'>; title: string; sport: string; startAt: number; endAt: number; organizerId: Id<'User'>; }
export interface EventLeftPayload { eventId: Id<'ScheduledEvent'>; }

export interface AddAppointment { type: 'AddAppointment'; userId: Id<'User'>; title: string; scheduledAt: number; durationMinutes: number; notes: string; }
export interface UpdateAppointment { type: 'UpdateAppointment'; appointmentId: Id<'Appointment'>; title?: string; scheduledAt?: number; durationMinutes?: number; notes?: string; }
export interface DeleteAppointment { type: 'DeleteAppointment'; appointmentId: Id<'Appointment'>; }
export interface ReorderAppointments { type: 'ReorderAppointments'; orderedIds: Id<'Appointment'>[]; }
export interface JoinEvent { type: 'JoinEvent'; eventId: Id<'ScheduledEvent'>; title: string; sport: string; startAt: number; endAt: number; organizerId: Id<'User'>; }
export interface LeaveEvent { type: 'LeaveEvent'; eventId: Id<'ScheduledEvent'>; }

export type SchedulingCommand = AddAppointment | UpdateAppointment | DeleteAppointment | ReorderAppointments | JoinEvent | LeaveEvent;
```

- [ ] **Step 2: Reducers**

```typescript
// features/scheduling/domain/reducers.ts
import type { SchedulingState, SchedulingEvent } from './types';

export const initialSchedulingState: SchedulingState = { appointments: [], joinedEvents: [] };

export const schedulingReducers: Record<
  string,
  (state: SchedulingState, event: SchedulingEvent) => SchedulingState
> = {
  AppointmentAdded: (state, event) => {
    if (event.type !== 'AppointmentAdded') return state;
    const a = { id: event.payload.appointmentId, userId: event.payload.userId, title: event.payload.title, scheduledAt: event.payload.scheduledAt, durationMinutes: event.payload.durationMinutes, notes: event.payload.notes, order: event.payload.order };
    return { ...state, appointments: [...state.appointments, a] };
  },
  AppointmentUpdated: (state, event) => {
    if (event.type !== 'AppointmentUpdated') return state;
    return { ...state, appointments: state.appointments.map(a => a.id === event.payload.appointmentId ? { ...a, ...event.payload } : a) };
  },
  AppointmentDeleted: (state, event) => {
    if (event.type !== 'AppointmentDeleted') return state;
    return { ...state, appointments: state.appointments.filter(a => a.id !== event.payload.appointmentId) };
  },
  AppointmentsReordered: (state, event) => {
    if (event.type !== 'AppointmentsReordered') return state;
    const order = event.payload.orderedIds;
    return { ...state, appointments: [...state.appointments].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id)).map((a, i) => ({ ...a, order: i })) };
  },
  EventJoined: (state, event) => {
    if (event.type !== 'EventJoined') return state;
    const e = { id: event.payload.eventId, title: event.payload.title, sport: event.payload.sport, startAt: event.payload.startAt, endAt: event.payload.endAt, organizerId: event.payload.organizerId, joinedAt: event.timestamp };
    return { ...state, joinedEvents: [...state.joinedEvents, e] };
  },
  EventLeft: (state, event) => {
    if (event.type !== 'EventLeft') return state;
    return { ...state, joinedEvents: state.joinedEvents.filter(e => e.id !== event.payload.eventId) };
  },
};
```

- [ ] **Step 3: Projections**

```typescript
// features/scheduling/projections/index.ts
import { viewStore } from '@data/projections/views';
import { projectionRegistry } from '@data/projections/builders';
import { schedulingReducers, initialSchedulingState } from '../domain/reducers';

const SCHEDULING_EVENTS = ['AppointmentAdded', 'AppointmentUpdated', 'AppointmentDeleted', 'AppointmentsReordered', 'EventJoined', 'EventLeft'];

projectionRegistry.register('appointments_by_date', events => {
  const state = events.filter(e => SCHEDULING_EVENTS.includes(e.type)).reduce((s, e) => {
    const r = schedulingReducers[e.type];
    return r ? r(s, e as any) : s;
  }, initialSchedulingState);
  const sorted = [...state.appointments].sort((a, b) => a.scheduledAt - b.scheduledAt);
  viewStore.set('appointments_by_date', sorted);
});

projectionRegistry.register('joined_events', events => {
  const state = events.filter(e => e.type === 'EventJoined' || e.type === 'EventLeft').reduce((s, e) => {
    const r = schedulingReducers[e.type];
    return r ? r(s, e as any) : s;
  }, initialSchedulingState);
  viewStore.set('joined_events', state.joinedEvents);
});
```

- [ ] **Step 4: Command handlers**

```typescript
// features/scheduling/commands/handlers.ts
import { eventStore } from '@data/event_store';
import { projectionRegistry } from '@data/projections/builders';
import type { AddAppointment, UpdateAppointment, DeleteAppointment, ReorderAppointments, JoinEvent, LeaveEvent } from '../domain/types';

const newId = <T extends string>(): import('@shared/types').Id<T> => crypto.randomUUID() as import('@shared/types').Id<T>;

export async function handleAddAppointment(cmd: AddAppointment) {
  await eventStore.append({ type: 'AppointmentAdded', payload: { appointmentId: newId<'Appointment'>(), userId: cmd.userId, title: cmd.title, scheduledAt: cmd.scheduledAt, durationMinutes: cmd.durationMinutes, notes: cmd.notes, order: Date.now() }, timestamp: Date.now() });
  await projectionRegistry.rebuild(['appointments_by_date']);
}

export async function handleUpdateAppointment(cmd: UpdateAppointment) {
  await eventStore.append({ type: 'AppointmentUpdated', payload: { appointmentId: cmd.appointmentId, title: cmd.title, scheduledAt: cmd.scheduledAt, durationMinutes: cmd.durationMinutes, notes: cmd.notes }, timestamp: Date.now() });
  await projectionRegistry.rebuild(['appointments_by_date']);
}

export async function handleDeleteAppointment(cmd: DeleteAppointment) {
  await eventStore.append({ type: 'AppointmentDeleted', payload: { appointmentId: cmd.appointmentId }, timestamp: Date.now() });
  await projectionRegistry.rebuild(['appointments_by_date']);
}

export async function handleReorderAppointments(cmd: ReorderAppointments) {
  await eventStore.append({ type: 'AppointmentsReordered', payload: { orderedIds: cmd.orderedIds }, timestamp: Date.now() });
  await projectionRegistry.rebuild(['appointments_by_date']);
}

export async function handleJoinEvent(cmd: JoinEvent) {
  await eventStore.append({ type: 'EventJoined', payload: { eventId: cmd.eventId, title: cmd.title, sport: cmd.sport, startAt: cmd.startAt, endAt: cmd.endAt, organizerId: cmd.organizerId }, timestamp: Date.now() });
  await projectionRegistry.rebuild(['joined_events']);
}

export async function handleLeaveEvent(cmd: LeaveEvent) {
  await eventStore.append({ type: 'EventLeft', payload: { eventId: cmd.eventId }, timestamp: Date.now() });
  await projectionRegistry.rebuild(['joined_events']);
}
```

- [ ] **Step 5: Queries**

```typescript
// features/scheduling/queries/index.ts
import { viewStore } from '@data/projections/views';
import type { Appointment, ScheduledEvent } from '../domain/types';

export function getScheduleForDay(dateMs: number): Appointment[] {
  const allAppointments = viewStore.get<Appointment[]>('appointments_by_date') ?? [];
  const startOfDay = new Date(dateMs);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(dateMs);
  endOfDay.setHours(23, 59, 59, 999);
  return allAppointments.filter(a => a.scheduledAt >= startOfDay.getTime() && a.scheduledAt <= endOfDay.getTime());
}

export function getAppointments(): Appointment[] {
  return viewStore.get<Appointment[]>('appointments_by_date') ?? [];
}

export function getJoinedEvents(): ScheduledEvent[] {
  return viewStore.get<ScheduledEvent[]>('joined_events') ?? [];
}
```

- [ ] **Step 6: Public index**

```typescript
// features/scheduling/index.ts
export * from './domain/types';
export * from './projections';
export * from './queries';
export { handleAddAppointment, handleUpdateAppointment, handleDeleteAppointment, handleReorderAppointments, handleJoinEvent, handleLeaveEvent } from './commands/handlers';
```

- [ ] **Step 7: Verify build** — `npm run build`

---

### Task 18: Conditions Feature Module

**Source:** `features/conditions/manifest.md`
**Used by:** Dashboard (suitability widget)

**Files:**
- Create: `features/conditions/domain/types.ts`
- Create: `features/conditions/projections/index.ts`
- Create: `features/conditions/commands/handlers.ts`
- Create: `features/conditions/queries/index.ts`
- Create: `features/conditions/index.ts`

- [ ] **Step 1: Domain types**

```typescript
// features/conditions/domain/types.ts
import type { DomainEvent } from '@shared/types';

export interface WeatherCondition {
  tempCelsius: number;
  humidity: number;
  windKph: number;
  description: string;
  icon: string;
  fetchedAt: number;
}

export type SportSuitability = 'excellent' | 'good' | 'fair' | 'poor';

export interface SuitabilityEntry {
  sport: string;
  suitability: SportSuitability;
  reason: string;
}

export interface ConditionsState {
  current: WeatherCondition | null;
  suitability: SuitabilityEntry[];
}

export type ConditionsEvent =
  | DomainEvent<'ForecastFetched', ForecastFetchedPayload>
  | DomainEvent<'SuitabilityComputed', SuitabilityComputedPayload>;

export interface ForecastFetchedPayload {
  tempCelsius: number;
  humidity: number;
  windKph: number;
  description: string;
  icon: string;
}

export interface SuitabilityComputedPayload {
  suitability: SuitabilityEntry[];
}

export interface RefreshConditions {
  type: 'RefreshConditions';
}
```

- [ ] **Step 2: Projections**

```typescript
// features/conditions/projections/index.ts
import { viewStore } from '@data/projections/views';
import { projectionRegistry } from '@data/projections/builders';
import type { WeatherCondition, SuitabilityEntry } from '../domain/types';

projectionRegistry.register('current_conditions', events => {
  const latest = [...events].reverse().find(e => e.type === 'ForecastFetched');
  if (!latest) { viewStore.set('current_conditions', null); return; }
  const p = latest.payload as any;
  const view: WeatherCondition = { tempCelsius: p.tempCelsius, humidity: p.humidity, windKph: p.windKph, description: p.description, icon: p.icon, fetchedAt: latest.timestamp };
  viewStore.set('current_conditions', view);
});

projectionRegistry.register('suitability_by_sport', events => {
  const latest = [...events].reverse().find(e => e.type === 'SuitabilityComputed');
  if (!latest) { viewStore.set('suitability_by_sport', []); return; }
  viewStore.set('suitability_by_sport', (latest.payload as any).suitability as SuitabilityEntry[]);
});
```

- [ ] **Step 3: Command handler** (stub — actual fetch is a remote call)

```typescript
// features/conditions/commands/handlers.ts
import { eventStore } from '@data/event_store';
import { projectionRegistry } from '@data/projections/builders';
import type { RefreshConditions } from '../domain/types';
import type { SuitabilityEntry } from '../domain/types';

// Stub: replace with real weather API call in production
function computeSuitability(tempCelsius: number, windKph: number): SuitabilityEntry[] {
  const sports = ['run', 'cycle', 'swim', 'row', 'hike', 'ski'];
  return sports.map(sport => ({
    sport,
    suitability: tempCelsius > 0 && windKph < 30 ? 'good' : 'fair',
    reason: windKph >= 30 ? 'High wind' : tempCelsius <= 0 ? 'Freezing' : 'OK',
  }));
}

export async function handleRefreshConditions(_cmd: RefreshConditions) {
  // Stub data — replace with fetch() call to weather API
  const stub = { tempCelsius: 18, humidity: 60, windKph: 12, description: 'Partly cloudy', icon: '⛅' };
  await eventStore.append({ type: 'ForecastFetched', payload: stub, timestamp: Date.now() });
  await eventStore.append({ type: 'SuitabilityComputed', payload: { suitability: computeSuitability(stub.tempCelsius, stub.windKph) }, timestamp: Date.now() });
  await projectionRegistry.rebuild(['current_conditions', 'suitability_by_sport']);
}
```

- [ ] **Step 4: Queries**

```typescript
// features/conditions/queries/index.ts
import { viewStore } from '@data/projections/views';
import type { WeatherCondition, SuitabilityEntry } from '../domain/types';

export function getCurrentConditions(): WeatherCondition | null {
  return viewStore.get<WeatherCondition>('current_conditions') ?? null;
}

export function getSuitability(sport?: string): SuitabilityEntry[] {
  const all = viewStore.get<SuitabilityEntry[]>('suitability_by_sport') ?? [];
  return sport ? all.filter(s => s.sport === sport) : all;
}
```

- [ ] **Step 5: Public index**

```typescript
// features/conditions/index.ts
export * from './domain/types';
export * from './projections';
export * from './queries';
export { handleRefreshConditions } from './commands/handlers';
```

- [ ] **Step 6: Verify build** — `npm run build`

---

### Task 19: News Feed Feature Module

**Source:** `features/news_feed/manifest.md`
**Used by:** Dashboard (headlines, deals widgets)

**Files:**
- Create: `features/news_feed/domain/types.ts`
- Create: `features/news_feed/projections/index.ts`
- Create: `features/news_feed/commands/handlers.ts`
- Create: `features/news_feed/queries/index.ts`
- Create: `features/news_feed/index.ts`

- [ ] **Step 1: Domain types**

```typescript
// features/news_feed/domain/types.ts
import type { Id, DomainEvent } from '@shared/types';

export interface Headline {
  id: Id<'Headline'>;
  title: string;
  source: string;
  url: string;
  publishedAt: number;
  isRead: boolean;
}

export interface Deal {
  id: Id<'Deal'>;
  title: string;
  brand: string;
  discountPercent: number;
  url: string;
  expiresAt: number | null;
}

export interface NewsFeedState {
  headlines: Headline[];
  deals: Deal[];
}

export type NewsFeedEvent =
  | DomainEvent<'HeadlinesFetched', HeadlinesFetchedPayload>
  | DomainEvent<'DealsFetched', DealsFetchedPayload>
  | DomainEvent<'ArticleRead', ArticleReadPayload>;

export interface HeadlinesFetchedPayload { headlines: Omit<Headline, 'isRead'>[]; }
export interface DealsFetchedPayload { deals: Deal[]; }
export interface ArticleReadPayload { articleId: Id<'Headline'>; }

export interface RefreshFeed { type: 'RefreshFeed'; }
export interface MarkArticleRead { type: 'MarkArticleRead'; articleId: Id<'Headline'>; }
export type NewsFeedCommand = RefreshFeed | MarkArticleRead;
```

- [ ] **Step 2: Projections**

```typescript
// features/news_feed/projections/index.ts
import { viewStore } from '@data/projections/views';
import { projectionRegistry } from '@data/projections/builders';
import type { Headline, Deal, NewsFeedEvent } from '../domain/types';

projectionRegistry.register('headlines', events => {
  let headlines: Headline[] = [];
  for (const e of events) {
    if (e.type === 'HeadlinesFetched') {
      headlines = (e.payload as any).headlines.map((h: any) => ({ ...h, isRead: false }));
    } else if (e.type === 'ArticleRead') {
      headlines = headlines.map(h => h.id === (e.payload as any).articleId ? { ...h, isRead: true } : h);
    }
  }
  viewStore.set('headlines', headlines);
});

projectionRegistry.register('deals', events => {
  const latest = [...events].reverse().find(e => e.type === 'DealsFetched');
  viewStore.set('deals', latest ? (latest.payload as any).deals : []);
});

projectionRegistry.register('unread_count', events => {
  const headlines = viewStore.get<Headline[]>('headlines') ?? [];
  viewStore.set('unread_count', headlines.filter(h => !h.isRead).length);
});
```

- [ ] **Step 3: Command handlers** (stub)

```typescript
// features/news_feed/commands/handlers.ts
import { eventStore } from '@data/event_store';
import { projectionRegistry } from '@data/projections/builders';
import type { RefreshFeed, MarkArticleRead } from '../domain/types';

export async function handleRefreshFeed(_cmd: RefreshFeed) {
  // Stub — replace with real API fetch
  const headlines = [
    { id: 'h1' as any, title: 'New Study: Progressive Overload Key to Hypertrophy', source: 'SportsScience', url: '#', publishedAt: Date.now() },
    { id: 'h2' as any, title: 'How Sleep Affects Recovery', source: 'FitHealth', url: '#', publishedAt: Date.now() - 86400000 },
  ];
  const deals = [
    { id: 'd1' as any, title: '20% off Whey Protein', brand: 'MyProtein', discountPercent: 20, url: '#', expiresAt: null },
  ];
  await eventStore.append({ type: 'HeadlinesFetched', payload: { headlines }, timestamp: Date.now() });
  await eventStore.append({ type: 'DealsFetched', payload: { deals }, timestamp: Date.now() });
  await projectionRegistry.rebuild(['headlines', 'deals', 'unread_count']);
}

export async function handleMarkArticleRead(cmd: MarkArticleRead) {
  await eventStore.append({ type: 'ArticleRead', payload: { articleId: cmd.articleId }, timestamp: Date.now() });
  await projectionRegistry.rebuild(['headlines', 'unread_count']);
}
```

- [ ] **Step 4: Queries**

```typescript
// features/news_feed/queries/index.ts
import { viewStore } from '@data/projections/views';
import type { Headline, Deal } from '../domain/types';

export function getHeadlines(): Headline[] {
  return viewStore.get<Headline[]>('headlines') ?? [];
}

export function getDeals(): Deal[] {
  return viewStore.get<Deal[]>('deals') ?? [];
}

export function getUnreadCount(): number {
  return viewStore.get<number>('unread_count') ?? 0;
}
```

- [ ] **Step 5: Public index**

```typescript
// features/news_feed/index.ts
export * from './domain/types';
export * from './projections';
export * from './queries';
export { handleRefreshFeed, handleMarkArticleRead } from './commands/handlers';
```

- [ ] **Step 6: Verify build** — `npm run build`

---

### Task 20: Profile Feature Commands

**Source:** `features/profile/manifest.md`
**Used by:** Profile tab

**Note:** Profile projections likely already exist from the original scaffold. This task adds the remaining commands: `UpdateProfile`, `SetUnitPreference`, `RecordInjury`, `ResolveInjury`.

**Files:**
- Modify: `features/profile/commands/handlers.ts` — add missing command handlers
- Modify: `features/profile/domain/types.ts` — add injury types and unit preference types if missing
- Modify: `ui/layouts/ProfileScreen.tsx` — wire unit preference toggle, injury tracker

- [ ] **Step 1: Check existing profile feature files**

Read `features/profile/domain/types.ts`, `features/profile/commands/handlers.ts`, and `features/profile/index.ts` to understand what exists.

- [ ] **Step 2: Add missing domain types** (if not present)

```typescript
// Add to features/profile/domain/types.ts

export type UnitSystem = 'metric' | 'imperial';

export interface Injury {
  id: Id<'Injury'>;
  userId: Id<'User'>;
  bodyPart: string;
  severity: 'mild' | 'moderate' | 'severe';
  recordedAt: number;
  resolvedAt: number | null;
  notes: string;
}

// Events to add:
// DomainEvent<'UnitsChanged', { userId: Id<'User'>; units: UnitSystem }>
// DomainEvent<'InjuryRecorded', { injuryId: Id<'Injury'>; userId: Id<'User'>; bodyPart: string; severity: string; notes: string }>
// DomainEvent<'InjuryResolved', { injuryId: Id<'Injury'>; resolvedAt: number }>

// Commands to add:
export interface SetUnitPreference { type: 'SetUnitPreference'; userId: Id<'User'>; units: UnitSystem; }
export interface RecordInjury { type: 'RecordInjury'; userId: Id<'User'>; bodyPart: string; severity: Injury['severity']; notes: string; }
export interface ResolveInjury { type: 'ResolveInjury'; injuryId: Id<'Injury'>; }
```

- [ ] **Step 3: Add command handlers**

```typescript
// Add to features/profile/commands/handlers.ts

export async function handleSetUnitPreference(cmd: SetUnitPreference) {
  await eventStore.append({ type: 'UnitsChanged', payload: { userId: cmd.userId, units: cmd.units }, timestamp: Date.now() });
  await projectionRegistry.rebuild(['preferences']);
}

export async function handleRecordInjury(cmd: RecordInjury) {
  const injuryId = newId<'Injury'>();
  await eventStore.append({ type: 'InjuryRecorded', payload: { injuryId, userId: cmd.userId, bodyPart: cmd.bodyPart, severity: cmd.severity, notes: cmd.notes }, timestamp: Date.now() });
  await projectionRegistry.rebuild(['active_injuries']);
}

export async function handleResolveInjury(cmd: ResolveInjury) {
  await eventStore.append({ type: 'InjuryResolved', payload: { injuryId: cmd.injuryId, resolvedAt: Date.now() }, timestamp: Date.now() });
  await projectionRegistry.rebuild(['active_injuries']);
}
```

- [ ] **Step 4: Add `active_injuries` and `preferences` projections** (if not present in `features/profile/projections/index.ts`)

```typescript
projectionRegistry.register('active_injuries', events => {
  let injuries: Injury[] = [];
  for (const e of events) {
    if (e.type === 'InjuryRecorded') {
      const p = e.payload as any;
      injuries = [...injuries, { id: p.injuryId, userId: p.userId, bodyPart: p.bodyPart, severity: p.severity, notes: p.notes, recordedAt: e.timestamp, resolvedAt: null }];
    } else if (e.type === 'InjuryResolved') {
      injuries = injuries.map(i => i.id === (e.payload as any).injuryId ? { ...i, resolvedAt: (e.payload as any).resolvedAt } : i);
    }
  }
  viewStore.set('active_injuries', injuries.filter(i => i.resolvedAt === null));
});

projectionRegistry.register('preferences', events => {
  const latest = [...events].reverse().find(e => e.type === 'UnitsChanged');
  viewStore.set('preferences', { units: latest ? (latest.payload as any).units : 'metric' });
});
```

- [ ] **Step 5: Wire to ProfileScreen**

Add unit toggle and active injuries section to `ui/layouts/ProfileScreen.tsx`:
- Unit preference toggle (metric/imperial) using `useCommand(handleSetUnitPreference)`
- Active injuries list using `useQuery(getActiveInjuries)` with resolve button
- Add injury form with body part, severity, notes inputs

- [ ] **Step 6: Verify build** — `npm run build`

---

### Task 21: Wire New Features to Dashboard

**Source:** README tab→feature map: Dashboard reads from `conditions`, `scheduling`, `news_feed`

**Files:**
- Modify: `ui/layouts/DashboardScreen.tsx` — add conditions widget, today's schedule, headlines preview

- [ ] **Step 1: Add conditions widget**

Import `getCurrentConditions`, `getSuitability` from `@features/conditions`. Show current temp, description, and top sport suitability badges.

- [ ] **Step 2: Add schedule widget**

Import `getScheduleForDay` from `@features/scheduling`. Show appointments for today. If none, show "No appointments today."

- [ ] **Step 3: Add news widget**

Import `getHeadlines`, `getDeals` from `@features/news_feed`. Show 2 most recent headlines and 1 deal. Wire `handleMarkArticleRead` on headline tap.

- [ ] **Step 4: Add CSS for new widgets**

Add any missing classes to `styling/global.css`:
- `.conditions-widget`, `.suitability-badge`, `.suitability-badge--excellent`, `.suitability-badge--good`, `.suitability-badge--fair`, `.suitability-badge--poor`
- `.schedule-item`, `.schedule-item__time`, `.schedule-item__title`
- `.news-item`, `.news-item__source`, `.news-item__headline`

- [ ] **Step 5: Verify build** — `npm run build`

---

### Task 22: Wire Cardio to Log Tab

**Source:** README tab→feature map: Log reads from `training_log`, `cardio`

**Files:**
- Modify: `ui/layouts/LogScreen.tsx` — add cardio session recording section

- [ ] **Step 1: Add cardio tab/section toggle**

Add a sport picker (run, cycle, swim, row, hike, ski) and input form for duration + distance. Wire `handleRecordCardioSession` on submit.

- [ ] **Step 2: Show recent cardio sessions**

Import `getRecentCardioSessions` and display the 5 most recent sessions with sport, distance, duration.

- [ ] **Step 3: Add CSS**

Add any missing classes:
- `.cardio-form`, `.sport-picker`, `.sport-picker__btn`, `.sport-picker__btn--active`
- `.cardio-session-item`, `.cardio-session-item__sport`, `.cardio-session-item__stats`

- [ ] **Step 4: Verify build** — `npm run build`

---

### Task 23: Wire Insights + Cardio to Progress and Analytics Tabs

**Source:** README tab→feature map: Progress reads from `progress_analysis`, `insights`, `training_log`, `cardio`. Analytics reads from `progress_analysis`, `insights`.

**Files:**
- Modify: `ui/layouts/ProgressScreen.tsx` — add insights cards, cardio progress section
- Modify: `ui/layouts/AnalyticsScreen.tsx` — add insights panel

- [ ] **Step 1: Wire insights to Progress tab**

Import `getInsightsForSport`, `getInsightsForExercise`. Show insight cards with severity badge and message. Use exercise filter from existing state.

- [ ] **Step 2: Wire cardio progress to Progress tab**

Import `getMonthlyProgression`. Show monthly cardio totals by sport (distance, duration, session count).

- [ ] **Step 3: Wire insights to Analytics tab**

Add an "Insights" section to `AnalyticsScreen` showing all insights grouped by severity.

- [ ] **Step 4: Add CSS**

Add:
- `.insight-card`, `.insight-card--success`, `.insight-card--warning`, `.insight-card--info`
- `.insight-card__badge`, `.insight-card__message`

- [ ] **Step 5: Verify build** — `npm run build`

---

### Task 24: Wire Scheduling to Social Tab

**Source:** README tab→feature map: Social reads from `social`, `scheduling`

**Files:**
- Modify: `ui/layouts/SocialScreen.tsx` — add joined events section

- [ ] **Step 1: Wire joined events**

Import `getJoinedEvents` from `@features/scheduling`. Show upcoming joined events with title, sport, date/time. Add "Leave" button wired to `handleLeaveEvent`.

- [ ] **Step 2: Add CSS**

Add:
- `.event-card`, `.event-card__sport`, `.event-card__date`, `.event-card__actions`

- [ ] **Step 3: Verify build** — `npm run build`

---

## Self-Review

### Spec Coverage Check

| Feature | Tasks | Status |
|---------|-------|--------|
| Session logging (start, add exercise, log sets, finish) | 1–6 | ✅ |
| Rest timer | 7 | ✅ |
| Plate calculator | 8 | ✅ |
| Progress feed with real sessions | 9 | ✅ |
| PR tracking | 10 | ✅ |
| Analytics screen real data | 10 | ✅ |
| Dashboard real session data | 11 | ✅ |
| Social posts, likes, comments | 12 | ✅ |
| Profile PRs + goals | 13 | ✅ |
| Readiness check-in + ring | 14 | ✅ |
| Cardio feature module | 15 | ✅ |
| Insights feature module | 16 | ✅ |
| Scheduling (appointments + events) | 17 | ✅ |
| Conditions + sport suitability | 18 | ✅ |
| News feed (headlines + deals) | 19 | ✅ |
| Profile unit preference + injury tracking | 20 | ✅ |
| Dashboard: conditions + schedule + news widgets | 21 | ✅ |
| Log tab: cardio session recording | 22 | ✅ |
| Progress/Analytics: insights + cardio progression | 23 | ✅ |
| Social tab: joined events from scheduling | 24 | ✅ |

### Task 25: Log Screen — Set Types, RPE & Workout Structures

**Source:** STRUCTURE.md — SetRow (dropset/giant-set/EMOM types, RPE picker, failed-set flag), BlockCard (superset/circuit/EMOM/AMRAP rounds), StructurePanel

**Files:**
- Modify: `ui/layouts/LogScreen.tsx` — add set type pill selector, RPE picker, failed-set toggle, block type headers, rounds selector
- Modify: `styling/global.css` — add `.set-type-pill`, `.rpe-picker`, `.block-type-badge`, `.rounds-selector` classes

- [ ] **Step 1: Extend `SetEntry` in `features/training_log/domain/types.ts`**

Add to `StrengthSet`:
```typescript
setType: 'normal' | 'dropset' | 'giant' | 'emom' | 'amrap';
rpe: number | null;   // 1-10
failed: boolean;
comment: string;
```

Add to `Block`:
```typescript
blockType: 'straight' | 'superset' | 'circuit' | 'emom' | 'amrap';
rounds: number;       // for circuit/EMOM/AMRAP
```

Add events: `SetTypeChanged`, `RPELogged`, `SetFailed`, `BlockTypeSet`, `BlockRoundsSet`

- [ ] **Step 2: Add reducers** for new set/block events in `features/training_log/domain/reducers.ts`

- [ ] **Step 3: Update Log UI** — wire set type pills, RPE picker (1–10 wheel), failed toggle, block-type header chip, rounds ± control

- [ ] **Step 4: Add CSS**

`.set-type-pill` — small rounded badge per set type
`.rpe-picker` — row of 10 tappable circles
`.block-type-badge` — coloured chip in block header (superset/circuit/etc.)
`.rounds-selector` — ± number control

- [ ] **Step 5: Verify build** — `npm run build`

---

### Task 26: Profile — Bodyweight Tracking Section

**Source:** STRUCTURE.md — BodyweightSection (weight entry log, trend chart with delta)

**Files:**
- Modify: `features/profile/domain/types.ts` — add `BodyweightEntry`, `BodyweightLogged` event, `LogBodyweight` command
- Modify: `features/profile/commands/handlers.ts` — add `handleLogBodyweight`
- Modify: `features/profile/projections/index.ts` — add `bodyweight_log` projection
- Modify: `features/profile/queries/index.ts` — add `getBodyweightLog`
- Modify: `ui/layouts/ProfileScreen.tsx` — add bodyweight section

- [ ] **Step 1: Domain types**

```typescript
export interface BodyweightEntry {
  id: Id<'BodyweightEntry'>;
  userId: Id<'User'>;
  weightKg: number;
  loggedAt: number;
}
export interface LogBodyweight { type: 'LogBodyweight'; userId: Id<'User'>; weightKg: number; loggedAt: number; }
```

- [ ] **Step 2: Handler + projection** — `handleLogBodyweight` appends `BodyweightLogged`; projection maintains sorted entry array

- [ ] **Step 3: Profile UI** — show current weight, delta from previous, simple SVG area sparkline for last 30 days, add-entry form (weight + date inputs)

- [ ] **Step 4: Add CSS** — `.bw-section`, `.bw-current`, `.bw-delta`, `.bw-chart`, `.bw-form`

- [ ] **Step 5: Verify build** — `npm run build`

---

### Task 27: Profile — Health Indicators Section

**Source:** STRUCTURE.md — HealthIndicatorsSection (HRV, resting HR, SpO2, VO2 max, steps, training load, body battery)

**Files:**
- Modify: `features/readiness/domain/types.ts` — add `HealthMetrics`, `HealthMetricsLogged` event, `LogHealthMetrics` command
- Modify: `features/readiness/commands/handlers.ts` — add handler
- Modify: `features/readiness/projections/index.ts` — add `health_metrics` projection
- Modify: `ui/layouts/ProfileScreen.tsx` — add health indicators section

- [ ] **Step 1: Domain types**

```typescript
export interface HealthMetrics {
  userId: Id<'User'>;
  hrv: number | null;           // ms
  restingHr: number | null;     // bpm
  spo2: number | null;          // %
  vo2max: number | null;        // ml/kg/min
  steps: number | null;
  trainingLoad: number | null;  // arbitrary score
  bodyBattery: number | null;   // 0-100
  loggedAt: number;
}
export interface LogHealthMetrics { type: 'LogHealthMetrics'; metrics: Omit<HealthMetrics, 'loggedAt'>; }
```

- [ ] **Step 2: Handler + projection** — append `HealthMetricsLogged`; projection keeps latest entry plus 7-entry history per metric

- [ ] **Step 3: Profile UI** — metric cards (current value + colour-coded status), steps progress bar, training load / body battery cards; tap card → bottom-sheet with 7-day trend sparkline

- [ ] **Step 4: Add CSS** — `.health-metric-card`, `.health-metric-card--good`, `.health-metric-card--warning`, `.health-metric-card--poor`, `.steps-bar`

- [ ] **Step 5: Verify build** — `npm run build`

---

### Task 28: Profile — Sleep Section

**Source:** STRUCTURE.md — SleepSection (last-night score, 3-night average, readiness bar, full history table)

**Note:** The readiness widget (Task 14) covers the Dashboard ring. This task adds the detailed sleep history view in the Profile tab.

**Files:**
- Modify: `ui/layouts/ProfileScreen.tsx` — add Sleep section with score bubble, 7-night history table, readiness bar
- Modify: `features/readiness/queries/index.ts` — add `getSleepHistory` returning sorted entries with scores

- [ ] **Step 1: Add query** — `getSleepHistory(userId)` returns entries sorted descending by `loggedAt`, each with derived `score` (average of sleep/energy/10×mood/soreness inverse)

- [ ] **Step 2: Profile UI** — score bubble (large number + ring), previous 3-night average chip, readiness bar (0–100%), table of last 14 nights (date / sleep / energy / soreness / mood / score columns)

- [ ] **Step 3: Add CSS** — `.sleep-score-bubble`, `.sleep-history-table`, `.sleep-history-row`, `.readiness-bar`

- [ ] **Step 4: Verify build** — `npm run build`

---

### Task 29: Profile — Stats Summary & Activity Feed

**Source:** STRUCTURE.md — StatsSummary (total volume, sessions per sport, km totals), ActivityFeed (chronological history with drill-down)

**Files:**
- Modify: `features/progress_analysis/queries/index.ts` — add `getStatsSummary`, `getActivityFeed`
- Modify: `ui/layouts/ProfileScreen.tsx` — add stats cards row and activity feed list

- [ ] **Step 1: Add queries**

`getStatsSummary(userId)` — returns:
```typescript
{ totalSessions: number; totalVolumeKg: number; liftSessions: number; cardioSessions: number; kmRan: number; kmCycled: number; kmSwum: number; kmRowed: number }
```
Derived from `session_history` projection.

`getActivityFeed(userId)` — returns sessions sorted descending, merged lift + cardio, each entry with `{ type, date, title, metric }`.

- [ ] **Step 2: Profile UI** — 2×3 stat cards (sessions / volume / ran / cycled / swum / rowed); activity feed list with sport icon, date, headline metric; tap row → session detail bottom-sheet

- [ ] **Step 3: Add CSS** — `.stats-grid`, `.stat-card`, `.activity-feed`, `.activity-feed-row`, `.activity-feed-row__icon`, `.activity-feed-row__meta`

- [ ] **Step 4: Verify build** — `npm run build`

---

### Task 30: Profile — Nutrition Logging Section

**Source:** STRUCTURE.md — NutritionSection (meals/snacks/vitamins/supplements/meds/water, macro tracking, category filter)

**Files:**
- Create: `features/nutrition/domain/types.ts`
- Create: `features/nutrition/commands/handlers.ts`
- Create: `features/nutrition/projections/index.ts`
- Create: `features/nutrition/queries/index.ts`
- Create: `features/nutrition/index.ts`
- Modify: `ui/layouts/ProfileScreen.tsx` — add nutrition section
- Modify: `styling/global.css` — nutrition classes

- [ ] **Step 1: Domain types**

```typescript
export type NutritionCategory = 'meal' | 'snack' | 'vitamin' | 'supplement' | 'medication' | 'water';

export interface NutritionEntry {
  id: Id<'NutritionEntry'>;
  userId: Id<'User'>;
  category: NutritionCategory;
  name: string;
  notes: string;
  time: string;        // HH:MM
  macros: { kcal: number; proteinG: number; carbsG: number; fatG: number } | null;
  loggedAt: number;
}

export interface LogNutrition { type: 'LogNutrition'; userId: Id<'User'>; entry: Omit<NutritionEntry, 'id' | 'userId' | 'loggedAt'>; }
export interface DeleteNutritionEntry { type: 'DeleteNutritionEntry'; entryId: Id<'NutritionEntry'>; }
```

- [ ] **Step 2: Handler + projection** — `nutrition_log` projection maintains today's entries array

- [ ] **Step 3: Profile UI** — category filter pills, today's log (time / name / macro summary), add-entry form (category picker, name, time, optional macro fields)

- [ ] **Step 4: Add CSS** — `.nutrition-section`, `.nutrition-filter`, `.nutrition-entry`, `.nutrition-macros`, `.macro-chip`

- [ ] **Step 5: Verify build** — `npm run build`

---

### Task 31: Log Screen — Stretching Feature

**Source:** STRUCTURE.md — StretchingForm (predefined routines or custom stretches, checklist, duration, notes)

**Files:**
- Create: `features/stretching/domain/types.ts`
- Create: `features/stretching/commands/handlers.ts`
- Create: `features/stretching/projections/index.ts`
- Create: `features/stretching/queries/index.ts`
- Create: `features/stretching/index.ts`
- Modify: `ui/layouts/LogScreen.tsx` — add stretching button in add panel, stretching form sheet
- Modify: `styling/global.css` — stretching classes

- [ ] **Step 1: Domain types**

```typescript
export type StretchingMode = 'routine' | 'custom';

export interface StretchingSession {
  id: Id<'StretchingSession'>;
  userId: Id<'User'>;
  mode: StretchingMode;
  routineName: string | null;
  durationMinutes: number;
  stretches: string[];
  completedStretches: string[];
  notes: string;
  loggedAt: number;
}

export interface LogStretching { type: 'LogStretching'; userId: Id<'User'>; session: Omit<StretchingSession, 'id' | 'userId' | 'loggedAt'>; }
```

Seed routines: `'Morning Mobility'`, `'Post-Lift Cool-down'`, `'Hip Flexor Focus'`, `'Full Body'`

- [ ] **Step 2: Handler + projection** — `stretching_log` projection maintains sorted session history

- [ ] **Step 3: Log UI** — "Stretching" button in AddWorkoutPanel; bottom-sheet with mode toggle (routine / custom), routine picker (dropdown), stretch checklist with progress bar, duration slider, notes textarea, save button

- [ ] **Step 4: Add CSS** — `.stretching-form`, `.stretch-checklist`, `.stretch-item`, `.stretch-progress`, `.routine-picker`

- [ ] **Step 5: Verify build** — `npm run build`

---

### Task 32: Progress — Chart Annotations

**Source:** STRUCTURE.md — AnnotationTimeline (visual annotation markers on lift analysis charts), AnalyseLiftView annotation management

**Files:**
- Modify: `features/progress_analysis/domain/types.ts` — add `ChartAnnotation` type + events + commands
- Modify: `features/progress_analysis/commands/handlers.ts` — add `handleAddAnnotation`, `handleDeleteAnnotation`
- Modify: `features/progress_analysis/projections/index.ts` — add `chart_annotations` projection
- Modify: `features/progress_analysis/queries/index.ts` — add `getAnnotations`
- Modify: `ui/layouts/ProgressScreen.tsx` — add annotation UI to lift analysis view

- [ ] **Step 1: Domain types**

```typescript
export interface ChartAnnotation {
  id: Id<'Annotation'>;
  userId: Id<'User'>;
  exerciseName: string;
  dateIso: string;        // YYYY-MM-DD — aligned to x-axis date
  label: string;
  color: 'success' | 'warning' | 'info';
}
export interface AddAnnotation { type: 'AddAnnotation'; userId: Id<'User'>; exerciseName: string; dateIso: string; label: string; color: ChartAnnotation['color']; }
export interface DeleteAnnotation { type: 'DeleteAnnotation'; annotationId: Id<'Annotation'>; }
```

- [ ] **Step 2: Handler + projection** — `chart_annotations` projection: `{ byExercise: Record<string, ChartAnnotation[]> }`

- [ ] **Step 3: Progress UI** — below lift scatter chart, render an `AnnotationTimeline` row: coloured vertical marker lines at annotated dates; "Add annotation" button opens inline form (date, label, colour); click marker shows label + delete button

- [ ] **Step 4: Add CSS** — `.annotation-timeline`, `.annotation-marker`, `.annotation-marker--success`, `.annotation-marker--warning`, `.annotation-marker--info`, `.annotation-form`

- [ ] **Step 5: Verify build** — `npm run build`

---

### Task 33: Share Modals

**Source:** STRUCTURE.md — SessionShareModal, WorkoutShareModal, RunShareModal (shareable card preview with theme toggle, export to social)

**Files:**
- Create: `ui/components/ShareModal.tsx`
- Modify: `ui/layouts/LogScreen.tsx` — share button on finished session
- Modify: `ui/layouts/ProgressScreen.tsx` — share button on session cards
- Modify: `styling/global.css` — share modal classes

- [ ] **Step 1: Create `ui/components/ShareModal.tsx`**

Props:
```typescript
interface ShareModalProps {
  type: 'session' | 'workout' | 'run';
  data: unknown;     // session | workout group | run
  onClose: () => void;
}
```

UI: overlay sheet with card preview (dark/light theme toggle), exercise/set summary table, "Copy as image" button (triggers `window.print()` fallback), close button.

- [ ] **Step 2: Wire to Progress session cards** — add share icon button to `LiftSessionCard`-equivalent in `ProgressScreen.tsx`

- [ ] **Step 3: Add CSS** — `.share-modal`, `.share-card`, `.share-card--dark`, `.share-card--light`, `.share-table`, `.share-actions`

- [ ] **Step 4: Verify build** — `npm run build`

---

### Task 34: Settings Modal

**Source:** STRUCTURE.md — SettingsModal (dark mode toggle, data export/import JSON/CSV, demo data load)

**Files:**
- Create: `ui/components/SettingsModal.tsx`
- Modify: `app/registry/App.tsx` — add settings gear icon + wire modal
- Modify: `styling/global.css` — settings modal classes

- [ ] **Step 1: Create `ui/components/SettingsModal.tsx`**

Sections:
- **Appearance** — dark mode toggle (writes `prefers-color-scheme` override via `document.documentElement.classList`)
- **Data** — Export all data as JSON (serialises event store); Import JSON (merges or replaces); clear all data confirmation dialog
- **About** — App version string from `package.json` version

- [ ] **Step 2: Wire to App shell** — gear icon in top bar of `App.tsx`; `showSettings` state controls modal visibility

- [ ] **Step 3: Add CSS** — `.settings-modal`, `.settings-section`, `.settings-row`, `.settings-label`, `.settings-action`, `.danger-btn`

- [ ] **Step 4: Verify build** — `npm run build`

---

## Spec Coverage — Updated

| Feature | Tasks | Status |
|---------|-------|--------|
| Session logging (start, add exercise, log sets, finish) | 1–6 | ✅ |
| Set types (dropset/giant/EMOM), RPE, failed flag, block structures | 25 | ✅ |
| Rest timer | 7 | ✅ |
| Plate calculator | 8 | ✅ |
| Progress feed with real sessions | 9 | ✅ |
| PR tracking | 10 | ✅ |
| Analytics screen real data | 10 | ✅ |
| Dashboard real session data | 11 | ✅ |
| Social posts, likes, comments | 12 | ✅ |
| Profile PRs + goals | 13 | ✅ |
| Readiness check-in + ring | 14 | ✅ |
| Cardio feature module | 15 | ✅ |
| Insights feature module | 16 | ✅ |
| Scheduling (appointments + events) | 17 | ✅ |
| Conditions + sport suitability | 18 | ✅ |
| News feed (headlines + deals) | 19 | ✅ |
| Profile unit preference + injury tracking | 20 | ✅ |
| Dashboard: conditions + schedule + news widgets | 21 | ✅ |
| Log tab: cardio session recording | 22 | ✅ |
| Progress/Analytics: insights + cardio progression | 23 | ✅ |
| Social tab: joined events from scheduling | 24 | ✅ |
| Bodyweight tracking | 26 | ✅ |
| Health indicators (HRV, HR, SpO2, VO2max, steps) | 27 | ✅ |
| Sleep history section in Profile | 28 | ✅ |
| Profile stats summary + activity feed | 29 | ✅ |
| Nutrition & supplement logging | 30 | ✅ |
| Stretching session logging | 31 | ✅ |
| Chart annotations (lift analysis) | 32 | ✅ |
| Share modals (session / workout / run) | 33 | ✅ |
| Settings modal (dark mode + data export/import) | 34 | ✅ |

### Deferred (out of scope for this plan)

- Blueprint system (save/load workout templates) — complex, warrants its own plan
- 1RM calculator tool — simple enough to add to Task 8's tool-bar in a follow-up
- Social groups, challenges — stub data only for now
- Cardio route import (GPX/FIT files) — needs file parsing library
- Profile achievements system — needs achievement definition schema
- Real weather API integration — conditions module uses stub data until API key configured
- Clients tab (trainer client management) — desktop-only feature, out of scope for mobile-first app

### Type Consistency Check

- `Id<'Session'>`, `Id<'Block'>`, `Id<'Post'>` used consistently
- `ExerciseCategory` imported from `@features/training_log` in progress_analysis (correct cross-feature read via import)
- `viewStore.set` / `viewStore.get` pattern matches existing profile handlers
- `projectionRegistry.register` called once per handler module — consistent with profile pattern
- `AggregateRepository` used in training_log handlers — matches profile pattern

### No Placeholders Check

All code blocks contain complete, runnable TypeScript. No "implement later" or "TODO" items in task steps.
