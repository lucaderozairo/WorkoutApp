import type { Id } from '@shared/types';
import type { NutritionEvent, NutritionLoggedPayload, NutritionEntryDeletedPayload } from './types';

export interface NutritionEntryView {
  id: Id<'NutritionEntry'>;
  category: string;
  name: string;
  notes: string;
  time: string;
  macros: { kcal: number; proteinG: number; carbsG: number; fatG: number } | null;
  loggedAt: number;
}

export function applyNutritionLogged(state: NutritionEntryView[], event: NutritionEvent): NutritionEntryView[] {
  if (event.type !== 'NutritionLogged') return state;
  const p = event.payload as NutritionLoggedPayload;
  const entry: NutritionEntryView = {
    id: p.entryId,
    category: p.category,
    name: p.name,
    notes: p.notes,
    time: p.time,
    macros: p.macros,
    loggedAt: event.timestamp,
  };
  return [entry, ...state];
}

export function applyNutritionEntryDeleted(state: NutritionEntryView[], event: NutritionEvent): NutritionEntryView[] {
  if (event.type !== 'NutritionEntryDeleted') return state;
  return state.filter(e => e.id !== event.payload.entryId);
}
