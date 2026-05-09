import { computeTrackStats } from '@data/sources/files/gps';
import type { GpsTrack, GpsPoint } from '@data/sources/files/gps';

export type CardioSport = 'run' | 'cycle' | 'swim' | 'row' | 'hike' | 'ski';

export interface MockRunOptions {
  date: Date;
  sport?: CardioSport;
  durationMin: number;
  distanceKm: number;
  avgHr?: number;
}

const POINT_INTERVAL_SEC = 5;

export function generateMockRun({
  date,
  sport = 'run',
  durationMin,
  distanceKm,
  avgHr = 155,
}: MockRunOptions): GpsTrack {
  const totalSeconds = durationMin * 60;
  const pointCount = Math.floor(totalSeconds / POINT_INTERVAL_SEC);
  const targetSpeedMs = (distanceKm * 1000) / totalSeconds;

  const baseLat = 51.429;
  const baseLng = -0.315;
  const radiusM = (distanceKm * 1000) / (2 * Math.PI);
  const metersPerDegreeLat = 111_320;
  const metersPerDegreeLng = metersPerDegreeLat * Math.cos((baseLat * Math.PI) / 180);

  const points: GpsPoint[] = [];

  for (let i = 0; i < pointCount; i++) {
    const t = i / pointCount;
    const elapsed = i * POINT_INTERVAL_SEC;
    const ts = new Date(date.getTime() + elapsed * 1000);

    let hr: number;
    if (t < 0.15) {
      hr = (avgHr - 30) + 30 * (t / 0.15);
    } else if (t < 0.85) {
      hr = avgHr + Math.sin(t * 37) * 5;
    } else {
      hr = avgHr - 25 * ((t - 0.85) / 0.15);
    }

    const angle = t * 2 * Math.PI;
    const lat = baseLat + (radiusM * Math.cos(angle)) / metersPerDegreeLat;
    const lng = baseLng + (radiusM * Math.sin(angle)) / metersPerDegreeLng;
    const elevation = 8 + 4 * Math.sin(t * 6 * Math.PI);
    const speed = targetSpeedMs * (0.95 + Math.abs(Math.sin(t * 53)) * 0.1);
    const cadence =
      sport === 'run'
        ? 168 + Math.floor(Math.abs(Math.sin(t * 71)) * 10)
        : 80  + Math.floor(Math.abs(Math.sin(t * 71)) * 20);
    const power =
      sport === 'run'
        ? Math.round(210 + Math.abs(Math.sin(t * 41)) * 50)
        : undefined;

    points.push({
      lat,
      lng,
      elevation,
      heartRate: Math.round(Math.max(100, Math.min(200, hr))),
      cadence,
      speed,
      ...(power != null ? { power } : {}),
      timestamp: ts.toISOString(),
    });
  }

  const stats = computeTrackStats(points);
  return {
    ...stats,
    points,
    sport,
    duration: totalSeconds,
    calories: Math.round(durationMin * (sport === 'run' ? 11 : 8)),
  };
}
