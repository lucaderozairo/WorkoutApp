import type { DomainEvent, Id, Result } from '@shared/types';
import { ok, err } from '@shared/types';
import { cryptoIdGenerator } from '@core/id-generator';
import { systemClock } from '@core/clock';
import { defineCommand } from '@data/define-command';
import { viewStore } from '@data/projections/views';
import type {
  AddTemplateExercise,
  CreateTemplate,
  DeleteTemplate,
  DuplicateTemplate,
  RemoveTemplateExercise,
  RenameTemplate,
  ReorderTemplateExercises,
  SetTemplateFavorite,
  TemplateEvent,
  TemplateState,
  UpdateTemplateExercise,
  WorkoutTemplate,
  WorkoutTemplateExercise,
} from '../domain/types';
import {
  favoriteTemplatesProjection,
  templateListProjection,
  templateStateProjection,
} from '../projections';
import { getVisibleTemplates } from '../domain/reducers';

const TEMPLATE_PROJECTIONS = [
  templateStateProjection,
  templateListProjection,
  favoriteTemplatesProjection,
] as const;

function applyTemplateEvents(events: TemplateEvent[]): void {
  for (const event of events) {
    for (const projection of TEMPLATE_PROJECTIONS) {
      projection.apply(event);
    }
  }
  viewStore.set('template_state', templateStateProjection.getState());
  viewStore.set('template_list', templateListProjection.getState());
  viewStore.set('favorite_templates', favoriteTemplatesProjection.getState());
}

function syncTemplateStateFromViewStore(): TemplateState {
  const stored = viewStore.get<TemplateState>('template_state');
  if (stored) templateStateProjection.setState(stored);
  templateListProjection.setState(stored ? getVisibleTemplates(stored) : viewStore.get<WorkoutTemplate[]>('template_list') ?? []);
  favoriteTemplatesProjection.setState(templateListProjection.getState().filter(t => t.favorite));
  return templateStateProjection.getState();
}

function activeTemplates(): WorkoutTemplate[] {
  return getVisibleTemplates(syncTemplateStateFromViewStore());
}

function findTemplate(templateId: string): WorkoutTemplate | null {
  return activeTemplates().find(template => template.id === templateId) ?? null;
}

function exerciseFromInput(
  input: CreateTemplate['exercises'][number] | AddTemplateExercise,
  order: number,
): WorkoutTemplateExercise {
  return {
    id: cryptoIdGenerator.next<'TemplateExercise'>(),
    name: input.name.trim(),
    category: input.category,
    order,
    ...(input.targetSets !== undefined ? { targetSets: input.targetSets } : {}),
    ...(input.targetReps !== undefined ? { targetReps: input.targetReps } : {}),
    ...(input.targetWeightKg !== undefined ? { targetWeightKg: input.targetWeightKg } : {}),
    ...(input.restSeconds !== undefined ? { restSeconds: input.restSeconds } : {}),
    ...(input.notes?.trim() ? { notes: input.notes.trim() } : {}),
  };
}

function commitTemplateEvents(events: TemplateEvent[]): { events: DomainEvent[]; result: Result<void, string> } {
  applyTemplateEvents(events);
  return { events, result: ok(undefined) };
}

function templateAggregateId(templateId: string): Id<'Template'> {
  return templateId as Id<'Template'>;
}

export const handleCreateTemplate = defineCommand<CreateTemplate, Result<{ templateId: string }, string>>({
  execute: async (cmd) => {
    if (!cmd.name.trim()) return { events: [], result: err('Template name is required') };
    const validExercises = cmd.exercises.filter(exercise => exercise.name.trim());
    if (validExercises.length === 0) return { events: [], result: err('Template must have at least one exercise') };

    syncTemplateStateFromViewStore();
    const now = systemClock.now();
    const template: WorkoutTemplate = {
      id: cryptoIdGenerator.next<'Template'>(),
      name: cmd.name.trim(),
      primarySport: cmd.primarySport,
      favorite: false,
      exercises: validExercises.map((exercise, order) => exerciseFromInput(exercise, order)),
      createdAt: now,
      updatedAt: now,
    };
    const event: TemplateEvent = {
      type: 'TemplateCreated',
      aggregateId: templateAggregateId(template.id),
      aggregateType: 'Template',
      timestamp: now,
      version: 1,
      payload: { template },
    };
    applyTemplateEvents([event]);
    return { events: [event], result: ok({ templateId: template.id }) };
  },
});

export const handleRenameTemplate = defineCommand<RenameTemplate, Result<void, string>>({
  execute: async (cmd) => {
    if (!cmd.name.trim()) return { events: [], result: err('Template name is required') };
    if (!findTemplate(cmd.templateId)) return { events: [], result: err('Template not found') };
    const now = systemClock.now();
    return commitTemplateEvents([{
      type: 'TemplateRenamed',
      aggregateId: templateAggregateId(cmd.templateId),
      aggregateType: 'Template',
      timestamp: now,
      version: 1,
      payload: { templateId: cmd.templateId, name: cmd.name.trim(), updatedAt: now },
    }]);
  },
});

