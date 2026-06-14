import { afterEach, describe, expect, it, vi } from 'vitest';
import { osrmProfile, routePath } from './routing';

describe('geo routing source', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('maps route preferences to the best available OSRM profile', () => {
    expect(osrmProfile('foot', 'balanced')).toBe('foot');
    expect(osrmProfile('bike', 'prefer_cycleways')).toBe('bike');
  });

  it('returns routed path when OSRM responds', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        routes: [{
          distance: 1234,
          geometry: { coordinates: [[-0.1, 51.5], [-0.11, 51.51]] },
        }],
      }),
    }));

    await expect(routePath({
      waypoints: [[51.5, -0.1], [51.51, -0.11]],
      profile: 'foot',
    })).resolves.toEqual({
      path: [[51.5, -0.1], [51.51, -0.11]],
      distanceKm: 1.23,
      status: 'routed',
    });
  });

  it('falls back to straight-line routing on failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const result = await routePath({
      waypoints: [[51.5, -0.1], [51.51, -0.11]],
      profile: 'foot',
    });
    expect(result.status).toBe('straight_line');
    expect(result.path).toEqual([[51.5, -0.1], [51.51, -0.11]]);
    expect(result.distanceKm).toBeGreaterThan(0);
  });
});
