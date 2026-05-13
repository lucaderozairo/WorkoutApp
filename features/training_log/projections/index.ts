import type { Id } from '@shared/types';
import type { SessionComment } from '@features/cardio/domain/types';
import type {
  TrainingLogEvent,
  TrainingLogState,
  TrainingSession,
  SetEntry,
  ExerciseCategory,
  StrengthSet,
} from '../domain/types';
import { ProjectionBuilder } from '@data/projections/builders';
import { trainingLogReducers, initialTrainingLogState } from '../domain/reducers';

function recomputePR(sets: SetEntry[]): SetEntry[] {
  const cleared = sets.map(s => (s.type === 'strength' ? { ...s, isPR: false } : s));
  let topScore = 0;
  let topIndex = -1;
  cleared.forEach((s, i) => {
    if (s.type !== 'strength' || s.isWarmup) return;
    const score = s.weightKg * s.reps;
    if (score > topScore) {
      topScore = score;
      topIndex = i;
    }
  });
  if (topIndex >= 0) {
    const pr = cleared[topIndex];
    if (pr.type === 'strength') cleared[topIndex] = { ...pr, isPR: true };
  }
  return cleared;
}

// ─── View Types ──────────────────────────────────────────────

export interface ActiveSessionView {
  id: Id<'Session'>;
  name: string;
  startedAt: number | null;
  blocks: Array<{
    id: Id<'Block'>;
    exerciseName: string;
    exerciseCategory: ExerciseCategory;
    sets: SetEntry[];
    notes: string;
    order: number;
    blockType?: 'straight' | 'superset' | 'circuit' | 'emom' | 'amrap';
    rounds?: number;
    restSeconds?: number;
    supersetGroupId?: Id<'SupersetGroup'>;
  }>;
  notes: string;
  comments?: SessionComment[];
  media?: string[];
}

