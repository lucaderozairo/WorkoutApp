import { eventBus } from "@core/events/bus";
import { viewStore } from "@data/projections/views";
import { TrainingLogEvents } from "@features/training_log/contract";
import {
  makeTrainingLoadInsight,
  makePlateauInsight,
  makeDeloadInsight,
} from "../domain/rules";
import { addInsight } from "../projections";

let registered = false;

export function registerCoachingPolicy(): void {
  if (registered) return;
  registered = true;

  eventBus.subscribe(TrainingLogEvents.SessionFinished, (event) => {
    if (event.type !== "SessionFinished") return;

    // 1. Training load insight
    const latestHealthMetrics = viewStore.get("health_metrics")?.[0];
    const ratio = latestHealthMetrics?.trainingLoad ?? 0;
    const loadInsight = makeTrainingLoadInsight(ratio);
    if (loadInsight) addInsight(loadInsight);

    // 2. Plateau insights (one per plateaued exercise)
    const progressions = viewStore.get("exercise_progressions");
    if (progressions) {
      for (const prog of Object.values(progressions)) {
        const plateauInsight = makePlateauInsight(
          prog.exerciseName,
          prog.plateauDetected,
        );
        if (plateauInsight) addInsight(plateauInsight);
      }
    }

    // 3. Deload detection
    const currentRpe = event.payload.sessionRpe ?? 0;
    const rpeHistory = viewStore.get("session_rpe_history") ?? [];
    const updatedRpeHistory = [...rpeHistory.slice(-9), currentRpe];
    viewStore.set("session_rpe_history", updatedRpeHistory);

    const highRpeStreak = updatedRpeHistory.reduceRight((streak, rpe) => {
      if (rpe >= 8) return streak + 1;
      return streak;
    }, 0);

    const deloadInsight = makeDeloadInsight({
      highLoadDays: ratio > 1.3 ? 5 : 0,
      highRpeStreak,
      adherenceRate:
        viewStore.get("plan_adherence")?.adherenceRate ?? 0.9,
    });
    if (deloadInsight) addInsight(deloadInsight);
  });
}
