// Public contract for the nutrition feature.

// Domain events this feature publishes.
export type {
  NutritionEvent,
  NutritionLoggedPayload,
  NutritionEntryDeletedPayload,
} from './domain/types';

// Commands this feature accepts.
export type {
  NutritionCommand,
  LogNutrition,
  DeleteNutritionEntry,
} from './domain/types';

// Domain types consumed by UI, screens and data sources.
export type { NutritionCategory, NutritionEntry } from './domain/types';

// Projection / view-model types consumed by data/mock and screens.
export type { NutritionEntryView } from './projections';
