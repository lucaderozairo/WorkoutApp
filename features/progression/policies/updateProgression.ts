import { eventBus } from '@core/events/bus';
import { viewStore } from '@data/projections/views';
import type { DomainEvent } from '@shared/types';
// eslint-disable-next-line boundaries/element-types -- TODO(arch): cross-layer import baselined; see docs/superpowers/plans/2026-06-03-architecture-rule-enforcement.md
import type { SessionFinishedPayload } from '@features/training_log/domain/types';
import { computeVolumeEntry, detectPlateau } from '../domain/compute';
import type { ProgressionState } from '../domain/types';

let registered = false;

export function registerProgressionPolicy(): void {
  if (registered) return;
  registered = true;

  eventBus.subscribe<DomainEvent<'SessionFinished', SessionFinishedPayload>>(
    'SessionFinished',
    (event) => {
      if (event.type !== 'SessionFinished') return;
      const { exerciseSummaries, sessionId, finishedAt } = event.payload;
      const date = new Date(finishedAt).toISOString().slice(0, 10);

      const current = viewStore.get<ProgressionState>('exercise_progressions') ?? {};
      const updated: ProgressionState = { ...current };

      for (const summary of exerciseSummaries) {
        const existing = updated[summary.exerciseName] ?? {
          exerciseName: summary.exerciseName,
          history: [],
          plateauDetected: false,
        };

        const entry = computeVolumeEntry(date, summary.sets, sessionId);
        if (entry.volume === 0) continue; // skip if no working sets

        const history = [...existing.history, entry];
        updated[summary.exerciseName] = {
          exerciseName: summary.exerciseName,
          history,
          plateauDetected: detectPlateau(history),
        };
      }

      viewStore.set('exercise_progressions', updated);
    },
  );
}
