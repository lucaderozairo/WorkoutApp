import { defineCommand } from '@data/define-command';
import { viewStore } from '@data/projections/views';
import { cryptoIdGenerator } from '@core/id-generator';
import { systemClock } from '@core/clock';
import type { Id } from '@shared/types';
import type { InsightEvent, InsightType } from '../domain/types';
import { insightsProjection } from '../projections';

export interface EmitInsightInput {
  type: InsightType;
  title: string;
  message: string;
  sport?: string;
  exerciseId?: Id<'Exercise'>;
}

function applyAndStore(event: InsightEvent): void {
  insightsProjection.apply(event);
  viewStore.set('insights', insightsProjection.getState());
}

/**
 * The single insight write-path. Every insight kind flows through here: the
 * `type` discriminates the event (and, downstream, its severity); the rest is
 * the shared payload.
 */
const handleEmitInsight = defineCommand<EmitInsightInput>({
  execute: async ({ type, title, message, sport, exerciseId }) => {
    const event: InsightEvent = {
      type,
      aggregateId: (exerciseId as unknown as Id) ?? cryptoIdGenerator.next(),
      aggregateType: exerciseId ? 'Exercise' : 'User',
      timestamp: systemClock.now(),
      version: 1,
      payload: {
        insightId: cryptoIdGenerator.next<'Insight'>(),
        title,
        message,
        sport,
        exerciseId,
      },
    };
    applyAndStore(event);
    return { events: [event] };
  },
});

export function emitInsight(input: EmitInsightInput): Promise<void> {
  return handleEmitInsight(input);
}
