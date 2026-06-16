import type { Id } from '@shared/types';
import type { DataSourceKind } from '@shared/contracts';
import type {
  ReadinessEvent,
  ReadinessLoggedPayload,
  HealthMetricsLoggedPayload,
  SleepLoggedPayload,
  SleepSource,
  RestingHRLoggedPayload,
  SubjectiveRPELoggedPayload,
} from './types';

export interface TodayReadinessView {
  score: number;
  sleep: number;
  energy: number;
  soreness: number;
  mood: number;
  hasEntry: boolean;
  source: DataSourceKind;
}

export interface HealthMetricsView {
  id: string;
  hrv: number | null;
  restingHr: number | null;
  spo2: number | null;
  vo2max: number | null;
  steps: number | null;
  trainingLoad: number | null;
  bodyBattery: number | null;
  loggedAt: number;
}

export interface SleepEntryView {
  id: Id<'Sleep'>;
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
  loggedAt: number;
}

export interface RestingHRView {
  id: Id<'RestingHR'>;
  bpm: number;
  date: string;
  loggedAt: number;
}

export interface SubjectiveRPEView {
  score: number;
  date: string;
  loggedAt: number;
}

export function applyReadinessLogged(_state: TodayReadinessView, event: ReadinessEvent): TodayReadinessView {
  if (event.type !== 'ReadinessLogged') return _state;
  const p = event.payload as ReadinessLoggedPayload;
  const { sleep, energy, soreness, mood } = p;
  const score = Math.round(((sleep + energy + (10 - soreness) + mood) / 40) * 100);
  return { score, sleep, energy, soreness, mood, hasEntry: true, source: 'manual' };
}

export function applyHealthMetricsLogged(state: HealthMetricsView[], event: ReadinessEvent): HealthMetricsView[] {
  if (event.type !== 'HealthMetricsLogged') return state;
  const p = event.payload as HealthMetricsLoggedPayload;
  const entry: HealthMetricsView = {
    id: p.entryId,
    hrv: p.hrv,
    restingHr: p.restingHr,
    spo2: p.spo2,
    vo2max: p.vo2max,
    steps: p.steps,
    trainingLoad: p.trainingLoad,
    bodyBattery: p.bodyBattery,
    loggedAt: event.timestamp,
  };
  return [entry, ...state].slice(0, 30);
}

export function applySleepLogged(state: SleepEntryView[], event: ReadinessEvent): SleepEntryView[] {
  if (event.type !== 'SleepLogged') return state;
  const p = event.payload as SleepLoggedPayload;
  const entry: SleepEntryView = {
    id: p.entryId,
    date: p.date,
    source: p.source,
    sleepQuality: p.sleepQuality,
    energy: p.energy,
    soreness: p.soreness,
    mood: p.mood,
    score: p.score,
    sleepScore: p.sleepScore,
    quality: p.quality,
    durationMin: p.durationMin,
    deepMin: p.deepMin,
    lightMin: p.lightMin,
    remMin: p.remMin,
    awakeMin: p.awakeMin,
    hrv: p.hrv,
    restingHr: p.restingHr,
    overnightHr: p.overnightHr,
    respiration: p.respiration,
    bodyBatteryChange: p.bodyBatteryChange,
    stressAvg: p.stressAvg,
    restlessMoments: p.restlessMoments,
    loggedAt: event.timestamp,
  };
  return [entry, ...state].slice(0, 50);
}

export function applyRestingHRLogged(state: RestingHRView[], event: ReadinessEvent): RestingHRView[] {
  if (event.type !== 'RestingHRLogged') return state;
  const payload = event.payload as RestingHRLoggedPayload;
  return [
    {
      id: payload.entryId,
      bpm: payload.bpm,
      date: payload.date,
      loggedAt: payload.loggedAt,
    },
    ...state,
  ].slice(0, 30);
}

export function applySubjectiveRPELogged(state: SubjectiveRPEView[], event: ReadinessEvent): SubjectiveRPEView[] {
  if (event.type !== 'SubjectiveRPELogged') return state;
  const payload = event.payload as SubjectiveRPELoggedPayload;
  return [
    {
      score: payload.score,
      date: payload.date,
      loggedAt: payload.loggedAt,
    },
    ...state.filter((entry) => entry.date !== payload.date),
  ].slice(0, 30);
}
