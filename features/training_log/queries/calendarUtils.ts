import type { CardioSession } from '@features/cardio/domain/types';
import type { ActivityHistoryItem } from '@features/training_log';
import type { CardioSport } from '@features/cardio/domain/types';

export type TypeFilter = 'all' | 'strength' | CardioSport;

export type CombinedSession =
  | { kind: 'strength'; session: ActivityHistoryItem }
  | { kind: 'cardio'; session: CardioSession };

export function toDateKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function buildDateMap(
  sessions: CombinedSession[],
  typeFilter: TypeFilter,
): Map<string, CombinedSession[]> {
  const map = new Map<string, CombinedSession[]>();
  for (const entry of sessions) {
    if (typeFilter !== 'all') {
      if (entry.kind === 'strength' && typeFilter !== 'strength') continue;
      if (entry.kind === 'cardio' && entry.session.sport !== typeFilter) continue;
    }
    const ts = entry.kind === 'strength'
      ? entry.session.finishedAt
      : entry.session.startedAt;
    const key = toDateKey(ts);
    map.set(key, [...(map.get(key) ?? []), entry]);
  }
  return map;
}

export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function formatWeekRange(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  return `${fmt(monday)} – ${fmt(sunday)} · ${monday.getFullYear()}`;
}

export function getMonthGrid(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startPad = (first.getDay() + 6) % 7;
  const grid: (Date | null)[] = [];
  for (let i = 0; i < startPad; i++) grid.push(null);
  for (let d = 1; d <= last.getDate(); d++) grid.push(new Date(year, month, d));
  return grid;
}
