import { describe, it, expect } from 'vitest';
import { generateMockRun } from './runs';

const DATE = new Date('2026-04-20T07:00:00Z');

describe('generateMockRun', () => {
  it('produces the correct point count (1 point per 5 seconds)', () => {
    const track = generateMockRun({ date: DATE, durationMin: 10, distanceKm: 2 });
    expect(track.points.length).toBe(120); // 10 * 60 / 5
  });

  it('every point has lat, lng, elevation, timestamp', () => {
    const track = generateMockRun({ date: DATE, durationMin: 5, distanceKm: 1 });
    for (const p of track.points) {
      expect(typeof p.lat).toBe('number');
      expect(typeof p.lng).toBe('number');
      expect(typeof p.elevation).toBe('number');
      expect(p.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    }
  });

  it('heart rate is in plausible range (100–200 bpm)', () => {
    const track = generateMockRun({ date: DATE, durationMin: 30, distanceKm: 5 });
    for (const p of track.points) {
      expect(p.heartRate).toBeGreaterThanOrEqual(100);
      expect(p.heartRate).toBeLessThanOrEqual(200);
    }
  });

  it('total distance is within 5% of requested', () => {
    const track = generateMockRun({ date: DATE, durationMin: 30, distanceKm: 5 });
    expect(track.totalDistance).toBeGreaterThan(4750);
    expect(track.totalDistance).toBeLessThan(5250);
  });

  it('duration matches requested within 1 second', () => {
    const track = generateMockRun({ date: DATE, durationMin: 20, distanceKm: 4 });
    expect(Math.abs(track.duration - 20 * 60)).toBeLessThanOrEqual(1);
  });

  it('sport defaults to run', () => {
    expect(generateMockRun({ date: DATE, durationMin: 10, distanceKm: 2 }).sport).toBe('run');
  });

  it('calories is set and > 0', () => {
    const track = generateMockRun({ date: DATE, durationMin: 30, distanceKm: 5 });
    expect(track.calories).toBeGreaterThan(0);
  });

  it('maxHeartRate >= avgHeartRate', () => {
    const track = generateMockRun({ date: DATE, durationMin: 30, distanceKm: 5 });
    expect(track.maxHeartRate!).toBeGreaterThanOrEqual(track.avgHeartRate!);
  });
});