export const handleDuplicateTemplate = defineCommand<DuplicateTemplate, Result<{ templateId: string }, string>>({
  execute: async (cmd) => {
    const source = findTemplate(cmd.templateId);
    if (!source) return { events: [], result: err('Template not found') };
    const now = systemClock.now();
    const template: WorkoutTemplate = {
      ...source,
      id: cryptoIdGenerator.next<'Template'>(),
      name: `${source.name} Copy`,
      favorite: false,
      exercises: source.exercises.map(exercise => ({
        ...exercise,
        id: cryptoIdGenerator.next<'TemplateExercise'>(),
      })),
      createdAt: now,
      updatedAt: now,
      deletedAt: undefined,
    };
    const event: TemplateEvent = {
      type: 'TemplateDuplicated',
      aggregateId: templateAggregateId(template.id),
      aggregateType: 'Template',
      timestamp: now,
      version: 1,
      payload: { sourceTemplateId: source.id, template },
    };
    applyTemplateEvents([event]);
    return { events: [event], result: ok({ templateId: template.id }) };
  },
});

export const handleDeleteTemplate = defineCommand<DeleteTemplate, Result<void, string>>({
  execute: async (cmd) => {
    if (!findTemplate(cmd.templateId)) return { events: [], result: err('Template not found') };
    const now = systemClock.now();
    return commitTemplateEvents([{
      type: 'TemplateDeleted',
      aggregateId: templateAggregateId(cmd.templateId),
      aggregateType: 'Template',
      timestamp: now,
      version: 1,
      payload: { templateId: cmd.templateId, deletedAt: now },
    }]);
  },
});

export const handleSetTemplateFavorite = defineCommand<SetTemplateFavorite, Result<void, string>>({
  execute: async (cmd) => {
    if (!findTemplate(cmd.templateId)) return { events: [], result: err('Template not found') };
    const now = systemClock.now();
    return commitTemplateEvents([{
      type: 'TemplateFavoriteChanged',
      aggregateId: templateAggregateId(cmd.templateId),
      aggregateType: 'Template',
      timestamp: now,
      version: 1,
      payload: { templateId: cmd.templateId, favorite: cmd.favorite, updatedAt: now },
    }]);
  },
});

export const handleAddTemplateExercise = defineCommand<AddTemplateExercise, Result<void, string>>({
  execute: async (cmd) => {
    const template = findTemplate(cmd.templateId);
    if (!template) return { events: [], result: err('Template not found') };
    if (!cmd.name.trim()) return { events: [], result: err('Exercise name is required') };
    const now = systemClock.now();
    return commitTemplateEvents([{
      type: 'TemplateExerciseAdded',
      aggregateId: templateAggregateId(cmd.templateId),
      aggregateType: 'Template',
      timestamp: now,
      version: 1,
      payload: {
        templateId: cmd.templateId,
        exercise: exerciseFromInput(cmd, template.exercises.length),
        updatedAt: now,
      },
    }]);
  },
});

export const handleUpdateTemplateExercise = defineCommand<UpdateTemplateExercise, Result<void, string>>({
  execute: async (cmd) => {
    const template = findTemplate(cmd.templateId);
    if (!template) return { events: [], result: err('Template not found') };
    if (!template.exercises.some(exercise => exercise.id === cmd.exerciseId)) {
      return { events: [], result: err('Template exercise not found') };
    }
    const now = systemClock.now();
    return commitTemplateEvents([{
      type: 'TemplateExerciseUpdated',
      aggregateId: templateAggregateId(cmd.templateId),
      aggregateType: 'Template',
      timestamp: now,
      version: 1,
      payload: { templateId: cmd.templateId, exerciseId: cmd.exerciseId, patch: cmd.patch, updatedAt: now },
    }]);
  },
});

export const handleRemoveTemplateExercise = defineCommand<RemoveTemplateExercise, Result<void, string>>({
  execute: async (cmd) => {
    const template = findTemplate(cmd.templateId);
    if (!template) return { events: [], result: err('Template not found') };
    if (!template.exercises.some(exercise => exercise.id === cmd.exerciseId)) {
      return { events: [], result: err('Template exercise not found') };
    }
    const now = systemClock.now();
    return commitTemplateEvents([{
      type: 'TemplateExerciseRemoved',
      aggregateId: templateAggregateId(cmd.templateId),
      aggregateType: 'Template',
      timestamp: now,
      version: 1,
      payload: { templateId: cmd.templateId, exerciseId: cmd.exerciseId, updatedAt: now },
    }]);
  },
});

export const handleReorderTemplateExercises = defineCommand<ReorderTemplateExercises, Result<void, string>>({
  execute: async (cmd) => {
    const template = findTemplate(cmd.templateId);
    if (!template) return { events: [], result: err('Template not found') };
    const knownIds = new Set(template.exercises.map(exercise => exercise.id));
    const validOrder = cmd.exerciseIds.length === template.exercises.length
      && cmd.exerciseIds.every(id => knownIds.has(id));
    if (!validOrder) return { events: [], result: err('Exercise order must include every template exercise') };
    const now = systemClock.now();
    return commitTemplateEvents([{
      type: 'TemplateExercisesReordered',
      aggregateId: templateAggregateId(cmd.templateId),
      aggregateType: 'Template',
      timestamp: now,
      version: 1,
      payload: { templateId: cmd.templateId, exerciseIds: cmd.exerciseIds, updatedAt: now },
    }]);
  },
});
