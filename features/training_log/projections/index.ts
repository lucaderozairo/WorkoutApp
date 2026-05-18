import type { Id } from '@shared/types';
import type { ActivityComment } from '../domain/types';
import type {
  TrainingLogEvent,
  ExerciseCategory,
  SetEntry,
  SourceContribution,
  ActivityPartner,
  SportType,
  ActivityStatus,
} from '../domain/types';
import { ProjectionBuilder } from '@data/projections/builders';

// ─── PR computation ───────────────────────────────────────────

function recomputePR(sets: SetEntry[]): SetEntry[] {
  const cleared = sets.map(s => ({ ...s, isPR: false }));
  let topScore = 0;
  let topIndex = -1;
  cleared.forEach((s, i) => {
    if (s.isWarmup) return;
    const w = s.weightKg ?? 0;
    const r = s.reps ?? 0;
    if (w === 0 && r === 0) return;
    const score = w > 0 ? w * r : r;
    if (score > topScore) { topScore = score; topIndex = i; }
  });
  if (topIndex >= 0) {
    cleared[topIndex] = { ...cleared[topIndex], isPR: true };
  }
  return cleared;
}

// ─── Activity read model ──────────────────────────────────────

export interface SegmentView {
  id: Id<'Segment'>;
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

export interface ActivityView {
  id: Id<'Activity'>;
  name: string;
  primarySport: SportType;
  status: ActivityStatus;
  startedAt: number | null;
  finishedAt: number | null;
  segments: SegmentView[];
  notes: string;
  rpe?: number;
  tags?: string[];
  comments?: ActivityComment[];
  media?: string[];
  sources: SourceContribution[];
  with?: ActivityPartner[];
}

export interface ActivitiesState {
  byId: Record<string, ActivityView>;
  activeId: string | null;
}

// ─── Derived summary (computed at query time) ─────────────────

export interface ActivityHistoryItem {
  id: Id<'Activity'>;
  name: string;
  primarySport: SportType;
  startedAt: number;
  finishedAt: number;
  durationSeconds: number;
  totalSets: number;
  exerciseCount: number;
  hasPR: boolean;
  category: ExerciseCategory;
  rpe?: number;
  tags?: string[];
  notes?: string;
  comments?: ActivityComment[];
  media?: string[];
}


// ─── Helpers ─────────────────────────────────────────────────

function updateActivity(
  state: ActivitiesState,
  sessionId: string,
  updater: (a: ActivityView) => ActivityView,
): ActivitiesState {
  const activity = state.byId[sessionId];
  if (!activity) return state;
  return { ...state, byId: { ...state.byId, [sessionId]: updater(activity) } };
}

function updateSegment(
  state: ActivitiesState,
  sessionId: string,
  blockId: string,
  updater: (s: SegmentView) => SegmentView,
): ActivitiesState {
  return updateActivity(state, sessionId, a => ({
    ...a,
    segments: a.segments.map(s => (s.id === blockId ? updater(s) : s)),
  }));
}

// ─── Projection ───────────────────────────────────────────────

const initialState: ActivitiesState = { byId: {}, activeId: null };

export const sessionProjection = new ProjectionBuilder<ActivitiesState, TrainingLogEvent>(
  'sessions',
  initialState,
  {
    SessionStarted: (state, event) => {
      if (event.type !== 'SessionStarted') return state;
      const { sessionId, name, primarySport } = event.payload;
      return {
        byId: {
          ...state.byId,
          [sessionId]: {
            id: sessionId,
            name,
            primarySport: primarySport ?? 'strength',
            status: 'active',
            startedAt: null,
            finishedAt: null,
            segments: [],
            notes: '',
            sources: [],
          },
        },
        activeId: sessionId,
      };
    },

    SessionFinished: (state, event) => {
      if (event.type !== 'SessionFinished') return state;
      const { sessionId } = event.payload;
      return updateActivity(state, sessionId, a => ({
        ...a,
        status: 'finished',
        finishedAt: event.timestamp,
        rpe: event.payload.sessionRpe,
        tags: event.payload.tags,
      }));
    },

    SessionDeleted: (state, event) => {
      if (event.type !== 'SessionDeleted') return state;
      const { sessionId } = event.payload;
      const { [sessionId]: _, ...rest } = state.byId;
      return {
        byId: rest,
        activeId: state.activeId === sessionId ? null : state.activeId,
      };
    },

    BlockAdded: (state, event) => {
      if (event.type !== 'BlockAdded') return state;
      const { sessionId, blockId, exerciseName, exerciseCategory, order } = event.payload;
      return updateActivity(state, sessionId, a => ({
        ...a,
        segments: [
          ...a.segments,
          { id: blockId, exerciseName, exerciseCategory, sets: [], notes: '', order },
        ],
      }));
    },

    SetLogged: (state, event) => {
      if (event.type !== 'SetLogged') return state;
      const { sessionId, blockId } = event.payload;
      return updateSegment(state, sessionId, blockId, s => ({
        ...s,
        sets: recomputePR([...s.sets, event.payload.set]),
      }));
    },

    PRFlagged: (state, event) => {
      if (event.type !== 'PRFlagged') return state;
      const { sessionId, blockId, setNumber } = event.payload;
      return updateSegment(state, sessionId, blockId, s => ({
        ...s,
        sets: s.sets.map(set => set.setNumber === setNumber ? { ...set, isPR: true } : set),
      }));
    },

    BlockNoteUpdated: (state, event) => {
      if (event.type !== 'BlockNoteUpdated') return state;
      return updateSegment(state, event.payload.sessionId, event.payload.blockId, s => ({
        ...s, notes: event.payload.notes,
      }));
    },

    SessionNoteUpdated: (state, event) => {
      if (event.type !== 'SessionNoteUpdated') return state;
      return updateActivity(state, event.payload.sessionId, a => ({
        ...a, notes: event.payload.notes,
      }));
    },

    SetTypeChanged: (state, event) => {
      if (event.type !== 'SetTypeChanged') return state;
      const { sessionId, blockId, setNumber, setType } = event.payload;
      return updateSegment(state, sessionId, blockId, s => ({
        ...s,
        sets: s.sets.map(set => set.setNumber === setNumber ? { ...set, setType } : set),
      }));
    },

    RPELogged: (state, event) => {
      if (event.type !== 'RPELogged') return state;
      const { sessionId, blockId, setNumber, rpe } = event.payload;
      return updateSegment(state, sessionId, blockId, s => ({
        ...s,
        sets: s.sets.map(set => set.setNumber === setNumber ? { ...set, rpe } : set),
      }));
    },

    SetFailed: (state, event) => {
      if (event.type !== 'SetFailed') return state;
      const { sessionId, blockId, setNumber, failed } = event.payload;
      return updateSegment(state, sessionId, blockId, s => ({
        ...s,
        sets: s.sets.map(set => set.setNumber === setNumber ? { ...set, failed } : set),
      }));
    },

    BlockTypeSet: (state, event) => {
      if (event.type !== 'BlockTypeSet') return state;
      return updateSegment(state, event.payload.sessionId, event.payload.blockId, s => ({
        ...s, blockType: event.payload.blockType,
      }));
    },

    BlockRoundsSet: (state, event) => {
      if (event.type !== 'BlockRoundsSet') return state;
      return updateSegment(state, event.payload.sessionId, event.payload.blockId, s => ({
        ...s, rounds: event.payload.rounds,
      }));
    },

    SetRemoved: (state, event) => {
      if (event.type !== 'SetRemoved') return state;
      const { sessionId, blockId, setNumber } = event.payload;
      return updateSegment(state, sessionId, blockId, s => {
        const remaining = s.sets
          .filter(set => set.setNumber !== setNumber)
          .map(set => set.setNumber > setNumber ? { ...set, setNumber: set.setNumber - 1 } : set);
        return { ...s, sets: recomputePR(remaining) };
      });
    },

    SetUpdated: (state, event) => {
      if (event.type !== 'SetUpdated') return state;
      const p = event.payload;
      return updateSegment(state, p.sessionId, p.blockId, s => {
        const merged = s.sets.map(set => {
          if (set.setNumber !== p.setNumber) return set;
          const next = { ...set };
          if (p.weightKg        !== undefined) next.weightKg        = p.weightKg;
          if (p.reps            !== undefined) next.reps            = p.reps;
          if (p.distanceMeters  !== undefined) next.distanceMeters  = p.distanceMeters;
          if (p.durationSeconds !== undefined) next.durationSeconds = p.durationSeconds;
          if (p.avgPowerWatts   !== undefined) next.avgPowerWatts   = p.avgPowerWatts;
          if (p.resistance      !== undefined) next.resistance      = p.resistance;
          if (p.isWarmup        !== undefined) next.isWarmup        = p.isWarmup;
          if (p.done            !== undefined) next.done            = p.done;
          return next;
        });
        return { ...s, sets: recomputePR(merged) };
      });
    },

    SetCommentUpdated: (state, event) => {
      if (event.type !== 'SetCommentUpdated') return state;
      const { sessionId, blockId, setNumber, comment } = event.payload;
      return updateSegment(state, sessionId, blockId, s => ({
        ...s,
        sets: s.sets.map(set => set.setNumber === setNumber ? { ...set, comment } : set),
      }));
    },

    BlockRestSet: (state, event) => {
      if (event.type !== 'BlockRestSet') return state;
      return updateSegment(state, event.payload.sessionId, event.payload.blockId, s => ({
        ...s, restSeconds: event.payload.restSeconds,
      }));
    },

    SessionRenamed: (state, event) => {
      if (event.type !== 'SessionRenamed') return state;
      return updateActivity(state, event.payload.sessionId, a => ({
        ...a, name: event.payload.name,
      }));
    },

    SessionStartTimeUpdated: (state, event) => {
      if (event.type !== 'SessionStartTimeUpdated') return state;
      return updateActivity(state, event.payload.sessionId, a => ({
        ...a, startedAt: event.payload.startedAt,
      }));
    },

    BlocksReordered: (state, event) => {
      if (event.type !== 'BlocksReordered') return state;
      const { sessionId, blockIds } = event.payload;
      return updateActivity(state, sessionId, a => {
        const byId = new Map(a.segments.map(s => [s.id, s]));
        const reordered = blockIds
          .map((id, index) => { const s = byId.get(id); return s ? { ...s, order: index } : null; })
          .filter((s): s is SegmentView => s !== null);
        return { ...a, segments: reordered };
      });
    },

    BlockAddedToSuperset: (state, event) => {
      if (event.type !== 'BlockAddedToSuperset') return state;
      return updateSegment(state, event.payload.sessionId, event.payload.blockId, s => ({
        ...s, supersetGroupId: event.payload.groupId,
      }));
    },

    BlockLeftSuperset: (state, event) => {
      if (event.type !== 'BlockLeftSuperset') return state;
      const { sessionId, blockId } = event.payload;
      return updateActivity(state, sessionId, a => {
        const leaving = a.segments.find(s => s.id === blockId);
        const groupId = leaving?.supersetGroupId;
        const strip = (s: SegmentView): SegmentView => {
          const { supersetGroupId: _, ...rest } = s;
          return rest;
        };
        const afterLeave = a.segments.map(s => s.id === blockId ? strip(s) : s);
        if (!groupId) return { ...a, segments: afterLeave };
        const stillInGroup = afterLeave.filter(s => s.supersetGroupId === groupId);
        if (stillInGroup.length >= 2) return { ...a, segments: afterLeave };
        return { ...a, segments: afterLeave.map(s => s.supersetGroupId === groupId ? strip(s) : s) };
      });
    },

    BlockRemoved: (state, event) => {
      if (event.type !== 'BlockRemoved') return state;
      const { sessionId, blockId } = event.payload;
      return updateActivity(state, sessionId, a => ({
        ...a,
        segments: a.segments
          .filter(s => s.id !== blockId)
          .map((s, i) => ({ ...s, order: i })),
      }));
    },

    SessionUpdated: (state, event) => {
      if (event.type !== 'SessionUpdated') return state;
      const p = event.payload;
      return updateActivity(state, p.sessionId, a => ({
        ...a,
        ...(p.finishedAt !== undefined ? { finishedAt: p.finishedAt } : {}),
        ...(p.rpe !== undefined ? { rpe: p.rpe ?? undefined } : {}),
        ...(p.tags !== undefined ? { tags: p.tags } : {}),
        ...(p.media !== undefined ? { media: p.media } : {}),
      }));
    },
  }
);

// ─── Recent exercises ─────────────────────────────────────────

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
