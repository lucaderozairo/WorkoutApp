import { describe, it, expect } from 'vitest';
import { parseGarminSleepYearCSV } from './parseGarminSleepYearCSV';

const SAMPLE = `Date,Avg Score,Avg Quality,Avg Duration,Avg Sleep Need,Avg Bedtime,Avg Wake Time
Apr 9-15,83,Good,7h 46min,7h 53min,12:31 AM,8:30 AM
Apr 2-8,85,Good,8h 5min,7h 55min,12:24 AM,8:39 AM
Nov 27 - Dec 3, 2025,71,Fair,7h 41min,8h 29min,12:38 AM,8:38 AM`;

describe('parseGarminSleepYearCSV', () => {
  it('skips the header row', () => {
    const result = parseGarminSleepYearCSV(SAMPLE);
    expect(result.every(r => r.weekLabel !== 'Date')).toBe(true);
  });

  it('returns rows oldest-first', () => {
    const result = parseGarminSleepYearCSV(SAMPLE);
    expect(result[0].weekLabel).toBe('Nov 27 - Dec 3, 2025');
    expect(result[result.length - 1].weekLabel).toBe('Apr 9-15');
  });

  it('parses score and quality', () => {
    const result = parseGarminSleepYearCSV(SAMPLE);
    const apr9 = result.find(r => r.weekLabel === 'Apr 9-15')!;
    expect(apr9.avgScore).toBe(83);
    expect(apr9.avgQuality).toBe('Good');
  });

  it('parses duration and sleep need to minutes', () => {
    const result = parseGarminSleepYearCSV(SAMPLE);
    const apr9 = result.find(r => r.weekLabel === 'Apr 9-15')!;
    expect(apr9.avgDurationMin).toBe(466);  // 7*60 + 46
    expect(apr9.avgSleepNeedMin).toBe(473); // 7*60 + 53
  });

  it('preserves week labels that contain a comma (year suffix)', () => {
    const result = parseGarminSleepYearCSV(SAMPLE);
    const nov = result.find(r => r.weekLabel === 'Nov 27 - Dec 3, 2025');
    expect(nov).toBeDefined();
    expect(nov!.avgScore).toBe(71);
  });

  it('preserves bedtime and wake time strings', () => {
    const result = parseGarminSleepYearCSV(SAMPLE);
    const apr9 = result.find(r => r.weekLabel === 'Apr 9-15')!;
    expect(apr9.avgBedtime).toBe('12:31 AM');
    expect(apr9.avgWakeTime).toBe('8:30 AM');
  });
});
