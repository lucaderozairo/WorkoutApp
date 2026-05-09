// features/training_plans/domain/types.ts
import type { Id, DomainEvent } from '@shared/types';

// ─── Core domain types ────────────────────────────────────────

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Monday

export type PlanDayAssignment =
  | { type: 'workout'; blueprintId: string; blueprintName: string }
  | { type: 'cardio'; activityType: string }
  | { type: 'rest' };

export interface PlanDay {
  dayOfWeek: DayOfWeek;
  assignment: PlanDayAssignment;
}

export interface PlanWeek {
  weekNumber: number; // 1-based
  days: PlanDay[];
}

export interface TrainingPlan {
  id: Id<'Plan'>;
  userId: Id<'User'>;
  name: string;
  startDate: string;        // ISO date 'YYYY-MM-DD'
  durationWeeks: number;
  weeks: PlanWeek[];
  createdAt: number;        // unix ms
}

export interface PlanAdherence {
  planId: Id<'Plan'>;
  completed: number;
  scheduled: number;
  adherenceRate: number;    // 0–1 (multiply by 100 for %)
  currentStreak: number;    // consecutive completed days
  missedDays: string[];     // ISO dates
}

// ─── Events ───────────────────────────────────────────────────

export interface PlanCreatedPayload {
  planId: Id<'Plan'>;
  userId: Id<'User'>;
  name: string;
  startDate: string;
  durationWeeks: number;
  weeks: PlanWeek[];
  createdAt: number;
}

export interface PlanUpdatedPayload {
  planId: Id<'Plan'>;
  name?: string;
  startDate?: string;
  durationWeeks?: number;
}

export interface DayAssignedPayload {
  planId: Id<'Plan'>;
  weekNumber: number;
  dayOfWeek: DayOfWeek;
  assignment: PlanDayAssignment;
}

export interface PlanDeletedPayload {
  planId: Id<'Plan'>;
}

export interface PlannedSessionCompletedPayload {
  planId: Id<'Plan'>;
  date: string;             // ISO date
  sessionId: Id<'Session'>;
}

export interface PlannedSessionSkippedPayload {
  planId: Id<'Plan'>;
  date: string;             // ISO date
}

export type TrainingPlanEvent =
  | DomainEvent<'PlanCreated', PlanCreatedPayload>
  | DomainEvent<'PlanUpdated', PlanUpdatedPayload>
  | DomainEvent<'DayAssigned', DayAssignedPayload>
  | DomainEvent<'PlanDeleted', PlanDeletedPayload>
  | DomainEvent<'PlannedSessionCompleted', PlannedSessionCompletedPayload>
  | DomainEvent<'PlannedSessionSkipped', PlannedSessionSkippedPayload>;

// ─── Commands ─────────────────────────────────────────────────

export interface CreatePlan {
  type: 'CreatePlan';
  userId: Id<'User'>;
  name: string;
  startDate: string;
  durationWeeks: number;
}

export interface UpdatePlan {
  type: 'UpdatePlan';
  planId: Id<'Plan'>;
  name?: string;
  startDate?: string;
  durationWeeks?: number;
}

export interface AssignWorkoutToDay {
  type: 'AssignWorkoutToDay';
  planId: Id<'Plan'>;
  weekNumber: number;
  dayOfWeek: DayOfWeek;
  assignment: PlanDayAssignment;
}

export interface DeletePlan {
  type: 'DeletePlan';
  planId: Id<'Plan'>;
}

export type TrainingPlanCommand =
  | CreatePlan
  | UpdatePlan
  | AssignWorkoutToDay
  | DeletePlan;
