export type {
  AddTemplateExercise,
  CreateTemplate,
  DeleteTemplate,
  DuplicateTemplate,
  RecentRoutine,
  RenameTemplate,
  ReorderTemplateExercises,
  SetTemplateFavorite,
  TemplateCommand,
  TemplateEvent,
  TemplateState,
  UpdateTemplateExercise,
  WorkoutTemplate,
  WorkoutTemplateExercise,
} from './domain/types';

export {
  getFavoriteTemplates,
  getRecentRoutines,
  getTemplate,
  getTemplates,
} from './queries';

export {
  favoriteTemplatesProjection,
  templateListProjection,
  templateStateProjection,
} from './projections';

export {
  handleAddTemplateExercise,
  handleCreateTemplate,
  handleDeleteTemplate,
  handleDuplicateTemplate,
  handleRemoveTemplateExercise,
  handleRenameTemplate,
  handleReorderTemplateExercises,
  handleSetTemplateFavorite,
  handleUpdateTemplateExercise,
} from './commands/handlers';
