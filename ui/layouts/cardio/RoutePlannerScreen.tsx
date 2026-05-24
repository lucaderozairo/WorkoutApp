import { useState } from 'react';
import { RouteMap } from '@ui/components/workout/wizard/RouteMap';
import { ScreenHeader } from '@ui/components/shared';
import {
  BarChart2, Bookmark, ChevronLeft, ChevronRight,
  Layers, Map, MapPin, Minus, Moon, Mountain,
  MousePointer2, Navigation, Pencil, Plus,
  RotateCcw, RotateCw, Satellite, Save, Scissors, Trash2, X,
} from 'lucide-react';
import { MdDirectionsBike, MdDirectionsRun, MdDirectionsWalk, MdHiking } from 'react-icons/md';
import { IoMdLocate } from 'react-icons/io';
import { PiLineSegments } from 'react-icons/pi';
import type { IconType } from 'react-icons';
import { formatPace } from '@features/planning';
import type { SavedRoute } from '@features/planning';
import {
  useRoutePlanner,
  BASE_LAYERS, ACTIVITIES, PACE_PRESETS, PACE_FACTORS, SURFACES,
  paceForPreset, estimateCalories,
  type ActivityId,
  type EditMode,
  type PacePreset,
  type SurfaceKey,
} from './useRoutePlanner';

type SidePanel = 'plan' | 'pins' | 'stats' | 'saved';

const ACTIVITY_ICON_MAP: Record<ActivityId, IconType> = {
  run:  MdDirectionsRun,
  hike: MdHiking,
  ride: MdDirectionsBike,
  walk: MdDirectionsWalk,
};

const RAIL_ITEMS: { id: SidePanel; icon: React.ReactNode; label: string }[] = [
  { id: 'plan',  icon: <Navigation size={16} />, label: 'PLAN'  },
  { id: 'pins',  icon: <MapPin size={16} />,     label: 'PINS'  },
  { id: 'stats', icon: <BarChart2 size={16} />,  label: 'STATS' },
  { id: 'saved', icon: <Bookmark size={16} />,   label: 'SAVED' },
];

const MOBILE_TABS: { id: SidePanel; label: string }[] = [
  { id: 'plan',  label: 'Plan'  },
  { id: 'pins',  label: 'Pins'  },
  { id: 'stats', label: 'Stats' },
  { id: 'saved', label: 'Saved' },
];

