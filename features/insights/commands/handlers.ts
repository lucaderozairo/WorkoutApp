import { inMemoryEventStore } from '@data/store';
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

export async function emitPRAchieved(exerciseId: Id<'Exercise'>, sport: string | undefined, message: string): Promise<void> {
  const event: InsightEvent = {
    type: 'PRAchieved',
    aggregateId: exerciseId as unknown as Id,
    aggregateType: 'Exercise',
    timestamp: systemClock.now(),
    version: 1,
    payload: { insightId: cryptoIdGenerator.next<'Insight'>(), exerciseId, sport, message },
  };
  await inMemoryEventStore.append(event);
  applyAndStore([event]);
}

export async function emitPlateauDetected(exerciseId: Id<'Exercise'>, message: string): Promise<void> {
  const event: InsightEvent = {
    type: 'PlateauDetected',
    aggregateId: exerciseId as unknown as Id,
    aggregateType: 'Exercise',
    timestamp: systemClock.now(),
    version: 1,
    payload: { insightId: cryptoIdGenerator.next<'Insight'>(), exerciseId, message },
  };
  await inMemoryEventStore.append(event);
  applyAndStore([event]);
}

export async function emitVolumeSpike(sport: string | undefined, message: string): Promise<void> {
  const event: InsightEvent = {
    type: 'VolumeSpike',
    aggregateId: cryptoIdGenerator.next(),
    aggregateType: 'User',
    timestamp: systemClock.now(),
    version: 1,
    payload: { insightId: cryptoIdGenerator.next<'Insight'>(), sport, message },
  };
  await inMemoryEventStore.append(event);
  applyAndStore([event]);
}

export async function emitFrequencyDrop(sport: string | undefined, message: string): Promise<void> {
  const event: InsightEvent = {
    type: 'FrequencyDrop',
    aggregateId: cryptoIdGenerator.next(),
    aggregateType: 'User',
    timestamp: systemClock.now(),
    version: 1,
    payload: { insightId: cryptoIdGenerator.next<'Insight'>(), sport, message },
  };
  await inMemoryEventStore.append(event);
  applyAndStore([event]);
}

export async function emitOvertrainingRisk(message: string): Promise<void> {
  const event: InsightEvent = {
    type: 'OvertrainingRisk',
    aggregateId: cryptoIdGenerator.next(),
    aggregateType: 'User',
    timestamp: systemClock.now(),
    version: 1,
    payload: { insightId: cryptoIdGenerator.next<'Insight'>(), message },
  };
  await inMemoryEventStore.append(event);
  applyAndStore([event]);
}
