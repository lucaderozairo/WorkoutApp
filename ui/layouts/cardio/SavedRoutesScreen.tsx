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
      <div className="row space-between align-center compact">
        <button className="ghost" onClick={handleBack}>Back</button>
        <h2>Saved Routes</h2>
        <div style={{ width: 60 }} />
      </div>

      {savedRoutes.length === 0 ? (
        <div className="surface column text-center">
          <p className="caption muted">No saved routes yet.</p>
          <p className="caption faint">Plan a route from the dashboard and save it to reuse later.</p>
        </div>
      ) : (
        <div className="grid-auto">
          {savedRoutes.map(route => (
            <div
              key={route.id}
              className="surface column compact"
              style={{ cursor: incoming.returnTo ? 'pointer' : 'default' }}
              onClick={() => incoming.returnTo && handleSelect(route)}
            >
              <div className="row space-between align-center">
                <span style={{ fontSize: '1.5rem' }}>{profileIcon(route.profile)}</span>
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
