import type { SetEntry, StrengthSet } from './domain/types';
import type { ActivityView, ActivityHistoryItem } from './projections';

/** Structural guard: a live/finished session view (carries a `segments` array). */
export function isActivityView(s: unknown): s is ActivityView {
  return Array.isArray((s as ActivityView).segments);
}

/** Structural guard: a history-list row (carries a numeric `totalSets`). */
export function isActivityHistoryItem(s: unknown): s is ActivityHistoryItem {
  return typeof (s as ActivityHistoryItem).totalSets === 'number';
}

/** Discriminates a strength set from a cardio set within a session segment. */
export function isStrengthSet(s: SetEntry): s is StrengthSet {
  return s.weightKg !== undefined || s.reps !== undefined;
}
