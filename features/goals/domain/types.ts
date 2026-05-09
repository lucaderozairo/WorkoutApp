// features/goals/domain/types.ts
import type { Id, DomainEvent } from '@shared/types';

// ─── Core domain types ────────────────────────────────────────

export type GoalMetric = 'weight_lifted' | 'distance_km' | 'sessions' | 'strength_1rm' | 'bodyweight_kg';

export interface Goal {
  id: Id<'Goal'>;
  userId: Id<'User'>;
  name: string;
  metric: GoalMetric;
  target: number;
  current: number;
  unit: string;
  deadline?: string;        // ISO date 'YYYY-MM-DD'
  completed: boolean;
  completedAt?: number;     // unix ms
  createdAt: number;
}

// ─── Events ───────────────────────────────────────────────────

export interface GoalCreatedPayload {
  goalId: Id<'Goal'>;
  userId: Id<'User'>;
  name: string;
  metric: GoalMetric;
  target: number;
  unit: string;
  deadline?: string;
  createdAt: number;
}

export interface GoalProgressUpdatedPayload {
  goalId: Id<'Goal'>;
  current: number;
  delta: number;
}

export interface GoalCompletedPayload {
  goalId: Id<'Goal'>;
  completedAt: number;
}

export interface GoalDeletedPayload {
  goalId: Id<'Goal'>;
}

export type GoalEvent =
  | DomainEvent<'GoalCreated', GoalCreatedPayload>
  | DomainEvent<'GoalProgressUpdated', GoalProgressUpdatedPayload>
  | DomainEvent<'GoalCompleted', GoalCompletedPayload>
  | DomainEvent<'GoalDeleted', GoalDeletedPayload>;

// ─── Commands ─────────────────────────────────────────────────

export interface CreateGoal {
  type: 'CreateGoal';
  userId: Id<'User'>;
  name: string;
  metric: GoalMetric;
  target: number;
  unit: string;
  deadline?: string;
}

export interface UpdateGoalProgress {
  type: 'UpdateGoalProgress';
  goalId: Id<'Goal'>;
  delta: number;    // amount to add to current; can be negative
}

export interface CompleteGoal {
  type: 'CompleteGoal';
  goalId: Id<'Goal'>;
}

export interface DeleteGoal {
  type: 'DeleteGoal';
  goalId: Id<'Goal'>;
}

export type GoalCommand = CreateGoal | UpdateGoalProgress | CompleteGoal | DeleteGoal;
