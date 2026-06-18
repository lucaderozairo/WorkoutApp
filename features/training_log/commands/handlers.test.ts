import { describe, it, expect } from 'vitest';
import {
  handleStartSession, handleAddBlock,
  handleFinishSessionWithDetails,
  handleFinishOrUpdateSession,
} from './handlers';
import { viewStore } from '@data/projections/views';
import type { ActivityView, ActivitiesState } from '../projections';
import type { Id } from '@shared/types';
import type { PaceTarget } from '@features/planning/domain/types';

describe('handleStartSession → active_session view', () => {
  it('preserves paceTarget on SessionStarted when provided', async () => {
    const USER = 'u-pace-1' as Id<'User'>;
    const paceTarget: PaceTarget = {
      kind: 'segments',
      segments: [
        { fromKm: 0, toKm: 2, paceSecPerKm: 300 },
        { fromKm: 2, toKm: 5, paceSecPerKm: 280 },
      ],
    };
    const r = await handleStartSession({ type: 'StartSession', userId: USER, name: 'Test Run', paceTarget });
    expect(r.ok).toBe(true);
    const view = viewStore.get('active_session');
    expect(view?.paceTarget).toEqual(paceTarget);
  });
  it('populates active_session in the viewStore', async () => {
    const USER = 'u-test-1' as Id<'User'>;
    const r = await handleStartSession({ type: 'StartSession', userId: USER, name: 'Test' });
    expect(r.ok).toBe(true);
    const view = viewStore.get('active_session');
    expect(view).not.toBeNull();
    expect(view?.name).toBe('Test');
    expect(view?.segments).toEqual([]);
  });

  it('AddBlock appends to active_session.segments', async () => {
    const USER = 'u-test-2' as Id<'User'>;
    await handleStartSession({ type: 'StartSession', userId: USER, name: 'Test 2' });
    const view = viewStore.get('active_session');
    expect(view).toBeTruthy();
    if (!view) return;
    await handleAddBlock({
      type: 'AddBlock',
      sessionId: view.id,
      exerciseName: 'Bench',
      exerciseCategory: 'strength',
    });
    const after = viewStore.get('active_session');
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

    const state = viewStore.get('sessions');
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
    const active = viewStore.get('active_session');
    expect(active).not.toBeNull();
    const sessionId = active!.id;

    await handleFinishSessionWithDetails({
      type: 'FinishSessionWithDetails',
      sessionId,
      sessionRpe: 7,
    });

    const state = viewStore.get('sessions');
    const session = state?.byId[sessionId];
    expect(session?.name).toBe('Keep This Name');
    expect(session?.status).toBe('finished');
  });
});

describe('handleFinishOrUpdateSession', () => {
  it('active session: finishes with all details in one call', async () => {
    const USER = 'u-fous-1' as Id<'User'>;
    const start = await handleStartSession({ type: 'StartSession', userId: USER, name: 'Old Name' });
    expect(start.ok).toBe(true);
    const sessionId = (start as { ok: true; value: { sessionId: string } }).value.sessionId as Id<'Activity'>;

    const now = Date.now();
    const result = await handleFinishOrUpdateSession({
      type: 'FinishOrUpdateSession',
      sessionId,
      isActive: true,
      name: 'New Name',
      notes: 'Good session',
      sessionRpe: 7,
      tags: ['legs'],
      finishedAt: now,
    });

    expect(result.ok).toBe(true);
    const state = viewStore.get('sessions');
    const session = state?.byId[sessionId];
    expect(session?.name).toBe('New Name');
    expect(session?.notes).toBe('Good session');
    expect(session?.status).toBe('finished');
    expect(session?.rpe).toBe(7);
    expect(session?.tags).toEqual(['legs']);
  });

  it('active session without finishedAt returns error', async () => {
    const USER = 'u-fous-3' as Id<'User'>;
    const start = await handleStartSession({ type: 'StartSession', userId: USER, name: 'Test' });
    expect(start.ok).toBe(true);
    const sessionId = (start as { ok: true; value: { sessionId: string } }).value.sessionId as Id<'Activity'>;

    const result = await handleFinishOrUpdateSession({
      type: 'FinishOrUpdateSession',
      sessionId,
      isActive: true,
      // finishedAt intentionally omitted
    });

    expect(result.ok).toBe(false);
    expect((result as { ok: false; error: string }).error).toContain('finishedAt');
  });

  it('finished session: updates note and name separately', async () => {
    const USER = 'u-fous-2' as Id<'User'>;
    const start = await handleStartSession({ type: 'StartSession', userId: USER, name: 'Original' });
    expect(start.ok).toBe(true);
    const sessionId = (start as { ok: true; value: { sessionId: string } }).value.sessionId as Id<'Activity'>;

    await handleFinishSessionWithDetails({
      type: 'FinishSessionWithDetails',
      sessionId,
      sessionRpe: 5,
      finishedAt: Date.now(),
    });

    const result = await handleFinishOrUpdateSession({
      type: 'FinishOrUpdateSession',
      sessionId,
      isActive: false,
      name: 'Updated Name',
      notes: 'Added later',
    });

    expect(result.ok).toBe(true);
    const state = viewStore.get('sessions');
    const session = state?.byId[sessionId];
    expect(session?.name).toBe('Updated Name');
    expect(session?.notes).toBe('Added later');
  });
});
