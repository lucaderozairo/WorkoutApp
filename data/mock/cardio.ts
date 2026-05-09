import type { CardioSession } from '@features/cardio';
import type { GpsTrack } from '@data/sources/files/gps';
import type { Id } from '@shared/types';

const d = (iso: string) => new Date(iso).getTime();

function minimalTrack(durationMin: number, distanceKm: number, avgHr: number): GpsTrack {
  return {
    points: [],
    totalDistance: distanceKm * 1000,
    elevationGain: Math.round(distanceKm * 8),
    avgHeartRate: avgHr,
    duration: durationMin * 60,
  };
}

function run(
  id: string, sport: CardioSession['sport'], dateIso: string,
  durationMin: number, distanceKm: number, avgHr?: number,
  notes = '',
): CardioSession {
  return {
    id: id as Id<'CardioSession'>,
    userId: 'user-001' as Id<'User'>,
    sport,
    startedAt: d(dateIso + 'T07:30:00'),
    durationSeconds: durationMin * 60,
    distanceMeters: distanceKm * 1000,
    notes,
    routeId: null,
    ...(avgHr != null ? { gpsTrack: minimalTrack(durationMin, distanceKm, avgHr) } : {}),
  };
}

export const MOCK_CARDIO_SESSIONS: CardioSession[] = [
  run('cs-01', 'run',   '2026-01-08', 32, 5.2,  152, 'Easy morning run'),
  run('cs-02', 'run',   '2026-01-15', 45, 7.4,  160),
  run('cs-03', 'cycle', '2026-01-22', 60, 22.0, 138),
  run('cs-04', 'run',   '2026-01-29', 28, 4.8,  155),
  run('cs-05', 'swim',  '2026-02-05', 40, 1.5,  140),
  run('cs-06', 'run',   '2026-02-10', 50, 8.1,  163, 'Tempo run'),
  run('cs-07', 'cycle', '2026-02-18', 75, 28.5, 142),
  run('cs-08', 'run',   '2026-02-24', 35, 5.9,  157),
  run('cs-09', 'swim',  '2026-03-04', 45, 1.8,  138),
  run('cs-10', 'run',   '2026-03-09', 55, 9.0,  165, 'Long run'),
  run('cs-11', 'cycle', '2026-03-16', 90, 35.0, 145),
  run('cs-12', 'run',   '2026-03-22', 40, 6.5,  158),
];
