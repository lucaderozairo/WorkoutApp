import type {
  TrainingLogState,
  TrainingLogEvent,
  Block,
  TrainingSession,
  StrengthSet,
  CardioSet,
  SetEntry,
} from './types';

export const initialTrainingLogState: TrainingLogState = {
  sessions: [],
};

// ─── helpers ─────────────────────────────────────────────────

type SessionMutator = (session: TrainingSession) => TrainingSession;
type BlockMutator = (block: Block) => Block;
type SetMutator = (set: SetEntry) => SetEntry;

function mapSession(
  state: TrainingLogState,
  sessionId: string,
  fn: SessionMutator
): TrainingLogState {
  return {
    ...state,
    sessions: state.sessions.map(s => (s.id === sessionId ? fn(s) : s)),
  };
}

function mapBlock(
  state: TrainingLogState,
  sessionId: string,
  blockId: string,
  fn: BlockMutator
): TrainingLogState {
  return mapSession(state, sessionId, session => ({
    ...session,
    blocks: session.blocks.map(b => (b.id === blockId ? fn(b) : b)),
  }));
}

function mapSet(
  state: TrainingLogState,
  sessionId: string,
  blockId: string,
  setNumber: number,
  fn: SetMutator
): TrainingLogState {
  return mapBlock(state, sessionId, blockId, block => ({
    ...block,
    sets: block.sets.map(s => (s.setNumber === setNumber ? fn(s) : s)),
  }));
}

function recomputePR(sets: SetEntry[]): SetEntry[] {
  // Reset all PR flags; highest weight*reps among non-warmup strength sets gets PR.
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
    if (pr.type === 'strength') {
      cleared[topIndex] = { ...pr, isPR: true };
    }
  }
  return cleared;
}

// ─── reducers ────────────────────────────────────────────────

export const trainingLogReducers: Record<
  string,
  (state: TrainingLogState, event: TrainingLogEvent) => TrainingLogState
