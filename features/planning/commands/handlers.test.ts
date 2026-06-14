import { beforeEach, describe, expect, it } from 'vitest';
import { viewStore } from '@data/projections/views';
import type { Id } from '@shared/types';
import type { RouteSummary } from '@shared/contracts';
import { plannedSessionsProjection, savedTemplatesProjection } from '../projections';
import { handlePlanSession } from './handlers';

function resetPlanning() {
  plannedSessionsProjection.setState([]);
  savedTemplatesProjection.setState([]);
  viewStore.set('planned_sessions', []);
  viewStore.set('saved_templates', []);
}

describe('planning commands route binding', () => {
  beforeEach(resetPlanning);

  it('captures a route snapshot and pace target on planned sessions', async () => {
    const routeSnapshot: RouteSummary = {
      id: 'route-1' as Id<'SavedRoute'>,
      name: 'Tempo Loop',
      profile: 'foot',
      distanceKm: 5,
      elevationGainM: 80,
      elevationLossM: 60,
    };

    const result = await handlePlanSession({
      type: 'PlanSession',
      userId: 'user-1' as Id<'User'>,
      planType: 'run',
      name: 'Route Session',
      scheduledAt: Date.now(),
      notes: '',
      routeId: routeSnapshot.id,
      routeSnapshot,
      paceTarget: { kind: 'full', paceSecPerKm: 300 },
    });

    expect(result.ok).toBe(true);
    expect(viewStore.get('planned_sessions')).toEqual([
      expect.objectContaining({
        routeId: routeSnapshot.id,
        routeSnapshot,
        paceTarget: { kind: 'full', paceSecPerKm: 300 },
      }),
    ]);
  });
});
