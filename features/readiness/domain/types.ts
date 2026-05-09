import type { Id, DomainEvent } from '@shared/types';

export interface ReadinessEntry {
  userId: Id<'User'>;
  sleep: number;       // 1-10
  energy: number;      // 1-10
  soreness: number;    // 1-10 (higher = more sore)
  mood: number;        // 1-10
  loggedAt: number;
}

export interface ReadinessState {
  entries: ReadinessEntry[];
  healthMetricsEntries: HealthMetricsEntry[];
}

export interface ReadinessLoggedPayload {
  userId: Id<'User'>;
  sleep: number;
  energy: number;
  soreness: number;
  mood: number;
}

export interface LogReadiness {
  type: 'LogReadiness';
  userId: Id<'User'>;
  sleep: number;
  energy: number;
  soreness: number;
  mood: number;
}

// ─── Health Metrics ──────────────────────────────────────────

export interface HealthMetricsEntry {
  id: Id<'HealthMetrics'>;
  userId: Id<'User'>;
  hrv: number | null;           // ms
  restingHr: number | null;     // bpm
  spo2: number | null;          // %
  vo2max: number | null;        // ml/kg/min
  steps: number | null;
  trainingLoad: number | null;  // arbitrary score
  bodyBattery: number | null;   // 0-100
  loggedAt: number;
}

export interface HealthMetricsState {
  entries: HealthMetricsEntry[];
}

export interface HealthMetricsLoggedPayload {
  entryId: Id<'HealthMetrics'>;
  userId: Id<'User'>;
  hrv: number | null;
  restingHr: number | null;
  spo2: number | null;
  vo2max: number | null;
  steps: number | null;
  trainingLoad: number | null;
  bodyBattery: number | null;
}

export interface LogHealthMetrics {
  type: 'LogHealthMetrics';
  userId: Id<'User'>;
  hrv: number | null;
  restingHr: number | null;
  spo2: number | null;
  vo2max: number | null;
  steps: number | null;
  trainingLoad: number | null;
  bodyBattery: number | null;
}

// ─── Sleep ───────────────────────────────────────────────────

export type SleepSource = 'manual' | 'garmin_csv' | 'garmin_api';

export interface SleepEntry {
  id: Id<'Sleep'>;
  userId: Id<'User'>;
  date: string;                     // 'YYYY-MM-DD'
  source: SleepSource;

  // Subjective (manual) — null when entry is Garmin-only
  sleepQuality: number | null;      // 1–10
  energy: number | null;            // 1–10
  soreness: number | null;          // 1–10
  mood: number | null;              // 1–10
  score: number;                    // 0–100; computed by handler (from subjective inputs or sleepScore)

  // Garmin-measured — null when entry is manual-only
  sleepScore: number | null;        // 0–100 Garmin score
  quality: 'Good' | 'Fair' | 'Poor' | null;
  durationMin: number | null;
  deepMin: number | null;
  lightMin: number | null;
  remMin: number | null;
  awakeMin: number | null;
  hrv: number | null;               // ms
  restingHr: number | null;         // bpm
  overnightHr: number | null;       // bpm
  respiration: number | null;       // brpm
  bodyBatteryChange: number | null;
  stressAvg: number | null;
  restlessMoments: number | null;

  loggedAt: number;
}

export interface SleepState {
  entries: SleepEntry[];
}

export interface SleepLoggedPayload {
  entryId: Id<'Sleep'>;
  userId: Id<'User'>;
  date: string;
  source: SleepSource;
  sleepQuality: number | null;
  energy: number | null;
  soreness: number | null;
  mood: number | null;
  score: number;
  sleepScore: number | null;
  quality: 'Good' | 'Fair' | 'Poor' | null;
  durationMin: number | null;
  deepMin: number | null;
  lightMin: number | null;
  remMin: number | null;
  awakeMin: number | null;
  hrv: number | null;
  restingHr: number | null;
  overnightHr: number | null;
  respiration: number | null;
  bodyBatteryChange: number | null;
  stressAvg: number | null;
  restlessMoments: number | null;
}

export interface LogSleep {
  type: 'LogSleep';
  userId: Id<'User'>;
  sleepQuality: number;   // required 1–10 (unchanged)
  energy: number;
  soreness: number;
  mood: number;
}

// Fires a SleepLogged event (same as LogSleep) with source: 'garmin_csv'
export interface ImportSleepFromCSV {
  type: 'ImportSleepFromCSV';
  userId: Id<'User'>;
  csvText: string;
}

// ─── Sleep Trend (UI-only, not persisted) ────────────────────

export interface WeeklySleepTrend {
  weekLabel: string;
  avgScore: number;
  avgQuality: 'Good' | 'Fair' | 'Poor';
  avgDurationMin: number;
  avgSleepNeedMin: number;
  avgBedtime: string;      // e.g. '12:31 AM'
  avgWakeTime: string;     // e.g. '8:30 AM'
}

export type ReadinessEvent =
  | DomainEvent<'ReadinessLogged', ReadinessLoggedPayload>
  | DomainEvent<'HealthMetricsLogged', HealthMetricsLoggedPayload>
  | DomainEvent<'SleepLogged', SleepLoggedPayload>
  | DomainEvent<'RestingHRLogged', RestingHRLoggedPayload>
  | DomainEvent<'SubjectiveRPELogged', SubjectiveRPELoggedPayload>;

export interface RestingHREntry {
  id: Id<'RestingHR'>;
  userId: Id<'User'>;
  bpm: number;
  loggedAt: number;
  date: string;
}

export interface RestingHRLoggedPayload {
  entryId: Id<'RestingHR'>;
  userId: Id<'User'>;
  bpm: number;
  date: string;
  loggedAt: number;
}

export interface LogRestingHR {
  type: 'LogRestingHR';
  userId: Id<'User'>;
  bpm: number;
  date: string;
}

export interface SubjectiveRPEEntry {
  userId: Id<'User'>;
  score: number;
  loggedAt: number;
  date: string;
}

export interface SubjectiveRPELoggedPayload {
  userId: Id<'User'>;
  score: number;
  date: string;
  loggedAt: number;
}

export interface LogSubjectiveRPE {
  type: 'LogSubjectiveRPE';
  userId: Id<'User'>;
  score: number;
}
