import type { Id } from '@shared/types';
import type { NutritionEntryView } from '../projections';
import { viewStore } from '@data/projections/views';

// ─── Queries ─────────────────────────────────────────────────

export function getNutritionLog(): NutritionEntryView[] {
  return viewStore.get('nutrition_log') ?? [];
}

export function getTodaysNutrition(): NutritionEntryView[] {
  const entries = viewStore.get('nutrition_log') ?? [];
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return entries.filter(e => e.loggedAt >= startOfDay);
}
