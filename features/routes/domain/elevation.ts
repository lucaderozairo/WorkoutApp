import { distanceMeters, type LatLng } from '@shared/geo';
import type { ElevationSample } from './types';

export interface ElevationTotals {
  gainM: number;
  lossM: number;
}

export function gradeBetween(a: LatLng, b: LatLng, elevationDeltaM: number): number {
  const meters = distanceMeters(a, b);
  if (meters <= 0) return 0;
  return Math.round((elevationDeltaM / meters) * 1000) / 10;
}

export function summarizeElevation(samples: ElevationSample[]): ElevationTotals {
  let gainM = 0;
  let lossM = 0;
  for (let i = 1; i < samples.length; i++) {
    const diff = samples[i].elevationM - samples[i - 1].elevationM;
    if (diff > 0) gainM += diff;
    else lossM += Math.abs(diff);
  }
  return {
    gainM: Math.round(gainM),
    lossM: Math.round(lossM),
  };
}

export function applyGrades(path: LatLng[], elevationsM: number[]): ElevationSample[] {
  let distanceKm = 0;
  return elevationsM.map((elevationM, index) => {
    if (index > 0) {
      distanceKm += distanceMeters(path[index - 1], path[index]) / 1000;
    }
    const previousElevation = elevationsM[index - 1] ?? elevationM;
    return {
      distanceKm: Math.round(distanceKm * 1000) / 1000,
      elevationM,
      grade: index === 0 ? 0 : gradeBetween(path[index - 1], path[index], elevationM - previousElevation),
    };
  });
}
