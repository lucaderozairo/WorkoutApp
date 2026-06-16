import { forwardRef, type CSSProperties } from 'react';
import { Bike, Footprints } from 'lucide-react';
import { Button } from '@ui/molecules';
import { Text } from '@ui/atoms';
import { Column, Row } from '@ui/layout';
import { RoutePreview as RoutePreviewGraphic } from './RoutePreview';
import type { SavedRoute } from '@features/routes';

export type RouteDisplay = SavedRoute & {
  photoUrl?: string;
  trailPhotoUrl?: string;
};

function profileIcon(profile: SavedRoute['profile']) {
  return profile === 'bike' ? <Bike size={16} /> : <Footprints size={16} />;
}

function routeDate(route: RouteDisplay) {
  return new Date(route.updatedAt ?? route.createdAt).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function RouteExplorePreview({ route }: { route: RouteDisplay }) {
  const photo = route.photoUrl ?? route.trailPhotoUrl;
  if (photo) {
    return <img className="route-explore-photo" src={photo} alt="" loading="lazy" />;
  }
  return <RoutePreviewGraphic route={route} />;
}

export const RouteExploreCard = forwardRef<HTMLButtonElement, {
  route: RouteDisplay;
  parallax: number;
  featured?: boolean;
  onRoute: (route: SavedRoute) => void;
}>(function RouteExploreCard({ route, parallax, featured = false, onRoute }, ref) {
  const style = { '--route-parallax-x': `${parallax}%` } as CSSProperties;

  return (
    <Button
      ref={ref}
      type="button"
      variant="ghost"
      className="route-explore-card"
      data-featured={featured || undefined}
      // eslint-disable-next-line no-restricted-syntax -- Scroll position drives one tokenized parallax transform value.
      style={style}
      onClick={() => onRoute(route)}
    >
      <span className="route-explore-media">
        <RouteExplorePreview route={route} />
      </span>
      <Column gap={2} className="pad-sm">
        <Row gap={2} align="center">
          <Row align="center" justify="center" className="route-card-icon" aria-hidden>
            {profileIcon(route.profile)}
          </Row>
          <Text size="caption" color="muted">
            {route.profile === 'bike' ? 'Bike' : 'Foot'}
          </Text>
        </Row>
        <Text bold truncate>{route.name}</Text>
        {route.description ? (
          <Text size="caption" className="clamp-2">{route.description}</Text>
        ) : null}
        <Row justify="between" gap={2}>
          <Text size="caption" mono>{route.distanceKm.toFixed(1)} km</Text>
          <Text size="caption" color="muted">{routeDate(route)}</Text>
        </Row>
      </Column>
    </Button>
  );
});
