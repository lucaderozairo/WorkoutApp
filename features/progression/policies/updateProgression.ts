import { eventBus } from '@core/events/bus';
import { viewStore } from '@data/projections/views';
import { TrainingLogEvents } from '@features/training_log/contract';
import { computeVolumeEntry, detectPlateau } from '../domain/compute';

let registered = false;

export function registerProgressionPolicy(): void {
  if (registered) return;
  registered = true;

  eventBus.subscribe(TrainingLogEvents.SessionFinished, (event) => {
      if (event.type !== 'SessionFinished') return;
      const { exerciseSummaries, sessionId, finishedAt } = event.payload;
      const date = new Date(finishedAt).toISOString().slice(0, 10);

      const current = viewStore.get('exercise_progressions') ?? {};
      const updated = { ...current };

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
  });
}
