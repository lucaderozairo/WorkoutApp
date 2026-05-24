import { ScreenHeader, EmptyState } from '@ui/components/shared';
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
    <div className="column">
      <ScreenHeader title="Saved Routes" back={handleBack} />

      {savedRoutes.length === 0 ? (
        <EmptyState
          icon="🗺️"
          title="No saved routes yet"
          message="Plan a route and save it to reuse it for future sessions."
        />
      ) : (
        <div className="grid-auto">
          {savedRoutes.map(route => (
            <div
              key={route.id}
              className={`surface column compact${incoming.returnTo ? ' interactive' : ''}`}
              onClick={() => incoming.returnTo && handleSelect(route)}
            >
              <div className="row space-between align-center">
                <span className="emoji-sm">{profileIcon(route.profile)}</span>
                {confirmDelete === route.id ? (
                  <div className="row compact">
                    <button className="danger sm" onClick={e => { e.stopPropagation(); handleDelete(route.id); }}>Delete</button>
                    <button className="ghost sm" onClick={e => { e.stopPropagation(); setConfirmDelete(null); }}>Cancel</button>
                  </div>
                ) : (
                  <button className="ghost sm" onClick={e => { e.stopPropagation(); setConfirmDelete(route.id); }}>✕</button>
                )}
              </div>
              <strong className="detail">{route.name}</strong>
              <span className="value">{route.distanceKm.toFixed(1)} km</span>
              <span className="caption muted">{new Date(route.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
