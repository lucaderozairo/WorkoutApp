import { eventBus } from "@core/events/bus";
import { viewStore } from "@data/projections/views";
import type { DomainEvent } from "@shared/types";
import type { SessionFinishedPayload } from "@features/training_log/domain/types";
import type { ProgressionState } from "@features/progression/domain/types";
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

  eventBus.subscribe<DomainEvent<"SessionFinished", SessionFinishedPayload>>(
    "SessionFinished",
    (event) => {
      if (event.type !== "SessionFinished") return;

      // 1. Training load insight
      const healthMetrics = viewStore.get<{ trainingLoad?: number | null }>(
        "health_metrics",
      );
      const ratio = healthMetrics?.trainingLoad ?? 0;
      const loadInsight = makeTrainingLoadInsight(ratio);
      if (loadInsight) addInsight(loadInsight);

      // 2. Plateau insights (one per plateaued exercise)
      const progressions = viewStore.get<ProgressionState>(
        "exercise_progressions",
      );
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
      const rpeHistory = viewStore.get<number[]>("session_rpe_history") ?? [];
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
          viewStore.get<{ adherenceRate: number } | null>("plan_adherence")
            ?.adherenceRate ?? 0.9,
      });
      if (deloadInsight) addInsight(deloadInsight);
    },
  );
}
