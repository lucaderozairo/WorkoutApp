import { defineCommand } from '@data/define-command';
import { systemClock } from '@core/clock';
import { generateId } from '@shared/utils';
import { viewStore } from '@data/projections/views';
import type { DomainEvent, Id } from '@shared/types';
import type {
  Habit,
  CreateHabit,
  LogHabitCompletion,
  DeleteHabit,
  HabitCreatedPayload,
  HabitCompletedPayload,
  HabitStreakBrokenPayload,
  HabitDeletedPayload,
} from '../domain/types';

function toISODate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function isConsecutiveDay(previous: string, current: string): boolean {
  const prev = new Date(previous).getTime();
  const next = new Date(current).getTime();
  return next - prev === 86_400_000;
}

export const handleCreateHabit = defineCommand<CreateHabit, Id<'Habit'>>({
  execute: async (cmd) => {
    const habitId = generateId<'Habit'>();
    const payload: HabitCreatedPayload = {
      habitId,
      userId: cmd.userId,
      name: cmd.name,
      frequency: cmd.frequency,
      createdAt: systemClock.now(),
    };
    return {
      result: habitId,
      events: [{
        type: 'HabitCreated',
        aggregateId: habitId,
        aggregateType: 'Habit',
        timestamp: systemClock.now(),
        version: 1,
        payload,
      }],
    };
  },
});

export const handleLogHabitCompletion = defineCommand<LogHabitCompletion>({
  execute: async (cmd) => {
    const habits = viewStore.get<Habit[]>('habits_today') ?? [];
    const habit = habits.find((entry) => entry.id === cmd.habitId);
    if (!habit || habit.completedToday) return { events: [] };

    const today = toISODate(systemClock.now());
    const isConsecutive = habit.lastCompletedDate ? isConsecutiveDay(habit.lastCompletedDate, today) : true;
    const newStreak = isConsecutive ? habit.streak + 1 : 1;
    const events: DomainEvent[] = [];

    if (!isConsecutive && habit.streak > 0 && habit.lastCompletedDate) {
      const brokenPayload: HabitStreakBrokenPayload = {
        habitId: cmd.habitId,
        userId: cmd.userId,
        brokenDate: today,
      };
      events.push({
        type: 'HabitStreakBroken',
        aggregateId: cmd.habitId,
        aggregateType: 'Habit',
        timestamp: systemClock.now(),
        version: 1,
        payload: brokenPayload,
      });
    }

    const completedPayload: HabitCompletedPayload = {
      habitId: cmd.habitId,
      userId: cmd.userId,
      completedDate: today,
      newStreak,
    };
    events.push({
      type: 'HabitCompleted',
      aggregateId: cmd.habitId,
      aggregateType: 'Habit',
      timestamp: systemClock.now(),
      version: 1,
      payload: completedPayload,
    });
    return { events };
  },
});

export const handleDeleteHabit = defineCommand<DeleteHabit>({
  execute: async (cmd) => {
    const payload: HabitDeletedPayload = { habitId: cmd.habitId };
    return {
      events: [{
        type: 'HabitDeleted',
        aggregateId: cmd.habitId,
        aggregateType: 'Habit',
        timestamp: systemClock.now(),
        version: 1,
        payload,
      }],
    };
  },
});
