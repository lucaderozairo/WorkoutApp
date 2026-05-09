// ui/components/workout/wizard/wizardUtils.ts
import type { PlanType } from '@features/planning';

const ACTIVITY_LABEL: Record<PlanType, string> = {
  gym: 'Workout',
  run: 'Run',
  cycle: 'Ride',
  swim: 'Swim',
};

export function defaultSessionName(type: PlanType, hour = new Date().getHours()): string {
  const period = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
  return `${period} ${ACTIVITY_LABEL[type]}`;
}
