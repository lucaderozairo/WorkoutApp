import { RouteMap } from '@ui/components/workout/wizard/RouteMap';
import { ChevronRight, ChevronLeft, FileText, MousePointer2, Plus, Minus, Layers, Save, X, Navigation, MapPin, Mountain, Bookmark } from 'lucide-react';
import { MdAddCircleOutline, MdDelete, MdLinearScale, MdOutlineFullscreen } from 'react-icons/md';
import { IoMdLocate } from 'react-icons/io';
import { PiLineSegments } from 'react-icons/pi';
import { formatPace } from '@features/planning';
import {
  useRoutePlanner,
  BASE_LAYERS, ACTIVITIES, PACE_PRESETS, PACE_FACTORS, SURFACES,
  paceForPreset, estimateCalories,
  type EditMode,
} from './useRoutePlanner';

export function RoutePlannerScreen() {
  const {
    mapRef,
    navigate,
    waypoints,
    setWaypoints,
    setRoutedKm,
    routeName,
    setRouteName,
    mode,
    undoCount,
    redoCount,
    baseLayerId,
    searchQuery,
    setSearchQuery,
    searchBusy,
    searchError,
    sideOpen,
    setSideOpen,
    snap,
    setSnap,
    activity,
    setActivity,
    paceSecondsPerKm,
    setPaceSecondsPerKm,
    pacePreset,
    paceInput,
    setPaceInput,
    segmentPaces,
    segmentInputs,
    layerPickerOpen,
    setLayerPickerOpen,
    profile,
    displayKm,
    isStandalone,
    segmentDistances,
    timeStr,
    surfaceMix,
    elevD,
    profileFilteredRoutes,
    handleSave,
    handleBack,
    handleUndoRedo,
    handleLayerSwitch,
    handleSearch,
    applyPaceInput,
    applySegmentPaceInput,
    handleDeleteWaypoint,
    handleLoadSavedRoute,
    handlePacePreset,
  } = useRoutePlanner();

  return (
    <div className="grow column compact clip">
      <div className="surface tight flat row compact desktop-only">
        <div className="row align-center">
          <div className="row compact align-center">
            <button className={`ghost caption sm${mode === 'select' as EditMode ? ' active' : ''}`}
              onClick={() => mapRef.current?.setMode('select')}><MousePointer2 size={10} /> Select</button>
            <button className={`ghost caption sm${mode === 'add' as EditMode ? ' active' : ''}`}
              onClick={() => mapRef.current?.setMode('add')}><MdAddCircleOutline size={10} /> Add</button>
            <button className={`ghost caption sm${mode === 'split' as EditMode ? ' active' : ''}`}
              onClick={() => mapRef.current?.setMode('split')}><MdLinearScale size={10} /> Split</button>
            <button className={`ghost caption sm${mode === 'delete' as EditMode ? ' active' : ''}`}
              onClick={() => mapRef.current?.setMode('delete')}><MdDelete size={10} /> Delete</button>
          </div>
          <div className="row compact">
            <button className="ghost icon sm" disabled={undoCount === 0} onClick={() => mapRef.current?.undo()} aria-label="Undo">↩</button>
            <button className="ghost icon sm" disabled={redoCount === 0} onClick={() => mapRef.current?.redo()} aria-label="Redo">↪</button>
          </div>
        </div>
        <div className="grow">
          <input
            className="input"
            placeholder="Search a place, address, or lat,"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') void handleSearch(); }}
          />
          {searchBusy && <span className="caption muted">Searching…</span>}
          {searchError && <span className="error-text">{searchError}</span>}
        </div>
      </div>

      <div className="row mobile-only" data-mobile-header>
        <div className="row align-center">
          <div className="brand" onClick={handleBack}>
            <div className="avatar sm">R</div>
          </div>
        </div>
        <div className="row compact">
          <button className="ghost icon" onClick={handleBack} aria-label="Back">←</button>
          <button className="ghost icon" disabled={undoCount === 0} onClick={() => mapRef.current?.undo()} aria-label="Undo">↩</button>
        </div>
      </div>

      <div className="row center mobile-only">
        <div className="row compact surface tight">
          {(['select', 'add', 'split', 'delete'] as EditMode[]).map(m => (
            <button
              key={m}
              className={`ghost${mode === m ? ' active' : ''}`}
              onClick={() => mapRef.current?.setMode(m)}
              aria-label={m.charAt(0).toUpperCase() + m.slice(1)}
            >
              {m === 'select' ? '✋' : m === 'add' ? '✏️' : m === 'split' ? '✂️' : '🗑️'}
            </button>
          ))}
        </div>
      </div>

      <div className="row grow clip">
        <div className={`side compact ghost surface ${sideOpen ? '' : ' collapsed'}`}>
          {sideOpen ? (
            <>
              <div className="row align-center space-between">
                <div className="column compact">
                  <h3>{routeName || 'New route'}</h3>
                </div>
                <button className="ghost icon sm" onClick={() => setSideOpen(false)} aria-label="Collapse sidebar">
                  <ChevronLeft size={16} />
                </button>
              </div>

              <div className="column compact">
                {isStandalone && waypoints.length >= 2 && (
                  <input className="input" placeholder="Route name…" value={routeName} onChange={e => setRouteName(e.target.value)} />
                )}
                <div className="row compact">
                  <button className="neutral grow" onClick={handleSave}><Save size={14} /> Save</button>
                  <button className="ghost icon sm"><FileText size={14} /></button>
                </div>
              </div>

              <div className="column compact">
                <span className="eyebrow">Activity</span>
                <div className="row compact">
                  {ACTIVITIES.map(a => (
                    <button key={a.id} data-id={a.id} className={`activity-chip${activity === a.id ? ' active' : ''}`} onClick={() => setActivity(a.id)}>
                      <span data-id={a.id} className="activity-dot">{a.label[0]}</span>
                      <span className="caption">{a.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="column compact">
                <span className="eyebrow">Summary</span>
                <div className="surface tight ghost row align-bottom compact">
                  <h3>{displayKm > 0 ? displayKm.toFixed(2) : '—'}</h3>
                  <span className="caption muted">km</span>
                </div>
                <div className="row compact">
                  <div className="surface tight align-center flat compact column grow">
                    <span className="mono caption">{timeStr}</span>
                    <span className="eyebrow">Time</span>
                  </div>
                  <div className="surface tight align-center flat compact column grow">
                    <span className="mono caption">{displayKm > 0 ? `+${Math.round(displayKm * 8)}` : '—'}<span className="caption muted"> m</span></span>
                    <span className="eyebrow">Gain</span>
                  </div>
                  <div className="surface tight align-center flat compact column grow">
                    <span className="mono caption">{displayKm > 0 ? estimateCalories(displayKm, activity) : '—'}<span className="caption muted"> kcal</span></span>
                    <span className="eyebrow">Energy</span>
                  </div>
                </div>
              </div>

              <div className="column compact">
                <span className="eyebrow">Pace</span>
                <div className="row align-bottom compact">
                  <h3>{formatPace(paceSecondsPerKm)}</h3>
                  <span className="caption muted">min/km</span>
                </div>
                <input
                  className="input sm"
                  placeholder="m:ss"
                  value={paceInput}
                  onChange={e => setPaceInput(e.target.value)}
                  onBlur={e => applyPaceInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') applyPaceInput((e.target as HTMLInputElement).value); }}
                />
                <input
                  type="range"
                  min={120}
                  max={540}
                  value={paceSecondsPerKm}
                  onChange={e => {
                    const val = Number(e.target.value);
                    setPaceSecondsPerKm(val);
                    const ratio = val / 300;
                    const closest = (Object.entries(PACE_FACTORS) as [import('./useRoutePlanner').PacePreset, number][]).reduce((prev, curr) =>
                      Math.abs(curr[1] - ratio) < Math.abs(prev[1] - ratio) ? curr : prev
                    )[0];
                    handlePacePreset(closest);
                  }}
                />
                <div className="cluster">
                  {PACE_PRESETS.map(p => (
                    <button key={p} className={`sm column tight${pacePreset === p ? ' active' : ''}`} onClick={() => handlePacePreset(p)}>
                      <span>{p.charAt(0).toUpperCase() + p.slice(1)}</span>
                      <span className="caption faint">{formatPace(paceForPreset(p))}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="column compact">
                <span className="eyebrow">Waypoints</span>
                {waypoints.length < 2 ? (
                  <span className="caption faint">Add at least 2 points.</span>
                ) : (
                  <div className="column compact">
                    {waypoints.map((wp, idx) => (
                      <div key={`wp-${idx}`} className="column compact">
                        <div className="row align-center compact interactive">
                          <span className={`waypoint-badge${idx === 0 ? ' start' : idx === waypoints.length - 1 ? ' finish' : ' mid'}`}>
                            {idx === 0 ? 'A' : idx === waypoints.length - 1 ? 'Z' : idx + 1}
                          </span>
                          <span className="caption grow">{wp[0].toFixed(4)}, {wp[1].toFixed(4)}</span>
                          <button className="ghost icon sm" onClick={() => handleDeleteWaypoint(idx)} aria-label="Remove waypoint"><X size={12} /></button>
                        </div>
                        {idx < segmentDistances.length && (
                          <div className="row align-center space-between">
                            <span className="caption faint">↕ {segmentDistances[idx].toFixed(2)} km</span>
                            <input
                              className="input sm"
                              placeholder={formatPace(paceSecondsPerKm)}
                              value={segmentInputs[idx] ?? ''}
                              onChange={e => applySegmentPaceInput(idx, e.target.value)}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="column compact">
                <span className="eyebrow">Surface</span>
                {SURFACES.map(s => (
                  <div key={s.key} className="row align-center space-between">
                    <span className="caption">{s.icon} {s.label}</span>
                    <span className="caption faint">{surfaceMix[s.key]}%</span>
                  </div>
                ))}
              </div>

              <div className="column compact">
                <div className="row align-center space-between">
                  <span className="eyebrow">Saved Routes</span>
                  <button className="ghost sm" onClick={() => navigate('/saved-routes', { state: { returnTo: '/plan-route' } })}>All</button>
                </div>
                {profileFilteredRoutes.length === 0 ? (
                  <span className="caption faint">No saved routes for this activity.</span>
                ) : (
                  profileFilteredRoutes.map(route => (
                    <button key={route.id} className="surface tight compact row align-center interactive" onClick={() => handleLoadSavedRoute(route)}>
                      <span className={`dot ${route.profile === 'bike' ? 'cycle' : 'run'}`} />
                      <span className="caption grow">{route.name}</span>
                      <span className="caption muted">{route.distanceKm.toFixed(1)} km</span>
                    </button>
                  ))
                )}
              </div>

              <div className="column compact">
                <span className="eyebrow">Elevation</span>
                <div className="row align-bottom compact">
                  <h3>{displayKm > 0 ? `${(displayKm * 8).toFixed(0)}m` : '—'}</h3>
                  <span className="caption muted">gain · {displayKm > 0 ? `${Math.round(displayKm * 3)}m` : '—'} loss</span>
                </div>
                <div data-chart>
                  <svg viewBox="0 0 400 60" preserveAspectRatio="none">
                    <path d={elevD} fill="none" stroke="var(--accent)" strokeWidth="1.5" />
                    <path d={`${elevD} L400,60 L0,60 Z`} fill="var(--accent)" opacity="0.1" />
                  </svg>
                </div>
              </div>
            </>
          ) : (
            <div className="column align-center">
              <button className="ghost icon sm" onClick={() => setSideOpen(true)} aria-label="Expand sidebar"><ChevronRight size={16} /></button>
              <hr />
              <button className="ghost icon sm" onClick={() => setSideOpen(true)} title="Plan"><Navigation size={16} /></button>
              <button className="ghost icon sm" onClick={() => setSideOpen(true)} title="Waypoints"><MapPin size={16} /></button>
              <button className="ghost icon sm" onClick={() => setSideOpen(true)} title="Elevation"><Mountain size={16} /></button>
              <button className="ghost icon sm" onClick={() => setSideOpen(true)} title="Saved"><Bookmark size={16} /></button>
            </div>
          )}
        </div>

        <div className="grow relative column compact">
          <RouteMap
            ref={mapRef}
            waypoints={waypoints}
            onChange={setWaypoints}
            profile={profile}
            onRoutedDistanceChange={setRoutedKm}
            mode={mode}
            onModeChange={() => {}}
            onUndoRedoChange={handleUndoRedo}
            baseLayerId={baseLayerId}
            showDistanceMarkers={false}
          />

          <div className="absolute right top column compact">
            <div className="surface tight column compact">
              <button className="ghost sm" onClick={() => mapRef.current?.zoomIn()} aria-label="Zoom in"><Plus size={10} /></button>
              <button className="ghost sm" onClick={() => mapRef.current?.zoomOut()} aria-label="Zoom out"><Minus size={10} /></button>
            </div>
            <div className="surface tight column compact">
              <button className="ghost icon sm" onClick={() => mapRef.current?.fitRoute()} aria-label="Route overview"><PiLineSegments size={10} /></button>
              <button className="ghost icon sm" onClick={() => mapRef.current?.locate()} aria-label="Locate me"><IoMdLocate size={10} /></button>
            </div>
          </div>
          <div className='absolute bottom right'>
            <div className="surface tight column compact">
              {layerPickerOpen ? (
                <>
                  {BASE_LAYERS.map(l => (
                    <button
                      key={l.id}
                      className={`ghost icon sm${baseLayerId === l.id ? ' active' : ''}`}
                      onClick={() => { handleLayerSwitch(l.id); setLayerPickerOpen(false); }}
                      aria-label={l.label}
                    >
                      {l.id === 'plain' ? '🗺' : l.id === 'dark' ? '🌙' : l.id === 'topo' ? '⛰' : '🛰'}
                    </button>
                  ))}
                  <button className="ghost icon sm" onClick={() => setLayerPickerOpen(false)} aria-label="Layers">
                    <Layers size={10} />
                  </button>
                </>
              ) : (
                <button className="ghost icon sm" onClick={() => setLayerPickerOpen(true)} aria-label="Layers">
                  <Layers size={10} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bottom-sheet" data-snap={snap}>
        <button className="handle" onClick={() => setSnap(s => s === 'peek' ? 'mid' : s === 'mid' ? 'full' : 'peek')} aria-label="Toggle sheet" />
        <div className="body">
          {isStandalone && waypoints.length >= 2 && (
            <input
              className="input"
              placeholder="Route name…"
              value={routeName}
              onChange={e => setRouteName(e.target.value)}
            />
          )}

          <div className="grid-4">
            <div>
              <h3>{displayKm > 0 ? displayKm.toFixed(2) : '—'}</h3>
              <span className="eyebrow">km</span>
            </div>
            <div>
              <h3>{displayKm > 0 ? `+${Math.round(displayKm * 8)}` : '—'}</h3>
              <span className="eyebrow">Gain</span>
            </div>
            <div>
              <h3>{displayKm > 0 ? estimateCalories(displayKm, activity) : '—'}</h3>
              <span className="eyebrow">Cal</span>
            </div>
            <div>
              <h3>{waypoints.length}</h3>
              <span className="eyebrow">Pins</span>
            </div>
          </div>

          <button className="primary" onClick={handleSave}>Save route</button>

          <div className="grid-4">
            {ACTIVITIES.map(a => (
              <div
                key={a.id}
                className={`surface flat compact interactive${activity === a.id ? ' selected' : ''}`}
                onClick={() => setActivity(a.id)}
                role="button"
                tabIndex={0}
              >
                <div className="text-center emoji-md">
                  {a.id === 'run' ? '🏃' : a.id === 'hike' ? '🥾' : a.id === 'ride' ? '🚴' : '🚶'}
                </div>
                <span className="caption">{a.label}</span>
              </div>
            ))}
          </div>

          <div className="grid-4">
            <button className="ghost" disabled={waypoints.length < 2} onClick={() => mapRef.current?.reverseRoute()}>
              <span className="emoji-md">🔄</span>
              <span className="caption">Reverse</span>
            </button>
            <button className="ghost" disabled={waypoints.length < 2} onClick={() => mapRef.current?.clearRoute()}>
              <span className="emoji-md">🧹</span>
              <span className="caption">Clear</span>
            </button>
            <button className="ghost">
              <span className="emoji-md">📤</span>
              <span className="caption">Share</span>
            </button>
            <button className="ghost">
              <span className="emoji-md">📄</span>
              <span className="caption">GPX</span>
            </button>
          </div>

          <div className="alert">
            <div className="eyebrow">ELEVATION</div>
            <div data-mini-chart>
              <svg viewBox="0 0 400 40" preserveAspectRatio="none">
                <path d={`${elevD.replace(/M/g, 'M').replace(/L/g, 'L')}`} fill="none" stroke="var(--accent)" strokeWidth="2" />
                <path d={`${elevD} L400,40 L0,40 Z`} fill="var(--accent)" opacity="0.1" />
              </svg>
            </div>
            <div className="row center">
              <span className="caption">Gain: {displayKm > 0 ? `+${Math.round(displayKm * 8)}m` : '—'}</span>
              <span className="caption">Min: —</span>
              <span className="caption">Max: —</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
