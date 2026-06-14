import { pathDistanceKm } from '@shared/geo';
import type { GpsTrack } from '@data/sources/files/gps';
import type { ElevationSample } from './types';
import { summarizeElevation } from './elevation';

export interface RouteDraftFromGps {
  name: string;
  waypoints: [number, number][];
  routePath: [number, number][];
  distanceKm: number;
  elevationProfile: ElevationSample[];
  elevationGainM: number;
  elevationLossM: number;
}

export function gpsTrackToRouteDraft(track: GpsTrack, name = 'Imported Route'): RouteDraftFromGps {
  const routePath = track.points.map(point => [point.lat, point.lng] as [number, number]);
  // track.totalDistance is in metres; pathDistanceKm already returns kilometres.
  const distanceKm = track.totalDistance
    ? Math.round((track.totalDistance / 1000) * 100) / 100
    : pathDistanceKm(routePath);
  let cumulativeKm = 0;
  const elevationProfile = track.points.map((point, index): ElevationSample => {
    if (index > 0) {
      cumulativeKm += pathDistanceKm([
        [track.points[index - 1].lat, track.points[index - 1].lng],
        [point.lat, point.lng],
      ]);
    }
    return {
      distanceKm: Math.round(cumulativeKm * 1000) / 1000,
      elevationM: point.elevation,
      grade: point.grade ?? 0,
    };
  });
  const totals = summarizeElevation(elevationProfile);

  return {
    name,
    waypoints: reduceToWaypoints(routePath),
    routePath,
    distanceKm,
    elevationProfile,
    elevationGainM: totals.gainM,
    elevationLossM: totals.lossM,
  };
}

function reduceToWaypoints(path: [number, number][]): [number, number][] {
  if (path.length <= 12) return path;
  const step = Math.max(1, Math.floor(path.length / 10));
  const sampled = path.filter((_, index) => index === 0 || index === path.length - 1 || index % step === 0);
  return sampled[sampled.length - 1] === path[path.length - 1]
    ? sampled
    : [...sampled, path[path.length - 1]];
}
