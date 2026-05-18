import { describe, it, expect } from 'vitest';
import { trainingLogReducers, initialActivityLogState } from './reducers';
import type {
  TrainingLogEvent,
  ActivityLogState,
  TrainingSession,
  SetEntry,
} from './types';
import type { Id } from '@shared/types';

const SESSION_ID = 's-1' as Id<'Session'>;
const USER_ID = 'u-1' as Id<'User'>;
const BLOCK_ID = 'b-1' as Id<'Block'>;
const BLOCK_ID_2 = 'b-2' as Id<'Block'>;
const EX_ID = 'e-1' as Id<'Exercise'>;
const EX_ID_2 = 'e-2' as Id<'Exercise'>;
const GROUP_ID = 'g-1' as Id<'SupersetGroup'>;

function reduce(state: ActivityLogState, event: TrainingLogEvent): ActivityLogState {
  const reducer = trainingLogReducers[event.type];
  return reducer ? reducer(state, event) : state;
}

function fold(events: TrainingLogEvent[]): ActivityLogState {
  return events.reduce(reduce, initialActivityLogState);
}

function sessionStarted(ts = 1000): TrainingLogEvent {
  return {
    type: 'SessionStarted',
    aggregateId: USER_ID,
    aggregateType: 'User',
    timestamp: ts,
    version: 1,
    payload: { sessionId: SESSION_ID, userId: USER_ID, name: 'Session 1' },
  };
}

function blockAdded(
  blockId: Id<'Block'> = BLOCK_ID,
  exerciseName = 'Bench Press',
  order = 0,
  ts = 1100,
  exerciseId: Id<'Exercise'> = EX_ID
): TrainingLogEvent {
  return {
    type: 'BlockAdded',
    aggregateId: SESSION_ID,
    aggregateType: 'Session',
    timestamp: ts,
    version: 1,
    payload: {
      sessionId: SESSION_ID,
      blockId,
      exerciseId,
      exerciseName,
      exerciseCategory: 'strength',
      order,
    },
  };
}

function strengthSetLogged(
  setNumber: number,
  weightKg: number,
  reps: number,
  opts: { isWarmup?: boolean; blockId?: Id<'Block'>; ts?: number } = {}
): TrainingLogEvent {
  return {
    type: 'SetLogged',
    aggregateId: SESSION_ID,
    aggregateType: 'Session',
    timestamp: opts.ts ?? 1200,
    version: 1,
    payload: {
      sessionId: SESSION_ID,
      blockId: opts.blockId ?? BLOCK_ID,
      set: {
        setNumber,
        weightKg,
        reps,
        isWarmup: opts.isWarmup ?? false,
        isPR: false,
        completedAt: opts.ts ?? 1200,
      },
    },
  };
}

function strengthSets(state: ActivityLogState): SetEntry[] {
  return ((state.activities[0] as TrainingSession | undefined)?.blocks[0]?.sets ?? []).filter(
    (s): s is SetEntry => s.weightKg !== undefined || s.reps !== undefined
  );
}

describe('trainingLogReducers — PR auto-detection', () => {
  it('flags the highest weight×reps non-warmup set as PR', () => {
    const state = fold([
      sessionStarted(),
      blockAdded(),
      strengthSetLogged(1, 80, 5), // score 400
      strengthSetLogged(2, 100, 5), // score 500 — PR
      strengthSetLogged(3, 90, 5), // score 450
    ]);
    const sets = strengthSets(state);
    expect(sets.map(s => s.isPR)).toEqual([false, true, false]);
  });

  it('ignores warmup sets when computing PR', () => {
    const state = fold([
      sessionStarted(),
      blockAdded(),
      strengthSetLogged(1, 200, 10, { isWarmup: true }), // huge but warmup — ignored
      strengthSetLogged(2, 100, 5),
    ]);
    const sets = strengthSets(state);
    expect(sets[0].isPR).toBe(false);
    expect(sets[1].isPR).toBe(true);
  });
});

describe('trainingLogReducers — SetRemoved', () => {
  it('removes and renumbers remaining sets, recomputes PR', () => {
    const state = fold([
      sessionStarted(),
      blockAdded(),
      strengthSetLogged(1, 80, 5),
      strengthSetLogged(2, 100, 5), // PR
      strengthSetLogged(3, 90, 5),
      {
        type: 'SetRemoved',
        aggregateId: SESSION_ID,
        aggregateType: 'Session',
        timestamp: 1300,
        version: 1,
        payload: { sessionId: SESSION_ID, blockId: BLOCK_ID, setNumber: 2 },
      },
    ]);
    const sets = strengthSets(state);
    expect(sets).toHaveLength(2);
    expect(sets.map(s => s.setNumber)).toEqual([1, 2]);
    expect(sets.map(s => s.weightKg)).toEqual([80, 90]);
    // After removing the 100kg PR, 90x5 (450) is new top
    expect(sets.map(s => s.isPR)).toEqual([false, true]);
  });
});

