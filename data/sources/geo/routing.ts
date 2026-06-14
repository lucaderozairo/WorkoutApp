import { pathDistanceKm, type LatLng } from '@shared/geo';
import type { RoutingPreference } from '@shared/contracts';

export interface RoutePathRequest {
  waypoints: LatLng[];
  profile: 'foot' | 'bike';
  preference?: RoutingPreference;
  signal?: AbortSignal;
}

export interface RoutedPath {
  path: [number, number][];
  distanceKm: number;
  status: 'routed' | 'straight_line';
}

export function osrmProfile(profile: 'foot' | 'bike', preference: RoutingPreference = 'balanced'): string {
  if (profile === 'bike') return 'bike';
  if (preference === 'shortest') return 'foot';
  return 'foot';
}

export async function routePath(request: RoutePathRequest): Promise<RoutedPath> {
  const waypoints = request.waypoints.map(([lat, lng]) => [lat, lng] as [number, number]);
  if (waypoints.length < 2) {
    return { path: waypoints, distanceKm: 0, status: 'straight_line' };
  }

  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), 8000);
  request.signal?.addEventListener('abort', () => timeoutController.abort(), { once: true });

  try {
    const profile = osrmProfile(request.profile, request.preference);
    const coords = waypoints.map(([lat, lng]) => `${lng},${lat}`).join(';');
    const response = await fetch(
      `https://routing.openstreetmap.de/routed-${profile}/route/v1/${profile}/${coords}?geometries=geojson&overview=full`,
      { signal: timeoutController.signal },
    );
    clearTimeout(timeoutId);
    if (!response.ok) return straightLine(waypoints);
    const json = await response.json();
    const route = json.routes?.[0];
    if (!route) return straightLine(waypoints);
    const path: [number, number][] = route.geometry.coordinates.map(
      ([lng, lat]: [number, number]) => [lat, lng],
    );
    return {
      path,
      distanceKm: Math.round((route.distance / 1000) * 100) / 100,
      status: 'routed',
    };
  } catch {
    clearTimeout(timeoutId);
    return straightLine(waypoints);
  }
}

function straightLine(waypoints: [number, number][]): RoutedPath {
  return {
    path: waypoints,
    distanceKm: pathDistanceKm(waypoints),
    status: 'straight_line',
  };
}
