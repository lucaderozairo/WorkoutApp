import { describe, it, expect } from 'vitest';
import { parseGarminSleepCSV } from './parseGarminSleepCSV';

const SAMPLE = `Sleep Score 1 Day,
Date,2026-04-15
Sleep Duration,8h 35m
Sleep Score,87
Quality,Good

Sleep Score Factors,
Sleep Duration,8h 35m
Stress Avg,17
Deep Sleep Duration,1h 3m
Light Sleep Duration,5h 25m
REM Duration,2h 8m
Awake Time,11m

Sleep Timeline Metrics,
Breathing Variations,--
Restless Moments,35
Avg Overnight Heart Rate,53 bpm
Resting Heart Rate,45 bpm
Body Battery Change,+70
Avg SpO₂,--
Avg Respiration,11 brpm
Avg Overnight HRV,89 ms`;

describe('parseGarminSleepCSV', () => {
  it('parses the date', () => {
    expect(parseGarminSleepCSV(SAMPLE).date).toBe('2026-04-15');
  });

  it('parses sleep score and quality', () => {
    const r = parseGarminSleepCSV(SAMPLE);
    expect(r.sleepScore).toBe(87);
    expect(r.quality).toBe('Good');
  });

  it('parses total duration from the first Sleep Duration row only', () => {
    expect(parseGarminSleepCSV(SAMPLE).durationMin).toBe(515); // 8*60 + 35
  });

  it('parses sleep stages', () => {
    const r = parseGarminSleepCSV(SAMPLE);
    expect(r.deepMin).toBe(63);   // 1*60 + 3
    expect(r.lightMin).toBe(325); // 5*60 + 25
    expect(r.remMin).toBe(128);   // 2*60 + 8
    expect(r.awakeMin).toBe(11);
  });

  it('parses physiological metrics', () => {
    const r = parseGarminSleepCSV(SAMPLE);
    expect(r.hrv).toBe(89);
    expect(r.restingHr).toBe(45);
    expect(r.overnightHr).toBe(53);
    expect(r.respiration).toBe(11);
    expect(r.bodyBatteryChange).toBe(70);
    expect(r.stressAvg).toBe(17);
    expect(r.restlessMoments).toBe(35);
  });

  it('returns null for -- values', () => {
    expect(parseGarminSleepCSV('Avg Overnight HRV,--\n').hrv).toBeNull();
  });

  it('handles minutes-only duration with no hours component', () => {
    expect(parseGarminSleepCSV('Awake Time,11m\n').awakeMin).toBe(11);
  });

  it('returns null for -- quality value', () => {
    expect(parseGarminSleepCSV('Quality,--\n').quality).toBeNull();
  });
});