type ActiveBlock = NonNullable<ActiveSessionView>['blocks'][number];

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
  notes?: string;
  comments?: SessionComment[];
  media?: string[];
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
        startedAt: null,
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
            ? { ...b, sets: recomputePR([...b.sets, event.payload.set]) }
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
    SetTypeChanged: (state, event) => {
      if (!state || event.type !== 'SetTypeChanged') return state;
      if (state.id !== event.payload.sessionId) return state;
      return {
        ...state,
        blocks: state.blocks.map(b =>
          b.id === event.payload.blockId
            ? {
                ...b,
                sets: b.sets.map(s =>
                  s.type === 'strength' && s.setNumber === event.payload.setNumber
                    ? { ...s, setType: event.payload.setType }
                    : s
                ),
              }
            : b
        ),
      };
    },
    RPELogged: (state, event) => {
      if (!state || event.type !== 'RPELogged') return state;
      if (state.id !== event.payload.sessionId) return state;
      return {
        ...state,
        blocks: state.blocks.map(b =>
          b.id === event.payload.blockId
            ? {
                ...b,
                sets: b.sets.map(s =>
                  s.type === 'strength' && s.setNumber === event.payload.setNumber
                    ? { ...s, rpe: event.payload.rpe }
                    : s
                ),
              }
            : b
        ),
      };
    },
    SetFailed: (state, event) => {
      if (!state || event.type !== 'SetFailed') return state;
      if (state.id !== event.payload.sessionId) return state;
      return {
        ...state,
        blocks: state.blocks.map(b =>
          b.id === event.payload.blockId
            ? {
                ...b,
                sets: b.sets.map(s =>
                  s.type === 'strength' && s.setNumber === event.payload.setNumber
                    ? { ...s, failed: event.payload.failed }
                    : s
                ),
              }
            : b
        ),
      };
    },
    BlockTypeSet: (state, event) => {
      if (!state || event.type !== 'BlockTypeSet') return state;
      if (state.id !== event.payload.sessionId) return state;
      return {
        ...state,
        blocks: state.blocks.map(b =>
          b.id === event.payload.blockId ? { ...b, blockType: event.payload.blockType } : b
        ),
      };
    },
    BlockRoundsSet: (state, event) => {
      if (!state || event.type !== 'BlockRoundsSet') return state;
      if (state.id !== event.payload.sessionId) return state;
      return {
        ...state,
        blocks: state.blocks.map(b =>
          b.id === event.payload.blockId ? { ...b, rounds: event.payload.rounds } : b
        ),
      };
    },
    SetRemoved: (state, event) => {
      if (!state || event.type !== 'SetRemoved') return state;
      if (state.id !== event.payload.sessionId) return state;
      const { blockId, setNumber } = event.payload;
      return {
        ...state,
        blocks: state.blocks.map(b => {
          if (b.id !== blockId) return b;
          const remaining = b.sets
            .filter(s => s.setNumber !== setNumber)
            .map(s => (s.setNumber > setNumber ? { ...s, setNumber: s.setNumber - 1 } : s));
          return { ...b, sets: recomputePR(remaining) };
        }),
      };
    },
    SetUpdated: (state, event) => {
      if (!state || event.type !== 'SetUpdated') return state;
      if (state.id !== event.payload.sessionId) return state;
      const p = event.payload;
      return {
        ...state,
        blocks: state.blocks.map(b => {
          if (b.id !== p.blockId) return b;
          const merged = b.sets.map(s => {
            if (s.setNumber !== p.setNumber) return s;
            if (s.type === 'strength') {
              const next: StrengthSet = { ...s };
              if (p.weightKg !== undefined) next.weightKg = p.weightKg;
              if (p.reps !== undefined) next.reps = p.reps;
              if (p.isWarmup !== undefined) next.isWarmup = p.isWarmup;
              if (p.done !== undefined) next.done = p.done;
              return next;
            }
            const next = { ...s } as import('../domain/types').CardioSet;
            if (p.distanceMeters !== undefined) next.distanceMeters = p.distanceMeters;
            if (p.durationSeconds !== undefined) next.durationSeconds = p.durationSeconds;
            if (p.avgPowerWatts !== undefined) next.avgPowerWatts = p.avgPowerWatts;
            if (p.resistance !== undefined) next.resistance = p.resistance;
            return next;
          });
          return { ...b, sets: recomputePR(merged) };
        }),
      };
    },
    SetCommentUpdated: (state, event) => {
      if (!state || event.type !== 'SetCommentUpdated') return state;
      if (state.id !== event.payload.sessionId) return state;
      const { blockId, setNumber, comment } = event.payload;
      return {
        ...state,
        blocks: state.blocks.map(b =>
          b.id === blockId
            ? {
                ...b,
                sets: b.sets.map(s =>
                  s.type === 'strength' && s.setNumber === setNumber
                    ? { ...s, comment }
                    : s
                ),
              }
            : b
        ),
      };
    },
    BlockRestSet: (state, event) => {
      if (!state || event.type !== 'BlockRestSet') return state;
      if (state.id !== event.payload.sessionId) return state;
      return {
        ...state,
        blocks: state.blocks.map(b =>
          b.id === event.payload.blockId ? { ...b, restSeconds: event.payload.restSeconds } : b
        ),
      };
    },
    SessionRenamed: (state, event) => {
      if (!state || event.type !== 'SessionRenamed') return state;
      if (state.id !== event.payload.sessionId) return state;
      return { ...state, name: event.payload.name };
    },
    SessionStartTimeUpdated: (state, event) => {
      if (!state || event.type !== 'SessionStartTimeUpdated') return state;
      if (state.id !== event.payload.sessionId) return state;
      return { ...state, startedAt: event.payload.startedAt };
    },
    BlocksReordered: (state, event) => {
      if (!state || event.type !== 'BlocksReordered') return state;
      if (state.id !== event.payload.sessionId) return state;
      const byId = new Map(state.blocks.map(b => [b.id, b]));
      const reordered = event.payload.blockIds
        .map((id, index) => {
          const b = byId.get(id);
          return b ? { ...b, order: index } : null;
        })
        .filter((b): b is ActiveBlock => b !== null);
      return { ...state, blocks: reordered };
    },
    BlockAddedToSuperset: (state, event) => {
      if (!state || event.type !== 'BlockAddedToSuperset') return state;
      if (state.id !== event.payload.sessionId) return state;
      return {
        ...state,
        blocks: state.blocks.map(b =>
          b.id === event.payload.blockId ? { ...b, supersetGroupId: event.payload.groupId } : b
        ),
      };
    },
    BlockLeftSuperset: (state, event) => {
      if (!state || event.type !== 'BlockLeftSuperset') return state;
      if (state.id !== event.payload.sessionId) return state;
      const leaving = state.blocks.find(b => b.id === event.payload.blockId);
      const groupId = leaving?.supersetGroupId;
      const stripGroup = (b: ActiveBlock): ActiveBlock => {
        const { supersetGroupId: _, ...rest } = b;
        return rest;
      };
      const afterLeave = state.blocks.map(b => (b.id === event.payload.blockId ? stripGroup(b) : b));
      if (!groupId) return { ...state, blocks: afterLeave };
      const stillInGroup = afterLeave.filter(b => b.supersetGroupId === groupId);
      if (stillInGroup.length >= 2) return { ...state, blocks: afterLeave };
      return {
        ...state,
        blocks: afterLeave.map(b => (b.supersetGroupId === groupId ? stripGroup(b) : b)),
      };
    },

    BlockRemoved: (state, event) => {
      if (!state || event.type !== 'BlockRemoved') return state;
      if (state.id !== event.payload.sessionId) return state;
      return {
        ...state,
        blocks: state.blocks
          .filter(b => b.id !== event.payload.blockId)
          .map((b, i) => ({ ...b, order: i })),
      };
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
    SessionDeleted: (state, event) => {
      if (event.type !== 'SessionDeleted') return state;
      return state.filter(s => s.id !== event.payload.sessionId);
    },
  }
);

