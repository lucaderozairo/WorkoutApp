import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useCommand } from '@ui/bindings';
import type { SavedRoute } from '@features/routes';
import { handleDeleteSavedRoute } from '@features/routes';

interface SavedRoutesState {
  returnTo?: string;
  callerState?: unknown;
}

export function useSavedRoutes() {
  const navigate = useNavigate();
  const location = useLocation();
  const incoming = (location.state ?? {}) as SavedRoutesState;
  const savedRoutes = (useQuery<SavedRoute[]>('saved_routes') ?? []) as SavedRoute[];
  const { dispatch: deleteRoute } = useCommand(handleDeleteSavedRoute);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function handleSelect(route: SavedRoute) {
    if (!incoming.returnTo) return;
    navigate(incoming.returnTo, {
      replace: true,
      state: {
        waypoints: route.waypoints,
        distanceKm: route.distanceKm,
        profile: route.profile,
        callerState: incoming.callerState,
      },
    });
  }

  function handleDelete(routeId: string) {
    deleteRoute({ type: 'DeleteSavedRoute', routeId: routeId as SavedRoute['id'] });
    setConfirmDelete(null);
  }

  function handleBack() {
    navigate(-1 as never);
  }

  const profileIcon = (p: 'foot' | 'bike') => p === 'bike' ? '🚴' : '🏃';

  return {
    incoming,
    savedRoutes,
    confirmDelete, setConfirmDelete,
    handleSelect,
    handleDelete,
    handleBack,
    profileIcon,
  };
}
