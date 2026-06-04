import type { ActivityView, ActivityHistoryItem } from '@features/training_log/contract';
import type { CardioSession } from '@features/cardio/contract';
import type { SetEntry, StrengthSet } from '@features/training_log/contract';

/** A seeded/sample cardio session used by mock data and previews. */
export interface SampleCardioSession {
  id: string;
  sport: string;
  title: string;
  distanceMeters: number;
  durationSeconds: number;
  avgPacePerKm: number;
  heartRate?: number;
  elevationGain?: number;
  power?: number;
  createdAt: number;
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

export function formatPace(secondsPerKm: number): string {
  if (secondsPerKm <= 0) return '--:--';
  const m = Math.floor(secondsPerKm / 60);
  const s = Math.floor(secondsPerKm % 60);
  return `${m}:${String(s).padStart(2, '0')}/km`;
}

export function sportColor(sport: string): string {
  switch (sport) {
    case 'run': return 'run';
    case 'cycle': return 'cycle';
    case 'swim': return 'swim';
    case 'row': return 'rowing';
    default: return 'lift';
  }
}

// ── Session-shape discriminators ──

export function isActivityHistoryItem(s: unknown): s is ActivityHistoryItem {
  return typeof (s as ActivityHistoryItem).totalSets === 'number';
}

export function isCardioSession(s: unknown): s is CardioSession {
  const obj = s as Record<string, unknown>;
  return typeof obj.sport === 'string' && 'distanceMeters' in obj && 'userId' in obj;
}

export function isSampleCardioSession(s: unknown): s is SampleCardioSession {
  const obj = s as Record<string, unknown>;
  return typeof obj.sport === 'string' && 'distanceMeters' in obj && 'createdAt' in obj;
}

export function isActivityView(s: unknown): s is ActivityView {
  return Array.isArray((s as ActivityView).segments);
}

export function isStrengthSet(s: SetEntry): s is StrengthSet {
  return s.weightKg !== undefined || s.reps !== undefined;
}
