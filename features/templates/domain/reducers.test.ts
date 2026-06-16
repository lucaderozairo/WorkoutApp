import { describe, expect, it } from 'vitest';
import type { TemplateEvent, TemplateState, WorkoutTemplate } from './types';
import { getVisibleTemplates, initialTemplateState, reduceTemplateState } from './reducers';

const template: WorkoutTemplate = {
  id: 'template-1',
  name: 'Push Day',
  primarySport: 'strength',
  favorite: false,
  createdAt: 1000,
  updatedAt: 1000,
  exercises: [
    { id: 'ex-1', name: 'Bench Press', category: 'strength', order: 0, targetSets: 3 },
    { id: 'ex-2', name: 'Overhead Press', category: 'strength', order: 1, targetSets: 3 },
  ],
};

function fold(events: TemplateEvent[]): TemplateState {
  return events.reduce(reduceTemplateState, initialTemplateState);
}

describe('template reducers', () => {
  it('creates, favorites, and sorts visible templates', () => {
    const state = fold([
      {
        type: 'TemplateCreated',
        aggregateId: 'template-1' as never,
        aggregateType: 'Template',
        timestamp: 1000,
        version: 1,
        payload: { template },
      },
      {
        type: 'TemplateFavoriteChanged',
        aggregateId: 'template-1' as never,
        aggregateType: 'Template',
        timestamp: 1100,
        version: 1,
        payload: { templateId: 'template-1', favorite: true, updatedAt: 1100 },
      },
    ]);

    expect(getVisibleTemplates(state)).toEqual([
      expect.objectContaining({ id: 'template-1', favorite: true }),
    ]);
  });

  it('duplicates with new identity and preserves exercise order', () => {
    const copy: WorkoutTemplate = {
      ...template,
      id: 'template-2',
      name: 'Push Day Copy',
      createdAt: 1200,
      updatedAt: 1200,
      exercises: template.exercises.map(exercise => ({ ...exercise, id: `${exercise.id}-copy` })),
    };
    const state = fold([
      {
        type: 'TemplateCreated',
        aggregateId: 'template-1' as never,
        aggregateType: 'Template',
        timestamp: 1000,
        version: 1,
        payload: { template },
      },
      {
        type: 'TemplateDuplicated',
        aggregateId: 'template-2' as never,
        aggregateType: 'Template',
        timestamp: 1200,
        version: 1,
        payload: { sourceTemplateId: 'template-1', template: copy },
      },
    ]);

    expect(state.byId['template-2'].exercises.map(exercise => exercise.order)).toEqual([0, 1]);
    expect(state.byId['template-2'].exercises[0].id).not.toBe(template.exercises[0].id);
  });

  it('hides deleted templates and reorders exercises', () => {
    const state = fold([
      {
        type: 'TemplateCreated',
        aggregateId: 'template-1' as never,
        aggregateType: 'Template',
        timestamp: 1000,
        version: 1,
        payload: { template },
      },
      {
        type: 'TemplateExercisesReordered',
        aggregateId: 'template-1' as never,
        aggregateType: 'Template',
        timestamp: 1100,
        version: 1,
        payload: { templateId: 'template-1', exerciseIds: ['ex-2', 'ex-1'], updatedAt: 1100 },
      },
      {
        type: 'TemplateDeleted',
        aggregateId: 'template-1' as never,
        aggregateType: 'Template',
        timestamp: 1200,
        version: 1,
        payload: { templateId: 'template-1', deletedAt: 1200 },
      },
    ]);

    expect(state.byId['template-1'].exercises.map(exercise => exercise.id)).toEqual(['ex-2', 'ex-1']);
    expect(getVisibleTemplates(state)).toEqual([]);
  });
});
