export type {
  ElevationSample,
  RouteProfile,
  RouteVisibility,
  RoutingPreference,
  RoutingStatus,
  SavedRoute,
  SurfaceSegment,
  RoutesEvent,
  RoutesCommand,
  SaveRoute,
  UpdateRoute,
  DeleteSavedRoute,
} from './domain/types';

export { savedRoutesProjection, normalizeRoute } from './projections';

export { getSavedRoutes, getRouteById, getRouteSummary, getRoutesByVisibility } from './queries';

export { handleSaveRoute, handleUpdateRoute, handleDeleteSavedRoute } from './commands/handlers';

export { exportSavedRouteGpx, resolveRoutePath, sampleRouteElevation, sampleRouteSurface } from './services/routeData';
