import { describe, it, expect } from 'vitest';
import { sessionCountEvaluator } from './sessionCount';
import { prWeightEvaluator } from './prWeight';
import { cardioDistanceEvaluator } from './cardioDistance';
import { consecutiveDaysEvaluator } from './consecutiveDays';
import { checkAchievementCondition } from './registry';
import type { AchievementDef, SessionSnapshot, CardioSnapshot } from '../types';
import type { EvalContext } from './types';

function makeSession(overrides: Partial<SessionSnapshot> = {}): SessionSnapshot {
  return {
    name: 'Workout',
    category: 'strength',
    startedAt: Date.now(),
    hasPR: false,
    ...overrides,
  };
}

function makeCardio(overrides: Partial<CardioSnapshot> = {}): CardioSnapshot {
  return {
    sport: 'running',
    distanceMeters: 5000,
    ...overrides,
  };
}

function makeDef(condition: AchievementDef['condition']): AchievementDef {
  return { id: 'ach-1', name: 'Test', description: '', rarity: 'common', condition };
}

describe('sessionCountEvaluator', () => {
  it('unlocks when session count meets threshold', () => {
    const def = makeDef({ type: 'session_count', threshold: 3 });
    const ctx: EvalContext = {
      sessions: [makeSession(), makeSession(), makeSession()],
      cardioSessions: [],
    };
    expect(sessionCountEvaluator.check(def, ctx).unlocked).toBe(true);
    expect(sessionCountEvaluator.check(def, ctx).progress).toBe(3);
  });

  it('does not unlock below threshold', () => {
    const def = makeDef({ type: 'session_count', threshold: 5 });
    const ctx: EvalContext = { sessions: [makeSession()], cardioSessions: [] };
    expect(sessionCountEvaluator.check(def, ctx).unlocked).toBe(false);
    expect(sessionCountEvaluator.check(def, ctx).progress).toBe(1);
  });

  it('filters by sport when specified', () => {
    const def = makeDef({ type: 'session_count', threshold: 2, sport: 'strength' });
    const ctx: EvalContext = {
      sessions: [makeSession({ category: 'strength' }), makeSession({ category: 'cardio' })],
      cardioSessions: [],
    };
    expect(sessionCountEvaluator.check(def, ctx).unlocked).toBe(false);
    expect(sessionCountEvaluator.check(def, ctx).progress).toBe(1);
  });
});

describe('prWeightEvaluator', () => {
  it('unlocks when session has a PR for the exercise', () => {
    const def = makeDef({ type: 'pr_weight', threshold: 100, exerciseName: 'Squat' });
    const ctx: EvalContext = {
      sessions: [makeSession({ hasPR: true, name: 'Squat Day' })],
      cardioSessions: [],
    };
    expect(prWeightEvaluator.check(def, ctx).unlocked).toBe(true);
  });

  it('does not unlock without PR', () => {
    const def = makeDef({ type: 'pr_weight', threshold: 100, exerciseName: 'Squat' });
    const ctx: EvalContext = {
      sessions: [makeSession({ hasPR: false, name: 'Squat Day' })],
      cardioSessions: [],
    };
    expect(prWeightEvaluator.check(def, ctx).unlocked).toBe(false);
  });
});

describe('cardioDistanceEvaluator', () => {
  it('unlocks when max distance meets threshold', () => {
    const def = makeDef({ type: 'cardio_distance', threshold: 5000, sport: 'running' });
    const ctx: EvalContext = {
      sessions: [],
      cardioSessions: [makeCardio({ distanceMeters: 5000, sport: 'running' })],
    };
    expect(cardioDistanceEvaluator.check(def, ctx).unlocked).toBe(true);
  });

  it('does not unlock for wrong sport', () => {
    const def = makeDef({ type: 'cardio_distance', threshold: 5000, sport: 'cycling' });
    const ctx: EvalContext = {
      sessions: [],
      cardioSessions: [makeCardio({ distanceMeters: 5000, sport: 'running' })],
    };
    expect(cardioDistanceEvaluator.check(def, ctx).unlocked).toBe(false);
  });
});

describe('consecutiveDaysEvaluator', () => {
  it('unlocks for consecutive days at threshold', () => {
    const now = new Date();
    const sessions: SessionSnapshot[] = [0, 1, 2, 3].map(daysAgo => {
      const d = new Date(now);
      d.setDate(d.getDate() - daysAgo);
      return makeSession({ startedAt: d.getTime() });
    });
    const def = makeDef({ type: 'consecutive_days', threshold: 4 });
    const ctx: EvalContext = { sessions, cardioSessions: [] };
    expect(consecutiveDaysEvaluator.check(def, ctx).unlocked).toBe(true);
  });

  it('does not unlock when streak is broken', () => {
    const now = new Date();
    const sessions: SessionSnapshot[] = [0, 2].map(daysAgo => {
      const d = new Date(now);
      d.setDate(d.getDate() - daysAgo);
      return makeSession({ startedAt: d.getTime() });
    });
    const def = makeDef({ type: 'consecutive_days', threshold: 2 });
    const ctx: EvalContext = { sessions, cardioSessions: [] };
    expect(consecutiveDaysEvaluator.check(def, ctx).unlocked).toBe(false);
  });
});

describe('checkAchievementCondition registry', () => {
  it('dispatches to the correct evaluator', () => {
    const def = makeDef({ type: 'session_count', threshold: 2 });
    const ctx: EvalContext = { sessions: [makeSession(), makeSession()], cardioSessions: [] };
    expect(checkAchievementCondition(def, ctx).unlocked).toBe(true);
  });

  it('returns unlocked:false for unknown condition type', () => {
    const def = makeDef({ type: 'session_count' as AchievementDef['condition']['type'], threshold: 1 });
    const ctx: EvalContext = { sessions: [], cardioSessions: [] };
    expect(checkAchievementCondition(def, ctx).unlocked).toBe(false);
  });
});
