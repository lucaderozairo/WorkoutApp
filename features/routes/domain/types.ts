import type {
  DataProvenance,
  ElevationSample,
  RouteProfile,
  RouteVisibility,
  RoutingPreference,
  RoutingStatus,
  SurfaceSegment,
} from '@shared/contracts';
import type { Id, DomainEvent } from '@shared/types';

export type {
  ElevationSample,
  RouteProfile,
  RouteVisibility,
  RoutingPreference,
  RoutingStatus,
  SurfaceKind,
  SurfaceSegment,
} from '@shared/contracts';

export interface SavedRoute {
  id: Id<'SavedRoute'>;
  name: string;
  description?: string;
  profile: RouteProfile;
  waypoints: [number, number][];
  routePath?: [number, number][];
  routingStatus?: RoutingStatus;
  distanceKm: number;
  elevationProfile?: ElevationSample[];
  elevationGainM?: number;
  elevationLossM?: number;
  surfaceSegments?: SurfaceSegment[];
  visibility?: RouteVisibility;
  routingPreference?: RoutingPreference;
  elevation?: DataProvenance;
  surface?: DataProvenance;
  dataUpdatedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export type RoutesEvent =
  | DomainEvent<'RouteSaved', SavedRoute>
  | DomainEvent<'RouteUpdated', SavedRoute>
  | DomainEvent<'RouteDeleted', { routeId: Id<'SavedRoute'> }>;

export interface SaveRoute {
  type: 'SaveRoute';
  routeId?: Id<'SavedRoute'>;
  name: string;
  description?: string;
  profile: RouteProfile;
  waypoints: [number, number][];
  routePath?: [number, number][];
  routingStatus?: RoutingStatus;
  distanceKm: number;
  elevationProfile?: ElevationSample[];
  elevationGainM?: number;
  elevationLossM?: number;
  surfaceSegments?: SurfaceSegment[];
  visibility?: RouteVisibility;
  routingPreference?: RoutingPreference;
  elevation?: DataProvenance;
  surface?: DataProvenance;
  dataUpdatedAt?: number;
}

export interface UpdateRoute {
  type: 'UpdateRoute';
  routeId: Id<'SavedRoute'>;
  name: string;
  description?: string;
  profile: RouteProfile;
  waypoints: [number, number][];
  routePath?: [number, number][];
  routingStatus?: RoutingStatus;
  distanceKm: number;
  elevationProfile?: ElevationSample[];
  elevationGainM?: number;
  elevationLossM?: number;
  surfaceSegments?: SurfaceSegment[];
  visibility?: RouteVisibility;
  routingPreference?: RoutingPreference;
  elevation?: DataProvenance;
  surface?: DataProvenance;
  dataUpdatedAt?: number;
}

export interface DeleteSavedRoute {
  type: 'DeleteSavedRoute';
  routeId: Id<'SavedRoute'>;
}

export type RoutesCommand = SaveRoute | UpdateRoute | DeleteSavedRoute;
