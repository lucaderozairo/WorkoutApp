export interface DailyLoad {
  date: string;
  load: number;
}

export interface AcuteChronicResult {
  acuteLoad: number;
  chronicLoad: number;
  ratio: number;
}

export interface HRZone {
  zone: 1 | 2 | 3 | 4 | 5;
  name: string;
  minPct: number;
  maxPct: number;
  minutes: number;
  color: string;
}

const ZONES: Omit<HRZone, 'minutes'>[] = [
  { zone: 1, name: 'Recovery', minPct: 50, maxPct: 60, color: 'var(--color-success)' },
  { zone: 2, name: 'Aerobic', minPct: 60, maxPct: 70, color: 'var(--color-info)' },
  { zone: 3, name: 'Tempo', minPct: 70, maxPct: 80, color: 'var(--color-warning)' },
  { zone: 4, name: 'Threshold', minPct: 80, maxPct: 90, color: 'var(--color-danger)' },
  { zone: 5, name: 'VO2 Max', minPct: 90, maxPct: 100, color: 'var(--color-danger)' },
];

export function computeSessionLoad(durationMinutes: number, sessionRpe?: number): number {
  const intensity = sessionRpe != null ? sessionRpe / 10 : 0.6;
  return Math.round(durationMinutes * intensity);
}

export function computeAcuteChronic(series: DailyLoad[]): AcuteChronicResult {
  const last7 = series.slice(-7);
  const last28 = series.slice(-28);
  const sum = (items: DailyLoad[]) => items.reduce((total, entry) => total + entry.load, 0);
  const acuteLoad = last7.length > 0 ? sum(last7) / last7.length : 0;
  const chronicLoad = last28.length > 0 ? sum(last28) / last28.length : 0;
  const ratio = chronicLoad > 0 ? acuteLoad / chronicLoad : 1;
  return { acuteLoad, chronicLoad, ratio };
}

export function computeHRZones(
  sessions: Array<{ avgHrBpm: number; durationMinutes: number }>,
  maxHrBpm = 190,
): HRZone[] {
  const zones = ZONES.map((zone) => ({ ...zone, minutes: 0 }));

  for (const session of sessions) {
    if (!session.avgHrBpm || !session.durationMinutes) continue;
    const pct = (session.avgHrBpm / maxHrBpm) * 100;
    const zone = zones.find((entry) => pct >= entry.minPct && pct < entry.maxPct) ?? zones[4];
    zone.minutes += session.durationMinutes;
  }

  return zones;
}
