import { describe, it, expect } from 'vitest';
import { trainingLoadInsight, plateauInsight, deloadInsight } from './rules';

describe('trainingLoadInsight', () => {
  it('returns null when ratio is within safe range (< 1.5)', () => {
    expect(trainingLoadInsight(1.2)).toBeNull();
  });

  it('returns an OvertrainingRisk insight when acute:chronic ratio > 1.5', () => {
    const insight = trainingLoadInsight(1.6);
    expect(insight).not.toBeNull();
    expect(insight?.type).toBe('OvertrainingRisk');
    expect(insight?.title).toBe('High training load');
    expect(insight?.message).toContain('1.6');
  });

  it('returns null when ratio is 0 (no data)', () => {
    expect(trainingLoadInsight(0)).toBeNull();
  });
});

describe('plateauInsight', () => {
  it('returns null when no plateau detected', () => {
    expect(plateauInsight('Bench Press', false)).toBeNull();
  });

  it('returns a PlateauDetected insight when plateau detected', () => {
    const insight = plateauInsight('Bench Press', true);
    expect(insight).not.toBeNull();
    expect(insight?.type).toBe('PlateauDetected');
    expect(insight?.message).toContain('Bench Press');
  });
});

describe('deloadInsight', () => {
  it('returns null when conditions not met', () => {
    expect(deloadInsight({ highLoadDays: 2, highRpeStreak: 1, adherenceRate: 0.9 })).toBeNull();
  });

  it('returns an OvertrainingRisk insight when all three signals align', () => {
    const insight = deloadInsight({ highLoadDays: 6, highRpeStreak: 3, adherenceRate: 0.55 });
    expect(insight).not.toBeNull();
    expect(insight?.type).toBe('OvertrainingRisk');
    expect(insight?.title).toBe('Deload week recommended');
  });

  it('returns null when only 2 of 3 signals are present', () => {
    expect(deloadInsight({ highLoadDays: 6, highRpeStreak: 3, adherenceRate: 0.85 })).toBeNull();
  });
});
