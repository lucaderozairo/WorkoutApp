import { describe, it, expect } from 'vitest';
import {
  generateMockAllDayHR,
  generateMockStress,
  generateMockBodyBattery,
  generateMockDailySummaries,
} from './wellness';

describe('generateMockAllDayHR', () => {
  it('returns one reading per minute for 24 h', () => {
    expect(generateMockAllDayHR(new Date()).length).toBe(1440);
  });

  it('each entry has a numeric bpm between 40 and 200', () => {
    for (const e of generateMockAllDayHR(new Date())) {
      expect(e.bpm).toBeGreaterThanOrEqual(40);
      expect(e.bpm).toBeLessThanOrEqual(200);
    }
  });

  it('each entry has a valid ISO timestamp', () => {
    const first = generateMockAllDayHR(new Date())[0];
    expect(() => new Date(first.timestamp)).not.toThrow();
    expect(new Date(first.timestamp).getTime()).not.toBeNaN();
  });
});

describe('generateMockStress', () => {
  it('returns one reading per 3 minutes (480 for 24 h)', () => {
    expect(generateMockStress(new Date()).length).toBe(480);
  });

  it('stress values are 0–100', () => {
    for (const e of generateMockStress(new Date())) {
      expect(e.level).toBeGreaterThanOrEqual(0);
      expect(e.level).toBeLessThanOrEqual(100);
    }
  });
});

describe('generateMockBodyBattery', () => {
  it('returns one reading per hour (24 for a day)', () => {
    expect(generateMockBodyBattery(new Date()).length).toBe(24);
  });

  it('charge values are 0–100', () => {
    for (const e of generateMockBodyBattery(new Date())) {
      expect(e.charge).toBeGreaterThanOrEqual(0);
      expect(e.charge).toBeLessThanOrEqual(100);
    }
  });
});

describe('generateMockDailySummaries', () => {
  it('returns the requested number of days', () => {
    expect(generateMockDailySummaries(7).length).toBe(7);
  });

  it('each summary has positive steps and calories', () => {
    for (const s of generateMockDailySummaries(7)) {
      expect(s.steps).toBeGreaterThan(0);
      expect(s.activeKcal).toBeGreaterThanOrEqual(0);
    }
  });

  it('summaries are sorted oldest to newest', () => {
    const summaries = generateMockDailySummaries(7);
    for (let i = 1; i < summaries.length; i++) {
      expect(summaries[i].calendarDate >= summaries[i - 1].calendarDate).toBe(true);
    }
  });
});
