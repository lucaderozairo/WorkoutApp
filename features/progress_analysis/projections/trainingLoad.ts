import { eventBus } from '@core/events/bus';
import { viewStore } from '@data/projections/views';
import type { DomainEvent } from '@shared/types';
// eslint-disable-next-line boundaries/element-types, no-restricted-imports -- TODO(arch): cross-layer import baselined; see docs/superpowers/plans/2026-06-03-architecture-rule-enforcement.md
import type { SessionFinishedPayload } from '@features/training_log/domain/types';
import { computeSessionLoad } from '../domain/trainingLoad';
import type { DailyLoad } from '../domain/trainingLoad';

function toISODate(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function mergeLoad(series: DailyLoad[], date: string, load: number): DailyLoad[] {
  const existing = series.find((entry) => entry.date === date);
  if (existing) {
    return series.map((entry) => entry.date === date ? { ...entry, load: entry.load + load } : entry);
  }
  return [...series, { date, load }].sort((a, b) => a.date.localeCompare(b.date)).slice(-28);
}

let registered = false;

export function registerTrainingLoadProjection(): void {
  if (registered) return;
  registered = true;

  viewStore.set('training_load_series', viewStore.get('training_load_series') ?? []);
  viewStore.set('cardio_hr_sessions', viewStore.get('cardio_hr_sessions') ?? []);

  eventBus.subscribe<DomainEvent<'SessionFinished', SessionFinishedPayload>>('SessionFinished', (event) => {
    const date = toISODate(event.payload.finishedAt);
    const durationMinutes = Math.max(
      1,
      Math.round(event.payload.exerciseSummaries.reduce((total, summary) => total + summary.sets.length * 2, 0)),
    );
    const load = computeSessionLoad(durationMinutes, event.payload.sessionRpe);
    const current = viewStore.get('training_load_series') ?? [];
    viewStore.set('training_load_series', mergeLoad(current, date, load));
  });

  eventBus.subscribe<
    DomainEvent<'CardioSessionRecorded', { durationSeconds: number; distanceMeters: number; avgHrBpm?: number; recordedAt?: number; sessionRpe?: number }>
  >('CardioSessionRecorded', (event) => {
    const timestamp = event.payload.recordedAt ?? Date.now();
    const durationMinutes = Math.max(1, Math.round((event.payload.durationSeconds ?? 0) / 60));
    const load = computeSessionLoad(durationMinutes, event.payload.sessionRpe);
    const current = viewStore.get('training_load_series') ?? [];
    viewStore.set('training_load_series', mergeLoad(current, toISODate(timestamp), load));

    if (event.payload.avgHrBpm) {
      const hrSessions = viewStore.get('cardio_hr_sessions') ?? [];
      viewStore.set('cardio_hr_sessions', [
        ...hrSessions,
        { avgHrBpm: event.payload.avgHrBpm, durationMinutes },
      ]);
    }
  });
}
