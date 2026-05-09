import type { Sport } from '@data/mock/workouts';

export interface MockCalendarEvent {
  month: string;
  day: number;
  title: string;
  sport: Sport;
  time: string;
}

export const MOCK_CALENDAR_UPCOMING: MockCalendarEvent[] = [
  { month: 'APR', day: 25, title: 'Morning Run — 5km', sport: 'run', time: '7:00am · 5km' },
  { month: 'APR', day: 26, title: 'Upper Body Push', sport: 'lift', time: 'Sat · 10:00am' },
  { month: 'APR', day: 27, title: 'Easy Recovery Ride', sport: 'cycle', time: 'Sun · 9:00am · 20km' },
];
