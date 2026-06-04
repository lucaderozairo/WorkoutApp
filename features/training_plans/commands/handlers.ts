// features/training_plans/commands/handlers.ts
import { eventBus } from '@core/events/bus';
import { generateId } from '@shared/utils';
import { systemClock } from '@core/clock';
import type { Id } from '@shared/types';
import { TrainingPlansEvents } from '../contract';
import type {
  CreatePlan, UpdatePlan, AssignWorkoutToDay, DeletePlan,
  PlanCreatedPayload, PlanUpdatedPayload, DayAssignedPayload,
  PlanDeletedPayload, PlanWeek, DayOfWeek, PlanDayAssignment,
} from '../domain/types';

/** Builds the full week structure from durationWeeks using rest as default. */
function buildInitialWeeks(durationWeeks: number): PlanWeek[] {
  return Array.from({ length: durationWeeks }, (_, i) => ({
    weekNumber: i + 1,
    days: ([0, 1, 2, 3, 4, 5, 6] as DayOfWeek[]).map(dayOfWeek => ({
      dayOfWeek,
      assignment: { type: 'rest' } as PlanDayAssignment,
    })),
  }));
}

export async function handleCreatePlan(cmd: CreatePlan): Promise<Id<'Plan'>> {
  const planId = generateId<'Plan'>();
  const payload: PlanCreatedPayload = {
    planId,
    userId: cmd.userId,
    name: cmd.name,
    startDate: cmd.startDate,
    durationWeeks: cmd.durationWeeks,
    weeks: buildInitialWeeks(cmd.durationWeeks),
    createdAt: systemClock.now(),
  };
  await eventBus.publish({
    type: TrainingPlansEvents.PlanCreated,
    aggregateId: planId,
    aggregateType: 'TrainingPlan',
    timestamp: systemClock.now(),
    version: 1,
    payload,
  });
  return planId;
}

export async function handleUpdatePlan(cmd: UpdatePlan): Promise<void> {
  const payload: PlanUpdatedPayload = {
    planId: cmd.planId,
    name: cmd.name,
    startDate: cmd.startDate,
    durationWeeks: cmd.durationWeeks,
  };
  await eventBus.publish({
    type: TrainingPlansEvents.PlanUpdated,
    aggregateId: cmd.planId,
    aggregateType: 'TrainingPlan',
    timestamp: systemClock.now(),
    version: 1,
    payload,
  });
}

export async function handleAssignWorkoutToDay(cmd: AssignWorkoutToDay): Promise<void> {
  const payload: DayAssignedPayload = {
    planId: cmd.planId,
    weekNumber: cmd.weekNumber,
    dayOfWeek: cmd.dayOfWeek,
    assignment: cmd.assignment,
  };
  await eventBus.publish({
    type: TrainingPlansEvents.DayAssigned,
    aggregateId: cmd.planId,
    aggregateType: 'TrainingPlan',
    timestamp: systemClock.now(),
    version: 1,
    payload,
  });
}

export async function handleDeletePlan(cmd: DeletePlan): Promise<void> {
  const payload: PlanDeletedPayload = { planId: cmd.planId };
  await eventBus.publish({
    type: TrainingPlansEvents.PlanDeleted,
    aggregateId: cmd.planId,
    aggregateType: 'TrainingPlan',
    timestamp: systemClock.now(),
    version: 1,
    payload,
  });
}
