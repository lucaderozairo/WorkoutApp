import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@ui/bindings';
import type { SavedRoute } from '@features/routes';

export type RouteProfileFilter = 'all' | 'foot' | 'bike';
export type RouteDistanceFilter = 'all' | 'short' | 'medium' | 'long';

interface RoutesState {
  returnTo?: string;
  callerState?: unknown;
}

function matchesDistance(route: SavedRoute, filter: RouteDistanceFilter): boolean {
  if (filter === 'short') return route.distanceKm < 5;
  if (filter === 'medium') return route.distanceKm >= 5 && route.distanceKm <= 20;
  if (filter === 'long') return route.distanceKm > 20;
  return true;
}

export function useRoutes() {
  const navigate = useNavigate();
  const location = useLocation();
  const incoming = (location.state ?? {}) as RoutesState;
  const savedRoutes = (useQuery<SavedRoute[]>('saved_routes') ?? []) as SavedRoute[];
  const [search, setSearch] = useState('');
  const [profileFilter, setProfileFilter] = useState<RouteProfileFilter>('all');
  const [distanceFilter, setDistanceFilter] = useState<RouteDistanceFilter>('all');

  const filteredRoutes = useMemo(() => {
    const query = search.trim().toLowerCase();
    return savedRoutes.filter(route => {
      const matchesQuery = !query
        || route.name.toLowerCase().includes(query)
        || (route.description ?? '').toLowerCase().includes(query);
      const matchesProfile = profileFilter === 'all' || route.profile === profileFilter;
      return matchesQuery && matchesProfile && matchesDistance(route, distanceFilter);
    });
  }, [savedRoutes, search, profileFilter, distanceFilter]);

  function handleCreate() {
    navigate('/routes/new', {
      state: incoming.returnTo
        ? { returnTo: incoming.returnTo, callerState: incoming.callerState }
        : undefined,
    });
  }

  function handleRoute(route: SavedRoute) {
    if (incoming.returnTo) {
      navigate(incoming.returnTo, {
        replace: true,
        state: {
          waypoints: route.waypoints,
          distanceKm: route.distanceKm,
          profile: route.profile,
          callerState: incoming.callerState,
        },
      });
      return;
    }
    navigate(`/routes/${route.id}`);
  }

  return {
    navigate,
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
  };
}
