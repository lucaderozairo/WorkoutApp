import { describe, it, expect } from 'vitest';
import { findPreviousPerformance, generateOverloadHint } from './sessionTools';
import type { ExerciseProgression } from './types';

const makeEmptyProgressions = (): Record<string, ExerciseProgression> => ({});

const makeProgressionWithHistory = (
  name: string,
  history: { date: string; weights: number[]; reps: number[]; maxWeight: number; e1rm: number }[],
): Record<string, ExerciseProgression> => ({
  [name]: {
    exerciseName: name,
    plateauDetected: false,
    history: history.map((h) => ({
      date: h.date,
      sessionId: 'sess-1' as any,
      sets: h.weights.length,
      totalReps: h.reps.reduce((a, b) => a + b, 0),
      maxWeightKg: h.maxWeight,
      volume: h.weights.reduce((sum, w, i) => sum + w * h.reps[i], 0),
      oneRepMaxEstimate: h.e1rm,
      setWeights: h.weights,
      setReps: h.reps,
      warmupWeights: [],
    })),
  },
});

describe('findPreviousPerformance', () => {
  it('returns undefined when no progression exists', () => {
    const result = findPreviousPerformance('Bench Press', makeEmptyProgressions());
    expect(result).toBeUndefined();
  });

  it('returns undefined when history is empty', () => {
    const progressions: Record<string, ExerciseProgression> = {
      'Bench Press': {
        exerciseName: 'Bench Press',
        history: [],
        plateauDetected: false,
      },
    };
    const result = findPreviousPerformance('Bench Press', progressions);
    expect(result).toBeUndefined();
  });

  it('returns performance from last session in history', () => {
    const progressions = makeProgressionWithHistory('Bench Press', [
      { date: '2026-06-01', weights: [50, 50], reps: [10, 8], maxWeight: 50, e1rm: 60 },
      { date: '2026-06-08', weights: [52.5, 52.5], reps: [8, 6], maxWeight: 52.5, e1rm: 63 },
    ]);
    const result = findPreviousPerformance('Bench Press', progressions);
    expect(result).toBeDefined();
    expect(result!.exerciseName).toBe('Bench Press');
    expect(result!.lastSessionDate).toBe('2026-06-08');
    expect(result!.maxWeightKg).toBe(52.5);
    expect(result!.estimatedOneRepMax).toBe(63);
    expect(result!.sets).toHaveLength(2);
    expect(result!.sets[0]).toEqual({ weightKg: 52.5, reps: 8, done: true });
    expect(result!.sets[1]).toEqual({ weightKg: 52.5, reps: 6, done: true });
  });

  it('maps sets with weight and reps from setWeights/setReps', () => {
    const progressions = makeProgressionWithHistory('Squat', [
      { date: '2026-06-05', weights: [80, 85, 90], reps: [5, 3, 1], maxWeight: 90, e1rm: 93 },
    ]);
    const result = findPreviousPerformance('Squat', progressions);
    expect(result!.sets).toHaveLength(3);
    expect(result!.sets[2]).toEqual({ weightKg: 90, reps: 1, done: true });
  });

  it('returns undefined for unknown exercise name', () => {
    const progressions = makeProgressionWithHistory('Bench Press', [
      { date: '2026-06-01', weights: [50], reps: [10], maxWeight: 50, e1rm: 60 },
    ]);
    const result = findPreviousPerformance('Squat', progressions);
    expect(result).toBeUndefined();
  });
});

describe('generateOverloadHint', () => {
  it('returns no_history when no previous performance', () => {
    const hint = generateOverloadHint(undefined, 50);
    expect(hint.kind).toBe('no_history');
    expect(hint.message).toContain('No previous data');
  });

  it('returns increase_weight when current matches previous max', () => {
    const prev = {
      exerciseName: 'Bench Press',
      lastSessionDate: '2026-06-01',
      sets: [{ weightKg: 50, reps: 10, done: true }],
      maxWeightKg: 50,
    };
    const hint = generateOverloadHint(prev, 50);
    expect(hint.kind).toBe('increase_weight');
    expect(hint.suggestedWeightKg).toBe(52.5);
    expect(hint.message).toContain('52.5kg');
  });

  it('returns increase_weight when current exceeds previous max', () => {
    const prev = {
      exerciseName: 'Bench Press',
      lastSessionDate: '2026-06-01',
      sets: [{ weightKg: 50, reps: 10, done: true }],
      maxWeightKg: 50,
    };
    const hint = generateOverloadHint(prev, 55);
    expect(hint.kind).toBe('increase_weight');
    expect(hint.suggestedWeightKg).toBe(52.5);
  });

  it('returns repeat_weight when current is below previous max', () => {
    const prev = {
      exerciseName: 'Squat',
      lastSessionDate: '2026-06-01',
      sets: [{ weightKg: 100, reps: 5, done: true }],
      maxWeightKg: 100,
    };
    const hint = generateOverloadHint(prev, 80);
    expect(hint.kind).toBe('repeat_weight');
    expect(hint.message).toContain('100');
  });

  it('returns repeat_weight when no current weight provided and there is history', () => {
    const prev = {
      exerciseName: 'Deadlift',
      lastSessionDate: '2026-06-01',
      sets: [{ weightKg: 120, reps: 5, done: true }],
      maxWeightKg: 120,
    };
    const hint = generateOverloadHint(prev, undefined);
    expect(hint.kind).toBe('repeat_weight');
  });

  it('rounds suggested weight to nearest 2.5kg', () => {
    const prev = {
      exerciseName: 'Bench Press',
      lastSessionDate: '2026-06-01',
      sets: [{ weightKg: 52.5, reps: 8, done: true }],
      maxWeightKg: 52.5,
    };
    const hint = generateOverloadHint(prev, 52.5);
    expect(hint.suggestedWeightKg).toBe(55);
  });
});
