import type { LatLng } from '@shared/geo';
import { distanceMeters } from '@shared/geo';
import type { ElevationSample } from '@shared/contracts';

export interface ElevationSource {
  sample(path: LatLng[], signal?: AbortSignal): Promise<ElevationSample[]>;
}

const cache = new Map<string, ElevationSample[]>();

export const openMeteoElevationSource: ElevationSource = {
  async sample(path, signal) {
    if (path.length === 0) return [];
    const key = path.map(([lat, lng]) => `${lat.toFixed(4)},${lng.toFixed(4)}`).join('|');
    const cached = cache.get(key);
    if (cached) return cached;

    try {
      const sampledPath = thinPath(path, 100);
      const params = new URLSearchParams({
        latitude: sampledPath.map(([lat]) => lat.toFixed(5)).join(','),
        longitude: sampledPath.map(([, lng]) => lng.toFixed(5)).join(','),
      });
      const response = await fetch(`https://api.open-meteo.com/v1/elevation?${params.toString()}`, { signal });
      if (!response.ok) return [];
      const json = await response.json() as { elevation?: number[] };
      if (!Array.isArray(json.elevation)) return [];
      const samples = applyGrades(sampledPath, json.elevation.map(value => Number(value) || 0));
      cache.set(key, samples);
      return samples;
    } catch {
      return [];
    }
  },
};

function thinPath(path: LatLng[], maxPoints: number): LatLng[] {
  if (path.length <= maxPoints) return path;
  const step = Math.ceil(path.length / maxPoints);
  const sampled = path.filter((_, index) => index === 0 || index === path.length - 1 || index % step === 0);
  return sampled[sampled.length - 1] === path[path.length - 1]
    ? sampled
    : [...sampled, path[path.length - 1]];
}

function applyGrades(path: LatLng[], elevationsM: number[]): ElevationSample[] {
  let distanceKm = 0;
  return elevationsM.map((elevationM, index) => {
    if (index > 0) distanceKm += distanceMeters(path[index - 1], path[index]) / 1000;
    const previousElevation = elevationsM[index - 1] ?? elevationM;
    const meters = index === 0 ? 0 : distanceMeters(path[index - 1], path[index]);
    return {
      distanceKm: Math.round(distanceKm * 1000) / 1000,
      elevationM,
      grade: meters <= 0 ? 0 : Math.round(((elevationM - previousElevation) / meters) * 1000) / 10,
    };
  });
}
