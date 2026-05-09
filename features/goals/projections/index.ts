import { eventBus } from '@core/events/bus';
import { viewStore } from '@data/projections/views';
import { ProjectionBuilder, projectionRegistry } from '@data/projections/builders';
import type { DomainEvent } from '@shared/types';
import type {
  Goal,
  GoalEvent,
  GoalCreatedPayload,
  GoalProgressUpdatedPayload,
  GoalCompletedPayload,
  GoalDeletedPayload,
} from '../domain/types';

export const activeGoalsProjection = new ProjectionBuilder<Goal[], GoalEvent>('active_goals', [], {
  GoalCreated: (state, event) => {
    const payload = event.payload as GoalCreatedPayload;
    return [
      ...state,
      {
        id: payload.goalId,
        userId: payload.userId,
        name: payload.name,
        metric: payload.metric,
        target: payload.target,
        current: 0,
        unit: payload.unit,
        deadline: payload.deadline,
        completed: false,
        createdAt: payload.createdAt,
      },
    ];
  },
  GoalProgressUpdated: (state, event) => {
    const payload = event.payload as GoalProgressUpdatedPayload;
    return state.map((goal) => goal.id === payload.goalId ? { ...goal, current: payload.current } : goal);
  },
  GoalCompleted: (state, event) => {
    const payload = event.payload as GoalCompletedPayload;
    return state.filter((goal) => goal.id !== payload.goalId);
  },
  GoalDeleted: (state, event) => {
    const payload = event.payload as GoalDeletedPayload;
    return state.filter((goal) => goal.id !== payload.goalId);
  },
});

export const completedGoalsProjection = new ProjectionBuilder<Goal[], GoalEvent>('completed_goals', [], {
  GoalCreated: (state, event) => {
    const payload = event.payload as GoalCreatedPayload;
    return [
      ...state.filter((goal) => goal.id !== payload.goalId),
      {
        id: payload.goalId,
        userId: payload.userId,
        name: payload.name,
        metric: payload.metric,
        target: payload.target,
        current: 0,
        unit: payload.unit,
        deadline: payload.deadline,
        completed: false,
        createdAt: payload.createdAt,
      },
    ];
  },
  GoalProgressUpdated: (state, event) => {
    const payload = event.payload as GoalProgressUpdatedPayload;
    return state.map((goal) => goal.id === payload.goalId ? { ...goal, current: payload.current } : goal);
  },
  GoalCompleted: (state, event) => {
    const payload = event.payload as GoalCompletedPayload;
    return state.map((goal) => goal.id === payload.goalId ? { ...goal, completed: true, completedAt: payload.completedAt } : goal);
  },
  GoalDeleted: (state, event) => {
    const payload = event.payload as GoalDeletedPayload;
    return state.filter((goal) => goal.id !== payload.goalId);
  },
});

let registered = false;

export function registerGoalProjections(): void {
  if (registered) return;
  registered = true;

  projectionRegistry.register('active_goals', activeGoalsProjection);
  projectionRegistry.register('completed_goals', completedGoalsProjection);
  viewStore.set('active_goals', activeGoalsProjection.getState());
  viewStore.set('completed_goals', completedGoalsProjection.getState().filter((goal) => goal.completed));

  const sync = (event: GoalEvent) => {
    activeGoalsProjection.apply(event);
    completedGoalsProjection.apply(event);
    viewStore.set('active_goals', activeGoalsProjection.getState());
    viewStore.set('completed_goals', completedGoalsProjection.getState().filter((goal) => goal.completed));
  };

  eventBus.subscribe<DomainEvent<'GoalCreated', object>>('GoalCreated', (event) => sync(event as GoalEvent));
  eventBus.subscribe('GoalProgressUpdated', (event) => sync(event as GoalEvent));
  eventBus.subscribe('GoalCompleted', (event) => sync(event as GoalEvent));
  eventBus.subscribe('GoalDeleted', (event) => sync(event as GoalEvent));
}
