import type { Id } from '@shared/types';

export type RouteProfile = 'foot' | 'bike';
export type RoutingStatus = 'routed' | 'straight_line';
export type RoutingPreference = 'balanced' | 'prefer_cycleways' | 'shortest';
export type RouteVisibility = 'private' | 'feed';

export interface ElevationSample {
  distanceKm: number;
  elevationM: number;
  grade: number;
}

export type SurfaceKind = 'paved' | 'gravel' | 'trail' | 'unpaved' | 'unknown';

export interface SurfaceSegment {
  fromKm: number;
  toKm: number;
  surface: SurfaceKind;
}

export interface RouteSummary {
  id: Id<'SavedRoute'>;
  name: string;
  profile: RouteProfile;
  distanceKm: number;
  elevationGainM: number;
  elevationLossM: number;
}
