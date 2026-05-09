import { describe, it, expect } from 'vitest';
import { MOCK_SESSION_HISTORY, MOCK_EXERCISE_SETS } from './sessions';

describe('MOCK_SESSION_HISTORY', () => {
  it('has 12 sessions', () => {
    expect(MOCK_SESSION_HISTORY).toHaveLength(12);
  });
  it('all sessions have category strength', () => {
    for (const s of MOCK_SESSION_HISTORY) {
      expect(s.category).toBe('strength');
    }
  });
  it('sessions are sorted oldest to newest', () => {
    for (let i = 1; i < MOCK_SESSION_HISTORY.length; i++) {
      expect(MOCK_SESSION_HISTORY[i].startedAt).toBeGreaterThan(MOCK_SESSION_HISTORY[i - 1].startedAt);
    }
  });
  it('at least one session has hasPR true', () => {
    expect(MOCK_SESSION_HISTORY.some(s => s.hasPR)).toBe(true);
  });
  it('durationSeconds equals finishedAt minus startedAt', () => {
    for (const s of MOCK_SESSION_HISTORY) {
      expect(s.durationSeconds).toBe(Math.round((s.finishedAt - s.startedAt) / 1000));
    }
  });
});

describe('MOCK_EXERCISE_SETS', () => {
  it('has exactly 4 exercises', () => {
    expect(Object.keys(MOCK_EXERCISE_SETS)).toHaveLength(4);
  });
  it('each exercise has at least 10 sessions', () => {
    for (const [name, entries] of Object.entries(MOCK_EXERCISE_SETS)) {
      expect(entries.length, `${name} should have >= 10 entries`).toBeGreaterThanOrEqual(10);
    }
  });
  it('each session has exactly one warmup set', () => {
    for (const entries of Object.values(MOCK_EXERCISE_SETS)) {
      for (const entry of entries) {
        expect(entry.sets.filter(s => s.isWarmup)).toHaveLength(1);
      }
    }
  });
  it('working sets have higher weight than the warmup set', () => {
    for (const entries of Object.values(MOCK_EXERCISE_SETS)) {
      for (const entry of entries) {
        const warmup = entry.sets.find(s => s.isWarmup)!;
        for (const s of entry.sets.filter(s => !s.isWarmup)) {
          expect(s.weightKg).toBeGreaterThan(warmup.weightKg);
        }
      }
    }
  });
  it('entries are sorted oldest to newest per exercise', () => {
    for (const entries of Object.values(MOCK_EXERCISE_SETS)) {
      for (let i = 1; i < entries.length; i++) {
        expect(entries[i].date).toBeGreaterThan(entries[i - 1].date);
      }
    }
  });
  it('at least one session has a failed set', () => {
    const allSets = Object.values(MOCK_EXERCISE_SETS).flatMap(e => e.flatMap(s => s.sets));
    expect(allSets.some(s => s.failed)).toBe(true);
  });
});