export function RoutePlannerScreen() {
  const {
    mapRef, navigate, waypoints, setWaypoints, setRoutedKm,
    routeName, setRouteName, mode, undoCount, redoCount,
    baseLayerId, searchQuery, setSearchQuery, searchBusy, searchError,
    sideOpen, setSideOpen, snap, setSnap,
    activity, setActivity, paceSecondsPerKm, setPaceSecondsPerKm,
    pacePreset, paceInput, setPaceInput, segmentInputs,
    layerPickerOpen, setLayerPickerOpen, profile, displayKm, isStandalone,
    segmentDistances, timeStr, surfaceMix, elevD, profileFilteredRoutes,
    handleSave, handleBack, handleUndoRedo, handleLayerSwitch, handleSearch,
    applyPaceInput, applySegmentPaceInput, handleDeleteWaypoint,
    handleLoadSavedRoute, handlePacePreset,
  } = useRoutePlanner();

  const [sidePanel, setSidePanel] = useState<SidePanel>('plan');

  const canSave = isStandalone
    ? waypoints.length >= 2 && routeName.trim().length > 0
    : waypoints.length >= 2;

  const gain = displayKm > 0 ? Math.round(displayKm * 8) : 0;
  const loss = displayKm > 0 ? Math.round(displayKm * 3) : 0;

  function handleRailClick(id: SidePanel) {
    if (sidePanel === id) {
      setSideOpen(s => !s);
    } else {
      setSidePanel(id);
      setSideOpen(true);
    }
  }

  const panelSubtitle =
    sidePanel === 'plan'  ? 'Activity, pace & summary' :
    sidePanel === 'pins'  ? `${waypoints.length} waypoint${waypoints.length !== 1 ? 's' : ''}` :
    sidePanel === 'stats' ? `${displayKm > 0 ? displayKm.toFixed(1) : '0'} km · +${gain} m` :
                            'Past routes & favourites';

  return (
    <div className="grow column clip full-bleed">

      {/* ── DESKTOP TOP TOOLBAR ── */}
      <div className="desktop-only">
      <div className="surface tight row align-center compact shrink-0">
        {(['select', 'add', 'split', 'delete'] as EditMode[]).map(m => (
          <button
            key={m}
            className={`ghost sm${mode === m ? ' active' : ''}`}
            onClick={() => mapRef.current?.setMode(m)}
            aria-label={m.charAt(0).toUpperCase() + m.slice(1)}
          >
            {m === 'select' ? <MousePointer2 size={14} />
              : m === 'add'    ? <Pencil size={14} />
              : m === 'split'  ? <Scissors size={14} />
              :                  <Trash2 size={14} />}
          </button>
        ))}
        <button className="ghost icon sm" disabled={undoCount === 0} onClick={() => mapRef.current?.undo()} aria-label="Undo">
          <RotateCcw size={14} />
        </button>
        <button className="ghost icon sm" disabled={redoCount === 0} onClick={() => mapRef.current?.redo()} aria-label="Redo">
          <RotateCw size={14} />
        </button>
        <div className="row align-center compact grow">
          <input
            className="input grow"
            placeholder="Search a place, address, or lat/lng…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') void handleSearch(); }}
          />
          {searchBusy && <span className="caption muted">Searching…</span>}
          {searchError && <span className="caption faint">{searchError}</span>}
        </div>
        {isStandalone && (
          <input
            className="input"
            placeholder="Route name…"
            value={routeName}
            onChange={e => setRouteName(e.target.value)}
          />
        )}
        <button className="primary sm" disabled={!canSave} onClick={handleSave}>
          <Save size={14} /> Save route
        </button>
      </div>
      </div>

      {/* ── MOBILE HEADER ── */}
      <div className="mobile-only column compact">
        <ScreenHeader
          title="Route Planner"
          back={handleBack}
          primary={
            <button className="ghost icon sm" disabled={undoCount === 0} onClick={() => mapRef.current?.undo()} aria-label="Undo">
              <RotateCcw size={16} />
            </button>
          }
        />
        <div className="row center compact">
          {(['select', 'add', 'split', 'delete'] as EditMode[]).map(m => (
            <button
              key={m}
              className={`ghost${mode === m ? ' active' : ''}`}
              onClick={() => mapRef.current?.setMode(m)}
              aria-label={m.charAt(0).toUpperCase() + m.slice(1)}
            >
              {m === 'select' ? <MousePointer2 size={14} />
                : m === 'add'    ? <Pencil size={14} />
                : m === 'split'  ? <Scissors size={14} />
                :                  <Trash2 size={14} />}
            </button>
          ))}
        </div>
      </div>

      {/* ── TWO-PANE AREA ── */}
      <div className="row grow clip">

        {/* Icon rail — hidden on mobile via sidebar.css */}
        <div className="side-rail">
          {RAIL_ITEMS.map(item => (
            <button
              key={item.id}
              className={`side-rail-item${sidePanel === item.id && sideOpen ? ' active' : ''}`}
              onClick={() => handleRailClick(item.id)}
              aria-label={item.label}
              aria-pressed={sidePanel === item.id && sideOpen}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Content panel */}
        <div className={`side column compact${sideOpen ? '' : ' collapsed'}`}>
          {sideOpen && (
            <>
              <div className="row align-center space-between">
                <span className="eyebrow">{panelSubtitle}</span>
                <button className="ghost icon sm" onClick={() => setSideOpen(false)} aria-label="Collapse sidebar">
                  <ChevronLeft size={16} />
                </button>
              </div>
              <hr />
              {sidePanel === 'plan'  && <PlanPanel
                activity={activity}
                setActivity={setActivity}
                displayKm={displayKm}
                timeStr={timeStr}
                gain={gain}
                estimatedCal={displayKm > 0 ? estimateCalories(displayKm, activity) : 0}
                paceSecondsPerKm={paceSecondsPerKm}
                setPaceSecondsPerKm={setPaceSecondsPerKm}
                pacePreset={pacePreset}
                paceInput={paceInput}
                setPaceInput={setPaceInput}
                applyPaceInput={applyPaceInput}
                handlePacePreset={handlePacePreset}
                segmentDistances={segmentDistances}
                segmentInputs={segmentInputs}
                applySegmentPaceInput={applySegmentPaceInput}
              />}
              {sidePanel === 'pins'  && <PinsPanel
                waypoints={waypoints}
                handleDeleteWaypoint={handleDeleteWaypoint}
                segmentDistances={segmentDistances}
              />}
              {sidePanel === 'stats' && <StatsPanel
                surfaceMix={surfaceMix}
                displayKm={displayKm}
                gain={gain}
                loss={loss}
                waypoints={waypoints}
                timeStr={timeStr}
              />}
              {sidePanel === 'saved' && <SavedPanel
                profileFilteredRoutes={profileFilteredRoutes}
                handleLoadSavedRoute={handleLoadSavedRoute}
                navigate={navigate}
              />}
            </>
          )}
        </div>

        {/* Map column */}
        <div className="grow column">
          <div className="grow relative">
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
            {/* Zoom + fit + locate */}
            <div className="absolute right top column compact">
              <div className="surface tight column compact" data-map-group>
                <button className="ghost sm" onClick={() => mapRef.current?.zoomIn()} aria-label="Zoom in" data-map-btn><Plus size={10} /></button>
                <button className="ghost sm" onClick={() => mapRef.current?.zoomOut()} aria-label="Zoom out" data-map-btn><Minus size={10} /></button>
              </div>
              <div className="surface tight column compact" data-map-group>
                <button className="ghost icon sm" onClick={() => mapRef.current?.fitRoute()} aria-label="Fit route" data-map-btn><PiLineSegments size={10} /></button>
                <button className="ghost icon sm" onClick={() => mapRef.current?.locate()} aria-label="Locate me" data-map-btn><IoMdLocate size={10} /></button>
              </div>
            </div>
            {/* Layer picker */}
            <div className="absolute bottom right">
              <div className="surface tight column compact" data-map-group>
                {layerPickerOpen ? (
                  <>
                    {BASE_LAYERS.map(l => (
                      <button
                        key={l.id}
                        className={`ghost icon sm${baseLayerId === l.id ? ' active' : ''}`}
                        onClick={() => { handleLayerSwitch(l.id); setLayerPickerOpen(false); }}
                        aria-label={l.label}
                        data-map-btn
                      >
                        {l.id === 'plain' ? <Map size={10} />
                          : l.id === 'dark' ? <Moon size={10} />
                          : l.id === 'topo' ? <Mountain size={10} />
                          : <Satellite size={10} />}
                      </button>
                    ))}
                    <button className="ghost icon sm" onClick={() => setLayerPickerOpen(false)} aria-label="Close" data-map-btn>
                      <Layers size={10} />
                    </button>
                  </>
                ) : (
                  <button className="ghost icon sm" onClick={() => setLayerPickerOpen(true)} aria-label="Layers" data-map-btn>
                    <Layers size={10} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Desktop elevation bar */}
          <div className="desktop-only">
          <div className="surface tight row align-center compact shrink-0">
            <button
              className="ghost icon sm"
              onClick={() => setSideOpen(s => !s)}
              aria-label="Toggle sidebar"
            >
              {sideOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
            </button>
            <span className="eyebrow nowrap">Elevation</span>
            <div className="grow" data-mini-chart>
              <svg viewBox="0 0 400 40" preserveAspectRatio="none">
                <path d={`${elevD} L400,40 L0,40 Z`} fill="var(--accent)" opacity="0.12" />
                <path d={elevD} fill="none" stroke="var(--accent)" strokeWidth="1.5" />
              </svg>
            </div>
            <span className="caption muted nowrap">
              {displayKm > 0 ? `+${gain}m gain · −${loss}m loss` : '—'}
            </span>
          </div>
          </div>
        </div>
      </div>

      {/* ── MOBILE BOTTOM SHEET ── */}
      <div className="bottom-sheet" data-snap={snap}>
        <button
          className="handle"
          onClick={() => setSnap(s => s === 'peek' ? 'mid' : s === 'mid' ? 'full' : 'peek')}
          aria-label="Toggle sheet"
        />
        <div className="body column grow scroll-y">
          <div className="tabs shrink-0">
            {MOBILE_TABS.map(tab => (
              <button
                key={tab.id}
                className={`tab${sidePanel === tab.id ? ' active' : ''}`}
                onClick={() => {
                  setSidePanel(tab.id);
                  if (snap === 'peek') setSnap('mid');
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {isStandalone && waypoints.length >= 2 && (
            <input
              className="input"
              placeholder="Route name…"
              value={routeName}
              onChange={e => setRouteName(e.target.value)}
            />
          )}
          <button className="primary" disabled={!canSave} onClick={handleSave}>
            <Save size={14} /> Save route
          </button>

          {sidePanel === 'plan'  && <PlanPanel
            activity={activity}
            setActivity={setActivity}
            displayKm={displayKm}
            timeStr={timeStr}
            gain={gain}
            estimatedCal={displayKm > 0 ? estimateCalories(displayKm, activity) : 0}
            paceSecondsPerKm={paceSecondsPerKm}
            setPaceSecondsPerKm={setPaceSecondsPerKm}
            pacePreset={pacePreset}
            paceInput={paceInput}
            setPaceInput={setPaceInput}
            applyPaceInput={applyPaceInput}
            handlePacePreset={handlePacePreset}
            segmentDistances={segmentDistances}
            segmentInputs={segmentInputs}
            applySegmentPaceInput={applySegmentPaceInput}
          />}
          {sidePanel === 'pins'  && <PinsPanel
            waypoints={waypoints}
            handleDeleteWaypoint={handleDeleteWaypoint}
            segmentDistances={segmentDistances}
          />}
          {sidePanel === 'stats' && <StatsPanel
            surfaceMix={surfaceMix}
            displayKm={displayKm}
            gain={gain}
            loss={loss}
            waypoints={waypoints}
            timeStr={timeStr}
          />}
          {sidePanel === 'saved' && <SavedPanel
            profileFilteredRoutes={profileFilteredRoutes}
            handleLoadSavedRoute={handleLoadSavedRoute}
            navigate={navigate}
          />}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface PlanPanelProps {
  activity: ActivityId;
  setActivity: (a: ActivityId) => void;
  displayKm: number;
  timeStr: string;
  gain: number;
  estimatedCal: number;
  paceSecondsPerKm: number;
  setPaceSecondsPerKm: (v: number) => void;
  pacePreset: PacePreset;
  paceInput: string;
  setPaceInput: (v: string) => void;
  applyPaceInput: (v: string) => void;
  handlePacePreset: (p: PacePreset) => void;
  segmentDistances: number[];
  segmentInputs: Record<number, string>;
  applySegmentPaceInput: (idx: number, v: string) => void;
}

function PlanPanel({
  activity, setActivity, displayKm, timeStr, gain, estimatedCal,
  paceSecondsPerKm, setPaceSecondsPerKm, pacePreset, paceInput, setPaceInput,
  applyPaceInput, handlePacePreset, segmentDistances, segmentInputs, applySegmentPaceInput,
}: PlanPanelProps) {
  return (
    <div className="column compact">

      <span className="eyebrow">Activity</span>
      <div className="grid-4">
        {ACTIVITIES.map(a => {
          const Icon = ACTIVITY_ICON_MAP[a.id];
          return (
            <button
              key={a.id}
              data-id={a.id}
              className={`activity-chip column compact align-center${activity === a.id ? ' active' : ''}`}
              onClick={() => setActivity(a.id)}
            >
              <span data-id={a.id} className="activity-dot row center align-center">
                <Icon size={10} />
              </span>
              <span className="caption">{a.label}</span>
            </button>
          );
        })}
      </div>

      <hr />

      <span className="eyebrow">Summary</span>
      <div className="surface ghost row align-bottom compact">
        <h2 className="mono">{displayKm > 0 ? displayKm.toFixed(2) : '—'}</h2>
        <span className="caption muted">km</span>
      </div>
      <div className="row compact">
        <div className="surface tight flat compact column grow align-center">
          <span className="mono detail">{timeStr}</span>
          <span className="eyebrow">Time</span>
        </div>
        <div className="surface tight flat compact column grow align-center">
          <span className="mono detail">{displayKm > 0 ? `+${gain}` : '—'}<span className="caption muted"> m</span></span>
          <span className="eyebrow">Gain</span>
        </div>
        <div className="surface tight flat compact column grow align-center">
          <span className="mono detail">{displayKm > 0 ? estimatedCal : '—'}<span className="caption muted"> kcal</span></span>
          <span className="eyebrow">Energy</span>
        </div>
      </div>

      <hr />

      <span className="eyebrow">Pace</span>
      <div className="row align-bottom compact">
        <h3 className="mono">{formatPace(paceSecondsPerKm)}</h3>
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
          const closest = (Object.entries(PACE_FACTORS) as [PacePreset, number][])
            .reduce((prev, curr) => Math.abs(curr[1] - ratio) < Math.abs(prev[1] - ratio) ? curr : prev)[0];
          handlePacePreset(closest);
        }}
      />
      <div className="cluster compact">
        {PACE_PRESETS.map(p => (
          <button
            key={p}
            className={`sm column tight${pacePreset === p ? ' active' : ''}`}
            onClick={() => handlePacePreset(p)}
          >
            <span>{p.charAt(0).toUpperCase() + p.slice(1)}</span>
            <span className="caption faint">{formatPace(paceForPreset(p))}</span>
          </button>
        ))}
      </div>

      {segmentDistances.length > 0 && (
        <>
          <hr />
          <span className="eyebrow">Per-segment pace</span>
          {segmentDistances.map((dist, idx) => (
            <div key={idx} className="row align-center compact">
              <span className="caption muted grow">{dist.toFixed(2)} km</span>
              <input
                className="input sm"
                placeholder={formatPace(paceSecondsPerKm)}
                value={segmentInputs[idx] ?? ''}
                onChange={e => applySegmentPaceInput(idx, e.target.value)}
              />
            </div>
          ))}
        </>
      )}
    </div>
  );
}

interface PinsPanelProps {
  waypoints: [number, number][];
  handleDeleteWaypoint: (idx: number) => void;
  segmentDistances: number[];
}

function PinsPanel({ waypoints, handleDeleteWaypoint, segmentDistances }: PinsPanelProps) {
  return (
    <div className="column compact">
      <span className="eyebrow">Waypoints</span>
      {waypoints.length < 2 ? (
        <span className="caption faint">Add at least 2 points on the map.</span>
      ) : (
        waypoints.map((wp, idx) => (
          <div key={`wp-${idx}`} className="row align-center compact interactive">
            <span className={`waypoint-badge row center align-center mono${
              idx === 0 ? ' start' : idx === waypoints.length - 1 ? ' finish' : ' mid'
            }`}>
              {idx === 0 ? 'S' : idx === waypoints.length - 1 ? 'F' : idx}
            </span>
            <div className="column compact grow">
              <span className="caption mono">{wp[0].toFixed(4)}, {wp[1].toFixed(4)}</span>
              {idx < segmentDistances.length && (
                <span className="caption faint">+{segmentDistances[idx].toFixed(2)} km</span>
              )}
            </div>
            <button
              className="ghost icon sm"
              onClick={() => handleDeleteWaypoint(idx)}
              aria-label="Remove waypoint"
            >
              <X size={12} />
            </button>
          </div>
        ))
      )}
    </div>
  );
}

interface StatsPanelProps {
  surfaceMix: Record<SurfaceKey, number>;
  displayKm: number;
  gain: number;
  loss: number;
  waypoints: [number, number][];
  timeStr: string;
}

function StatsPanel({ surfaceMix, displayKm, gain, loss, waypoints, timeStr }: StatsPanelProps) {
  return (
    <div className="column compact">

      <span className="eyebrow">Surface Mix</span>
      <div className="surface-mix-bar">
        {SURFACES.map(s =>
          surfaceMix[s.key] > 0 ? (
            <div
              key={s.key}
              className="surface-mix-segment"
              data-surface={s.key}
              style={{ '--mix-pct': `${surfaceMix[s.key]}%` } as React.CSSProperties}
              title={`${s.label}: ${surfaceMix[s.key]}%`}
            />
          ) : null
        )}
      </div>
      <div className="cluster compact">
        {SURFACES.filter(s => surfaceMix[s.key] > 0).map(s => (
          <div key={s.key} className="row align-center compact">
            <span className="caption">{s.icon} {s.label}</span>
            <span className="caption faint">{surfaceMix[s.key]}%</span>
          </div>
        ))}
      </div>

      <hr />

      <span className="eyebrow">Elevation</span>
      <div className="row compact">
        <div className="surface tight flat compact column grow align-center">
          <span className="mono detail">{displayKm > 0 ? `+${gain}` : '—'}<span className="caption muted"> m</span></span>
          <span className="eyebrow">Gain</span>
        </div>
        <div className="surface tight flat compact column grow align-center">
          <span className="mono detail">{displayKm > 0 ? `−${loss}` : '—'}<span className="caption muted"> m</span></span>
          <span className="eyebrow">Loss</span>
        </div>
      </div>

      <hr />

      <span className="eyebrow">Highlights</span>
      {[
        { label: 'Total distance', value: displayKm > 0 ? `${displayKm.toFixed(2)} km` : '—' },
        { label: 'Segments',       value: String(Math.max(0, waypoints.length - 1))          },
        { label: 'Estimated time', value: timeStr                                             },
      ].map(row => (
        <div key={row.label} className="row align-center space-between">
          <span className="caption">{row.label}</span>
          <span className="caption mono">{row.value}</span>
        </div>
      ))}

      <hr />

      <div className="surface flat tight compact">
        <span className="caption muted">Surface mix and elevation are estimated values.</span>
      </div>
    </div>
  );
}

interface SavedPanelProps {
  profileFilteredRoutes: SavedRoute[];
  handleLoadSavedRoute: (route: SavedRoute) => void;
  navigate: (path: string, opts?: { state: unknown }) => void;
}

function SavedPanel({ profileFilteredRoutes, handleLoadSavedRoute, navigate }: SavedPanelProps) {
  return (
    <div className="column compact">
      <span className="eyebrow">Saved Routes</span>
      {profileFilteredRoutes.length === 0 ? (
        <span className="caption faint">No saved routes for this activity.</span>
      ) : (
        profileFilteredRoutes.map(route => (
          <button
            key={route.id}
            className="surface tight flat compact row align-center interactive"
            onClick={() => handleLoadSavedRoute(route)}
          >
            <span className={`dot ${route.profile === 'bike' ? 'cycle' : 'run'}`} />
            <div className="column compact grow">
              <span className="caption">{route.name}</span>
              <span className="caption faint">{route.distanceKm.toFixed(1)} km</span>
            </div>
            <ChevronRight size={12} className="faint" />
          </button>
        ))
      )}
      <button
        className="ghost sm"
        onClick={() => navigate('/saved-routes', { state: { returnTo: '/plan-route' } })}
      >
        View all saved routes
      </button>
    </div>
  );
}
