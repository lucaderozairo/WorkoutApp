import { Button } from '@ui/atoms';
import { ScreenHeader, EmptyState } from '@ui/molecules';
import { Grid, Row } from '@ui/layout';
import { useSavedRoutes } from './useSavedRoutes';

export function SavedRoutesScreen() {
  const {
    incoming,
    savedRoutes,
    confirmDelete, setConfirmDelete,
    handleSelect,
    handleDelete,
    handleBack,
    profileIcon,
  } = useSavedRoutes();

  return (
    <Grid>
      <ScreenHeader title="Saved Routes" back={handleBack} />

      {savedRoutes.length === 0 ? (
        <EmptyState
          icon="Map"
          title="No saved routes yet"
          message="Plan a route and save it to reuse it for future sessions."
        />
      ) : (
        <Grid min="md">
          {savedRoutes.map(route => (
            <div
              key={route.id}
              className={`surface column gap-1${incoming.returnTo ? ' interactive' : ''}`}
              onClick={() => incoming.returnTo && handleSelect(route)}
            >
              <Row justify="between" align="center">
                <span className="emoji-sm">{profileIcon(route.profile)}</span>
                {confirmDelete === route.id ? (
                  <Row gap={1}>
                    <Button variant="destructive" size="sm" onClick={e => { e.stopPropagation(); handleDelete(route.id); }}>Delete</Button>
                    <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); setConfirmDelete(null); }}>Cancel</Button>
                  </Row>
                ) : (
                  <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); setConfirmDelete(route.id); }}>x</Button>
                )}
              </Row>
              <strong className="detail">{route.name}</strong>
              <span className="value">{route.distanceKm.toFixed(1)} km</span>
              <span className="caption muted">
                {new Date(route.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          ))}
        </Grid>
      )}
    </Grid>
  );
}
