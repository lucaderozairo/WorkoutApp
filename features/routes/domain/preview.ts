import { toXY, type LatLng } from '@shared/geo';

export interface RouteSvgOptions {
  width: number;
  height: number;
  padding: number;
}

export function routeToSvgPoints(path: LatLng[], options: RouteSvgOptions): string {
  if (path.length === 0) return '';
  const points = path.map(toXY);
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const innerWidth = Math.max(1, options.width - options.padding * 2);
  const innerHeight = Math.max(1, options.height - options.padding * 2);
  const spanX = Math.max(maxX - minX, Number.EPSILON);
  const spanY = Math.max(maxY - minY, Number.EPSILON);
  const scale = Math.min(innerWidth / spanX, innerHeight / spanY);
  const drawnWidth = spanX * scale;
  const drawnHeight = spanY * scale;
  const offsetX = options.padding + (innerWidth - drawnWidth) / 2;
  const offsetY = options.padding + (innerHeight - drawnHeight) / 2;

  return points
    .map(([x, y]) => {
      const sx = offsetX + (x - minX) * scale;
      const sy = options.height - (offsetY + (y - minY) * scale);
      return `${round(sx)},${round(sy)}`;
    })
    .join(' ');
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}
