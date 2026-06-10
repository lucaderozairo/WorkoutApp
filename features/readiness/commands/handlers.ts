import type { Result } from '@shared/types';
import { ok, err } from '@shared/types';
import type {
  LogReadiness,
  LogHealthMetrics,
  LogSleep,
  ReadinessEvent,
  LogRestingHR,
  RestingHRLoggedPayload,
  LogSubjectiveRPE,
  SubjectiveRPELoggedPayload,
  ImportSleepFromCSV,
} from '../domain/types';
import { cryptoIdGenerator } from '@core/id-generator';
import { systemClock } from '@core/clock';
import { parseGarminSleepCSV } from '../domain/parseGarminSleepCSV';
import { defineCommand } from '@data/define-command';
import { projectionRegistry } from '@data/projections/builders';
import { viewStore } from '@data/projections/views';
import {
  todayReadinessProjection,
  healthMetricsProjection,
  sleepHistoryProjection,
  restingHRProjection,
  subjectiveRPEProjection,
} from '../projections';

projectionRegistry.register('today_readiness', todayReadinessProjection);
projectionRegistry.register('health_metrics', healthMetricsProjection);
projectionRegistry.register('sleep_history', sleepHistoryProjection);
projectionRegistry.register('resting_hr_history', restingHRProjection);
projectionRegistry.register('subjective_rpe_history', subjectiveRPEProjection);

export const handleLogReadiness = defineCommand<LogReadiness, Result<void, string>>({
  execute: async (cmd) => {
    for (const field of ['sleep', 'energy', 'soreness', 'mood'] as const) {
      if (cmd[field] < 1 || cmd[field] > 10) return { events: [], result: err(`${field} must be between 1 and 10`) };
    }

    const events: ReadinessEvent[] = [{
      type: 'ReadinessLogged',
      aggregateId: cmd.userId,
      aggregateType: 'User',
      timestamp: systemClock.now(),
      version: 1,
      payload: {
        userId: cmd.userId,
        sleep: cmd.sleep,
        energy: cmd.energy,
        soreness: cmd.soreness,
        mood: cmd.mood,
      },
    }];

    events.forEach(e => todayReadinessProjection.apply(e));
    viewStore.set('today_readiness', todayReadinessProjection.getState());
    return { events, result: ok(undefined) };
  },
});

export const handleLogHealthMetrics = defineCommand<LogHealthMetrics, Result<void, string>>({
  execute: async (cmd) => {
    if (cmd.hrv !== null && cmd.hrv < 0) return { events: [], result: err('HRV must be non-negative') };
    if (cmd.restingHr !== null && (cmd.restingHr < 20 || cmd.restingHr > 200)) return { events: [], result: err('Resting HR must be between 20 and 200') };
    if (cmd.spo2 !== null && (cmd.spo2 < 50 || cmd.spo2 > 100)) return { events: [], result: err('SpO2 must be between 50 and 100') };
    if (cmd.vo2max !== null && cmd.vo2max < 0) return { events: [], result: err('VO2 max must be non-negative') };
    if (cmd.steps !== null && cmd.steps < 0) return { events: [], result: err('Steps must be non-negative') };
    if (cmd.bodyBattery !== null && (cmd.bodyBattery < 0 || cmd.bodyBattery > 100)) return { events: [], result: err('Body battery must be between 0 and 100') };

    const entryId = cryptoIdGenerator.next<'HealthMetrics'>();

    const events: ReadinessEvent[] = [{
      type: 'HealthMetricsLogged',
      aggregateId: cmd.userId,
      aggregateType: 'User',
      timestamp: systemClock.now(),
      version: 1,
      payload: {
        entryId,
        userId: cmd.userId,
        hrv: cmd.hrv,
        restingHr: cmd.restingHr,
        spo2: cmd.spo2,
        vo2max: cmd.vo2max,
        steps: cmd.steps,
        trainingLoad: cmd.trainingLoad,
        bodyBattery: cmd.bodyBattery,
      },
    }];

    events.forEach(e => healthMetricsProjection.apply(e));
    viewStore.set('health_metrics', healthMetricsProjection.getState());
    return { events, result: ok(undefined) };
  },
});

