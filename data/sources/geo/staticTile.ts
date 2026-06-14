import type { LatLng } from '@shared/geo';

export interface StaticTilePreview {
  url: string;
  attribution: string;
}

const cache = new Map<string, StaticTilePreview | null>();

export async function staticTileForBounds(path: LatLng[]): Promise<StaticTilePreview | null> {
  if (path.length === 0) return null;
  const key = path.map(([lat, lng]) => `${lat.toFixed(3)},${lng.toFixed(3)}`).join('|');
  if (cache.has(key)) return cache.get(key) ?? null;
  cache.set(key, null);
  return null;
}
