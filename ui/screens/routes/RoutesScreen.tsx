import { forwardRef, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Bike, ChevronLeft, ChevronRight, Footprints, Map, Plus } from 'lucide-react';
import { Button, ScreenHeader } from '@ui/molecules';
import { Surface, Text } from '@ui/atoms';
import { Column, Grid, Row, Cluster } from '@ui/layout';
import { EmptyState, SearchBar } from '@ui/patterns';
import { RoutePreview as RoutePreviewGraphic } from '@ui/components/routes/RoutePreview';
import type { SavedRoute } from '@features/routes';
import { useRoutes, type RouteDistanceFilter, type RouteProfileFilter } from './useRoutes';

const PROFILE_FILTERS: Array<{ id: RouteProfileFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'foot', label: 'Foot' },
  { id: 'bike', label: 'Bike' },
];

const DISTANCE_FILTERS: Array<{ id: RouteDistanceFilter; label: string }> = [
  { id: 'all', label: 'Any distance' },
  { id: 'short', label: '<5 km' },
  { id: 'medium', label: '5-20 km' },
  { id: 'long', label: '>20 km' },
];

function profileIcon(profile: SavedRoute['profile']) {
  return profile === 'bike' ? <Bike size={16} /> : <Footprints size={16} />;
}

function routeDate(route: SavedRoute) {
  return new Date(route.updatedAt ?? route.createdAt).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

type RouteDisplay = SavedRoute & {
  photoUrl?: string;
  trailPhotoUrl?: string;
};

interface RouteExploreGroup {
  id: string;
  title: string;
  subtitle: string;
  routes: RouteDisplay[];
  featured?: boolean;
}

function routePhoto(route: RouteDisplay) {
  return route.photoUrl ?? route.trailPhotoUrl;
}

function routeExploreGroups(routes: RouteDisplay[]): RouteExploreGroup[] {
  const foot = routes.filter(route => route.profile === 'foot');
  const bike = routes.filter(route => route.profile === 'bike');
  const long = routes.filter(route => route.distanceKm >= 10);

  return [
    {
      id: 'all',
      title: 'Explore routes',
      subtitle: `${routes.length} saved ${routes.length === 1 ? 'route' : 'routes'}`,
      routes,
      featured: true,
    },
    foot.length > 0
      ? {
        id: 'foot',
        title: 'Foot routes',
        subtitle: 'Runs, walks, and hikes',
        routes: foot,
      }
      : null,
    bike.length > 0
      ? {
        id: 'bike',
        title: 'Bike routes',
        subtitle: 'Road and cycling plans',
        routes: bike,
      }
      : null,
    long.length > 0
      ? {
        id: 'long',
        title: 'Longer efforts',
        subtitle: 'Routes at 10 km and above',
        routes: long,
      }
      : null,
  ].filter((group): group is RouteExploreGroup => !!group && group.routes.length > 0);
}

function RouteExplorePreview({ route }: { route: RouteDisplay }) {
  const photo = routePhoto(route);

  if (photo) {
    return <img className="route-explore-photo" src={photo} alt="" loading="lazy" />;
  }

  return <RoutePreviewGraphic route={route} />;
}

const RouteExploreCard = forwardRef<HTMLButtonElement, {
  route: RouteDisplay;
  parallax: number;
  featured?: boolean;
  onRoute: (route: SavedRoute) => void;
}>(function RouteExploreCard({
  route,
  parallax,
  featured = false,
  onRoute,
}, ref) {
  const style = { '--route-parallax-x': `${parallax}%` } as CSSProperties;

  return (
    <button
      ref={ref}
      type="button"
      className="route-explore-card"
      data-featured={featured || undefined}
      // eslint-disable-next-line no-restricted-syntax -- Scroll position drives one tokenized parallax transform value.
      style={style}
      onClick={() => onRoute(route)}>
      <span className="route-explore-media">
        <RouteExplorePreview route={route} />
      </span>
      <span className="route-explore-body">
        <span className="route-explore-kicker">
          <span className="route-card-icon" aria-hidden>{profileIcon(route.profile)}</span>
          <span>{route.profile === 'bike' ? 'Bike' : 'Foot'}</span>
        </span>
        <span className="route-explore-title">{route.name}</span>
        {route.description ? (
          <span className="route-explore-description">{route.description}</span>
        ) : null}
        <span className="route-explore-meta">
          <span className="mono">{route.distanceKm.toFixed(1)} km</span>
          <span>{routeDate(route)}</span>
        </span>
      </span>
    </button>
  );
});

function RouteExploreRow({
  group,
  onRoute,
}: {
  group: RouteExploreGroup;
  onRoute: (route: SavedRoute) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const frameRef = useRef<number | undefined>(undefined);
  const [parallax, setParallax] = useState<number[]>([]);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return undefined;

    const measure = () => {
      const scrollerRect = scroller.getBoundingClientRect();
      const next = cardRefs.current.map(card => {
        if (!card) return 0;
        const cardRect = card.getBoundingClientRect();
        const center = cardRect.left + cardRect.width / 2;
        const fraction = (center - scrollerRect.left) / Math.max(scrollerRect.width, 1);
        return Math.round((Math.min(1, Math.max(0, fraction)) - 0.5) * -28);
      });
      setParallax(next);
    };

    const schedule = () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(measure);
    };

    measure();
    scroller.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);

    return () => {
      scroller.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [group.routes]);

  const scrollCards = (direction: -1 | 1) => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    scroller.scrollBy({
      left: direction * scroller.clientWidth * 0.78,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  };

  return (
    <section className="route-explore-row" aria-labelledby={`route-explore-${group.id}`}>
      <Row justify="between" align="end" gap={2} className="route-explore-row-header">
        <Column gap={1}>
          <h3 className="route-explore-heading" id={`route-explore-${group.id}`}>{group.title}</h3>
          <Text size="caption" color="muted">{group.subtitle}</Text>
        </Column>
        {group.routes.length > 1 ? (
          <Cluster className="route-explore-controls gap-1">
            <Button variant="ghost" size="icon-sm" onClick={() => scrollCards(-1)} aria-label={`Scroll ${group.title} left`}>
              <ChevronLeft size={14} />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => scrollCards(1)} aria-label={`Scroll ${group.title} right`}>
              <ChevronRight size={14} />
            </Button>
          </Cluster>
        ) : null}
      </Row>
      <div ref={scrollRef} className="route-explore-track">
        {group.routes.map((route, index) => (
          <RouteExploreCard
            key={`${group.id}-${route.id}`}
            route={route}
            featured={group.featured}
            parallax={parallax[index] ?? 0}
            onRoute={onRoute}
            ref={(node: HTMLButtonElement | null) => { cardRefs.current[index] = node; }}
          />
        ))}
      </div>
    </section>
  );
}

