import { describe, expect, it } from 'vitest';
import { viewStore } from '@data/projections/views';
import type { Id } from '@shared/types';
import type { ActivitiesState } from '@features/training_log/contract';
import { handleStartSessionFromTemplate } from '@features/training_log';
import {
  handleCreateTemplate,
  handleDeleteTemplate,
  handleDuplicateTemplate,
  handleSetTemplateFavorite,
} from './handlers';
import type { WorkoutTemplate } from '../domain/types';

describe('template commands', () => {
  it('creates, favorites, duplicates, and deletes templates', async () => {
    const created = await handleCreateTemplate({
      type: 'CreateTemplate',
      name: 'Pull Day',
      primarySport: 'strength',
      exercises: [{ name: 'Row', category: 'strength', targetSets: 3 }],
    });
    expect(created.ok).toBe(true);
    const templateId = created.value!.templateId;

    await handleSetTemplateFavorite({ type: 'SetTemplateFavorite', templateId, favorite: true });
    const templates = viewStore.get<WorkoutTemplate[]>('template_list') ?? [];
    expect(templates[0]).toEqual(expect.objectContaining({ id: templateId, favorite: true }));

    const duplicated = await handleDuplicateTemplate({ type: 'DuplicateTemplate', templateId });
    expect(duplicated.ok).toBe(true);
    const afterDuplicate = viewStore.get<WorkoutTemplate[]>('template_list') ?? [];
    expect(afterDuplicate).toHaveLength(2);
    const copy = afterDuplicate.find(template => template.id === duplicated.value!.templateId);
    expect(copy?.exercises[0].id).not.toBe(templates[0].exercises[0].id);

    await handleDeleteTemplate({ type: 'DeleteTemplate', templateId });
    const afterDelete = viewStore.get<WorkoutTemplate[]>('template_list') ?? [];
    expect(afterDelete.some(template => template.id === templateId)).toBe(false);
  });

  it('starts a session from template exercises in one command', async () => {
    const result = await handleStartSessionFromTemplate({
      type: 'StartSessionFromTemplate',
      userId: 'user-template' as Id<'User'>,
      name: 'Push Day',
      primarySport: 'strength',
      exercises: [
        { id: 'ex-1', name: 'Bench Press', category: 'strength', order: 0 },
        { id: 'ex-2', name: 'Overhead Press', category: 'strength', order: 1 },
      ],
    });

    expect(result.ok).toBe(true);
    const sessions = viewStore.get<ActivitiesState>('sessions');
    const session = sessions?.byId[result.value!.sessionId];
    expect(session?.name).toBe('Push Day');
    expect(session?.segments.map(segment => segment.exerciseName)).toEqual(['Bench Press', 'Overhead Press']);
  });
});
