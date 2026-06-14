import type { LatLng } from '@shared/geo';
import type { SurfaceSegment } from '@shared/contracts';

export interface TerrainSource {
  surfaceForPath(path: LatLng[], signal?: AbortSignal): Promise<SurfaceSegment[]>;
}

const cache = new Map<string, SurfaceSegment[]>();

export const overpassTerrainSource: TerrainSource = {
  async surfaceForPath(path, signal) {
    if (path.length < 2) return [];
    const key = path.map(([lat, lng]) => `${lat.toFixed(3)},${lng.toFixed(3)}`).join('|');
    const cached = cache.get(key);
    if (cached) return cached;

    try {
      const [south, west, north, east] = bounds(path);
      const query = `[out:json][timeout:12];way["surface"](${south},${west},${north},${east});out tags geom;`;
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query,
        signal,
      });
      if (!response.ok) return [];
      const json = await response.json() as { elements?: Array<{ tags?: { surface?: string } }> };
      const surfaces = (json.elements ?? []).map(element => normalizeSurface(element.tags?.surface));
      const dominant = surfaces[0] ?? 'unknown';
      const segments: SurfaceSegment[] = [{ fromKm: 0, toKm: Number.POSITIVE_INFINITY, surface: dominant }];
      cache.set(key, segments);
      return segments;
    } catch {
      return [];
    }
  },
};

function bounds(path: LatLng[]): [number, number, number, number] {
  const lats = path.map(([lat]) => lat);
  const lngs = path.map(([, lng]) => lng);
  return [
    Math.min(...lats) - 0.01,
    Math.min(...lngs) - 0.01,
    Math.max(...lats) + 0.01,
    Math.max(...lngs) + 0.01,
  ];
}

function normalizeSurface(surface?: string): SurfaceSegment['surface'] {
  if (!surface) return 'unknown';
  if (/asphalt|paved|concrete|sett|paving/.test(surface)) return 'paved';
  if (/gravel|fine_gravel|pebble/.test(surface)) return 'gravel';
  if (/ground|dirt|earth|mud|sand|unpaved/.test(surface)) return 'unpaved';
  if (/grass|wood|trail/.test(surface)) return 'trail';
  return 'unknown';
}
