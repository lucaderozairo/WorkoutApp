import { viewStore } from '@data/projections/views';
import { getActivityHistory } from '@features/training_log';
import type { PersonalRecord, ChartAnnotation } from '../domain/types';

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

export function getPersonalRecords(): PersonalRecord[] {
  return viewStore.get<PersonalRecord[]>('personal_records') ?? [];
}

export function getStatsSummary(): StatsSummary {
  const sessions = getActivityHistory();

  const stats: StatsSummary = {
    totalSessions: sessions.length,
    totalVolumeKg: 0,
    liftSessions: 0,
    cardioSessions: 0,
    kmRan: 0,
    kmCycled: 0,
    kmSwum: 0,
    kmRowed: 0,
  };

  for (const s of sessions) {
    if (s.category === 'strength') stats.liftSessions++;
    else if (s.category === 'cardio') stats.cardioSessions++;

    // Estimate volume from sets (rough heuristic — cardio distance mapped to km)
    if (s.category === 'cardio') {
      // We don't have distance in session_history; use a placeholder
    }
  }

  return stats;
}

export function getActivityFeed(): ActivityFeedEntry[] {
  const sessions = getActivityHistory();

  return sessions.map(s => {
    const date = new Date(s.startedAt).toLocaleDateString();
    let metric = '';
    if (s.category === 'strength') {
      metric = `${s.totalSets} sets · ${s.exerciseCount} exercises`;
      if (s.hasPR) metric += ' 🏆';
    } else if (s.category === 'cardio') {
      const mins = Math.round(s.durationSeconds / 60);
      metric = `${mins} min`;
    } else {
      metric = `${s.exerciseCount} exercises`;
    }
    return {
      id: s.id,
      type: s.category as ActivityFeedEntry['type'],
      date,
      title: s.name,
      metric,
    };
  });
}

export function getAnnotations(exerciseName: string): ChartAnnotation[] {
  const all = viewStore.get<Record<string, ChartAnnotation[]>>('chart_annotations') ?? {};
  return all[exerciseName] ?? [];
}
