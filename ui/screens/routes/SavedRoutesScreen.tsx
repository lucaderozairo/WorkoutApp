
import { ScreenHeader, Button } from '@ui/molecules';
import { EmptyState } from '@ui/patterns';
import { Surface, Text } from '@ui/atoms';
import { Grid, Row, Column } from '@ui/layout';
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
            <Surface
              key={route.id}
              as={incoming.returnTo ? 'button' : 'div'}
              interactive={!!incoming.returnTo}
              onClick={() => incoming.returnTo && handleSelect(route)}
            >
              <Column gap={1}>
                <Row justify="between" align="center">
                  <span className="emoji sm">{profileIcon(route.profile)}</span>
                  {confirmDelete === route.id ? (
                    <Row gap={1}>
                      <Button variant="destructive" size="sm" onClick={e => { e.stopPropagation(); handleDelete(route.id); }}>Delete</Button>
                      <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); setConfirmDelete(null); }}>Cancel</Button>
                    </Row>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); setConfirmDelete(route.id); }}>x</Button>
                  )}
                </Row>
                <Text bold size="detail">{route.name}</Text>
                <Text size="detail" mono>{route.distanceKm.toFixed(1)} km</Text>
                <Text size="caption" color="muted">
                  {new Date(route.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
              </Column>
            </Surface>
          ))}
        </Grid>
      )}
    </Grid>
  );
}
