export interface RestingHREntry {
  date: string; // YYYY-MM-DD
  bpm: number;
}

export interface HRVEntry {
  date: string; // YYYY-MM-DD
  hrv: number;  // ms
}

export function generateMockRestingHRHistory(
  days: number,
  endDate: Date = new Date(),
): RestingHREntry[] {
  const entries: RestingHREntry[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(endDate);
    d.setDate(d.getDate() - i);
    const trend = -0.04 * (days - i);
    const noise = Math.sin(i * 1.7) * 2.5;
    const bpm = Math.round(Math.max(35, Math.min(65, 50 + trend + noise)));
    entries.push({ date: d.toISOString().slice(0, 10), bpm });
  }
  return entries;
}

export function generateMockHRVHistory(
  days: number,
  endDate: Date = new Date(),
): HRVEntry[] {
  const entries: HRVEntry[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(endDate);
    d.setDate(d.getDate() - i);
    const trend = 0.1 * (days - i);
    const noise = Math.sin(i * 2.3) * 12 + Math.sin(i * 0.7) * 8;
    const hrv = Math.round(Math.max(30, Math.min(140, 72 + trend + noise)));
    entries.push({ date: d.toISOString().slice(0, 10), hrv });
  }
  return entries;
}
