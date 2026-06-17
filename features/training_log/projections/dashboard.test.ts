import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { computeDashboard } from './dashboard';
import type { ActivityHistoryItem } from './index';

// Fix the clock so "today" and "this week" are deterministic.
const FIXED_NOW = new Date('2026-06-18T12:00:00Z').getTime(); // Wednesday

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

function makeSession(startedAt: Date): ActivityHistoryItem {
  return {
    id: `s-${startedAt.getTime()}` as never,
    name: 'Test',
    primarySport: 'strength',
    startedAt: startedAt.getTime(),
    finishedAt: startedAt.getTime() + 3600_000,
    durationSeconds: 3600,
    totalSets: 0,
    exerciseCount: 0,
    hasPR: false,
    category: 'compound',
  } as unknown as ActivityHistoryItem;
}

describe('computeDashboard', () => {
  it('returns zeroes for empty history', () => {
    expect(computeDashboard([])).toEqual({ streak: 0, workoutsThisWeek: 0, totalSessions: 0 });
  });

  it('counts a session on today as workoutsThisWeek=1', () => {
    const today = new Date(FIXED_NOW);
    const result = computeDashboard([makeSession(today)]);
    expect(result.workoutsThisWeek).toBe(1);
    expect(result.totalSessions).toBe(1);
  });

  it('does not count a session from last week', () => {
    const lastSunday = new Date('2026-06-14T10:00:00Z'); // before Mon Jun 16
    const result = computeDashboard([makeSession(lastSunday)]);
    expect(result.workoutsThisWeek).toBe(0);
  });

  it('streak is 1 for a session today', () => {
    const today = new Date(FIXED_NOW);
    expect(computeDashboard([makeSession(today)]).streak).toBe(1);
  });

  it('streak is 2 for sessions today and yesterday', () => {
    const today = new Date(FIXED_NOW);
    const yesterday = new Date(FIXED_NOW - 86400_000);
    expect(computeDashboard([makeSession(today), makeSession(yesterday)]).streak).toBe(2);
  });

  it('streak gaps reset the count', () => {
    const today = new Date(FIXED_NOW);
    const twoDaysAgo = new Date(FIXED_NOW - 2 * 86400_000);
    // No session yesterday — gap
    expect(computeDashboard([makeSession(today), makeSession(twoDaysAgo)]).streak).toBe(1);
  });

  it('streak counts yesterday when not trained today', () => {
    const yesterday = new Date(FIXED_NOW - 86400_000);
    expect(computeDashboard([makeSession(yesterday)]).streak).toBe(1);
  });
});
