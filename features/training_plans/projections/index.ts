// features/training_plans/projections/index.ts
import { eventBus } from '@core/events/bus';
import { ProjectionBuilder, projectionRegistry } from '@data/projections/builders';
import { viewStore } from '@data/projections/views';
import type { DomainEvent } from '@shared/types';
import type {
  TrainingPlanEvent,
  TrainingPlan, PlanAdherence,
  PlanCreatedPayload, PlanUpdatedPayload, DayAssignedPayload,
  PlanDeletedPayload, PlannedSessionCompletedPayload, PlannedSessionSkippedPayload,
} from '../domain/types';

// ─── Active Plan Projection ───────────────────────────────────

export const activePlanProjection = new ProjectionBuilder<TrainingPlan | null, TrainingPlanEvent>('active_plan', null, {
  PlanCreated: (_state, event) => {
    const p = event.payload;
    return {
      id: p.planId,
      userId: p.userId,
      name: p.name,
      startDate: p.startDate,
      durationWeeks: p.durationWeeks,
      weeks: p.weeks,
      createdAt: p.createdAt,
    };
  },
  PlanUpdated: (state, event) => {
    if (!state) return null;
    const p = event.payload;
    return {
      ...state,
      name: p.name ?? state.name,
      startDate: p.startDate ?? state.startDate,
      durationWeeks: p.durationWeeks ?? state.durationWeeks,
    };
  },
  DayAssigned: (state, event) => {
    if (!state) return null;
    const { weekNumber, dayOfWeek, assignment } = event.payload;
    return {
      ...state,
      weeks: state.weeks.map(week =>
        week.weekNumber === weekNumber
          ? {
              ...week,
              days: week.days.map(day =>
                day.dayOfWeek === dayOfWeek ? { ...day, assignment } : day
              ),
            }
          : week
      ),
    };
  },
  PlanDeleted: (_state, _event) => null,
});

// ─── Plan List Projection ─────────────────────────────────────

export const planListProjection = new ProjectionBuilder<TrainingPlan[], TrainingPlanEvent>('plan_list', [], {
  PlanCreated: (state, event) => {
    const p = event.payload;
    const plan: TrainingPlan = {
      id: p.planId,
      userId: p.userId,
      name: p.name,
      startDate: p.startDate,
      durationWeeks: p.durationWeeks,
      weeks: p.weeks,
      createdAt: p.createdAt,
    };
    return [...state, plan];
  },
  PlanUpdated: (state, event) => {
    const p = event.payload;
    return state.map(plan =>
      plan.id === p.planId
        ? {
            ...plan,
            name: p.name ?? plan.name,
            startDate: p.startDate ?? plan.startDate,
            durationWeeks: p.durationWeeks ?? plan.durationWeeks,
          }
        : plan
    );
  },
  DayAssigned: (state, event) => {
    const { planId, weekNumber, dayOfWeek, assignment } = event.payload;
    return state.map(plan =>
      plan.id === planId
        ? {
            ...plan,
            weeks: plan.weeks.map(week =>
              week.weekNumber === weekNumber
                ? {
                    ...week,
                    days: week.days.map(day =>
                      day.dayOfWeek === dayOfWeek ? { ...day, assignment } : day
                    ),
                  }
                : week
            ),
          }
        : plan
    );
  },
  PlanDeleted: (state, event) =>
    state.filter(p => p.id !== event.payload.planId),
});

// ─── Plan Adherence Projection ────────────────────────────────

const DEFAULT_ADHERENCE: PlanAdherence = {
  planId: '' as any,
  completed: 0,
  scheduled: 0,
  adherenceRate: 1,
  currentStreak: 0,
  missedDays: [],
};

export const planAdherenceProjection = new ProjectionBuilder<PlanAdherence, TrainingPlanEvent>('plan_adherence', DEFAULT_ADHERENCE, {
  PlanCreated: (_state, event) => ({
    ...DEFAULT_ADHERENCE,
    planId: event.payload.planId,
  }),
  PlannedSessionCompleted: (state, event) => {
    if (!state) return state;
    const completed = state.completed + 1;
    const scheduled = state.scheduled + 1;
    return {
      ...state,
      completed,
      scheduled,
      adherenceRate: completed / scheduled,
      currentStreak: state.currentStreak + 1,
    };
  },
  PlannedSessionSkipped: (state, event) => {
    if (!state) return state;
    const scheduled = state.scheduled + 1;
    return {
      ...state,
      scheduled,
      adherenceRate: state.completed / scheduled,
      currentStreak: 0,
      missedDays: [...state.missedDays, event.payload.date],
    };
  },
  PlanDeleted: (_state, _event) => ({ ...DEFAULT_ADHERENCE }),
});

/** Registers all training_plans projections with the ViewStore. Call once at app boot. */
let registered = false;

export function registerTrainingPlanProjections(): void {
  if (registered) return;
  registered = true;

  projectionRegistry.register('active_plan', activePlanProjection);
  projectionRegistry.register('plan_list', planListProjection);
  projectionRegistry.register('plan_adherence', planAdherenceProjection);
  viewStore.set('active_plan', activePlanProjection.getState());
  viewStore.set('plan_list', planListProjection.getState());
  viewStore.set('plan_adherence', planAdherenceProjection.getState());

  const sync = (event: TrainingPlanEvent) => {
    activePlanProjection.apply(event);
    planListProjection.apply(event);
    planAdherenceProjection.apply(event);
    viewStore.set('active_plan', activePlanProjection.getState());
    viewStore.set('plan_list', planListProjection.getState());
    viewStore.set('plan_adherence', planAdherenceProjection.getState());
  };

  eventBus.subscribe<DomainEvent<'PlanCreated', object>>('PlanCreated', (event) => sync(event as TrainingPlanEvent));
  eventBus.subscribe('PlanUpdated', (event) => sync(event as TrainingPlanEvent));
  eventBus.subscribe('DayAssigned', (event) => sync(event as TrainingPlanEvent));
  eventBus.subscribe('PlanDeleted', (event) => sync(event as TrainingPlanEvent));
  eventBus.subscribe('PlannedSessionCompleted', (event) => sync(event as TrainingPlanEvent));
  eventBus.subscribe('PlannedSessionSkipped', (event) => sync(event as TrainingPlanEvent));
}
