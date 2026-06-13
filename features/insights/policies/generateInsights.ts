import { eventBus } from '@core/events/bus';
import { viewStore } from '@data/projections/views';
import { TrainingLogEvents } from '@features/training_log/contract';
import { trainingLoadInsight, plateauInsight, deloadInsight } from '../domain/rules';
import type { InsightContent } from '../domain/rules';
import { emitInsight } from '../commands/handlers';

let registered = false;

/**
 * Synthesises insights from cross-domain read-models whenever a session
 * finishes. Generation flows through the `emitInsight` command, so every
 * insight is a durable, replayed event rather than a live-only viewStore write.
 *
 * Reading peer features' read-model keys (health_metrics, exercise_progressions,
 * plan_adherence) is the legitimate seam for a cross-domain policy — it never
 * imports another feature's runtime internals.
 */
export function registerInsightsPolicy(): void {
  if (registered) return;
  registered = true;

  eventBus.subscribe(TrainingLogEvents.SessionFinished, (event) => {
    if (event.type !== 'SessionFinished') return;

    // De-dupe against insights already on the feed (by headline), and against
    // ones queued earlier in this same pass.
    const seen = new Set((viewStore.get('insights') ?? []).map((i) => i.title));
    const emit = (content: InsightContent | null) => {
      if (!content || seen.has(content.title)) return;
      seen.add(content.title);
      void emitInsight(content);
    };

    // 1. Training load
    const ratio = viewStore.get('health_metrics')?.[0]?.trainingLoad ?? 0;
    emit(trainingLoadInsight(ratio));

    // 2. Plateaus — one per plateaued exercise
    const progressions = viewStore.get('exercise_progressions');
    if (progressions) {
      for (const prog of Object.values(progressions)) {
        emit(plateauInsight(prog.exerciseName, prog.plateauDetected));
      }
    }

    // 3. Deload — needs a rolling window of recent session RPE
    const currentRpe = event.payload.sessionRpe ?? 0;
    const rpeHistory = [...(viewStore.get('session_rpe_history') ?? []).slice(-9), currentRpe];
    viewStore.set('session_rpe_history', rpeHistory);

    const highRpeStreak = rpeHistory.reduceRight((streak, rpe) => (rpe >= 8 ? streak + 1 : streak), 0);

    emit(deloadInsight({
      highLoadDays: ratio > 1.3 ? 5 : 0,
      highRpeStreak,
      adherenceRate: viewStore.get('plan_adherence')?.adherenceRate ?? 0.9,
    }));
  });
}
