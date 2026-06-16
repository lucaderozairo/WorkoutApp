import type { TemplateEvent, TemplateState, WorkoutTemplateExercise } from './types';

export const initialTemplateState: TemplateState = {
  byId: {},
  order: [],
};

function sortExercises(exercises: WorkoutTemplateExercise[]): WorkoutTemplateExercise[] {
  return [...exercises].sort((a, b) => a.order - b.order);
}

function updateTemplate(
  state: TemplateState,
  templateId: string,
  updater: (template: TemplateState['byId'][string]) => TemplateState['byId'][string],
): TemplateState {
  const template = state.byId[templateId];
  if (!template) return state;
  return {
    ...state,
    byId: {
      ...state.byId,
      [templateId]: updater(template),
    },
  };
}

export const templateReducers = {
  TemplateCreated: (state: TemplateState, event: Extract<TemplateEvent, { type: 'TemplateCreated' }>): TemplateState => ({
    byId: {
      ...state.byId,
      [event.payload.template.id]: event.payload.template,
    },
    order: [event.payload.template.id, ...state.order.filter(id => id !== event.payload.template.id)],
  }),

  TemplateRenamed: (state: TemplateState, event: Extract<TemplateEvent, { type: 'TemplateRenamed' }>): TemplateState =>
    updateTemplate(state, event.payload.templateId, template => ({
      ...template,
      name: event.payload.name,
      updatedAt: event.payload.updatedAt,
    })),

  TemplateDuplicated: (state: TemplateState, event: Extract<TemplateEvent, { type: 'TemplateDuplicated' }>): TemplateState => ({
    byId: {
      ...state.byId,
      [event.payload.template.id]: event.payload.template,
    },
    order: [event.payload.template.id, ...state.order],
  }),

  TemplateDeleted: (state: TemplateState, event: Extract<TemplateEvent, { type: 'TemplateDeleted' }>): TemplateState =>
    updateTemplate(state, event.payload.templateId, template => ({
      ...template,
      deletedAt: event.payload.deletedAt,
      updatedAt: event.payload.deletedAt,
    })),

  TemplateFavoriteChanged: (state: TemplateState, event: Extract<TemplateEvent, { type: 'TemplateFavoriteChanged' }>): TemplateState =>
    updateTemplate(state, event.payload.templateId, template => ({
      ...template,
      favorite: event.payload.favorite,
      updatedAt: event.payload.updatedAt,
    })),

  TemplateExerciseAdded: (state: TemplateState, event: Extract<TemplateEvent, { type: 'TemplateExerciseAdded' }>): TemplateState =>
    updateTemplate(state, event.payload.templateId, template => ({
      ...template,
      exercises: sortExercises([...template.exercises, event.payload.exercise]),
      updatedAt: event.payload.updatedAt,
    })),

  TemplateExerciseUpdated: (state: TemplateState, event: Extract<TemplateEvent, { type: 'TemplateExerciseUpdated' }>): TemplateState =>
    updateTemplate(state, event.payload.templateId, template => ({
      ...template,
      exercises: sortExercises(template.exercises.map(exercise =>
        exercise.id === event.payload.exerciseId
          ? { ...exercise, ...event.payload.patch }
          : exercise
      )),
      updatedAt: event.payload.updatedAt,
    })),

  TemplateExerciseRemoved: (state: TemplateState, event: Extract<TemplateEvent, { type: 'TemplateExerciseRemoved' }>): TemplateState =>
    updateTemplate(state, event.payload.templateId, template => ({
      ...template,
      exercises: template.exercises
        .filter(exercise => exercise.id !== event.payload.exerciseId)
        .map((exercise, order) => ({ ...exercise, order })),
      updatedAt: event.payload.updatedAt,
    })),

  TemplateExercisesReordered: (state: TemplateState, event: Extract<TemplateEvent, { type: 'TemplateExercisesReordered' }>): TemplateState =>
    updateTemplate(state, event.payload.templateId, template => {
      const byId = new Map(template.exercises.map(exercise => [exercise.id, exercise]));
      const reordered = event.payload.exerciseIds
        .map((id, order) => {
          const exercise = byId.get(id);
          return exercise ? { ...exercise, order } : null;
        })
        .filter((exercise): exercise is WorkoutTemplateExercise => exercise !== null);
      return {
        ...template,
        exercises: reordered,
        updatedAt: event.payload.updatedAt,
      };
    }),
};

export function reduceTemplateState(
  state: TemplateState,
  event: TemplateEvent,
): TemplateState {
  const reducer = templateReducers[event.type as keyof typeof templateReducers];
  if (!reducer) return state;
  return reducer(state, event as never);
}

export function getVisibleTemplates(state: TemplateState) {
  return state.order
    .map(id => state.byId[id])
    .filter(template => template && !template.deletedAt)
    .sort((a, b) => Number(b.favorite) - Number(a.favorite) || b.updatedAt - a.updatedAt);
}
