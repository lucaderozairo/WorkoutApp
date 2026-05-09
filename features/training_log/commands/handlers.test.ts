import { describe, it, expect } from 'vitest';
import { handleStartSession, handleAddBlock } from './handlers';
import { viewStore } from '@data/projections/views';
import type { ActiveSessionView } from '../projections';
import type { Id } from '@shared/types';

describe('handleStartSession → active_session view', () => {
  it('populates active_session in the viewStore', async () => {
    const USER = 'u-test-1' as Id<'User'>;
    const r = await handleStartSession({ type: 'StartSession', userId: USER, name: 'Test' });
    expect(r.ok).toBe(true);
    const view = viewStore.get<ActiveSessionView>('active_session');
    expect(view).not.toBeNull();
    expect(view?.name).toBe('Test');
    expect(view?.blocks).toEqual([]);
  });

  it('AddBlock appends to active_session.blocks', async () => {
    const USER = 'u-test-2' as Id<'User'>;
    await handleStartSession({ type: 'StartSession', userId: USER, name: 'Test 2' });
    const view = viewStore.get<ActiveSessionView>('active_session');
    expect(view).toBeTruthy();
    if (!view) return;
    await handleAddBlock({
      type: 'AddBlock',
      sessionId: view.id,
      exerciseName: 'Bench',
      exerciseCategory: 'strength',
    });
    const after = viewStore.get<ActiveSessionView>('active_session');
    expect(after?.blocks).toHaveLength(1);
    expect(after?.blocks[0].exerciseName).toBe('Bench');
  });
});
