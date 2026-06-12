// Pure geographic / geometric math. Domain-agnostic (no workout vocabulary) so
// both infrastructure (data/) and UI can consume it. Canonical interface:
// tuple coordinates [lat, lng], distances in metres (SI) at the core.

export type LatLng = readonly [number, number]; // [lat, lng]

const EARTH_RADIUS_M = 6_371_000;

/** Great-circle distance in metres (haversine). */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const φ1 = toRad(a[0]);
  const φ2 = toRad(b[0]);
  const Δφ = toRad(b[0] - a[0]);
  const Δλ = toRad(b[1] - a[1]);
  const h =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/** Great-circle distance in kilometres. */
export function distanceKm(a: LatLng, b: LatLng): number {
  return distanceMeters(a, b) / 1000;
}

/** Total path length in kilometres, rounded to 2 decimal places. */
export function pathDistanceKm(path: LatLng[]): number {
  if (path.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    total += distanceKm(path[i - 1], path[i]);
  }
  return Math.round(total * 100) / 100;
}

/** Linear interpolation between two points. */
export function interpolate(a: LatLng, b: LatLng, ratio: number): LatLng {
  return [a[0] + (b[0] - a[0]) * ratio, a[1] + (b[1] - a[1]) * ratio];
}

/** Positions of whole-kilometre markers along a path. */
export function distanceMarkers(path: LatLng[]): { latlng: LatLng; km: number }[] {
  if (path.length < 2) return [];

  let totalKm = 0;
  for (let i = 1; i < path.length; i++) {
    totalKm += distanceKm(path[i - 1], path[i]);
  }

  const markerCount = Math.floor(totalKm);
  if (markerCount < 1) return [];

  const markers: { latlng: LatLng; km: number }[] = [];
  let nextMarkerKm = 1;
  let travelledKm = 0;

  for (let i = 1; i < path.length && nextMarkerKm <= markerCount; i++) {
    const previous = path[i - 1];
    const current = path[i];
    const segmentKm = distanceKm(previous, current);
    if (segmentKm === 0) continue;

    while (travelledKm + segmentKm >= nextMarkerKm && nextMarkerKm <= markerCount) {
      const ratio = (nextMarkerKm - travelledKm) / segmentKm;
      markers.push({
        latlng: interpolate(previous, current, ratio),
        km: nextMarkerKm,
      });
      nextMarkerKm += 1;
    }

    travelledKm += segmentKm;
  }

  return markers;
}

/** Equirectangular projection to radian XY (good enough for local hit-testing). */
export function toXY(p: LatLng): [number, number] {
  const x = (p[1] * Math.PI) / 180;
  const y = (p[0] * Math.PI) / 180;
  return [x, y];
}

/** Squared distance from point p to segment a–b, in projected XY space. */
export function distToSegmentSq(p: LatLng, a: LatLng, b: LatLng): number {
  const [px, py] = toXY(p);
  const [ax, ay] = toXY(a);
  const [bx, by] = toXY(b);

  const abx = bx - ax;
  const aby = by - ay;
  const apx = px - ax;
  const apy = py - ay;
  const abLenSq = abx * abx + aby * aby;
  if (abLenSq === 0) return apx * apx + apy * apy;
  const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / abLenSq));
  const cx = ax + t * abx;
  const cy = ay + t * aby;
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy;
}

/** Index of the path vertex nearest to target (by great-circle distance). */
export function closestPathIndex(path: LatLng[], target: LatLng): number {
  let bestIdx = 0;
  let bestDist = Infinity;
  for (let i = 0; i < path.length; i++) {
    const d = distanceKm(path[i], target);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = i;
    }
  }
  return bestIdx;
}
