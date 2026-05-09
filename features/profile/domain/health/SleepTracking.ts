export type SleepEntry = {
  date: string;
  durationMinutes: number;
  quality?: 'poor' | 'fair' | 'good';
};
