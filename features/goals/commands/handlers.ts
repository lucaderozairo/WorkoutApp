import { eventBus } from '@core/events/bus';
import { systemClock } from '@core/clock';
import { generateId } from '@shared/utils';
import { viewStore } from '@data/projections/views';
import type { Id } from '@shared/types';
import type {
  Goal,
  CreateGoal,
  UpdateGoalProgress,
  CompleteGoal,
  DeleteGoal,
  GoalCreatedPayload,
  GoalProgressUpdatedPayload,
  GoalCompletedPayload,
  GoalDeletedPayload,
} from '../domain/types';

function publishGoalEvent<TPayload extends object>(type: string, aggregateId: Id, payload: TPayload): Promise<void> {
  return eventBus.publish({
    type,
    aggregateId,
    aggregateType: 'Goal',
    timestamp: systemClock.now(),
    version: 1,
    payload,
  });
}

export async function handleCreateGoal(cmd: CreateGoal): Promise<Id<'Goal'>> {
  const goalId = generateId<'Goal'>();
  const payload: GoalCreatedPayload = {
    goalId,
    userId: cmd.userId,
    name: cmd.name,
    metric: cmd.metric,
    target: cmd.target,
    unit: cmd.unit,
    deadline: cmd.deadline,
    createdAt: systemClock.now(),
  };
  await publishGoalEvent('GoalCreated', goalId, payload);
  return goalId;
}

export async function handleUpdateGoalProgress(cmd: UpdateGoalProgress): Promise<void> {
  const goals = viewStore.get<Goal[]>('active_goals') ?? [];
  const goal = goals.find((entry) => entry.id === cmd.goalId);
  if (!goal) return;

  const current = Math.max(0, goal.current + cmd.delta);
  const progressPayload: GoalProgressUpdatedPayload = {
    goalId: cmd.goalId,
    current,
    delta: cmd.delta,
  };
  await publishGoalEvent('GoalProgressUpdated', cmd.goalId, progressPayload);

  if (current >= goal.target && !goal.completed) {
    const completedPayload: GoalCompletedPayload = {
      goalId: cmd.goalId,
      completedAt: systemClock.now(),
    };
    await publishGoalEvent('GoalCompleted', cmd.goalId, completedPayload);
  }
}

export async function handleCompleteGoal(cmd: CompleteGoal): Promise<void> {
  const payload: GoalCompletedPayload = {
    goalId: cmd.goalId,
    completedAt: systemClock.now(),
  };
  await publishGoalEvent('GoalCompleted', cmd.goalId, payload);
}

export async function handleDeleteGoal(cmd: DeleteGoal): Promise<void> {
  const payload: GoalDeletedPayload = { goalId: cmd.goalId };
  await publishGoalEvent('GoalDeleted', cmd.goalId, payload);
}
