import type { GarminDailySummary } from '@data/sources/api/garmin';

export interface AllDayHRPoint { timestamp: string; bpm: number }
export interface StressPoint    { timestamp: string; level: number }
export interface BodyBatteryPoint { timestamp: string; charge: number }

export function generateMockAllDayHR(date: Date): AllDayHRPoint[] {
  const midnight = new Date(date);
  midnight.setHours(0, 0, 0, 0);
  const points: AllDayHRPoint[] = [];
  for (let m = 0; m < 1440; m++) {
    const ts = new Date(midnight.getTime() + m * 60_000);
    const hour = ts.getHours();
    let base = 60;
    if (hour < 6)       base = 52 + Math.sin(m * 0.04) * 5;
    else if (hour < 8)  base = 90 + Math.sin(m * 0.3) * 20;
    else if (hour < 18) base = 70 + Math.sin(m * 0.07) * 12;
    else                base = 62 + Math.sin(m * 0.05) * 8;
    points.push({
      timestamp: ts.toISOString(),
      bpm: Math.round(Math.max(40, Math.min(200, base))),
    });
  }
  return points;
}

export function generateMockStress(date: Date): StressPoint[] {
  const midnight = new Date(date);
  midnight.setHours(0, 0, 0, 0);
  const points: StressPoint[] = [];
  for (let i = 0; i < 480; i++) {
    const ts = new Date(midnight.getTime() + i * 3 * 60_000);
    const hour = ts.getHours();
    let base = 25;
    if (hour >= 9 && hour < 12)  base = 55 + Math.sin(i * 0.5) * 15;
    else if (hour >= 14 && hour < 17) base = 50 + Math.sin(i * 0.4) * 20;
    else if (hour < 6)           base = 10 + Math.sin(i * 0.2) * 8;
    const level = Math.round(Math.max(0, Math.min(100, base + Math.sin(i * 1.7) * 10)));
    points.push({ timestamp: ts.toISOString(), level });
  }
  return points;
}

export function generateMockBodyBattery(date: Date): BodyBatteryPoint[] {
  const midnight = new Date(date);
  midnight.setHours(0, 0, 0, 0);
  const points: BodyBatteryPoint[] = [];
  let charge = 30;
  for (let h = 0; h < 24; h++) {
    const ts = new Date(midnight.getTime() + h * 3_600_000);
    if (h < 6)       charge = Math.min(100, charge + 12 + Math.sin(h) * 3);
    else if (h < 7)  charge = Math.max(0, charge - 5);
    else if (h < 13) charge = Math.max(0, charge - 7 + Math.sin(h) * 2);
    else if (h < 14) charge = Math.min(100, charge + 8);
    else             charge = Math.max(0, charge - 6 + Math.sin(h) * 2);
    points.push({ timestamp: ts.toISOString(), charge: Math.round(charge) });
  }
  return points;
}

export function generateMockDailySummaries(
  days: number,
  endDate: Date = new Date(),
): GarminDailySummary[] {
  const summaries: GarminDailySummary[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(endDate);
    d.setDate(d.getDate() - i);
    const calendarDate = d.toISOString().slice(0, 10);
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const steps = Math.round(
      isWeekend ? 9000 + Math.sin(i * 1.3) * 3000 : 7000 + Math.sin(i * 2.1) * 2500,
    );
    summaries.push({
      calendarDate,
      steps,
      activeKcal: Math.round(steps * 0.04 + Math.sin(i * 0.9) * 50),
      totalKcal: Math.round(1800 + steps * 0.05 + Math.sin(i * 0.7) * 100),
      floorsClimbed: Math.round(4 + Math.abs(Math.sin(i * 1.1)) * 8),
      intensityMinutes: Math.round(Math.max(0, 20 + Math.sin(i * 1.5) * 25)),
      restingHeartRate: Math.round(50 + Math.sin(i * 1.7) * 5),
      averageStressLevel: Math.round(30 + Math.sin(i * 1.3) * 20),
    });
  }
  return summaries;
}
