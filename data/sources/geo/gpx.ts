import type { ElevationSample } from '@shared/contracts';
import { parseGpx } from '@data/sources/files/gps';

export { parseGpx };

export interface GpxRouteInput {
  name: string;
  waypoints: [number, number][];
  routePath?: [number, number][];
  elevationProfile?: ElevationSample[];
}

export function exportRouteGpx(route: GpxRouteInput): string {
  const path = route.routePath && route.routePath.length >= 2 ? route.routePath : route.waypoints;
  const points = path.map(([lat, lng], index) => {
    const elevation = route.elevationProfile?.[index]?.elevationM;
    const ele = elevation == null ? '' : `\n        <ele>${escapeXml(String(elevation))}</ele>`;
    return `      <trkpt lat="${lat}" lon="${lng}">${ele}\n      </trkpt>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="WorkoutApp" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${escapeXml(route.name)}</name>
  </metadata>
  <trk>
    <name>${escapeXml(route.name)}</name>
    <trkseg>
${points}
    </trkseg>
  </trk>
</gpx>`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
