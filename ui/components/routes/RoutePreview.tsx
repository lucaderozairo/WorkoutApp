import { Map } from 'lucide-react';
import { Grid } from '@ui/layout';
import type { SavedRoute } from '@features/routes/contract';
import { routeToSvgPoints } from '@features/routes/domain/preview';

interface RoutePreviewProps {
  route: SavedRoute;
  width?: number;
  height?: number;
}

export function RoutePreview({ route, width = 320, height = 160 }: RoutePreviewProps) {
  const path = route.routePath && route.routePath.length >= 2 ? route.routePath : route.waypoints;
  const points = routeToSvgPoints(path, { width, height, padding: 18 });
  const pointList = points.split(' ');
  const [startX, startY] = pointList[0]?.split(',') ?? [];
  const [endX, endY] = pointList[pointList.length - 1]?.split(',') ?? [];

  if (!points) {
    return (
      <Grid as="span" placeItems="center" className="route-preview-empty" aria-hidden="true">
        <Map size={24} />
      </Grid>
    );
  }

  return (
    <svg
      className="route-preview-svg"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={`${route.name} preview`}
    >
      <polyline className="route-preview-line" points={points} fill="none" />
      <circle className="route-preview-start" cx={startX} cy={startY} r="5" />
      <circle className="route-preview-end" cx={endX} cy={endY} r="5" />
    </svg>
  );
}
