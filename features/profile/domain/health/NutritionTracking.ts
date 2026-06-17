// Re-exports nutrition types needed by the profile health domain.
// Import from contract only — never from @features/nutrition barrel.
export type { NutritionCategory, NutritionEntry, NutritionEntryView } from '@features/nutrition/contract';
