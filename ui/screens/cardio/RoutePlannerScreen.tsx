import { useState } from 'react';
import { Grid, Row, Column, Cluster, Layer, Layered } from '@ui/layout';
import { Surface, Text } from '@ui/atoms';
import { RouteMap } from '@ui/components/workout/wizard/RouteMap';
import { ScreenHeader, Button, Input, Slider } from '@ui/molecules';
import { SearchBar } from '@ui/patterns/common/SearchBar';
import {
  BarChart2, Bookmark, ChevronLeft, ChevronRight, ChevronUp,
  Layers, Map, MapPin, Minus, Moon, Mountain,
  MousePointer2, Navigation, Pencil, Plus,
  RotateCcw, RotateCw, Satellite, Save, Scissors, Trash2, X
} from 'lucide-react';
import { ChartContainer } from '@ui/patterns/charts/charts';
import { MdDirectionsBike, MdDirectionsRun, MdDirectionsWalk, MdHiking } from 'react-icons/md';
import { IoMdLocate } from 'react-icons/io';
import { PiLineSegments } from 'react-icons/pi';
import type { IconType } from 'react-icons';
import {ArrowSquareRight} from 'phosphor-react';
import { formatPace } from '@features/planning';
import type { SavedRoute } from '@features/planning/contract';
import {
  useRoutePlanner,
  BASE_LAYERS, ACTIVITIES, PACE_PRESETS, PACE_FACTORS, SURFACES,
  paceForPreset, estimateCalories,
  type ActivityId,
  type EditMode,
  type PacePreset,
  type SurfaceKey,
} from './useRoutePlanner';
import { MapControlButton } from '@ui/components/route-planner/MapControlButton';
import { SideRailItem } from '@ui/components/route-planner/SideRailItem';
import { ActivityChip } from '@ui/components/route-planner/ActivityChip';

type SidePanel = 'plan' | 'pins' | 'stats' | 'saved';

const ACTIVITY_ICON_MAP: Record<ActivityId, IconType> = {
  run: MdDirectionsRun,
  hike: MdHiking,
  ride: MdDirectionsBike,
  walk: MdDirectionsWalk,
};

const RAIL_ITEMS: { id: SidePanel; icon: React.ReactNode; label: string }[] = [
  { id: 'plan', icon: <Navigation size={16} />, label: 'PLAN' },
  { id: 'pins', icon: <MapPin size={16} />, label: 'PINS' },
  { id: 'stats', icon: <BarChart2 size={16} />, label: 'STATS' },
  { id: 'saved', icon: <Bookmark size={16} />, label: 'SAVED' },
];

const MOBILE_TABS: { id: SidePanel; label: string }[] = [
  { id: 'plan', label: 'Plan' },
  { id: 'pins', label: 'Pins' },
  { id: 'stats', label: 'Stats' },
  { id: 'saved', label: 'Saved' },
];

