import { describe, it, expect, beforeEach } from 'vitest';
import { viewStore } from '@data/projections/views';
import { registerProgressionPolicy } from './updateProgression';
import type { ProgressionState } from '../domain/types';
import type { DomainEvent } from '@shared/types';
import type { SessionFinishedPayload } from '@features/training_log/domain/types';
import { eventBus } from '@core/events/bus';

function makeSessionFinishedEvent(
  exerciseName: string,
  sets: Array<{ weight: number; reps: number }>,
): DomainEvent<'SessionFinished', SessionFinishedPayload> {
  return {
    type: 'SessionFinished',
    aggregateId: 'sess-1' as any,
    aggregateType: 'Session',
    timestamp: Date.now(),
    version: 1,
    payload: {
      sessionId: 'sess-1' as any,
      finishedAt: Date.now(),
      exerciseSummaries: [{
        exerciseName,
        exerciseCategory: 'strength' as any,
        sets: sets.map((s, i) => ({
          type: 'strength' as const,
          setNumber: i + 1,
          weightKg: s.weight,
          reps: s.reps,
          isWarmup: false,
          isPR: false,
          completedAt: Date.now(),
        })),
      }],
    },
  };
}

describe('registerProgressionPolicy', () => {
  beforeEach(() => {
    viewStore.set<ProgressionState>('exercise_progressions', {});
  });

  it('creates a progression entry for a new exercise after SessionFinished', async () => {
    registerProgressionPolicy();
    await eventBus.publish(makeSessionFinishedEvent('Bench Press', [{ weight: 100, reps: 5 }]));
    const state = viewStore.get<ProgressionState>('exercise_progressions');
    expect(state?.['Bench Press']).toBeDefined();
    expect(state?.['Bench Press'].history).toHaveLength(1);
    expect(state?.['Bench Press'].history[0].volume).toBe(500);
  });

  it('appends a new entry for an existing exercise', async () => {
    registerProgressionPolicy();
    await eventBus.publish(makeSessionFinishedEvent('Squat', [{ weight: 120, reps: 5 }]));
    await eventBus.publish(makeSessionFinishedEvent('Squat', [{ weight: 125, reps: 5 }]));
    const state = viewStore.get<ProgressionState>('exercise_progressions');
    expect(state?.['Squat'].history).toHaveLength(2);
  });
});
