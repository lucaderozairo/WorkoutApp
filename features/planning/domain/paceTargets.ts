import type { PaceTarget } from './types';

export function estimateTargetDuration(routeDistanceKm: number, paceTarget?: PaceTarget): number {
  if (!paceTarget || routeDistanceKm <= 0) return 0;
  if (paceTarget.kind === 'full') return Math.round(routeDistanceKm * paceTarget.paceSecPerKm);
  return Math.round(paceTarget.segments.reduce((total, segment) => {
    const distance = Math.max(0, Math.min(routeDistanceKm, segment.toKm) - Math.max(0, segment.fromKm));
    return total + distance * segment.paceSecPerKm;
  }, 0));
}

export function validatePaceTarget(routeDistanceKm: number, paceTarget?: PaceTarget): string | undefined {
  if (!paceTarget) return undefined;
  if (routeDistanceKm <= 0) return 'Route distance is required';
  if (paceTarget.kind === 'full') {
    return paceTarget.paceSecPerKm > 0 ? undefined : 'Pace must be greater than zero';
  }
  if (paceTarget.segments.length === 0) return 'At least one segment target is required';
  for (const segment of paceTarget.segments) {
    if (segment.fromKm < 0 || segment.toKm > routeDistanceKm || segment.fromKm >= segment.toKm) {
      return 'Segment ranges must fit inside the route';
    }
    if (segment.paceSecPerKm <= 0) return 'Segment pace must be greater than zero';
  }
  return undefined;
}
