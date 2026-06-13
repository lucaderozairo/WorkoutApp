import type { ActivityView, ActivityHistoryItem } from '@features/training_log';
import type { CardioSession } from '@features/cardio';
import type { SetEntry, StrengthSet } from '@features/training_log/domain/types';

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