describe('trainingLogReducers — SetUpdated', () => {
  it('merges only provided fields and re-detects PR', () => {
    const state = fold([
      sessionStarted(),
      blockAdded(),
      strengthSetLogged(1, 80, 5), // currently PR
      strengthSetLogged(2, 70, 5),
      {
        type: 'SetUpdated',
        aggregateId: SESSION_ID,
        aggregateType: 'Session',
        timestamp: 1300,
        version: 1,
        payload: {
          sessionId: SESSION_ID,
          blockId: BLOCK_ID,
          setNumber: 2,
          weightKg: 120, // new PR
        },
      },
    ]);
    const sets = strengthSets(state);
    expect(sets[1].weightKg).toBe(120);
    expect(sets[1].reps).toBe(5); // untouched
    expect(sets[0].isPR).toBe(false);
    expect(sets[1].isPR).toBe(true);
  });
});

describe('trainingLogReducers — SessionRenamed / StartTimeUpdated', () => {
  it('updates name and startedAt', () => {
    const state = fold([
      sessionStarted(),
      {
        type: 'SessionRenamed',
        aggregateId: SESSION_ID,
        aggregateType: 'Session',
        timestamp: 2000,
        version: 1,
        payload: { sessionId: SESSION_ID, name: 'Leg Day' },
      },
      {
        type: 'SessionStartTimeUpdated',
        aggregateId: SESSION_ID,
        aggregateType: 'Session',
        timestamp: 2001,
        version: 1,
        payload: { sessionId: SESSION_ID, startedAt: 500 },
      },
    ]);
    expect((state.activities[0] as TrainingSession).name).toBe('Leg Day');
    expect(state.activities[0].startedAt).toBe(500);
  });
});

describe('trainingLogReducers — BlocksReordered', () => {
  it('reorders blocks and assigns new order indices', () => {
    const state = fold([
      sessionStarted(),
      blockAdded(BLOCK_ID, 'A', 0, 1100, EX_ID),
      blockAdded(BLOCK_ID_2, 'B', 1, 1101, EX_ID_2),
      {
        type: 'BlocksReordered',
        aggregateId: SESSION_ID,
        aggregateType: 'Session',
        timestamp: 1200,
        version: 1,
        payload: { sessionId: SESSION_ID, blockIds: [BLOCK_ID_2, BLOCK_ID] },
      },
    ]);
    const blocks = (state.activities[0] as TrainingSession).blocks;
    expect(blocks.map(b => b.id)).toEqual([BLOCK_ID_2, BLOCK_ID]);
    expect(blocks.map(b => b.order)).toEqual([0, 1]);
  });
});

describe('trainingLogReducers — superset auto-ungroup', () => {
  it('clears groupId from the last remaining member when size drops below 2', () => {
    const state = fold([
      sessionStarted(),
      blockAdded(BLOCK_ID, 'A', 0, 1100, EX_ID),
      blockAdded(BLOCK_ID_2, 'B', 1, 1101, EX_ID_2),
      {
        type: 'BlockAddedToSuperset',
        aggregateId: SESSION_ID,
        aggregateType: 'Session',
        timestamp: 1200,
        version: 1,
        payload: { sessionId: SESSION_ID, blockId: BLOCK_ID, groupId: GROUP_ID },
      },
      {
        type: 'BlockAddedToSuperset',
        aggregateId: SESSION_ID,
        aggregateType: 'Session',
        timestamp: 1201,
        version: 1,
        payload: { sessionId: SESSION_ID, blockId: BLOCK_ID_2, groupId: GROUP_ID },
      },
      {
        type: 'BlockLeftSuperset',
        aggregateId: SESSION_ID,
        aggregateType: 'Session',
        timestamp: 1300,
        version: 1,
        payload: { sessionId: SESSION_ID, blockId: BLOCK_ID },
      },
    ]);
    const blocks = (state.activities[0] as TrainingSession).blocks;
    expect(blocks.every(b => b.supersetGroupId === undefined)).toBe(true);
  });
});

describe('trainingLogReducers — post-finish editability', () => {
  it('still applies edits to a session after SessionFinished', () => {
    const state = fold([
      sessionStarted(),
      blockAdded(),
      strengthSetLogged(1, 80, 5),
      {
        type: 'SessionFinished',
        aggregateId: SESSION_ID,
        aggregateType: 'Session',
        timestamp: 1500,
        version: 1,
        payload: {
          sessionId: SESSION_ID,
          finishedAt: 1500,
          exerciseSummaries: [],
        },
      },
      {
        type: 'SessionRenamed',
        aggregateId: SESSION_ID,
        aggregateType: 'Session',
        timestamp: 1600,
        version: 1,
        payload: { sessionId: SESSION_ID, name: 'Renamed after finish' },
      },
    ]);
    expect(state.activities[0].status).toBe('finished');
    expect((state.activities[0] as TrainingSession).name).toBe('Renamed after finish');
  });
});