export const handleLogSleep = defineCommand<LogSleep, Result<void, string>>({
  execute: async (cmd) => {
    for (const [field, value] of [['sleepQuality', cmd.sleepQuality], ['energy', cmd.energy], ['soreness', cmd.soreness], ['mood', cmd.mood]] as const) {
      if (value < 1 || value > 10) return { events: [], result: err(`${field} must be between 1 and 10`) };
    }

    const entryId = cryptoIdGenerator.next<'Sleep'>();
    // Score: average of sleepQuality, energy, (10 - soreness), mood mapped to 0-100.
    const score = Math.round(((cmd.sleepQuality + cmd.energy + (10 - cmd.soreness) + cmd.mood) / 40) * 100);
    const date = new Date().toISOString().slice(0, 10);

    const events: ReadinessEvent[] = [{
      type: 'SleepLogged',
      aggregateId: cmd.userId,
      aggregateType: 'User',
      timestamp: systemClock.now(),
      version: 1,
      payload: {
        entryId,
        userId: cmd.userId,
        date,
        source: 'manual',
        sleepQuality: cmd.sleepQuality,
        energy: cmd.energy,
        soreness: cmd.soreness,
        mood: cmd.mood,
        score,
        sleepScore: null,
        quality: null,
        durationMin: null,
        deepMin: null,
        lightMin: null,
        remMin: null,
        awakeMin: null,
        hrv: null,
        restingHr: null,
        overnightHr: null,
        respiration: null,
        bodyBatteryChange: null,
        stressAvg: null,
        restlessMoments: null,
      },
    }];

    events.forEach(e => sleepHistoryProjection.apply(e));
    viewStore.set('sleep_history', sleepHistoryProjection.getState());
    return { events, result: ok(undefined) };
  },
});

export const handleImportSleepFromCSV = defineCommand<ImportSleepFromCSV, Result<void, string>>({
  execute: async (cmd) => {
    if (!cmd.csvText.trim()) return { events: [], result: err('CSV text is empty') };
    const parsed = parseGarminSleepCSV(cmd.csvText);
    if (!parsed.date) return { events: [], result: err('Could not parse date from CSV - is this a Garmin single-day sleep export?') };

    const entryId = cryptoIdGenerator.next<'Sleep'>();

    const events: ReadinessEvent[] = [{
      type: 'SleepLogged',
      aggregateId: cmd.userId,
      aggregateType: 'User',
      timestamp: systemClock.now(),
      version: 1,
      payload: {
        entryId,
        userId: cmd.userId,
        date: parsed.date,
        source: 'garmin_csv',
        sleepQuality: null,
        energy: null,
        soreness: null,
        mood: null,
        score: parsed.sleepScore ?? 0,
        sleepScore: parsed.sleepScore,
        quality: parsed.quality,
        durationMin: parsed.durationMin,
        deepMin: parsed.deepMin,
        lightMin: parsed.lightMin,
        remMin: parsed.remMin,
        awakeMin: parsed.awakeMin,
        hrv: parsed.hrv,
        restingHr: parsed.restingHr,
        overnightHr: parsed.overnightHr,
        respiration: parsed.respiration,
        bodyBatteryChange: parsed.bodyBatteryChange,
        stressAvg: parsed.stressAvg,
        restlessMoments: parsed.restlessMoments,
      },
    }];

    events.forEach(e => sleepHistoryProjection.apply(e));
    viewStore.set('sleep_history', sleepHistoryProjection.getState());
    return { events, result: ok(undefined) };
  },
});

export const handleLogRestingHR = defineCommand<LogRestingHR, Result<void, string>>({
  execute: async (cmd) => {
    if (cmd.bpm < 20 || cmd.bpm > 200) return { events: [], result: err('Resting HR must be between 20 and 200') };

    const entryId = cryptoIdGenerator.next<'RestingHR'>();
    const payload: RestingHRLoggedPayload = {
      entryId,
      userId: cmd.userId,
      bpm: cmd.bpm,
      date: cmd.date,
      loggedAt: systemClock.now(),
    };

    const event: ReadinessEvent = {
      type: 'RestingHRLogged',
      aggregateId: cmd.userId,
      aggregateType: 'User',
      timestamp: payload.loggedAt,
      version: 1,
      payload,
    };

    restingHRProjection.apply(event);
    viewStore.set('resting_hr_history', restingHRProjection.getState());
    return { events: [event], result: ok(undefined) };
  },
});

export const handleLogSubjectiveRPE = defineCommand<LogSubjectiveRPE, Result<void, string>>({
  execute: async (cmd) => {
    if (cmd.score < 1 || cmd.score > 5) return { events: [], result: err('Subjective score must be between 1 and 5') };

    const payload: SubjectiveRPELoggedPayload = {
      userId: cmd.userId,
      score: cmd.score,
      date: new Date().toISOString().slice(0, 10),
      loggedAt: systemClock.now(),
    };

    const event: ReadinessEvent = {
      type: 'SubjectiveRPELogged',
      aggregateId: cmd.userId,
      aggregateType: 'User',
      timestamp: payload.loggedAt,
      version: 1,
      payload,
    };

    subjectiveRPEProjection.apply(event);
    viewStore.set('subjective_rpe_history', subjectiveRPEProjection.getState());
    return { events: [event], result: ok(undefined) };
  },
});
