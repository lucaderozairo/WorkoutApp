export type {
  NutritionCategory,
  NutritionEntry,
  NutritionState,
  NutritionEvent,
  NutritionLoggedPayload,
  NutritionEntryDeletedPayload,
  NutritionCommand,
  LogNutrition,
  DeleteNutritionEntry,
} from './domain/types';

export type { NutritionEntryView } from './projections';

export { nutritionLogProjection } from './projections';

export {
  handleLogNutrition,
  handleDeleteNutritionEntry,
} from './commands/handlers';

export {
  getNutritionLog,
  getTodaysNutrition,
} from './queries';
