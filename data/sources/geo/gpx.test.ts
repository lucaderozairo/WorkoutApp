import { describe, expect, it } from 'vitest';
import { exportRouteGpx, parseGpx } from './gpx';

describe('geo GPX source', () => {
  it('exports a saved route and parses it back', () => {
    const xml = exportRouteGpx({
      name: 'GPX Loop',
      waypoints: [[51.5, -0.1], [51.51, -0.11]],
      routePath: [[51.5, -0.1], [51.51, -0.11]],
      elevationProfile: [
        { distanceKm: 0, elevationM: 10, grade: 0 },
        { distanceKm: 1.2, elevationM: 20, grade: 1 },
      ],
    });
    const parsed = parseGpx(xml);
    expect(parsed.points).toHaveLength(2);
    expect(parsed.points[0]).toEqual(expect.objectContaining({ lat: 51.5, lng: -0.1, elevation: 10 }));
  });
});
