import type { DistanceMarker } from './types';

export function formatPace(secPerKm: number): string {
  const totalSec = Math.round(secPerKm);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function parsePace(str: string): number {
  const parts = str.split(':');
  const m = parseInt(parts[0] ?? '0', 10) || 0;
  const s = Math.min(parseInt(parts[1] ?? '0', 10) || 0, 59);
  return m * 60 + s;
}

export function buildMarkers(
  distanceKm: number,
  paceSecPerKm: number,
  intervalKm: number,
): DistanceMarker[] {
  const markers: DistanceMarker[] = [];
  const count = Math.floor(distanceKm / intervalKm);
  for (let i = 1; i <= count; i++) {
    const km = Math.round(i * intervalKm * 1000) / 1000;
    const totalSec = Math.round(km * paceSecPerKm);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    markers.push({ distanceKm: km, cumulativeTime: `${mins}:${String(secs).padStart(2, '0')}` });
  }
  // Add final marker if total distance is not a round multiple of interval
  if (count * intervalKm < distanceKm - 0.001) {
    const km = distanceKm;
    const totalSec = Math.round(km * paceSecPerKm);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    markers.push({ distanceKm: km, cumulativeTime: `${mins}:${String(secs).padStart(2, '0')}` });
  }
  return markers;
}
