import { describe, it, expect } from 'vitest';
import { generateMockRestingHRHistory, generateMockHRVHistory } from './health';
import { generateMockSleepHistory } from './sleep';

describe('generateMockRestingHRHistory', () => {
  it('returns exactly the requested number of days', () => {
    expect(generateMockRestingHRHistory(30).length).toBe(30);
  });

  it('entries are sorted oldest to newest', () => {
    const entries = generateMockRestingHRHistory(7);
    for (let i = 1; i < entries.length; i++) {
      expect(entries[i].date > entries[i - 1].date).toBe(true);
    }
  });

  it('BPM values are in realistic range (35–65)', () => {
    const entries = generateMockRestingHRHistory(90);
    for (const e of entries) {
      expect(e.bpm).toBeGreaterThanOrEqual(35);
      expect(e.bpm).toBeLessThanOrEqual(65);
    }
  });

  it('dates are YYYY-MM-DD strings', () => {
    for (const e of generateMockRestingHRHistory(3)) {
      expect(e.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});

describe('generateMockHRVHistory', () => {
  it('returns exactly the requested number of days', () => {
    expect(generateMockHRVHistory(30).length).toBe(30);
  });

  it('HRV values are in realistic range (30–140 ms)', () => {
    for (const e of generateMockHRVHistory(90)) {
      expect(e.hrv).toBeGreaterThanOrEqual(30);
      expect(e.hrv).toBeLessThanOrEqual(140);
    }
  });
});

describe('generateMockSleepHistory', () => {
  it('returns exactly the requested number of days', () => {
    expect(generateMockSleepHistory(7).length).toBe(7);
  });

  it('each entry has score between 0 and 100', () => {
    for (const e of generateMockSleepHistory(30)) {
      expect(e.score).toBeGreaterThanOrEqual(0);
      expect(e.score).toBeLessThanOrEqual(100);
    }
  });

  it('entries are sorted oldest to newest', () => {
    const entries = generateMockSleepHistory(7);
    for (let i = 1; i < entries.length; i++) {
      expect(entries[i].start >= entries[i - 1].start).toBe(true);
    }
  });
});
