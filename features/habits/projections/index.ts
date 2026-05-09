import { eventBus } from '@core/events/bus';
import { viewStore } from '@data/projections/views';
import { ProjectionBuilder, projectionRegistry } from '@data/projections/builders';
import type { DomainEvent } from '@shared/types';
import type {
  Habit,
  HabitEvent,
  HabitCreatedPayload,
  HabitCompletedPayload,
  HabitDeletedPayload,
  HabitStreakBrokenPayload,
} from '../domain/types';

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export const habitsTodayProjection = new ProjectionBuilder<Habit[], HabitEvent>('habits_today', [], {
  HabitCreated: (state, event) => {
    const payload = event.payload as HabitCreatedPayload;
    return [
      ...state,
      {
        id: payload.habitId,
        userId: payload.userId,
        name: payload.name,
        frequency: payload.frequency,
        streak: 0,
        longestStreak: 0,
        lastCompletedDate: undefined,
        completedToday: false,
        createdAt: payload.createdAt,
      },
    ];
  },
  HabitCompleted: (state, event) => {
    const payload = event.payload as HabitCompletedPayload;
    const today = todayISO();
    return state.map((habit) =>
      habit.id === payload.habitId
        ? {
            ...habit,
            streak: payload.newStreak,
            longestStreak: Math.max(habit.longestStreak, payload.newStreak),
            lastCompletedDate: payload.completedDate,
            completedToday: payload.completedDate === today,
          }
        : habit,
    );
  },
  HabitStreakBroken: (state, event) => {
    const payload = event.payload as HabitStreakBrokenPayload;
    return state.map((habit) => habit.id === payload.habitId ? { ...habit, streak: 0 } : habit);
  },
  HabitDeleted: (state, event) => {
    const payload = event.payload as HabitDeletedPayload;
    return state.filter((habit) => habit.id !== payload.habitId);
  },
});

let registered = false;

export function registerHabitProjections(): void {
  if (registered) return;
  registered = true;

  projectionRegistry.register('habits_today', habitsTodayProjection);
  viewStore.set('habits_today', habitsTodayProjection.getState());

  const sync = (event: HabitEvent) => {
    habitsTodayProjection.apply(event);
    viewStore.set('habits_today', habitsTodayProjection.getState());
  };

  eventBus.subscribe<DomainEvent<'HabitCreated', object>>('HabitCreated', (event) => sync(event as HabitEvent));
  eventBus.subscribe('HabitCompleted', (event) => sync(event as HabitEvent));
  eventBus.subscribe('HabitStreakBroken', (event) => sync(event as HabitEvent));
  eventBus.subscribe('HabitDeleted', (event) => sync(event as HabitEvent));
}
