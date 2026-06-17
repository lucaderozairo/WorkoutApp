import { describe, it, expect } from 'vitest';
import { epleyOneRepMax, computeVolumeEntry, detectPlateau } from './compute';
// eslint-disable-next-line no-restricted-imports -- TODO(arch): cross-layer import baselined; see docs/superpowers/plans/2026-06-03-architecture-rule-enforcement.md
import type { StrengthSet } from '@features/training_log/domain/types';

const makeSet = (weight: number, reps: number, isWarmup = false): StrengthSet => ({
  type: 'strength',
  setNumber: 1,
  weightKg: weight,
  reps,
  isWarmup,
  isPR: false,
  completedAt: Date.now(),
});

describe('epleyOneRepMax', () => {
  it('returns weight unchanged when reps is 1', () => {
    expect(epleyOneRepMax(100, 1)).toBe(100);
  });

  it('estimates 1RM using Epley formula: weight * (1 + reps/30)', () => {
    expect(epleyOneRepMax(80, 10)).toBeCloseTo(80 * (1 + 10 / 30), 2);
  });
});

describe('computeVolumeEntry', () => {
  it('sums volume across all working sets', () => {
    const sets = [makeSet(100, 5), makeSet(100, 5), makeSet(100, 4)];
    const entry = computeVolumeEntry('2026-04-14', sets, 'sess-1' as any);
    // total volume = 100*5 + 100*5 + 100*4 = 1400
    expect(entry.volume).toBe(1400);
  });

  it('excludes warmup sets from volume and 1RM', () => {
    const sets = [makeSet(60, 10, true), makeSet(100, 5), makeSet(100, 5)];
    const entry = computeVolumeEntry('2026-04-14', sets, 'sess-1' as any);
    expect(entry.volume).toBe(1000); // only 2 working sets
  });

  it('returns zero volume when no working sets', () => {
    const entry = computeVolumeEntry('2026-04-14', [], 'sess-1' as any);
    expect(entry.volume).toBe(0);
    expect(entry.oneRepMaxEstimate).toBe(0);
  });

  it('finds the heaviest 1RM estimate across working sets', () => {
    const sets = [makeSet(80, 10), makeSet(100, 3)];
    const entry = computeVolumeEntry('2026-04-14', sets, 'sess-1' as any);
    const rm80x10 = epleyOneRepMax(80, 10);
    const rm100x3 = epleyOneRepMax(100, 3);
    expect(entry.oneRepMaxEstimate).toBeCloseTo(Math.max(rm80x10, rm100x3), 2);
  });
});

describe('detectPlateau', () => {
  it('returns false when fewer than 3 entries', () => {
    expect(detectPlateau([{ volume: 1000 } as any, { volume: 1050 } as any])).toBe(false);
  });

  it('returns true when last 3 volumes show < 2% increase overall', () => {
    const history = [
      { volume: 1000 } as any,
      { volume: 1005 } as any,
      { volume: 1008 } as any,
    ];
    expect(detectPlateau(history)).toBe(true);
  });

  it('returns false when volume increases >= 2%', () => {
    const history = [
      { volume: 1000 } as any,
      { volume: 1020 } as any,
      { volume: 1050 } as any,
    ];
    expect(detectPlateau(history)).toBe(false);
  });
});
