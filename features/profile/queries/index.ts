import type { Id } from '@shared/types';
import type { UserProfile, Injury, UnitSystem, BodyweightEntry } from '../domain/types';
import { viewStore } from '@data/projections/views';

// ─── Queries ─────────────────────────────────────────────────

export function getProfile(): { displayName: string; email: string; unitPreference: UnitSystem } | null {
  return viewStore.get('profile') ?? null;
}

export function getActiveInjuries(): Array<{ id: Id<'Injury'>; description: string; bodyPart: string; recordedAt: number }> {
  return viewStore.get('active_injuries') ?? [];
}

export function getPreferences(): { unitPreference: UnitSystem } | null {
  return viewStore.get('preferences') ?? null;
}

export function getBodyweightLog(): BodyweightEntry[] {
  const entries = viewStore.get('bodyweight_log') ?? [];
  return entries.map(e => ({
    id: e.id,
    userId: '' as Id<'User'>,
    weightKg: e.weightKg,
    loggedAt: e.loggedAt,
  }));
}
