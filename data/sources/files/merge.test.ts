import { describe, it, expect } from 'vitest';
import { mergeSessionWithTrack } from './merge';
import type { GpsTrack } from './gps';

const track: GpsTrack = {
  points: [],
  totalDistance: 5000,
  elevationGain: 80,
  avgHeartRate: 155,
  avgPace: 360,
  avgSpeed: 10,
  duration: 1800,
  startTimestamp: '2026-04-14T10:00:00Z',
};

describe('mergeSessionWithTrack', () => {
  it('fills missing sensor fields from track', () => {
    const result = mergeSessionWithTrack({ durationSeconds: 0, distanceMeters: 0 }, track);
    expect(result.durationSeconds).toBe(1800);
    expect(result.distanceMeters).toBe(5000);
    expect(result.gpsTrack).toBe(track);
  });

  it('file wins for sensor data even when session has values', () => {
    const result = mergeSessionWithTrack({ durationSeconds: 999, distanceMeters: 999 }, track);
    expect(result.durationSeconds).toBe(1800);
    expect(result.distanceMeters).toBe(5000);
  });

  it('session wins for rpe', () => {
    const result = mergeSessionWithTrack({ rpe: 7 }, track);
    expect(result.rpe).toBe(7);
  });

  it('session wins for notes', () => {
    const result = mergeSessionWithTrack({ notes: 'felt strong' }, track);
    expect(result.notes).toBe('felt strong');
  });

  it('session wins for activityType / sport', () => {
    const result = mergeSessionWithTrack({ sport: 'cycle' as const }, track);
    expect(result.sport).toBe('cycle');
  });
});
