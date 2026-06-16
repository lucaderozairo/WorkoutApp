export interface StatsSummary {
  totalSessions: number;
  totalVolumeKg: number;
  liftSessions: number;
  cardioSessions: number;
  kmRan: number;
  kmCycled: number;
  kmSwum: number;
  kmRowed: number;
}

export interface ActivityFeedEntry {
  id: string;
  type: 'lift' | 'cardio' | 'mobility' | 'other';
  date: string;
  title: string;
  metric: string;
}
