import type { GpsTrack } from './gps';
import type { CardioSport } from '@features/cardio/domain/types';

export interface PartialCardioSession {
  sport?: CardioSport;
  durationSeconds?: number;
  distanceMeters?: number;
  notes?: string;
  rpe?: number;
  gpsTrack?: GpsTrack;
}

export interface MergedCardioSession {
  sport?: CardioSport;
  durationSeconds: number;
  distanceMeters: number;
  notes?: string;
  rpe?: number;
  gpsTrack: GpsTrack;
}

/**
 * D-merge: file wins for sensor data, session wins for subjective fields.
 * Sensor fields: durationSeconds, distanceMeters, gpsTrack
 * Subjective fields: sport, notes, rpe
 */
export function mergeSessionWithTrack(
  session: PartialCardioSession,
  track: GpsTrack,
): MergedCardioSession {
  return {
    // Subjective — session wins (keep undefined if not set)
    sport: session.sport,
    notes: session.notes,
    rpe: session.rpe,
    // Sensor — file wins
    durationSeconds: track.duration,
    distanceMeters: track.totalDistance,
    gpsTrack: track,
  };
}