> = {
  SessionStarted: (state, event) => {
    if (event.type !== 'SessionStarted') return state;
    const session: TrainingSession = {
      id: event.payload.sessionId,
      userId: event.payload.userId,
      name: event.payload.name,
      startedAt: event.timestamp,
      finishedAt: null,
      status: 'active',
      blocks: [],
      notes: '',
    };
    return { ...state, sessions: [...state.sessions, session] };
  },

  BlockAdded: (state, event) => {
    if (event.type !== 'BlockAdded') return state;
    const { sessionId, blockId, exerciseId, exerciseName, exerciseCategory, order } =
      event.payload;
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
    return mapSession(state, sessionId, s => ({ ...s, blocks: [...s.blocks, block] }));
  },

  SetLogged: (state, event) => {
    if (event.type !== 'SetLogged') return state;
    const { sessionId, blockId, set } = event.payload;
    return mapBlock(state, sessionId, blockId, block => ({
      ...block,
      sets: recomputePR([...block.sets, set]),
    }));
  },

  PRFlagged: (state, event) => {
    if (event.type !== 'PRFlagged') return state;
    const { sessionId, blockId, setNumber } = event.payload;
    return mapSet(state, sessionId, blockId, setNumber, set =>
      set.type === 'strength' ? { ...set, isPR: true } : set
    );
  },

  BlockNoteUpdated: (state, event) => {
    if (event.type !== 'BlockNoteUpdated') return state;
    const { sessionId, blockId, notes } = event.payload;
    return mapBlock(state, sessionId, blockId, b => ({ ...b, notes }));
  },

  SessionNoteUpdated: (state, event) => {
    if (event.type !== 'SessionNoteUpdated') return state;
    const { sessionId, notes } = event.payload;
    return mapSession(state, sessionId, s => ({ ...s, notes }));
  },

  SessionFinished: (state, event) => {
    if (event.type !== 'SessionFinished') return state;
    const { sessionId, finishedAt } = event.payload;
    return mapSession(state, sessionId, s => ({ ...s, finishedAt, status: 'finished' }));
  },

  SessionDeleted: (state, event) => {
    if (event.type !== 'SessionDeleted') return state;
    return {
      ...state,
      sessions: state.sessions.filter(s => s.id !== event.payload.sessionId),
    };
  },

  SetTypeChanged: (state, event) => {
    if (event.type !== 'SetTypeChanged') return state;
    const { sessionId, blockId, setNumber, setType } = event.payload;
    return mapSet(state, sessionId, blockId, setNumber, set =>
      set.type === 'strength' ? { ...set, setType } : set
    );
  },

  RPELogged: (state, event) => {
    if (event.type !== 'RPELogged') return state;
    const { sessionId, blockId, setNumber, rpe } = event.payload;
    return mapSet(state, sessionId, blockId, setNumber, set =>
      set.type === 'strength' ? { ...set, rpe } : set
    );
  },

  SetFailed: (state, event) => {
    if (event.type !== 'SetFailed') return state;
    const { sessionId, blockId, setNumber, failed } = event.payload;
    return mapSet(state, sessionId, blockId, setNumber, set =>
      set.type === 'strength' ? { ...set, failed } : set
    );
  },

  BlockTypeSet: (state, event) => {
    if (event.type !== 'BlockTypeSet') return state;
    const { sessionId, blockId, blockType } = event.payload;
    return mapBlock(state, sessionId, blockId, b => ({ ...b, blockType }));
  },

  BlockRoundsSet: (state, event) => {
    if (event.type !== 'BlockRoundsSet') return state;
    const { sessionId, blockId, rounds } = event.payload;
    return mapBlock(state, sessionId, blockId, b => ({ ...b, rounds }));
  },

  SetRemoved: (state, event) => {
    if (event.type !== 'SetRemoved') return state;
    const { sessionId, blockId, setNumber } = event.payload;
    return mapBlock(state, sessionId, blockId, block => {
      const remaining = block.sets
        .filter(s => s.setNumber !== setNumber)
        .map(s =>
          s.setNumber > setNumber ? { ...s, setNumber: s.setNumber - 1 } : s
        );
      return { ...block, sets: recomputePR(remaining) };
    });
  },

  SetUpdated: (state, event) => {
    if (event.type !== 'SetUpdated') return state;
    const { sessionId, blockId, setNumber } = event.payload;
    return mapBlock(state, sessionId, blockId, block => {
      const merged = block.sets.map(s => {
        if (s.setNumber !== setNumber) return s;
        if (s.type === 'strength') {
          const next: StrengthSet = { ...s };
          if (event.payload.weightKg !== undefined) next.weightKg = event.payload.weightKg;
          if (event.payload.reps !== undefined) next.reps = event.payload.reps;
          if (event.payload.isWarmup !== undefined) next.isWarmup = event.payload.isWarmup;
          if (event.payload.done !== undefined) next.done = event.payload.done;
          return next;
        }
        // cardio
        const next = { ...s };
        if (event.payload.distanceMeters !== undefined)
          next.distanceMeters = event.payload.distanceMeters;
        if (event.payload.durationSeconds !== undefined)
          next.durationSeconds = event.payload.durationSeconds;
        if (event.payload.avgPowerWatts !== undefined)
          (next as CardioSet).avgPowerWatts = event.payload.avgPowerWatts;
        if (event.payload.resistance !== undefined)
          (next as CardioSet).resistance = event.payload.resistance;
        return next;
      });
      return { ...block, sets: recomputePR(merged) };
    });
  },

  SetCommentUpdated: (state, event) => {
    if (event.type !== 'SetCommentUpdated') return state;
    const { sessionId, blockId, setNumber, comment } = event.payload;
    return mapSet(state, sessionId, blockId, setNumber, set =>
      set.type === 'strength' ? { ...set, comment } : set
    );
  },

  BlockRestSet: (state, event) => {
    if (event.type !== 'BlockRestSet') return state;
    const { sessionId, blockId, restSeconds } = event.payload;
    return mapBlock(state, sessionId, blockId, b => ({ ...b, restSeconds }));
  },

  SessionRenamed: (state, event) => {
    if (event.type !== 'SessionRenamed') return state;
    const { sessionId, name } = event.payload;
    return mapSession(state, sessionId, s => ({ ...s, name }));
  },

  SessionStartTimeUpdated: (state, event) => {
    if (event.type !== 'SessionStartTimeUpdated') return state;
    const { sessionId, startedAt } = event.payload;
    return mapSession(state, sessionId, s => ({ ...s, startedAt }));
  },

  BlocksReordered: (state, event) => {
    if (event.type !== 'BlocksReordered') return state;
    const { sessionId, blockIds } = event.payload;
    return mapSession(state, sessionId, session => {
      const byId = new Map(session.blocks.map(b => [b.id, b]));
      const reordered = blockIds
        .map((id, index) => {
          const b = byId.get(id);
          return b ? { ...b, order: index } : null;
        })
        .filter((b): b is Block => b !== null);
      return { ...session, blocks: reordered };
    });
  },

  BlockAddedToSuperset: (state, event) => {
    if (event.type !== 'BlockAddedToSuperset') return state;
    const { sessionId, blockId, groupId } = event.payload;
    return mapBlock(state, sessionId, blockId, b => ({ ...b, supersetGroupId: groupId }));
  },

  BlockLeftSuperset: (state, event) => {
    if (event.type !== 'BlockLeftSuperset') return state;
    const { sessionId, blockId } = event.payload;
    return mapSession(state, sessionId, session => {
      const leaving = session.blocks.find(b => b.id === blockId);
      const groupId = leaving?.supersetGroupId;
      const afterLeave = session.blocks.map(b =>
        b.id === blockId ? stripSuperset(b) : b
      );
      // Auto-ungroup orphans: if the group now has <2 members, clear it from survivors too.
      if (!groupId) return { ...session, blocks: afterLeave };
      const stillInGroup = afterLeave.filter(b => b.supersetGroupId === groupId);
      if (stillInGroup.length >= 2) return { ...session, blocks: afterLeave };
      return {
        ...session,
        blocks: afterLeave.map(b =>
          b.supersetGroupId === groupId ? stripSuperset(b) : b
        ),
      };
    });
  },

  BlockRemoved: (state, event) => {
    if (event.type !== 'BlockRemoved') return state;
    const { sessionId, blockId } = event.payload;
    return mapSession(state, sessionId, session => ({
      ...session,
      blocks: session.blocks
        .filter(b => b.id !== blockId)
        .map((b, i) => ({ ...b, order: i })),
    }));
  },
};

function stripSuperset(block: Block): Block {
  const { supersetGroupId: _removed, ...rest } = block;
  return rest as Block;
}
