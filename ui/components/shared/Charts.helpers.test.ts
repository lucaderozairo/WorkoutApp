import { describe, it, expect } from 'vitest';
import {
  gpsPointsToHRSeries,
  gpsPointsToPaceSeries,
  gpsPointsToElevationSeries,
} from '@ui/patterns/charts/domain-charts';
import type { GpsPoint } from '@data/sources/files/gps';

const pt = (overrides: Partial<GpsPoint> & { timestamp: string }): GpsPoint => ({
  lat: 51.4, lng: -0.3, elevation: 10, ...overrides,
});

describe('gpsPointsToHRSeries', () => {
  it('maps cumulative distance (m) and HR', () => {
    // Points at distinct locations so distance accumulates
    const points = [
      pt({ timestamp: '2025-09-08T10:00:00.000Z', lat: 51.4000, lng: -0.3000, heartRate: 120 }),
      pt({ timestamp: '2025-09-08T10:01:00.000Z', lat: 51.4010, lng: -0.3000, heartRate: 140 }),
      pt({ timestamp: '2025-09-08T10:02:00.000Z', lat: 51.4020, lng: -0.3000, heartRate: 160 }),
    ];
    const series = gpsPointsToHRSeries(points);
    expect(series.length).toBe(3);
    expect(series[0].x).toBe(0);        // first point always at 0
    expect(series[0].y).toBe(120);
    expect(series[1].x).toBeGreaterThan(0); // subsequent points accumulate distance
    expect(series[1].y).toBe(140);
    expect(series[2].x).toBeGreaterThan(series[1].x);
    expect(series[2].y).toBe(160);
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
    // Need at least 2 points; speed is read from curr (index 1)
    const points = [
      pt({ timestamp: '2025-09-08T10:00:00.000Z', lat: 51.4000, lng: -0.3000, speed: 1.0 }),
      pt({ timestamp: '2025-09-08T10:01:00.000Z', lat: 51.4010, lng: -0.3000, speed: 3.0 }),
    ];
    // 3.0 m/s → 1000 / 3.0 / 60 = 5.555... → rounded to 5.6
    expect(gpsPointsToPaceSeries(points)[0].y).toBeCloseTo(5.6, 1);
  });

  it('filters out points with no speed or zero speed', () => {
    const points = [
      pt({ timestamp: '2025-09-08T10:00:00.000Z', lat: 51.4000, lng: -0.3000, speed: 0 }),
      pt({ timestamp: '2025-09-08T10:01:00.000Z', lat: 51.4010, lng: -0.3000, speed: 0 }),
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
