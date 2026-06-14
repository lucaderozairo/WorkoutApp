import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { viewStore } from '@data/projections/views';
import type { Id } from '@shared/types';
import type { SavedRoute } from '@features/routes';
import { RoutesScreen } from './RoutesScreen';
import { RouteOverviewScreen } from './RouteOverviewScreen';

function setRoutes(routes: SavedRoute[]) {
  viewStore.set('saved_routes', routes);
}

function route(id: string, name: string, distanceKm: number, profile: 'foot' | 'bike' = 'foot'): SavedRoute {
  return {
    id: id as Id<'SavedRoute'>,
    name,
    description: `${name} description`,
    profile,
    waypoints: [[51.5, -0.1], [51.51, -0.11]],
    routePath: [[51.5, -0.1], [51.51, -0.11]],
    routingStatus: 'routed',
    distanceKm,
    createdAt: 1000,
    updatedAt: 1000,
  };
}

describe('RoutesScreen', () => {
  beforeEach(() => setRoutes([]));

  it('renders an empty state when there are no saved routes', () => {
    render(<RoutesScreen />, { wrapper: MemoryRouter });

    expect(screen.getByText('No routes yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create first route/i })).toBeInTheDocument();
  });

  it('filters saved routes by search and distance', async () => {
    setRoutes([
      route('short', 'Canal Shakeout', 4.2),
      route('long', 'Ridge Endurance', 24.5, 'bike'),
    ]);
    const user = userEvent.setup();
    render(<RoutesScreen />, { wrapper: MemoryRouter });

    // A route appears in multiple explore rows (e.g. "Explore routes" + "Foot
    // routes"), so assert presence with the *All* query rather than a single hit.
    expect(screen.getAllByText('Canal Shakeout').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Ridge Endurance').length).toBeGreaterThan(0);

    await user.type(screen.getByRole('searchbox'), 'ridge');
    expect(screen.queryByText('Canal Shakeout')).not.toBeInTheDocument();
    expect(screen.getAllByText('Ridge Endurance').length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: '<5 km' }));
    expect(screen.getByText('No matching routes')).toBeInTheDocument();
  });
});

describe('RouteOverviewScreen', () => {
  beforeEach(() => setRoutes([]));

  it('renders a not-found state for a missing route id', () => {
    render(
      <MemoryRouter initialEntries={['/routes/missing']}>
        <Routes>
          <Route path="/routes/:routeId" element={<RouteOverviewScreen />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Route not found')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /view routes/i })).toBeInTheDocument();
  });
});
