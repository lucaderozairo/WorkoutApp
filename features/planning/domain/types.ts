import type { Id, DomainEvent } from '@shared/types';
// eslint-disable-next-line boundaries/element-types -- TODO(arch): cross-layer import baselined; see docs/superpowers/plans/2026-06-03-architecture-rule-enforcement.md
import type { SportType } from '@features/training_log/domain/types';

export type PlanType = SportType;

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

export interface SavedRoute {
  id: Id<'SavedRoute'>;
  name: string;
  profile: 'foot' | 'bike';
  waypoints: [number, number][];
  distanceKm: number;
  createdAt: number;
}

export interface TemplateExercise {
  name: string;
  setCount: number;
}

export interface SavedTemplate {
  id: Id<'SavedTemplate'>;
  name: string;
  primarySport: SportType;
  exercises: TemplateExercise[];
  createdAt: number;
}

export type PlanningEvent =
  | DomainEvent<'SessionPlanned', PlannedSession>
  | DomainEvent<'PlannedSessionDeleted', { planId: Id<'PlannedSession'> }>
  | DomainEvent<'RouteSaved', SavedRoute>
  | DomainEvent<'RouteDeleted', { routeId: Id<'SavedRoute'> }>
  | DomainEvent<'TemplateSaved', SavedTemplate>
  | DomainEvent<'TemplateDeleted', { templateId: Id<'SavedTemplate'> }>;

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

export interface SaveRoute {
  type: 'SaveRoute';
  name: string;
  profile: 'foot' | 'bike';
  waypoints: [number, number][];
  distanceKm: number;
}

export interface DeleteSavedRoute {
  type: 'DeleteSavedRoute';
  routeId: Id<'SavedRoute'>;
}

export interface SaveTemplate {
  type: 'SaveTemplate';
  name: string;
  primarySport: SportType;
  exercises: TemplateExercise[];
}

export interface DeleteSavedTemplate {
  type: 'DeleteSavedTemplate';
  templateId: Id<'SavedTemplate'>;
}

export type PlanningCommand = PlanSession | DeletePlannedSession | SaveRoute | DeleteSavedRoute | SaveTemplate | DeleteSavedTemplate;