// ─── editing_session ──────────────────────────────────────────
// Full domain state keyed by sessionId. Unlike active_session, this
// survives SessionFinished — the log page can edit finished sessions.

export type EditingSessionsView = TrainingLogState;

function delegateReducers(): {
  [K in TrainingLogEvent['type']]: (state: TrainingLogState, event: TrainingLogEvent) => TrainingLogState;
} {
  const map = {} as Record<string, (state: TrainingLogState, event: TrainingLogEvent) => TrainingLogState>;
  for (const type of Object.keys(trainingLogReducers)) {
    map[type] = (state, event) => trainingLogReducers[type](state, event);
  }
  return map as never;
}

export const editingSessionProjection = new ProjectionBuilder<
  EditingSessionsView,
  TrainingLogEvent
>('editing_session', initialTrainingLogState, delegateReducers());

export function findEditingSession(
  state: EditingSessionsView,
  sessionId: Id<'Session'>
): TrainingSession | undefined {
  return state.sessions.find(s => s.id === sessionId);
}

// ─── recent_exercises ─────────────────────────────────────────

export interface RecentExercise {
  name: string;
  category: ExerciseCategory;
  lastUsedAt: number;
  useCount: number;
}

function exerciseKey(name: string, category: ExerciseCategory): string {
  return `${category}::${name.trim().toLowerCase()}`;
}

export const recentExercisesProjection = new ProjectionBuilder<
  RecentExercise[],
  TrainingLogEvent
>('recent_exercises', [], {
  BlockAdded: (state, event) => {
    if (event.type !== 'BlockAdded') return state;
    const { exerciseName, exerciseCategory } = event.payload;
    const key = exerciseKey(exerciseName, exerciseCategory);
    const existing = state.find(e => exerciseKey(e.name, e.category) === key);
    const lastUsedAt = event.timestamp;
    const next = existing
      ? state.map(e =>
          exerciseKey(e.name, e.category) === key
            ? { ...e, lastUsedAt, useCount: e.useCount + 1 }
            : e
        )
      : [...state, { name: exerciseName, category: exerciseCategory, lastUsedAt, useCount: 1 }];
    return [...next].sort((a, b) => b.lastUsedAt - a.lastUsedAt);
  },
});