export function RoutePlannerScreen() {
  const {
    mapRef, navigate, waypoints, setWaypoints, setRoutedKm,
    routeName, setRouteName, mode, setMode, undoCount, redoCount,
    baseLayerId, searchQuery, setSearchQuery, searchBusy, searchError,
    sideOpen, setSideOpen, snap, setSnap,
    activity, setActivity, paceSecondsPerKm, setPaceSecondsPerKm,
    pacePreset, paceInput, setPaceInput, segmentInputs,
    layerPickerOpen, setLayerPickerOpen, profile, displayKm, isStandalone,
    segmentDistances, timeStr, surfaceMix, elevD, elevPoints, profileFilteredRoutes,
    handleSave, handleBack, handleUndoRedo, handleLayerSwitch, handleSearch,
    applyPaceInput, applySegmentPaceInput, handleDeleteWaypoint,
    handleLoadSavedRoute, handlePacePreset,
  } = useRoutePlanner();

  const [sidePanel, setSidePanel] = useState<SidePanel>('plan');
  const [elevOpen, setElevOpen] = useState(false);

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
    sidePanel === 'plan' ? 'Activity, pace & summary' :
      sidePanel === 'pins' ? `${waypoints.length} waypoint${waypoints.length !== 1 ? 's' : ''}` :
        sidePanel === 'stats' ? `${displayKm > 0 ? displayKm.toFixed(1) : '0'} km · +${gain} m` :
          'Past routes & favourites';

  return (
    <Surface variant="ghost" className="pad-sm grow gap-0 column clip full-bleed">

      {/* ── DESKTOP TOP TOOLBAR ── */}
      <Row className="desktop-only">
        <Surface pad="sm">
          <Row align="center" gap={1} className="shrink-0">
          {(['select', 'add', 'split', 'delete'] as EditMode[]).map(m => (
            <Button
              key={m}
              variant="ghost"
              size="sm"
              active={mode === m}
              onClick={() => setMode(m)}
              aria-label={m.charAt(0).toUpperCase() + m.slice(1)}
            >
              {m === 'select' ? <MousePointer2 size={14} />
                : m === 'add' ? <Pencil size={14} />
                  : m === 'split' ? <Scissors size={14} />
                    : <Trash2 size={14} />}
            </Button>
          ))}
          <Button variant="ghost" size="icon-sm" disabled={undoCount === 0} onClick={() => mapRef.current?.undo()} aria-label="Undo">
            <RotateCcw size={14} />
          </Button>
          <Button variant="ghost" size="icon-sm" disabled={redoCount === 0} onClick={() => mapRef.current?.redo()} aria-label="Redo">
            <RotateCw size={14} />
          </Button>
          <Row align="center" gap={1} className="grow">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search a place, address, or lat/lng…"
              onSubmit={() => void handleSearch()}
            />
            {searchBusy && <Text size="caption" color="muted">Searching…</Text>}
            {searchError && <Text size="caption" color="faint">{searchError}</Text>}
          </Row>
          {isStandalone && (
            <Input
              className="grow"
              placeholder="Route name…"
              value={routeName}
              onChange={e => setRouteName(e.target.value)}
            />
          )}
          <Button variant="primary" size="sm" disabled={!canSave} onClick={handleSave}>
            <Save size={14} /> Save route
          </Button>
          </Row>
        </Surface>
      </Row>

      {/* ── MOBILE HEADER ── */}
      <Column gap={1} className="mobile-only">
        <ScreenHeader
          title="Route Planner"
          back={handleBack}
          primary={
            <Button variant="ghost" size="icon-sm" disabled={undoCount === 0} onClick={() => mapRef.current?.undo()} aria-label="Undo">
              <RotateCcw size={16} />
            </Button>
          }
        />
        <Row gap={1} justify="center">
          {(['select', 'add', 'split', 'delete'] as EditMode[]).map(m => (
            <Button
              key={m}
              variant="ghost"
              active={mode === m}
              onClick={() => setMode(m)}
              aria-label={m.charAt(0).toUpperCase() + m.slice(1)}
            >
              {m === 'select' ? <MousePointer2 size={14} />
                : m === 'add' ? <Pencil size={14} />
                  : m === 'split' ? <Scissors size={14} />
                    : <Trash2 size={14} />}
            </Button>
          ))}
        </Row>
      </Column>

      {/* ── TWO-PANE AREA ── */}
      <Row className="gap-0 grow clip">

        

        {/* Map column */}
        <Column gap={0} className="grow">
          <Layered className="grow column">
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
              showDistanceMarkers={false}
            />
            {/* Zoom + fit + locate */}

            <Layer pin="top-left" z="controls" gap={1}>
              <Surface pad="sm" data-map-group>
                <Column gap={1}>
                  <MapControlButton onClick={() => mapRef.current?.zoomIn()} aria-label="Zoom in"><Plus size={10} /></MapControlButton>
                  <MapControlButton onClick={() => mapRef.current?.zoomOut()} aria-label="Zoom out"><Minus size={10} /></MapControlButton>
                </Column>
              </Surface>
              <Surface pad="sm" data-map-group>
                <Column gap={1}>
                  {layerPickerOpen ? (
                    <>
                      {BASE_LAYERS.map(l => (
                        <MapControlButton key={l.id} active={baseLayerId === l.id}
                          onClick={() => { handleLayerSwitch(l.id); setLayerPickerOpen(false); }} aria-label={l.label}>
                          {l.id === 'plain' ? <Map size={10} />
                            : l.id === 'dark' ? <Moon size={10} />
                              : l.id === 'topo' ? <Mountain size={10} />
                                : <Satellite size={10} />}
                        </MapControlButton>
                      ))}
                      <MapControlButton onClick={() => setLayerPickerOpen(false)} aria-label="Close"><Layers size={10} /></MapControlButton>
                    </>
                  ) : (
                    <MapControlButton onClick={() => setLayerPickerOpen(true)} aria-label="Layers"><Layers size={10} /></MapControlButton>
                  )}
                </Column>
              </Surface>
            </Layer>
            <Layer pin="top-right" z="controls" gap={1}>
              <Surface pad="sm" data-map-group>
                <Column gap={1}>
                  <MapControlButton onClick={() => mapRef.current?.fitRoute()} aria-label="Fit route"><PiLineSegments size={10} /></MapControlButton>
                  <MapControlButton onClick={() => mapRef.current?.locate()} aria-label="Locate me"><IoMdLocate size={10} /></MapControlButton>
                </Column>
              </Surface>
            </Layer>
          </Layered>
                  
          {/* Desktop elevation panel */}
          <Row className="desktop-only">
            <Column className="shrink-0" data-elevation-panel>
              <Button
                variant="ghost"
                block
                className="gap-1"
                onClick={() => setElevOpen(v => !v)}
                aria-expanded={elevOpen}
                aria-label="Toggle elevation profile"
              >
                <ChevronUp size={14} className={elevOpen ? 'chevron open' : 'chevron'} />
                <Text size="eyebrow" nowrap>Elevation</Text>
                <Column className="grow" data-mini-chart>
                  <svg viewBox="0 0 400 40" preserveAspectRatio="none">
                    <path d={`${elevD} L400,40 L0,40 Z`} fill="var(--accent)" opacity="0.12" />
                    <path d={elevD} fill="none" stroke="var(--accent)" strokeWidth="1.5" />
                  </svg>
                </Column>
                <Text size="caption" color="muted" nowrap>
                  {displayKm > 0 ? `+${gain}m gain · −${loss}m loss` : '—'}
                </Text>
              </Button>
              {elevOpen && (
                <Column data-chart>
                  <ChartContainer
                    data={elevPoints}
                    chartType="area"
                    color="var(--accent)"
                    height={100}
                    axisShow={{ x: true, y: false }}
                  />
                </Column>
              )}
            </Column>
          </Row>
        </Column>
        {/* Sidebar: icon rail + collapsible content panel */}
        <Row className={`side${sideOpen ? '' : ' collapsed'}`}>
          <Column className="side-rail">
            <Button
              children={<ArrowSquareRight size={18}/>}/>
            {RAIL_ITEMS.map(item => (
              <SideRailItem
                key={item.id}
                id={item.id}
                label={item.label}
                icon={item.icon}
                active={sidePanel === item.id && sideOpen}
                onClick={() => handleRailClick(item.id)}
              />
            ))}
          </Column>
          {sideOpen && (
            <Column gap={1} className="side-content">
              <Row align="center" justify="between">
                <Text size="eyebrow">{panelSubtitle}</Text>
                <Button variant="ghost" size="icon-sm" onClick={() => setSideOpen(false)} aria-label="Collapse sidebar">
                  <ChevronLeft size={16} />
                </Button>
              </Row>
              <hr />
              {sidePanel === 'plan' && <PlanPanel
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
              {sidePanel === 'pins' && <PinsPanel
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
            </Column>
          )}
        </Row>
      </Row>

      {/* ── MOBILE BOTTOM SHEET ── */}
      {/* bottom-sheet: raw div retained — data-snap drives CSS snap behavior, pending grid-first refactor */}
      <div className="bottom-sheet" data-snap={snap}>
        <Button variant="ghost" className="handle"
          onClick={() => setSnap(s => s === 'peek' ? 'mid' : s === 'mid' ? 'full' : 'peek')}
          aria-label="Toggle sheet"
        />
        <Column className="grow scroll-y">
          <Row className="tabs shrink-0">
            {MOBILE_TABS.map(tab => (
              <Button key={tab.id} variant="ghost" active={sidePanel === tab.id} className="tab"
                onClick={() => { setSidePanel(tab.id); if (snap === 'peek') setSnap('mid'); }}
              >
                {tab.label}
              </Button>
            ))}
          </Row>

          {isStandalone && (
            <Input
              placeholder="Route name…"
              value={routeName}
              onChange={e => setRouteName(e.target.value)}
            />
          )}
          <Button variant="primary" disabled={!canSave} onClick={handleSave}>
            <Save size={14} /> Save route
          </Button>

          {sidePanel === 'plan' && <PlanPanel
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
          {sidePanel === 'pins' && <PinsPanel
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
        </Column>
      </div>
    </Surface>
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
  const [perSegEnabled, setPerSegEnabled] = useState(false);

  return (
    <Column gap={1}>

      <Text size="eyebrow">Activity</Text>
      <Grid cols={4}>
        {ACTIVITIES.map(a => {
          const ActivityIcon = ACTIVITY_ICON_MAP[a.id];
          return (
            <ActivityChip
              key={a.id}
              id={a.id}
              label={a.label}
              dot={<span data-id={a.id} className="activity-dot"><ActivityIcon size={10} /></span>}
              active={activity === a.id}
              onClick={() => setActivity(a.id)}
            />
          );
        })}
      </Grid>
      <Button variant="ghost" size="sm" block disabled aria-label="More activities coming soon">
        <Row gap={1} align="center" justify="center">
          <Plus size={12} />
          <span>Other activity</span>
        </Row>
      </Button>
      <Surface variant="ghost" className="pad-sm">
        <Text size="caption" color="muted">
          {activity === 'ride'
            ? 'Cycling uses bike-optimised paths and roads.'
            : activity === 'hike'
              ? 'Hiking prefers trails and unpaved paths.'
              : activity === 'walk'
                ? 'Walking uses footpaths and quiet roads.'
                : 'Running uses footpaths with some road sections.'}
        </Text>
      </Surface>

      <hr />

      <Text size="eyebrow">Summary</Text>
      <Surface pad="sm" variant="ghost">
        <Row align="end" gap={1}>
          <Text as="h2" mono>{displayKm > 0 ? displayKm.toFixed(2) : '—'}</Text>
          <Text size="caption" color="muted">km</Text>
        </Row>
      </Surface>
      <Row gap={1}>
        <Surface pad="sm" variant="flat" className="grow">
          <Column gap={1} align="center">
            <Text size="detail" mono>{timeStr}</Text>
            <Text size="eyebrow">Time</Text>
          </Column>
        </Surface>
        <Surface pad="sm" variant="flat" className="grow">
          <Column gap={1} align="center">
            <Text size="detail" mono>{displayKm > 0 ? `+${gain}` : '—'}<Text size="caption" color="muted"> m</Text></Text>
            <Text size="eyebrow">Gain</Text>
          </Column>
        </Surface>
        <Surface pad="sm" variant="flat" className="grow">
          <Column gap={1} align="center">
            <Text size="detail" mono>{displayKm > 0 ? estimatedCal : '—'}<Text size="caption" color="muted"> kcal</Text></Text>
            <Text size="eyebrow">Energy</Text>
          </Column>
        </Surface>
      </Row>

      <hr />

      <Text size="eyebrow">Pace</Text>
      <Row gap={1} align="end">
        <Text as="h3" mono>{formatPace(paceSecondsPerKm)}</Text>
        <Text size="caption" color="muted">min/km</Text>
      </Row>
      <Input
        className="sm"
        placeholder="m:ss"
        value={paceInput}
        onChange={e => setPaceInput(e.target.value)}
        onBlur={e => applyPaceInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') applyPaceInput((e.target as HTMLInputElement).value); }}
      />
      <Slider min={120} max={540} value={paceSecondsPerKm} onChange={v => setPaceSecondsPerKm(v)} />
      <Cluster className="gap-1">
        {PACE_PRESETS.map(p => (
          <Button key={p} variant="ghost" size="sm" active={pacePreset === p} className="pad-sm"
            onClick={() => handlePacePreset(p)}>
            <Column gap={0} align="center">
              <Text>{p.charAt(0).toUpperCase() + p.slice(1)}</Text>
              <Text size="caption" color="faint">{formatPace(paceForPreset(p))}</Text>
            </Column>
          </Button>
        ))}
      </Cluster>

      {segmentDistances.length > 0 && (
        <>
          <hr />
          <Row align="center" justify="between">
            <Text size="eyebrow">Per-segment pace</Text>
            <Button
              variant="ghost"
              size="sm"
              active={perSegEnabled}
              onClick={() => setPerSegEnabled(v => !v)}
              aria-pressed={perSegEnabled}
            >
              {perSegEnabled ? 'On' : 'Off'}
            </Button>
          </Row>
          {perSegEnabled && segmentDistances.map((dist, idx) => (
            <Row key={idx} align="center" gap={1}>
              <Text size="caption" color="muted" className="grow">Seg {idx + 1} — {dist.toFixed(2)} km</Text>
              <Input
                className="sm"
                placeholder={formatPace(paceSecondsPerKm)}
                value={segmentInputs[idx] ?? ''}
                onChange={e => applySegmentPaceInput(idx, e.target.value)}
              />
            </Row>
          ))}
        </>
      )}
    </Column>
  );
}

interface PinsPanelProps {
  waypoints: [number, number][];
  handleDeleteWaypoint: (idx: number) => void;
  segmentDistances: number[];
}

function PinsPanel({ waypoints, handleDeleteWaypoint, segmentDistances }: PinsPanelProps) {
  return (
    <Column gap={1}>
      <Text size="eyebrow">Waypoints</Text>
      {waypoints.length < 2 ? (
        <Text size="caption" color="faint">Add at least 2 points on the map.</Text>
      ) : (
        waypoints.map((wp, idx) => (
          <Row key={`wp-${idx}`} align="center" gap={1}>
            <span className={`waypoint-badge row center align-center mono${idx === 0 ? ' start' : idx === waypoints.length - 1 ? ' finish' : ' mid'
              }`}>
              {idx === 0 ? 'S' : idx === waypoints.length - 1 ? 'F' : idx}
            </span>
            <Column gap={1} className="grow">
              <Text size="caption" mono>{wp[0].toFixed(4)}, {wp[1].toFixed(4)}</Text>
              {idx < segmentDistances.length && (
                <Text size="caption" color="faint">+{segmentDistances[idx].toFixed(2)} km</Text>
              )}
            </Column>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => handleDeleteWaypoint(idx)}
              aria-label="Remove waypoint"
            >
              <X size={12} />
            </Button>
          </Row>
        ))
      )}
    </Column>
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
    <Column gap={1}>

      <Text size="eyebrow">Surface Mix</Text>
      <Row className="surface-mix-bar">
        {SURFACES.map(s =>
          surfaceMix[s.key] > 0 ? (
            <span
              key={s.key}
              className="surface-mix-segment"
              data-surface={s.key}
              style={{ '--mix-pct': `${surfaceMix[s.key]}%` } as React.CSSProperties}
              title={`${s.label}: ${surfaceMix[s.key]}%`}
            />
          ) : null
        )}
      </Row>
      <Cluster className="gap-1">
        {SURFACES.filter(s => surfaceMix[s.key] > 0).map(s => (
          <Row key={s.key} align="center" gap={1}>
            <Row align="center" gap={1} className="caption">
              <span className="surface-mix-swatch" data-surface={s.key} />
              {s.label}
            </Row>
            <Text size="caption" color="faint">{surfaceMix[s.key]}%</Text>
          </Row>
        ))}
      </Cluster>

      <hr />

      <Text size="eyebrow">Elevation</Text>
      <Row gap={1}>
        <Surface pad="sm" variant="flat" className="grow">
          <Column gap={1} align="center">
            <Text size="detail" mono>{displayKm > 0 ? `+${gain}` : '—'}<Text size="caption" color="muted"> m</Text></Text>
            <Text size="eyebrow">Gain</Text>
          </Column>
        </Surface>
        <Surface pad="sm" variant="flat" className="grow">
          <Column gap={1} align="center">
            <Text size="detail" mono>{displayKm > 0 ? `−${loss}` : '—'}<Text size="caption" color="muted"> m</Text></Text>
            <Text size="eyebrow">Loss</Text>
          </Column>
        </Surface>
      </Row>

      <hr />

      <Text size="eyebrow">Highlights</Text>
      {[
        { label: 'Total distance', value: displayKm > 0 ? `${displayKm.toFixed(2)} km` : '—' },
        { label: 'Segments', value: String(Math.max(0, waypoints.length - 1)) },
        { label: 'Estimated time', value: timeStr },
      ].map(row => (
        <Row key={row.label} align="center" justify="between">
          <Text size="caption">{row.label}</Text>
          <Text size="caption" mono>{row.value}</Text>
        </Row>
      ))}

      <hr />

      <Surface pad="sm" variant="flat">
        <Text size="caption" color="muted">Surface mix and elevation are estimated values.</Text>
      </Surface>
    </Column>
  );
}

interface SavedPanelProps {
  profileFilteredRoutes: SavedRoute[];
  handleLoadSavedRoute: (route: SavedRoute) => void;
  navigate: (path: string, opts?: { state: unknown }) => void;
}

function SavedPanel({ profileFilteredRoutes, handleLoadSavedRoute, navigate }: SavedPanelProps) {
  return (
    <Column gap={1}>
      <Text size="eyebrow">Saved Routes</Text>
      {profileFilteredRoutes.length === 0 ? (
        <Text size="caption" color="faint">No saved routes for this activity.</Text>
      ) : (
        profileFilteredRoutes.map(route => (
          <Surface key={route.id} as="button" variant="flat" pad="sm" interactive
            onClick={() => handleLoadSavedRoute(route)}>
            <Row align="center" gap={1}>
            <span className={`dot ${route.profile === 'bike' ? 'cycle' : 'run'}`} />
            <Column gap={1} className="grow">
              <Text size="caption">{route.name}</Text>
              <Text size="caption" color="faint">{route.distanceKm.toFixed(1)} km</Text>
            </Column>
            <ChevronRight size={12} className="faint" />
            </Row>
          </Surface>
        ))
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/saved-routes', { state: { returnTo: '/plan-route' } })}
      >
        View all saved routes
      </Button>
    </Column>
  );
}
