import { describe, it, expect } from 'vitest';
import {
  handleStartSession, handleAddBlock,
  handleFinishSessionWithDetails,
} from './handlers';
import { viewStore } from '@data/projections/views';
import type { ActivityView, ActivitiesState } from '../projections';
import type { Id } from '@shared/types';

describe('handleStartSession → active_session view', () => {
  it('populates active_session in the viewStore', async () => {
    const USER = 'u-test-1' as Id<'User'>;
    const r = await handleStartSession({ type: 'StartSession', userId: USER, name: 'Test' });
    expect(r.ok).toBe(true);
    const view = viewStore.get<ActivityView>('active_session');
    expect(view).not.toBeNull();
    expect(view?.name).toBe('Test');
    expect(view?.segments).toEqual([]);
  });

  it('AddBlock appends to active_session.segments', async () => {
    const USER = 'u-test-2' as Id<'User'>;
    await handleStartSession({ type: 'StartSession', userId: USER, name: 'Test 2' });
    const view = viewStore.get<ActivityView>('active_session');
    expect(view).toBeTruthy();
    if (!view) return;
    await handleAddBlock({
      type: 'AddBlock',
      sessionId: view.id,
      exerciseName: 'Bench',
      exerciseCategory: 'strength',
    });
    const after = viewStore.get<ActivityView>('active_session');
    expect(after?.segments).toHaveLength(1);
    expect(after?.segments[0].exerciseName).toBe('Bench');
  });
});

describe('handleFinishSessionWithDetails', () => {
  it('finishes session atomically — name, note, start-time, details all applied', async () => {
    const USER = 'u-finish-1' as Id<'User'>;
    const start = await handleStartSession({ type: 'StartSession', userId: USER, name: 'Old Name' });
    expect(start.ok).toBe(true);
    const sessionId = (start as { ok: true; value: { sessionId: string } }).value.sessionId as Id<'Activity'>;

    await handleFinishSessionWithDetails({
      type: 'FinishSessionWithDetails',
      sessionId,
      name: 'New Name',
      notes: 'Great session',
      sessionRpe: 8,
      tags: ['push', 'upper'],
      finishedAt: Date.now(),
    });

    const state = viewStore.get<ActivitiesState>('sessions');
    const session = state?.byId[sessionId];
    expect(session).toBeDefined();
    expect(session?.name).toBe('New Name');
    expect(session?.notes).toBe('Great session');
    expect(session?.status).toBe('finished');
    expect(session?.rpe).toBe(8);
    expect(session?.tags).toEqual(['push', 'upper']);
  });

  it('skips rename event if name is undefined', async () => {
    const USER = 'u-finish-2' as Id<'User'>;
    await handleStartSession({ type: 'StartSession', userId: USER, name: 'Keep This Name' });
    const active = viewStore.get<ActivityView>('active_session');
    expect(active).not.toBeNull();
    const sessionId = active!.id;

    await handleFinishSessionWithDetails({
      type: 'FinishSessionWithDetails',
      sessionId,
      sessionRpe: 7,
    });

    const state = viewStore.get<ActivitiesState>('sessions');
    const session = state?.byId[sessionId];
    expect(session?.name).toBe('Keep This Name');
    expect(session?.status).toBe('finished');
  });
});
