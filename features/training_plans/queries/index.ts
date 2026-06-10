// features/training_plans/queries/index.ts
import { viewStore } from '@data/projections/views';
import type { TrainingPlan, PlanAdherence } from '../domain/types';
import type { Id } from '@shared/types';

export function getActivePlan(): TrainingPlan | null {
  return viewStore.get('active_plan') ?? null;
}

export function getPlanList(): TrainingPlan[] {
  return viewStore.get('plan_list') ?? [];
}

export function getPlanById(planId: Id<'Plan'>): TrainingPlan | undefined {
  return getPlanList().find(p => p.id === planId);
}

export function getPlanAdherence(): PlanAdherence | null {
  return viewStore.get('plan_adherence') ?? null;
}
