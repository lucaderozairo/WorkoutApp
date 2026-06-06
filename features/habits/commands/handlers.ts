import { eventRepository } from '@data/event-repository';
import { systemClock } from '@core/clock';
import { generateId } from '@shared/utils';
import { viewStore } from '@data/projections/views';
import type { Id } from '@shared/types';
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

export async function handleCreateHabit(cmd: CreateHabit): Promise<Id<'Habit'>> {
  const habitId = generateId<'Habit'>();
  const payload: HabitCreatedPayload = {
    habitId,
    userId: cmd.userId,
    name: cmd.name,
    frequency: cmd.frequency,
    createdAt: systemClock.now(),
  };
  await eventRepository.commit([{
    type: 'HabitCreated',
    aggregateId: habitId,
    aggregateType: 'Habit',
    timestamp: systemClock.now(),
    version: 1,
    payload,
  }]);
  return habitId;
}

export async function handleLogHabitCompletion(cmd: LogHabitCompletion): Promise<void> {
  const habits = viewStore.get<Habit[]>('habits_today') ?? [];
  const habit = habits.find((entry) => entry.id === cmd.habitId);
  if (!habit || habit.completedToday) return;

  const today = toISODate(systemClock.now());
  const isConsecutive = habit.lastCompletedDate ? isConsecutiveDay(habit.lastCompletedDate, today) : true;
  const newStreak = isConsecutive ? habit.streak + 1 : 1;

  if (!isConsecutive && habit.streak > 0 && habit.lastCompletedDate) {
    const brokenPayload: HabitStreakBrokenPayload = {
      habitId: cmd.habitId,
      userId: cmd.userId,
      brokenDate: today,
    };
    await eventRepository.commit([{
      type: 'HabitStreakBroken',
      aggregateId: cmd.habitId,
      aggregateType: 'Habit',
      timestamp: systemClock.now(),
      version: 1,
      payload: brokenPayload,
    }]);
  }

  const completedPayload: HabitCompletedPayload = {
    habitId: cmd.habitId,
    userId: cmd.userId,
    completedDate: today,
    newStreak,
  };
  await eventRepository.commit([{
    type: 'HabitCompleted',
    aggregateId: cmd.habitId,
    aggregateType: 'Habit',
    timestamp: systemClock.now(),
    version: 1,
    payload: completedPayload,
  }]);
}

export async function handleDeleteHabit(cmd: DeleteHabit): Promise<void> {
  const payload: HabitDeletedPayload = { habitId: cmd.habitId };
  await eventRepository.commit([{
    type: 'HabitDeleted',
    aggregateId: cmd.habitId,
    aggregateType: 'Habit',
    timestamp: systemClock.now(),
    version: 1,
    payload,
  }]);
}
