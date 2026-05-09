import { describe, it, expect } from 'vitest';
import {
  gpsPointsToHRSeries,
  gpsPointsToPaceSeries,
  gpsPointsToElevationSeries,
} from './Charts';
import type { GpsPoint } from '@data/sources/files/gps';

const pt = (overrides: Partial<GpsPoint> & { timestamp: string }): GpsPoint => ({
  lat: 51.4, lng: -0.3, elevation: 10, ...overrides,
});

describe('gpsPointsToHRSeries', () => {
  it('maps elapsed minutes and HR', () => {
    const points = [
      pt({ timestamp: '2025-09-08T10:00:00.000Z', heartRate: 120 }),
      pt({ timestamp: '2025-09-08T10:01:00.000Z', heartRate: 140 }),
      pt({ timestamp: '2025-09-08T10:02:00.000Z', heartRate: 160 }),
    ];
    expect(gpsPointsToHRSeries(points)).toEqual([
      { x: 0, y: 120 },
      { x: 1, y: 140 },
      { x: 2, y: 160 },
    ]);
  });

  it('filters out points with no heart rate', () => {
    const points = [
      pt({ timestamp: '2025-09-08T10:00:00.000Z', heartRate: 120 }),
      pt({ timestamp: '2025-09-08T10:01:00.000Z' }),
    ];
    expect(gpsPointsToHRSeries(points).length).toBe(1);
  });

  it('returns empty array for empty input', () => {
    expect(gpsPointsToHRSeries([])).toEqual([]);
  });
});

describe('gpsPointsToPaceSeries', () => {
  it('converts speed (m/s) to pace (min/km) rounded to 1dp', () => {
    const points = [pt({ timestamp: '2025-09-08T10:00:00.000Z', speed: 3.0 })];
    // 3.0 m/s → 1000 / 3.0 / 60 = 5.555... → rounded to 5.6
    expect(gpsPointsToPaceSeries(points)[0].y).toBeCloseTo(5.6, 1);
  });

  it('filters out points with no speed or zero speed', () => {
    const points = [
      pt({ timestamp: '2025-09-08T10:00:00.000Z', speed: 0 }),
      pt({ timestamp: '2025-09-08T10:01:00.000Z' }),
    ];
    expect(gpsPointsToPaceSeries(points).length).toBe(0);
  });
});

describe('gpsPointsToElevationSeries', () => {
  it('first point has x=0', () => {
    const points = [pt({ timestamp: '2025-09-08T10:00:00.000Z', elevation: 5 })];
    expect(gpsPointsToElevationSeries(points)[0].x).toBe(0);
  });

  it('elevation y matches input', () => {
    const points = [pt({ timestamp: '2025-09-08T10:00:00.000Z', elevation: 12.5 })];
    expect(gpsPointsToElevationSeries(points)[0].y).toBe(12.5);
  });

  it('returns empty array for empty input', () => {
    expect(gpsPointsToElevationSeries([])).toEqual([]);
  });
});
