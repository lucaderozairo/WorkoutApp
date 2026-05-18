import type { PlanType } from '@features/planning';
import { getActivityLabel } from '@ui/icons/activityIcons';

export function defaultSessionName(type: PlanType, hour = new Date().getHours()): string {
  const period = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
  return `${period} ${getActivityLabel(type)}`;
}
