// features/training_plans/policies/trackAdherence.ts
import { eventBus } from '@core/events/bus';
import { viewStore } from '@data/projections/views';
import type { DomainEvent } from '@shared/types';
// eslint-disable-next-line boundaries/element-types -- TODO(arch): cross-layer import baselined; see docs/superpowers/plans/2026-06-03-architecture-rule-enforcement.md
import type { SessionFinishedPayload } from '@features/training_log/domain/types';
import type { TrainingPlan, PlannedSessionCompletedPayload } from '../domain/types';
import { TrainingPlansEvents } from '../contract';

/** Returns 'YYYY-MM-DD' for a unix-ms timestamp. */
function toISODate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Returns 0 (Mon) … 6 (Sun) from a JS Date. JS getDay() returns 0=Sun, so we shift. */
function toDayOfWeek(ms: number): 0 | 1 | 2 | 3 | 4 | 5 | 6 {
  const jsDay = new Date(ms).getDay(); // 0=Sun, 1=Mon, …, 6=Sat
  return ((jsDay + 6) % 7) as 0 | 1 | 2 | 3 | 4 | 5 | 6;
}

let registered = false;

export function registerAdherencePolicy(): void {
  if (registered) return;
  registered = true;

  eventBus.subscribe<DomainEvent<'SessionFinished', SessionFinishedPayload>>(
    'SessionFinished',
    async (event) => {
      const plan = viewStore.get<TrainingPlan | null>('active_plan');
      if (!plan) return;

      const now = event.payload.finishedAt;
      const todayIso = toISODate(now);
      const todayDow = toDayOfWeek(now);

      // Which week is today relative to plan start?
      const startMs = new Date(plan.startDate).getTime();
      const diffDays = Math.floor((now - startMs) / 86_400_000);
      if (diffDays < 0) return; // session before plan started
      const weekIndex = Math.floor(diffDays / 7);
      if (weekIndex >= plan.durationWeeks) return; // plan finished

      const week = plan.weeks[weekIndex];
      if (!week) return;

      const planDay = week.days.find(d => d.dayOfWeek === todayDow);
      if (!planDay || planDay.assignment.type === 'rest') return;

      const payload: PlannedSessionCompletedPayload = {
        planId: plan.id,
        date: todayIso,
        sessionId: event.payload.sessionId,
      };
      await eventBus.publish({
        type: TrainingPlansEvents.PlannedSessionCompleted,
        aggregateId: plan.id,
        aggregateType: 'TrainingPlan',
        timestamp: now,
        version: 1,
        payload,
      });
    }
  );
}
