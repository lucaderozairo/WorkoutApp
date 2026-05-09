import { describe, it, expect } from 'vitest';
import { parseStravaActivity } from './strava';
import type { StravaDetailedActivity, StravaStreams } from './strava';

const ACTIVITY: StravaDetailedActivity = {
  id: 12345,
  sport_type: 'Run',
  elapsed_time: 1800,
  moving_time: 1750,
  distance: 5000,
  total_elevation_gain: 42,
  average_heartrate: 155,
  max_heartrate: 182,
  average_watts: 210,
  kilojoules: 378,
  average_temp: 14,
  start_date: '2026-04-20T07:00:00Z',
  splits_metric: [],
  laps: [],
};

const STREAMS: StravaStreams = {
  time:     { data: [0, 5, 10] },
  latlng:   { data: [[51.429, -0.315], [51.430, -0.314], [51.431, -0.313]] },
  altitude: { data: [5, 6, 7] },
  heartrate:{ data: [150, 155, 160] },
  velocity_smooth: { data: [3.0, 3.1, 3.2] },
  cadence:  { data: [170, 172, 174] },
  watts:    { data: [200, 210, 220] },
  grade_smooth: { data: [1.0, 1.5, 2.0] },
  temp:     { data: [14, 14, 15] },
};

describe('parseStravaActivity', () => {
  it('returns a GpsTrack with correct point count when streams provided', () => {
    const track = parseStravaActivity(ACTIVITY, STREAMS);
    expect(track.points.length).toBe(3);
  });

  it('maps sport to lowercase', () => {
    expect(parseStravaActivity(ACTIVITY, STREAMS).sport).toBe('run');
  });

  it('sets avgHeartRate from activity when no streams', () => {
    const track = parseStravaActivity(ACTIVITY);
    expect(track.avgHeartRate).toBe(155);
  });

  it('sets maxHeartRate from activity', () => {
    expect(parseStravaActivity(ACTIVITY).maxHeartRate).toBe(182);
  });

  it('converts kilojoules to kcal for calories', () => {
    const track = parseStravaActivity(ACTIVITY);
    expect(track.calories).toBeGreaterThan(85);
    expect(track.calories).toBeLessThan(95);
  });

  it('sets duration from elapsed_time', () => {
    expect(parseStravaActivity(ACTIVITY).duration).toBe(1800);
  });

  it('sets totalDistance from activity distance', () => {
    expect(parseStravaActivity(ACTIVITY).totalDistance).toBe(5000);
  });

  it('maps per-point heartrate, speed, grade, temperature from streams', () => {
    const track = parseStravaActivity(ACTIVITY, STREAMS);
    const p = track.points[0];
    expect(p.heartRate).toBe(150);
    expect(p.speed).toBeCloseTo(3.0);
    expect(p.grade).toBe(1.0);
    expect(p.temperature).toBe(14);
  });

  it('works without streams — returns empty points array', () => {
    const track = parseStravaActivity(ACTIVITY);
    expect(track.points).toEqual([]);
  });
});
