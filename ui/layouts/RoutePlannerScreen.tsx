import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { RouteMap, totalDistanceKm } from '@ui/components/workout/wizard/RouteMap';
import type { MapCanvasHandle } from '@ui/components/workout/wizard/RouteMap';
import { handleSaveRoute } from '@features/planning';

interface RoutePlannerState {
  waypoints?: [number, number][];
  profile?: 'foot' | 'bike';
  returnTo?: string;
  callerState?: unknown;
}

type EditMode = 'select' | 'add' | 'split';
type BaseLayerId = 'plain' | 'dark' | 'topo' | 'sat';

const BASE_LAYERS: { id: BaseLayerId; label: string }[] = [
  { id: 'plain', label: 'Plain' },
  { id: 'dark', label: 'Dark' },
  { id: 'topo', label: 'Topo' },
  { id: 'sat', label: 'Sat' },
];

export function RoutePlannerScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const incoming = (location.state ?? {}) as RoutePlannerState;

  const mapRef = useRef<MapCanvasHandle>(null);
  const [waypoints, setWaypoints] = useState<[number, number][]>(incoming.waypoints ?? []);
  const [routedKm, setRoutedKm] = useState(0);
  const [routeName, setRouteName] = useState('');
  const [mode, setMode] = useState<EditMode>('select');
  const [undoCount, setUndoCount] = useState(0);
  const [redoCount, setRedoCount] = useState(0);
  const [baseLayerId, setBaseLayerId] = useState<BaseLayerId>('plain');
  const [showDistanceMarkers, setShowDistanceMarkers] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchBusy, setSearchBusy] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const profile = incoming.profile ?? 'foot';
  const displayKm = routedKm > 0 ? routedKm : totalDistanceKm(waypoints);
  const isStandalone = !incoming.callerState;

  async function handleSave() {
    const dest = incoming.returnTo ?? (-1 as never);
    if (isStandalone && waypoints.length >= 2 && displayKm > 0) {
      const name = routeName.trim() || (profile === 'bike' ? 'Cycle Route' : 'Run Route');
      await handleSaveRoute({ type: 'SaveRoute', name, profile, waypoints, distanceKm: displayKm });
    }
    navigate(dest, {
      replace: typeof dest === 'string',
      state: { waypoints, distanceKm: displayKm, callerState: incoming.callerState },
    });
  }

  function handleBack() {
    navigate(incoming.returnTo ?? (-1 as never));
  }

  function handleUndoRedo(undo: number, redo: number) {
    setUndoCount(undo);
    setRedoCount(redo);
  }

  function handleLayerSwitch(id: BaseLayerId) {
    setBaseLayerId(id);
    mapRef.current?.switchBaseLayer(id);
  }

  function handleToggleDistanceMarkers() {
    const next = !showDistanceMarkers;
    setShowDistanceMarkers(next);
    mapRef.current?.toggleDistanceMarkers(next);
  }

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setSearchBusy(true);
    setSearchError(null);
    const result = await mapRef.current?.runSearch(searchQuery);
    if (result === 'fail') setSearchError('Search failed');
    else if (result === 'no_results') setSearchError('No results');
    setSearchBusy(false);
  }

  return (
    <div className="grow column">
      <div className="row space-between align-center compact">
        <button className="ghost" onClick={handleBack}>Back</button>
        <h2>Plan Route</h2>
        <button className="primary compact" onClick={handleSave}>
          Save{displayKm > 0 ? ` · ${displayKm.toFixed(1)} km` : ''}
        </button>
      </div>
      <div className="row align-center compact">
        <div className='grow'>
          <input
            className="input"
            placeholder="Search routes, places, trails…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') void handleSearch(); }}
          />
          {searchBusy && <span className="caption muted">Searching…</span>}
          {searchError && <span className="caption muted" style={{ color: 'var(--bad)' }}>{searchError}</span>}
        </div>
        <button className="ghost icon" onClick={() => mapRef.current?.locate()} aria-label="Locate me">◎</button></div>

      {isStandalone && waypoints.length >= 2 && (
        <div>
          <input
            className="input"
            placeholder="Route name…"
            value={routeName}
            onChange={e => setRouteName(e.target.value)}
          />
        </div>
      )}

      <div className="grow relative column compact">
        <div className="absolute top left tools-panel">
          <div className="surface tight column compact">
            <button className="ghost icon" onClick={() => mapRef.current?.zoomIn()} aria-label="Zoom in">+</button>
            <button className="ghost icon" onClick={() => mapRef.current?.zoomOut()} aria-label="Zoom out">−</button>
            <button className="ghost icon" onClick={() => mapRef.current?.fitRoute()} aria-label="Route overview">⤢</button>
          </div>
        </div>
        <div className="absolute bottom right tools-panel desktop-only">
          <div className="surface tight column compact">

            <span className="text-center caption">Overlay</span>
            <div className="column compact">

            <button className={`ghost compact caption${showDistanceMarkers ? ' active' : ''}`} onClick={handleToggleDistanceMarkers}>
              Markers
            </button>
            </div>
          </div>
        </div>
        <RouteMap
          ref={mapRef}
          waypoints={waypoints}
          onChange={setWaypoints}
          profile={profile}
          onRoutedDistanceChange={setRoutedKm}
          mode={mode}
          onModeChange={setMode}
          onUndoRedoChange={handleUndoRedo}
          baseLayerId={baseLayerId}
          showDistanceMarkers={showDistanceMarkers}
        />

        <div className="desktop-only tools-panel absolute top bottom right scroll column">
          <div className="surface tight align-left">
            <h3 className='text-center'>Tools</h3>
            <div className="column compact">
              <span className="text-center caption">Route</span>
              <button className={`ghost compact caption${mode === 'select' ? ' active' : ''}`} onClick={() => mapRef.current?.setMode('select')}>✋ Pan</button>
              <button className={`ghost compact caption${mode === 'add' ? ' active' : ''}`} onClick={() => mapRef.current?.setMode('add')}>✏️ Draw</button>
              <button className={`ghost compact caption${mode === 'split' ? ' active' : ''}`} onClick={() => mapRef.current?.setMode('split')}>✂️ Cut</button>
              <button className="ghost compact caption" disabled={waypoints.length < 2} onClick={() => mapRef.current?.clearRoute()}>🧹 Clear</button>
            </div>
            <div className="text-center column compact">
              <span className="caption">Edit</span>
              <button className="ghost compact caption" disabled={undoCount === 0} onClick={() => mapRef.current?.undo()}>↩️ Undo</button>
              <button className="ghost compact caption" disabled={redoCount === 0} onClick={() => mapRef.current?.redo()}>↪️ Redo</button>
              <button className="ghost compact caption" disabled={waypoints.length < 2} onClick={() => mapRef.current?.reverseRoute()}>🔄 Reverse</button>
            </div>

          </div>
        </div>
      </div>

      <div className="mobile-only column compact">
        <div className="cluster compact align-center space-between ">
          <div className='row compact align-center' >
            <span className="caption">Route:</span>
            <button className={`ghost compact caption${mode === 'select' ? ' active' : ''}`} onClick={() => mapRef.current?.setMode('select')}>✋ Pan</button>
            <button className={`ghost compact caption${mode === 'add' ? ' active' : ''}`} onClick={() => mapRef.current?.setMode('add')}>✏️ Draw</button>
            <button className={`ghost compact caption${mode === 'split' ? ' active' : ''}`} onClick={() => mapRef.current?.setMode('split')}>✂️ Cut</button>
            <button className="ghost compact caption" disabled={waypoints.length < 2} onClick={() => mapRef.current?.clearRoute()}>🧹 Clear</button>
          </div>
          <div className='row compact align-center'>
            <span className="caption">Edit:</span>
            <button className="ghost compact caption" disabled={undoCount === 0} onClick={() => mapRef.current?.undo()}>↩️ Undo</button>
            <button className="ghost compact caption" disabled={redoCount === 0} onClick={() => mapRef.current?.redo()}>↪️ Redo</button>
            <button className="ghost compact caption" disabled={waypoints.length < 2} onClick={() => mapRef.current?.reverseRoute()}>🔄 Reverse</button>
          </div>
        </div>
        <div className="cluster compact align-center space-between ">
        <div className="row compact align-center">
          <span className="caption">Show: </span>
          <button className={`ghost compact caption${showDistanceMarkers ? ' active' : ''}`} onClick={handleToggleDistanceMarkers}>
            Distance Markers
          </button>
        </div>
          <div className="row compact align-center">
            <span className="caption">Map:</span>
              {BASE_LAYERS.map(l => (
                <button key={l.id} className={`ghost compact caption ${baseLayerId === l.id ? ' active' : ''}`} onClick={() => handleLayerSwitch(l.id)}>{l.label}</button>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
