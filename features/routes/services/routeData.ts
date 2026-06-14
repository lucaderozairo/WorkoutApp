import { routePath, type RoutePathRequest, type RoutedPath } from '@data/sources/geo/routing';
import { openMeteoElevationSource } from '@data/sources/geo/elevation';
import { overpassTerrainSource } from '@data/sources/geo/terrain';
import { exportRouteGpx, type GpxRouteInput } from '@data/sources/geo/gpx';
import type { ElevationSample, SurfaceSegment } from '@shared/contracts';
import type { LatLng } from '@shared/geo';

export function resolveRoutePath(request: RoutePathRequest): Promise<RoutedPath> {
  return routePath(request);
}

export function sampleRouteElevation(path: LatLng[], signal?: AbortSignal): Promise<ElevationSample[]> {
  return openMeteoElevationSource.sample(path, signal);
}

export function sampleRouteSurface(path: LatLng[], signal?: AbortSignal): Promise<SurfaceSegment[]> {
  return overpassTerrainSource.surfaceForPath(path, signal);
}

export function exportSavedRouteGpx(route: GpxRouteInput): string {
  return exportRouteGpx(route);
}
