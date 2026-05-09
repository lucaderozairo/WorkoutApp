import type { Id, DomainEvent } from '@shared/types';

// ─── Value Types ─────────────────────────────────────────────

export type NutritionCategory = 'meal' | 'snack' | 'vitamin' | 'supplement' | 'medication' | 'water';

export interface NutritionEntry {
  id: Id<'NutritionEntry'>;
  userId: Id<'User'>;
  category: NutritionCategory;
  name: string;
  notes: string;
  time: string;        // HH:MM
  macros: {
    kcal: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    fiberG?: number;
    sugarG?: number;
    sodiumMg?: number;
    cholesterolMg?: number;
  } | null;
  loggedAt: number;
}

export interface NutritionState {
  entries: NutritionEntry[];
}

// ─── Events ──────────────────────────────────────────────────

export type NutritionEvent =
  | DomainEvent<'NutritionLogged', NutritionLoggedPayload>
  | DomainEvent<'NutritionEntryDeleted', NutritionEntryDeletedPayload>;

export interface NutritionLoggedPayload {
  entryId: Id<'NutritionEntry'>;
  userId: Id<'User'>;
  category: NutritionCategory;
  name: string;
  notes: string;
  time: string;
  macros: {
    kcal: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    fiberG?: number;
    sugarG?: number;
    sodiumMg?: number;
    cholesterolMg?: number;
  } | null;
}

export interface NutritionEntryDeletedPayload {
  entryId: Id<'NutritionEntry'>;
}

// ─── Commands ────────────────────────────────────────────────

export interface LogNutrition {
  type: 'LogNutrition';
  userId: Id<'User'>;
  entry: {
    category: NutritionCategory;
    name: string;
    notes: string;
    time: string;
    macros: {
    kcal: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    fiberG?: number;
    sugarG?: number;
    sodiumMg?: number;
    cholesterolMg?: number;
  } | null;
  };
}

export interface DeleteNutritionEntry {
  type: 'DeleteNutritionEntry';
  entryId: Id<'NutritionEntry'>;
}

export type NutritionCommand = LogNutrition | DeleteNutritionEntry;