export function RoutesScreen() {
  const {
    incoming,
    savedRoutes,
    filteredRoutes,
    search,
    setSearch,
    profileFilter,
    setProfileFilter,
    distanceFilter,
    setDistanceFilter,
    handleCreate,
    handleRoute,
  } = useRoutes();

  const isPicking = !!incoming.returnTo;
  const isFiltered = search.trim() || profileFilter !== 'all' || distanceFilter !== 'all';
  const exploreGroups = useMemo(
    () => routeExploreGroups(filteredRoutes as RouteDisplay[]),
    [filteredRoutes],
  );

  return (
    <Grid gap={4} className="routes-screen">
      <ScreenHeader
        title={isPicking ? 'Choose Route' : 'Routes'}
        primary={
          <Button variant="primary" size="sm" onClick={handleCreate}>
            <Plus size={14} /> New route
          </Button>
        }
      />

      <Surface variant="flat" className="routes-filter-panel">
        <Column gap={3}>
          <SearchBar
            value={search}
            onChange={setSearch}
            onClear={() => setSearch('')}
            placeholder="Search routes"
          />
          <Row gap={2} align="center" className="wrap">
            <Cluster className="gap-1">
              {PROFILE_FILTERS.map(filter => (
                <Button
                  key={filter.id}
                  variant="ghost"
                  size="sm"
                  active={profileFilter === filter.id}
                  onClick={() => setProfileFilter(filter.id)}>
                  {filter.id === 'bike' ? <Bike size={14} /> : filter.id === 'foot' ? <Footprints size={14} /> : <Map size={14} />}
                  {filter.label}
                </Button>
              ))}
            </Cluster>
            <Cluster className="gap-1">
              {DISTANCE_FILTERS.map(filter => (
                <Button
                  key={filter.id}
                  variant="ghost"
                  size="sm"
                  active={distanceFilter === filter.id}
                  onClick={() => setDistanceFilter(filter.id)}>
                  {filter.label}
                </Button>
              ))}
            </Cluster>
          </Row>
        </Column>
      </Surface>

      {savedRoutes.length === 0 ? (
        <EmptyState
          icon="Map"
          title="No routes yet"
          message="Create a route to reuse it in future sessions."
          action={<Button variant="primary" onClick={handleCreate}>Create first route</Button>}
        />
      ) : filteredRoutes.length === 0 ? (
        <EmptyState
          icon="Search"
          title="No matching routes"
          message="Adjust the search or filters."
          action={isFiltered ? <Button variant="secondary" onClick={() => { setSearch(''); setProfileFilter('all'); setDistanceFilter('all'); }}>Clear filters</Button> : undefined}
        />
      ) : (
        <Column gap={4} className="route-explore">
          {exploreGroups.map(group => (
            <RouteExploreRow key={group.id} group={group} onRoute={handleRoute} />
          ))}
        </Column>
      )}
    </Grid>
  );
}
