import type { SurfaceKind, SurfaceSegment } from './types';

export type SurfaceMix = Record<SurfaceKind, number>;

const SURFACE_ORDER: SurfaceKind[] = ['paved', 'gravel', 'trail', 'unpaved', 'unknown'];

export function summarizeSurfaceMix(segments: SurfaceSegment[], distanceKm: number): SurfaceMix {
  const totals: SurfaceMix = {
    paved: 0,
    gravel: 0,
    trail: 0,
    unpaved: 0,
    unknown: 0,
  };

  if (distanceKm <= 0) {
    totals.unknown = 100;
    return totals;
  }

  for (const segment of segments) {
    const length = Math.max(0, Math.min(distanceKm, segment.toKm) - Math.max(0, segment.fromKm));
    totals[segment.surface] += length;
  }

  const covered = SURFACE_ORDER.reduce((sum, key) => sum + totals[key], 0);
  totals.unknown += Math.max(0, distanceKm - covered);

  let roundedTotal = 0;
  for (const key of SURFACE_ORDER) {
    totals[key] = Math.round((totals[key] / distanceKm) * 100);
    roundedTotal += totals[key];
  }

  if (roundedTotal !== 100) {
    totals.unknown = Math.max(0, totals.unknown + (100 - roundedTotal));
  }

  return totals;
}
