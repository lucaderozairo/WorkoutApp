import { useMemo } from 'react';
import { Bike, Footprints, Map, Plus } from 'lucide-react';
import { Button, ScreenHeader } from '@ui/molecules';
import { Surface } from '@ui/atoms';
import { Column, Grid, Row, Cluster } from '@ui/layout';
import { EmptyState, SearchBar } from '@ui/patterns';
import { RouteExploreRow, type RouteExploreGroup } from '@ui/components/routes/RouteExploreRow';
import { type RouteDisplay } from '@ui/components/routes/RouteExploreCard';
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
      ? { id: 'foot', title: 'Foot routes', subtitle: 'Runs, walks, and hikes', routes: foot }
      : null,
    bike.length > 0
      ? { id: 'bike', title: 'Bike routes', subtitle: 'Road and cycling plans', routes: bike }
      : null,
    long.length > 0
      ? { id: 'long', title: 'Longer efforts', subtitle: 'Routes at 10 km and above', routes: long }
      : null,
  ].filter((group): group is RouteExploreGroup => !!group && group.routes.length > 0);
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
    <Grid gap={4} data-page="routes">
      <ScreenHeader
        title={isPicking ? 'Choose Route' : 'Routes'}
        primary={
          <Button variant="primary" size="sm" onClick={handleCreate}>
            <Plus size={14} /> New route
          </Button>
        }
      />

      <Surface>
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
          action={isFiltered
            ? <Button variant="secondary" onClick={() => { setSearch(''); setProfileFilter('all'); setDistanceFilter('all'); }}>Clear filters</Button>
            : undefined}
        />
      ) : (
        <Column gap={4}>
          {exploreGroups.map(group => (
            <RouteExploreRow key={group.id} group={group} onRoute={handleRoute} />
          ))}
        </Column>
      )}
    </Grid>
  );
}
