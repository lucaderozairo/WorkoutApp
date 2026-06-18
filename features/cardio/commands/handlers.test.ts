import { beforeEach, describe, expect, it } from 'vitest';
import { viewStore } from '@data/projections/views';
import type { Id } from '@shared/types';
import { handleRecordCardioSession } from './handlers';
import {
  monthlyCardioProjection,
  recentCardioProjection,
  type MonthlyCardioEntry,
  type RecentCardioView,
} from '../projections';

beforeEach(() => {
  recentCardioProjection.setState({ sessions: [] });
  monthlyCardioProjection.setState([]);
  viewStore.set('recent_cardio_sessions', { sessions: [] });
  viewStore.set('monthly_cardio_progression', []);
});

describe('handleRecordCardioSession', () => {
  it('records a session through the projection-aware command context', async () => {
    const result = await handleRecordCardioSession({
      type: 'RecordCardioSession',
      userId: 'user-1' as Id<'User'>,
      sessionId: 'cardio-1' as Id<'CardioSession'>,
      sport: 'run',
      durationSeconds: 1800,
      distanceMeters: 5000,
      notes: 'Easy aerobic run',
    });

    expect(result.ok).toBe(true);

    const recent = viewStore.get('recent_cardio_sessions');
    expect(recent?.sessions).toHaveLength(1);
    expect(recent?.sessions[0]).toEqual(expect.objectContaining({
      id: 'cardio-1',
      sport: 'run',
      distanceMeters: 5000,
      durationSeconds: 1800,
    }));

    const monthly = viewStore.get('monthly_cardio_progression');
    expect(monthly).toHaveLength(1);
    expect(monthly?.[0]).toEqual(expect.objectContaining({
      sport: 'run',
      totalDistanceMeters: 5000,
      totalDurationSeconds: 1800,
      sessionCount: 1,
    }));
  });
});
