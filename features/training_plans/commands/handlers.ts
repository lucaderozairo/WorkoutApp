// features/training_plans/commands/handlers.ts
import { defineCommand } from '@data/define-command';
import { generateId } from '@shared/utils';
import { systemClock } from '@core/clock';
import type { Id } from '@shared/types';
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

export const handleCreatePlan = defineCommand<CreatePlan, Id<'Plan'>>({
  execute: async (cmd) => {
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
    return {
      result: planId,
      events: [{
        type: 'PlanCreated',
        aggregateId: planId,
        aggregateType: 'TrainingPlan',
        timestamp: systemClock.now(),
        version: 1,
        payload,
      }],
    };
  },
});

export const handleUpdatePlan = defineCommand<UpdatePlan>({
  execute: async (cmd) => {
    const payload: PlanUpdatedPayload = {
      planId: cmd.planId,
      name: cmd.name,
      startDate: cmd.startDate,
      durationWeeks: cmd.durationWeeks,
    };
    return {
      events: [{
        type: 'PlanUpdated',
        aggregateId: cmd.planId,
        aggregateType: 'TrainingPlan',
        timestamp: systemClock.now(),
        version: 1,
        payload,
      }],
    };
  },
});

export const handleAssignWorkoutToDay = defineCommand<AssignWorkoutToDay>({
  execute: async (cmd) => {
    const payload: DayAssignedPayload = {
      planId: cmd.planId,
      weekNumber: cmd.weekNumber,
      dayOfWeek: cmd.dayOfWeek,
      assignment: cmd.assignment,
    };
    return {
      events: [{
        type: 'DayAssigned',
        aggregateId: cmd.planId,
        aggregateType: 'TrainingPlan',
        timestamp: systemClock.now(),
        version: 1,
        payload,
      }],
    };
  },
});

export const handleDeletePlan = defineCommand<DeletePlan>({
  execute: async (cmd) => {
    const payload: PlanDeletedPayload = { planId: cmd.planId };
    return {
      events: [{
        type: 'PlanDeleted',
        aggregateId: cmd.planId,
        aggregateType: 'TrainingPlan',
        timestamp: systemClock.now(),
        version: 1,
        payload,
      }],
    };
  },
});
