import { describe, it, expect } from 'vitest';
import { domainBlocksToUIBlocks } from './mappers';
import type { ActivityView } from '@features/training_log';

type Segment = ActivityView['segments'][number];

function segment(overrides: Record<string, unknown>): Segment {
  return {
    id: 'seg-1',
    exerciseName: 'Burpees',
    exerciseCategory: 'strength',
    sets: [],
    notes: '',
    order: 0,
    ...overrides,
  } as unknown as Segment;
}

describe('domainBlocksToUIBlocks — EMOM/AMRAP + rounds', () => {
  it('preserves a single-exercise EMOM block type and rounds', () => {
    const [block] = domainBlocksToUIBlocks([
      segment({ id: 'seg-1', blockType: 'emom', rounds: 12 }),
    ]);
    expect(block.type).toBe('emom');
    expect(block.label).toBe('EMOM');
    expect(block.rounds).toBe(12);
  });

  it('preserves a single-exercise AMRAP block type', () => {
    const [block] = domainBlocksToUIBlocks([
      segment({ id: 'seg-1', blockType: 'amrap', rounds: 5 }),
    ]);
    expect(block.type).toBe('amrap');
    expect(block.label).toBe('AMRAP');
    expect(block.rounds).toBe(5);
  });

  it('preserves a grouped EMOM with member blocks and rounds', () => {
    const [block] = domainBlocksToUIBlocks([
      segment({ id: 'a', exerciseName: 'Thrusters', blockType: 'emom', rounds: 10, supersetGroupId: 'g1' }),
      segment({ id: 'b', exerciseName: 'Pull-ups', blockType: 'emom', rounds: 10, supersetGroupId: 'g1' }),
    ]);
    expect(block.type).toBe('emom');
    expect(block.label).toBe('EMOM');
    expect(block.rounds).toBe(10);
    expect(block.memberBlockIds).toEqual(['a', 'b']);
  });

  it('still maps a plain strength block to single with no rounds', () => {
    const [block] = domainBlocksToUIBlocks([
      segment({ id: 'seg-1', blockType: 'straight' }),
    ]);
    expect(block.type).toBe('single');
    expect(block.rounds).toBeUndefined();
  });

  it('maps a transition segment to a transition block', () => {
    const [block] = domainBlocksToUIBlocks([
      segment({ id: 'seg-1', exerciseName: 'T1', exerciseCategory: 'cardio', isTransition: true }),
    ]);
    expect(block.type).toBe('transition');
  });

  it('surfaces every cardio set as cardioSets (intervals/laps)', () => {
    const [block] = domainBlocksToUIBlocks([
      segment({
        id: 'seg-1',
        exerciseName: 'Row',
        exerciseCategory: 'cardio',
        sets: [
          { setNumber: 1, distanceMeters: 500, durationSeconds: 100 },
          { setNumber: 2, distanceMeters: 500, durationSeconds: 105 },
        ],
      }),
    ]);
    expect(block.type).toBe('cardio');
    expect(block.exercises[0].cardioSets).toHaveLength(2);
    expect(block.exercises[0].cardioSets?.[1].durationSeconds).toBe(105);
  });

  it('passes a set setType (dropset) through to the UI set', () => {
    const [block] = domainBlocksToUIBlocks([
      segment({
        id: 'seg-1',
        sets: [{ setNumber: 1, weightKg: 60, reps: 8, setType: 'dropset' }],
      }),
    ]);
    expect(block.exercises[0].sets?.[0].setType).toBe('dropset');
  });
});
