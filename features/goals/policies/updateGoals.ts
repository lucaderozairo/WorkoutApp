import { eventBus } from '@core/events/bus';
import { viewStore } from '@data/projections/views';
import type { DomainEvent } from '@shared/types';
import type { SessionFinishedPayload, SetEntry } from '@features/training_log/domain/types';
import type { Goal, GoalMetric } from '../domain/types';
import { handleUpdateGoalProgress } from '../commands/handlers';

function goalsForMetric(metric: GoalMetric): Goal[] {
  const goals = viewStore.get<Goal[]>('active_goals') ?? [];
  return goals.filter((goal) => goal.metric === metric && !goal.completed);
}

function estimateOneRepMax(set: SetEntry): number {
  return (set.weightKg ?? 0) * (1 + (set.reps ?? 0) / 30);
}

let registered = false;

export function registerGoalUpdatePolicy(): void {
  if (registered) return;
  registered = true;

  eventBus.subscribe<DomainEvent<'SessionFinished', SessionFinishedPayload>>('SessionFinished', async (event) => {
    const summaries = event.payload.exerciseSummaries;

    for (const goal of goalsForMetric('sessions')) {
      await handleUpdateGoalProgress({ type: 'UpdateGoalProgress', goalId: goal.id, delta: 1 });
    }

    const totalVolume = summaries.reduce(
      (sum, exercise) => sum + exercise.sets.reduce((inner, set) => inner + (set.isWarmup ? 0 : (set.weightKg ?? 0) * (set.reps ?? 0)), 0),
      0,
    );
    if (totalVolume > 0) {
      for (const goal of goalsForMetric('weight_lifted')) {
        await handleUpdateGoalProgress({ type: 'UpdateGoalProgress', goalId: goal.id, delta: totalVolume });
      }
    }

    const bestOneRepMax = summaries.reduce(
      (best, exercise) => Math.max(best, ...exercise.sets.filter((set) => !set.isWarmup).map(estimateOneRepMax), 0),
      0,
    );
    for (const goal of goalsForMetric('strength_1rm')) {
      if (bestOneRepMax > goal.current) {
        await handleUpdateGoalProgress({
          type: 'UpdateGoalProgress',
          goalId: goal.id,
          delta: bestOneRepMax - goal.current,
        });
      }
    }
  });

  eventBus.subscribe<
    DomainEvent<'CardioSessionRecorded', { distanceMeters: number }>
  >('CardioSessionRecorded', async (event) => {
    const distanceKm = (event.payload.distanceMeters ?? 0) / 1000;
    for (const goal of goalsForMetric('sessions')) {
      await handleUpdateGoalProgress({ type: 'UpdateGoalProgress', goalId: goal.id, delta: 1 });
    }
    if (distanceKm > 0) {
      for (const goal of goalsForMetric('distance_km')) {
        await handleUpdateGoalProgress({ type: 'UpdateGoalProgress', goalId: goal.id, delta: distanceKm });
      }
    }
  });

  eventBus.subscribe<DomainEvent<'BodyweightLogged', { weightKg: number }>>('BodyweightLogged', async (event) => {
    const currentWeight = event.payload.weightKg;
    for (const goal of goalsForMetric('bodyweight_kg')) {
      await handleUpdateGoalProgress({
        type: 'UpdateGoalProgress',
        goalId: goal.id,
        delta: currentWeight - goal.current,
      });
    }
  });
}
