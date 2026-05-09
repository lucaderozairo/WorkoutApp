import { describe, it, expect } from 'vitest';
import {
  makeTrainingLoadInsight,
  makePlateauInsight,
  makeDeloadInsight,
} from './rules';

describe('makeTrainingLoadInsight', () => {
  it('returns null when ratio is within safe range (< 1.5)', () => {
    expect(makeTrainingLoadInsight(1.2)).toBeNull();
  });

  it('returns a warning when acute:chronic ratio > 1.5', () => {
    const insight = makeTrainingLoadInsight(1.6);
    expect(insight).not.toBeNull();
    expect(insight?.type).toBe('warning');
    expect(insight?.message).toContain('1.6');
  });

  it('returns null when ratio is 0 (no data)', () => {
    expect(makeTrainingLoadInsight(0)).toBeNull();
  });
});

describe('makePlateauInsight', () => {
  it('returns null when no plateau detected', () => {
    expect(makePlateauInsight('Bench Press', false)).toBeNull();
  });

  it('returns a suggestion when plateau detected', () => {
    const insight = makePlateauInsight('Bench Press', true);
    expect(insight).not.toBeNull();
    expect(insight?.type).toBe('suggestion');
    expect(insight?.message).toContain('Bench Press');
  });
});

describe('makeDeloadInsight', () => {
  it('returns null when conditions not met', () => {
    expect(makeDeloadInsight({ highLoadDays: 2, highRpeStreak: 1, adherenceRate: 0.9 })).toBeNull();
  });

  it('returns a warning when all three signals align', () => {
    const insight = makeDeloadInsight({ highLoadDays: 6, highRpeStreak: 3, adherenceRate: 0.55 });
    expect(insight).not.toBeNull();
    expect(insight?.type).toBe('warning');
  });

  it('returns null when only 2 of 3 signals are present', () => {
    expect(makeDeloadInsight({ highLoadDays: 6, highRpeStreak: 3, adherenceRate: 0.85 })).toBeNull();
  });
});
