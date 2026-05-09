import type { Id, DomainEvent } from '@shared/types';

export type PlanType = 'gym' | 'run' | 'cycle' | 'swim';

export interface PlannedExercise {
  name: string;
  sets: number;
  reps: number;
  weightKg: number;
}

export interface DistanceMarker {
  distanceKm: number;
  cumulativeTime: string;  // "M:SS" or "MM:SS"
}

export interface PlannedSession {
  id: Id<'PlannedSession'>;
  type: PlanType;
  name: string;
  scheduledAt: number;  // Unix ms
  notes: string;
  // Gym only
  exercises?: PlannedExercise[];
  // Run / cycle only
  routeWaypoints?: [number, number][];   // [lat, lng] pairs
  distanceKm?: number;
  paceSecPerKm?: number;
  distanceMarkers?: DistanceMarker[];
  // Swim only
  poolLengthM?: 25 | 50;
  targetDistanceM?: number;
  paceSecPer100m?: number;
}

export type PlanningEvent =
  | DomainEvent<'SessionPlanned', PlannedSession>
  | DomainEvent<'PlannedSessionDeleted', { planId: Id<'PlannedSession'> }>;

export interface PlanSession {
  type: 'PlanSession';
  userId: Id<'User'>;
  planType: PlanType;
  name: string;
  scheduledAt: number;
  notes: string;
  exercises?: PlannedExercise[];
  routeWaypoints?: [number, number][];
  distanceKm?: number;
  paceSecPerKm?: number;
  distanceMarkers?: DistanceMarker[];
  poolLengthM?: 25 | 50;
  targetDistanceM?: number;
  paceSecPer100m?: number;
}

export interface DeletePlannedSession {
  type: 'DeletePlannedSession';
  planId: Id<'PlannedSession'>;
}

export type PlanningCommand = PlanSession | DeletePlannedSession;
