import { defineCommand } from '@data/define-command';
import { systemClock } from '@core/clock';
import { generateId } from '@shared/utils';
import { viewStore } from '@data/projections/views';
import type { DomainEvent, Id } from '@shared/types';
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

function buildGoalEvent<TPayload extends object>(type: string, aggregateId: Id, payload: TPayload): DomainEvent {
  return {
    type,
    aggregateId,
    aggregateType: 'Goal',
    timestamp: systemClock.now(),
    version: 1,
    payload,
  };
}

export const handleCreateGoal = defineCommand<CreateGoal, Id<'Goal'>>({
  execute: async (cmd) => {
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
    return { result: goalId, events: [buildGoalEvent('GoalCreated', goalId, payload)] };
  },
});

export const handleUpdateGoalProgress = defineCommand<UpdateGoalProgress>({
  execute: async (cmd) => {
    const goals = viewStore.get('active_goals') ?? [];
    const goal = goals.find((entry) => entry.id === cmd.goalId);
    if (!goal) return { events: [] };

    const current = Math.max(0, goal.current + cmd.delta);
    const progressPayload: GoalProgressUpdatedPayload = {
      goalId: cmd.goalId,
      current,
      delta: cmd.delta,
    };
    const events = [buildGoalEvent('GoalProgressUpdated', cmd.goalId, progressPayload)];

    if (current >= goal.target && !goal.completed) {
      const completedPayload: GoalCompletedPayload = {
        goalId: cmd.goalId,
        completedAt: systemClock.now(),
      };
      events.push(buildGoalEvent('GoalCompleted', cmd.goalId, completedPayload));
    }
    return { events };
  },
});

export const handleCompleteGoal = defineCommand<CompleteGoal>({
  execute: async (cmd) => {
    const payload: GoalCompletedPayload = {
      goalId: cmd.goalId,
      completedAt: systemClock.now(),
    };
    return { events: [buildGoalEvent('GoalCompleted', cmd.goalId, payload)] };
  },
});

export const handleDeleteGoal = defineCommand<DeleteGoal>({
  execute: async (cmd) => {
    const payload: GoalDeletedPayload = { goalId: cmd.goalId };
    return { events: [buildGoalEvent('GoalDeleted', cmd.goalId, payload)] };
  },
});
