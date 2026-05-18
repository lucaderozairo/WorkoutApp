import type { Id } from '@shared/types';
import type { SleepEntryView, RestingHRView, SubjectiveRPEView } from '../projections';
import type { SleepSession } from '../domain/mock-types';
import { viewStore } from '@data/projections/views';

// ─── Queries ─────────────────────────────────────────────────

export function getTodayReadiness(): { score: number; sleep: number; energy: number; soreness: number; mood: number; hasEntry: boolean } | null {
  return viewStore.get('today_readiness') ?? null;
}

export function getSleepHistory(): SleepEntryView[] {
  return viewStore.get('sleep_history') ?? [];
}

export function getHealthMetrics(): Array<{
  id: string;
  hrv: number | null;
  restingHr: number | null;
  spo2: number | null;
  vo2max: number | null;
  steps: number | null;
  trainingLoad: number | null;
  bodyBattery: number | null;
  loggedAt: number;
}> {
  return viewStore.get('health_metrics') ?? [];
}

export function getRestingHRHistory(): RestingHRView[] {
  return viewStore.get('resting_hr_history') ?? [];
}

export function getSubjectiveRPEHistory(): SubjectiveRPEView[] {
  return viewStore.get('subjective_rpe_history') ?? [];
}

export function getTodaySubjectiveRPE(): number | null {
  const today = new Date().toISOString().slice(0, 10);
  return getSubjectiveRPEHistory().find((entry) => entry.date === today)?.score ?? null;
}

export function sleepEntryToSession(entry: SleepEntryView): SleepSession {
  const end = new Date(entry.date);
  end.setHours(6, 30, 0, 0);
  const durationMs = (entry.durationMin ?? 0) * 60_000;
  return {
    start: new Date(end.getTime() - durationMs),
    end,
    score: entry.score,
    stages: {
      deep: entry.deepMin ?? 0,
      light: entry.lightMin ?? 0,
      rem: entry.remMin ?? 0,
      awake: entry.awakeMin ?? 0,
    },
  };
}
