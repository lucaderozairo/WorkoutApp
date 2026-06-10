import { defineCommand } from '@data/define-command';
import { viewStore } from '@data/projections/views';
import { cryptoIdGenerator } from '@core/id-generator';
import { systemClock } from '@core/clock';
import type { Id } from '@shared/types';
import type { InsightEvent } from '../domain/types';
import { insightsProjection } from '../projections';

function applyAndStore(events: InsightEvent[]): void {
  events.forEach(e => insightsProjection.apply(e));
  viewStore.set('insights', insightsProjection.getState());
}

const handleEmitPRAchieved = defineCommand<{ exerciseId: Id<'Exercise'>; sport: string | undefined; message: string }>({
  execute: async ({ exerciseId, sport, message }) => {
  const event: InsightEvent = {
    type: 'PRAchieved',
    aggregateId: exerciseId as unknown as Id,
    aggregateType: 'Exercise',
    timestamp: systemClock.now(),
    version: 1,
    payload: { insightId: cryptoIdGenerator.next<'Insight'>(), exerciseId, sport, message },
  };
  applyAndStore([event]);
  return { events: [event] };
  },
});

export function emitPRAchieved(exerciseId: Id<'Exercise'>, sport: string | undefined, message: string): Promise<void> {
  return handleEmitPRAchieved({ exerciseId, sport, message });
}

const handleEmitPlateauDetected = defineCommand<{ exerciseId: Id<'Exercise'>; message: string }>({
  execute: async ({ exerciseId, message }) => {
  const event: InsightEvent = {
    type: 'PlateauDetected',
    aggregateId: exerciseId as unknown as Id,
    aggregateType: 'Exercise',
    timestamp: systemClock.now(),
    version: 1,
    payload: { insightId: cryptoIdGenerator.next<'Insight'>(), exerciseId, message },
  };
  applyAndStore([event]);
  return { events: [event] };
  },
});

export function emitPlateauDetected(exerciseId: Id<'Exercise'>, message: string): Promise<void> {
  return handleEmitPlateauDetected({ exerciseId, message });
}

const handleEmitVolumeSpike = defineCommand<{ sport: string | undefined; message: string }>({
  execute: async ({ sport, message }) => {
  const event: InsightEvent = {
    type: 'VolumeSpike',
    aggregateId: cryptoIdGenerator.next(),
    aggregateType: 'User',
    timestamp: systemClock.now(),
    version: 1,
    payload: { insightId: cryptoIdGenerator.next<'Insight'>(), sport, message },
  };
  applyAndStore([event]);
  return { events: [event] };
  },
});

export function emitVolumeSpike(sport: string | undefined, message: string): Promise<void> {
  return handleEmitVolumeSpike({ sport, message });
}

const handleEmitFrequencyDrop = defineCommand<{ sport: string | undefined; message: string }>({
  execute: async ({ sport, message }) => {
  const event: InsightEvent = {
    type: 'FrequencyDrop',
    aggregateId: cryptoIdGenerator.next(),
    aggregateType: 'User',
    timestamp: systemClock.now(),
    version: 1,
    payload: { insightId: cryptoIdGenerator.next<'Insight'>(), sport, message },
  };
  applyAndStore([event]);
  return { events: [event] };
  },
});

export function emitFrequencyDrop(sport: string | undefined, message: string): Promise<void> {
  return handleEmitFrequencyDrop({ sport, message });
}

const handleEmitOvertrainingRisk = defineCommand<{ message: string }>({
  execute: async ({ message }) => {
  const event: InsightEvent = {
    type: 'OvertrainingRisk',
    aggregateId: cryptoIdGenerator.next(),
    aggregateType: 'User',
    timestamp: systemClock.now(),
    version: 1,
    payload: { insightId: cryptoIdGenerator.next<'Insight'>(), message },
  };
  applyAndStore([event]);
  return { events: [event] };
  },
});

export function emitOvertrainingRisk(message: string): Promise<void> {
  return handleEmitOvertrainingRisk({ message });
}
