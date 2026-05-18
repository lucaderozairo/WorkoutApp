import type { SportType } from '@features/training_log/domain/types';

export interface MockCalendarEvent {
  month: string;
  day: number;
  title: string;
  sport: SportType;
  time: string;
}
