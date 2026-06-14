import { describe, it, expect } from 'vitest';
import type { GpsPoint, GpsTrack } from '@data/sources/files/gps';
import { gpsTrackToRouteDraft } from './gpxModel';

function point(lat: number, lng: number, elevation: number): GpsPoint {
  return { lat, lng, elevation, timestamp: new Date(0).toISOString() };
}

function track(points: GpsPoint[]): GpsTrack {
  return { points, totalDistance: 0, elevationGain: 0, duration: 0 };
}

describe('gpsTrackToRouteDraft', () => {
  it('interprets a GPS track into a route draft with elevation totals', () => {
    const draft = gpsTrackToRouteDraft(
      track([point(51.5, -0.1, 10), point(51.51, -0.1, 30), point(51.52, -0.1, 15)]),
      'My Import',
    );

    expect(draft.name).toBe('My Import');
    expect(draft.routePath).toHaveLength(3);
    expect(draft.distanceKm).toBeGreaterThan(0);
    expect(draft.elevationProfile).toHaveLength(3);
    expect(draft.elevationGainM).toBe(20); // 10 -> 30
    expect(draft.elevationLossM).toBe(15); // 30 -> 15
    expect(draft.elevationProfile[0].distanceKm).toBe(0);
  });

  it('reduces a dense track to a sparse waypoint set while keeping the full path', () => {
    const dense = Array.from({ length: 60 }, (_, i) => point(51.5 + i * 0.001, -0.1, 10 + i));
    const draft = gpsTrackToRouteDraft(track(dense));

    expect(draft.routePath).toHaveLength(60);
    expect(draft.waypoints.length).toBeLessThanOrEqual(12);
    // First and last points are preserved as waypoints.
    expect(draft.waypoints[0]).toEqual([dense[0].lat, dense[0].lng]);
    expect(draft.waypoints[draft.waypoints.length - 1]).toEqual([dense[59].lat, dense[59].lng]);
  });

  it('falls back to the default name and a computed distance', () => {
    const draft = gpsTrackToRouteDraft(track([point(0, 0, 0), point(0, 0.01, 5)]));
    expect(draft.name).toBe('Imported Route');
    expect(draft.distanceKm).toBeGreaterThan(0);
  });
});
