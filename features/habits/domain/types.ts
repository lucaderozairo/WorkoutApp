import type { Id, DomainEvent } from '@shared/types';

export type HabitFrequency = 'daily' | 'weekly';

export interface Habit {
  id: Id<'Habit'>;
  userId: Id<'User'>;
  name: string;
  frequency: HabitFrequency;
  streak: number;
  longestStreak: number;
  lastCompletedDate?: string;
  completedToday: boolean;
  createdAt: number;
}

export interface HabitCreatedPayload {
  habitId: Id<'Habit'>;
  userId: Id<'User'>;
  name: string;
  frequency: HabitFrequency;
  createdAt: number;
}

export interface HabitCompletedPayload {
  habitId: Id<'Habit'>;
  userId: Id<'User'>;
  completedDate: string;
  newStreak: number;
}

export interface HabitStreakBrokenPayload {
  habitId: Id<'Habit'>;
  userId: Id<'User'>;
  brokenDate: string;
}

export interface HabitDeletedPayload {
  habitId: Id<'Habit'>;
}

export type HabitEvent =
  | DomainEvent<'HabitCreated', HabitCreatedPayload>
  | DomainEvent<'HabitCompleted', HabitCompletedPayload>
  | DomainEvent<'HabitStreakBroken', HabitStreakBrokenPayload>
  | DomainEvent<'HabitDeleted', HabitDeletedPayload>;

export interface CreateHabit {
  type: 'CreateHabit';
  userId: Id<'User'>;
  name: string;
  frequency: HabitFrequency;
}

export interface LogHabitCompletion {
  type: 'LogHabitCompletion';
  habitId: Id<'Habit'>;
  userId: Id<'User'>;
}

export interface DeleteHabit {
  type: 'DeleteHabit';
  habitId: Id<'Habit'>;
}

export type HabitCommand = CreateHabit | LogHabitCompletion | DeleteHabit;
