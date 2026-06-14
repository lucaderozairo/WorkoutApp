import { useState } from "react";
import {
  Grid,
  Row,
  Column,
  Cluster,
  Layer,
  Layered,
  FillScreen,
} from "@ui/layout";
import { Surface, Text } from "@ui/atoms";
import { RouteMap } from "@ui/components/workout/wizard/RouteMap";
import { ScreenHeader, Button, Input, Slider, Textarea } from "@ui/molecules";
import { EmptyState } from "@ui/patterns";
import { SearchBar } from "@ui/patterns/common/SearchBar";
import {
  BarChart2,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Layers,
  Map,
  MapPin,
  Menu,
  Minus,
  Moon,
  Mountain,
  MousePointer2,
  Navigation,
  Pencil,
  Plus,
  RotateCcw,
  RotateCw,
  Satellite,
  Save,
  Scissors,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  MdDirectionsBike,
  MdDirectionsRun,
  MdDirectionsWalk,
  MdHiking,
} from "react-icons/md";
import { IoMdLocate } from "react-icons/io";
import { PiLineSegments } from "react-icons/pi";
import type { IconType } from "react-icons";
import { formatPace } from "@features/planning";
import type { SavedRoute } from "@features/routes/contract";
import {
  useRoutePlanner,
  BASE_LAYERS,
  ACTIVITIES,
  PACE_PRESETS,
  SURFACES,
  paceForPreset,
  estimateCalories,
  type ActivityId,
  type EditMode,
  type PacePreset,
  type SurfaceKey,
  type RouteDataStatus,
} from "./useRoutePlanner";
import type { RoutingPreference, RouteVisibility } from "@features/routes/contract";
import { MapControlButton } from "@ui/components/route-planner/MapControlButton";
import { SideRailItem } from "@ui/components/route-planner/SideRailItem";
import { ActivityChip } from "@ui/components/route-planner/ActivityChip";

type SidePanel = "plan" | "pins" | "stats" | "saved";

const ACTIVITY_ICON_MAP: Record<ActivityId, IconType> = {
  run: MdDirectionsRun,
  hike: MdHiking,
  ride: MdDirectionsBike,
  walk: MdDirectionsWalk,
};

const RAIL_ITEMS: { id: SidePanel; icon: React.ReactNode; label: string }[] = [
  { id: "plan", icon: <Navigation size={16} />, label: "PLAN" },
  { id: "pins", icon: <MapPin size={16} />, label: "PINS" },
  { id: "stats", icon: <BarChart2 size={16} />, label: "STATS" },
  { id: "saved", icon: <Bookmark size={16} />, label: "SAVED" },
];

const MOBILE_TABS: { id: SidePanel; label: string }[] = [
  { id: "plan", label: "Plan" },
  { id: "pins", label: "Pins" },
  { id: "stats", label: "Stats" },
  { id: "saved", label: "Saved" },
];

interface RoutePlannerScreenProps {
  routeId?: SavedRoute["id"];
}

export function RoutePlannerScreen({ routeId }: RoutePlannerScreenProps = {}) {
  const {
    mapRef,
    navigate,
    waypoints,
    setWaypoints,
    routedPath,
    setRoutedKm,
    routeName,
    setRouteName,
    routeDescription,
    setRouteDescription,
    mode,
    setMode,
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
    segmentInputs,
    layerPickerOpen,
    setLayerPickerOpen,
    profile,
    routingPreference,
    setRoutingPreference,
    visibility,
    setVisibility,
    displayKm,
    elevationGainM,
    elevationLossM,
    isStandalone,
    segmentDistances,
    timeStr,
    surfaceMix,
    routeDataStatus,
    profileFilteredRoutes,
    editingRoute,
    isEditing,
    routeNotFound,
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
  } = useRoutePlanner({ routeId });

  type SearchPhase =
    | { phase: "icon" }
    | { phase: "input" }
    | { phase: "located"; label: string };

  const [sidePanel, setSidePanel] = useState<SidePanel>("plan");
  const [searchState, setSearchState] = useState<SearchPhase>({ phase: "icon" });

  const canSave = isStandalone
    ? waypoints.length >= 2 && routeName.trim().length > 0
    : waypoints.length >= 2;

  const headerTitle = isEditing ? (editingRoute?.name ?? "Edit Route") : "New Route";

  if (routeNotFound) {
    return (
      <Grid>
        <ScreenHeader title="Route Not Found" back={() => navigate("/routes")} />
        <EmptyState
          icon="Map"
          title="Route not found"
          message="This saved route is no longer available."
          action={<Button variant="primary" onClick={() => navigate("/routes")}>View routes</Button>}
        />
      </Grid>
    );
  }

  function handleRailClick(id: SidePanel) {
    if (sidePanel === id) {
      setSideOpen((s) => !s);
    } else {
      setSidePanel(id);
      setSideOpen(true);
    }
  }

  async function handleLocationSearch() {
    const submitted = searchQuery.trim();
    if (!submitted) return;
    const result = await handleSearch();
    if (result !== "fail" && result !== "no_results") {
      setSearchState({ phase: "located", label: submitted });
    }
  }

  function handleLocate() {
    mapRef.current?.locate();
    setSearchState({ phase: "located", label: "Current location" });
  }

  function handleOpenRouteDetails() {
    setSidePanel("stats");
    setSideOpen(true);
  }

  function handleClearLocation() {
    setSearchState({ phase: "icon" });
    setSearchQuery("");
  }

  function handleCloseSearch() {
    setSearchState(s => s.phase === "located" ? s : { phase: "icon" });
  }

  const panelSubtitle =
    sidePanel === "plan"
      ? "Activity, pace & summary"
      : sidePanel === "pins"
        ? `${waypoints.length} waypoint${waypoints.length !== 1 ? "s" : ""}`
        : sidePanel === "stats"
          ? `${displayKm > 0 ? displayKm.toFixed(1) : "0"} km`
          : "Past routes & favourites";

  return (
    <FillScreen className="route-planner-screen">
      {/* ── MOBILE HEADER ── */}
      <Column gap={1} className="mobile-only">
        <ScreenHeader
          title={headerTitle}
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
      <Grid rows="1fr" className="route-planner-stage gap-0 self-fill clip">

        {/* Map column */}
        <Column gap={0} className="self-fill">
          <Layered className="self-fill column">
            <RouteMap
              ref={mapRef}
              waypoints={waypoints}
              routePath={routedPath}
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

            {/* ── Search — top-left ── */}
            <Layer pin="top-left" z="controls" className="desktop-only">
              <Surface
                pad="sm"
                className="route-planner-location-control"
                data-phase={searchState.phase}
              >
                {searchState.phase === "icon" && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setSearchState({ phase: "input" })}
                    aria-label="Search location"
                  >
                    <Search size={14} />
                  </Button>
                )}
                {searchState.phase === "input" && (
                  <Column gap={1}>
                    <Grid
                      cols="minmax(0, 1fr) auto auto"
                      gap={1}
                      onKeyDown={(e: React.KeyboardEvent) => {
                        if (e.key === "Escape") handleCloseSearch();
                      }}
                    >
                      <SearchBar
                        className="self-fill"
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder="Search a place, address, or lat/lng..."
                        loading={searchBusy}
                        onSubmit={() => void handleLocationSearch()}
                      />
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={handleLocate}
                        aria-label="Use current location"
                      >
                        <IoMdLocate size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={handleCloseSearch}
                        aria-label="Close search"
                      >
                        <X size={14} />
                      </Button>
                    </Grid>
                    {searchError && (
                      <Text size="caption" color="faint" nowrap>
                        {searchError}
                      </Text>
                    )}
                  </Column>
                )}
                {searchState.phase === "located" && (
                  <Grid cols="auto minmax(0, 1fr) auto" gap={1}>
                    <MapPin size={14} className="faint" />
                    <Text size="caption" nowrap className="min-w-0">{searchState.label}</Text>
                    <Button variant="ghost" size="sm" onClick={() => setSearchState({ phase: "input" })}>
                      Search again
                    </Button>
                  </Grid>
                )}
              </Surface>
            </Layer>

            {/* ── Toolbar — bottom-center ── */}
            <Layer pin="bottom-center" z="controls" className="desktop-only">
              <Surface pad="sm" className="route-planner-draw-toolbar">
                <Row align="center" gap={1}>
                  {waypoints.length >= 2 && (
                    <>
                      <Button variant="ghost" size="sm" onClick={handleOpenRouteDetails}>
                        <BarChart2 size={14} />
                        {displayKm > 0 ? `${displayKm.toFixed(1)} km` : "Route details"}
                      </Button>
                      <span className="route-planner-toolbar-divider" aria-hidden />
                    </>
                  )}
                  <Button variant="ghost" size="icon-sm" onClick={() => mapRef.current?.fitRoute()} aria-label="Fit route">
                    <PiLineSegments size={14} />
                  </Button>
                  {(['select', 'add', 'split', 'delete'] as EditMode[]).map(m => (
                    <Button
                      key={m}
                      variant="ghost"
                      size="icon-sm"
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
                  <span className="route-planner-toolbar-divider" aria-hidden />
                  <Button variant="ghost" size="icon-sm" disabled={undoCount === 0} onClick={() => mapRef.current?.undo()} aria-label="Undo">
                    <RotateCcw size={14} />
                  </Button>
                  <Button variant="ghost" size="icon-sm" disabled={redoCount === 0} onClick={() => mapRef.current?.redo()} aria-label="Redo">
                    <RotateCw size={14} />
                  </Button>
                </Row>
              </Surface>
            </Layer>

            {/* ── Zoom + layers — bottom-left ── */}
            <Layer pin="bottom-left" z="controls" className="desktop-only">
              <Column gap={1} align="center" className="route-planner-map-controls">
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
              </Column>
            </Layer>

            {/* ── Side rail — right edge, full height ── */}
            <Layer pin="full" z="controls" direction="none" className="desktop-only">
              <Row justify="end" className="route-planner-rail-layer">
                <Row gap={0} className={`route-planner-side${sideOpen ? '' : ' collapsed'}`}>
                  <Column className="route-planner-rail">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setSideOpen((s) => !s)}
                      aria-label={sideOpen ? "Collapse route details" : "Open route details"}
                    >
                      <Menu size={18} />
                    </Button>
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
                    <Column gap={1} className="route-planner-side-content">
                      <Row align="center" justify="between">
                        <Text size="eyebrow">{panelSubtitle}</Text>
                        <Button variant="ghost" size="icon-sm" onClick={() => setSideOpen(false)} aria-label="Collapse sidebar">
                          <ChevronLeft size={16} />
                        </Button>
                      </Row>
                      {(isStandalone || canSave) && (
                        <Surface pad="sm" variant="flat" className="route-planner-route-details">
                          <Column gap={1}>
                            {isStandalone && (
                              <>
                                <Input
                                  placeholder="Route name..."
                                  value={routeName}
                                  onChange={e => setRouteName(e.target.value)}
                                />
                                <Textarea
                                  placeholder="Route description"
                                  rows={3}
                                  value={routeDescription}
                                  onChange={e => setRouteDescription(e.target.value)}
                                />
                              </>
                            )}
                            <Button variant="primary" size="sm" disabled={!canSave} onClick={handleSave}>
                              <Save size={14} /> {isEditing ? "Save changes" : "Save route"}
                            </Button>
                          </Column>
                        </Surface>
                      )}
                      <hr />
                      {sidePanel === 'plan' && <PlanPanel
                        activity={activity}
                        setActivity={setActivity}
                        displayKm={displayKm}
                        timeStr={timeStr}
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
                        routingPreference={routingPreference}
                        setRoutingPreference={setRoutingPreference}
                        visibility={visibility}
                        setVisibility={setVisibility}
                      />}
                      {sidePanel === 'pins' && <PinsPanel
                        waypoints={waypoints}
                        handleDeleteWaypoint={handleDeleteWaypoint}
                        segmentDistances={segmentDistances}
                      />}
                      {sidePanel === 'stats' && <StatsPanel
                        surfaceMix={surfaceMix}
                        displayKm={displayKm}
                        waypoints={waypoints}
                        timeStr={timeStr}
                        routeDataStatus={routeDataStatus}
                        elevationGainM={elevationGainM}
                        elevationLossM={elevationLossM}
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
            </Layer>

          </Layered>
        </Column>
      </Grid>

      {/* ── MOBILE BOTTOM SHEET ── */}
      <Surface variant="ghost" pad="none" className="bottom-sheet route-planner-bottom-sheet" data-snap={snap}>
        <Button variant="ghost" className="handle"
          onClick={() => setSnap(s => s === 'peek' ? 'mid' : s === 'mid' ? 'full' : 'peek')}
          aria-label="Toggle sheet"
        />
        <Grid rows="auto auto auto 1fr" className="bottom-sheet-body scroll-y">
          <Row className="tabs">
            {MOBILE_TABS.map(tab => (
              <Button key={tab.id} variant="ghost" active={sidePanel === tab.id} className="tab"
                onClick={() => { setSidePanel(tab.id); if (snap === 'peek') setSnap('mid'); }}
              >
                {tab.label}
              </Button>
            ))}
          </Row>

          {isStandalone && (
            <>
            <Input
              placeholder="Route name…"
              value={routeName}
              onChange={e => setRouteName(e.target.value)}
            />
            <Textarea
              placeholder="Route description"
              rows={3}
              value={routeDescription}
              onChange={e => setRouteDescription(e.target.value)}
            />
            </>
          )}
          <Button variant="primary" disabled={!canSave} onClick={handleSave}>
            <Save size={14} /> {isEditing ? "Save changes" : "Save route"}
          </Button>

          {sidePanel === 'plan' && <PlanPanel
            activity={activity}
            setActivity={setActivity}
            displayKm={displayKm}
            timeStr={timeStr}
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
            routingPreference={routingPreference}
            setRoutingPreference={setRoutingPreference}
            visibility={visibility}
            setVisibility={setVisibility}
          />}
          {sidePanel === 'pins' && <PinsPanel
            waypoints={waypoints}
            handleDeleteWaypoint={handleDeleteWaypoint}
            segmentDistances={segmentDistances}
          />}
          {sidePanel === 'stats' && <StatsPanel
            surfaceMix={surfaceMix}
            displayKm={displayKm}
            waypoints={waypoints}
            timeStr={timeStr}
            routeDataStatus={routeDataStatus}
            elevationGainM={elevationGainM}
            elevationLossM={elevationLossM}
          />}
          {sidePanel === 'saved' && <SavedPanel
            profileFilteredRoutes={profileFilteredRoutes}
            handleLoadSavedRoute={handleLoadSavedRoute}
            navigate={navigate}
          />}
        </Grid>
      </Surface>
    </FillScreen >
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface PlanPanelProps {
  activity: ActivityId;
  setActivity: (a: ActivityId) => void;
  displayKm: number;
  timeStr: string;
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
  routingPreference: RoutingPreference;
  setRoutingPreference: (value: RoutingPreference) => void;
  visibility: RouteVisibility;
  setVisibility: (value: RouteVisibility) => void;
}

function PlanPanel({
  activity,
  setActivity,
  displayKm,
  timeStr,
  estimatedCal,
  paceSecondsPerKm,
  setPaceSecondsPerKm,
  pacePreset,
  paceInput,
  setPaceInput,
  applyPaceInput,
  handlePacePreset,
  segmentDistances,
  segmentInputs,
  applySegmentPaceInput,
  routingPreference,
  setRoutingPreference,
  visibility,
  setVisibility,
}: PlanPanelProps) {
  const [perSegEnabled, setPerSegEnabled] = useState(false);

  return (
    <Column gap={1}>
      <Text size="eyebrow">Activity</Text>
      <Grid cols={4}>
        {ACTIVITIES.map((a) => {
          const ActivityIcon = ACTIVITY_ICON_MAP[a.id];
          return (
            <ActivityChip
              key={a.id}
              id={a.id}
              label={a.label}
              dot={
                <span data-id={a.id} className="activity-dot">
                  <ActivityIcon size={10} />
                </span>
              }
              active={activity === a.id}
              onClick={() => setActivity(a.id)}
            />
          );
        })}
      </Grid>
      <Button
        variant="ghost"
        size="sm"
        block
        disabled
        aria-label="More activities coming soon">
        <Row gap={1} align="center" justify="center">
          <Plus size={12} />
          <span>Other activity</span>
        </Row>
      </Button>
      <Surface variant="ghost" className="pad-sm">
        <Text size="caption" color="muted">
          {activity === "ride"
            ? "Cycling uses bike-optimised paths and roads."
            : activity === "hike"
              ? "Hiking prefers trails and unpaved paths."
              : activity === "walk"
                ? "Walking uses footpaths and quiet roads."
                : "Running uses footpaths with some road sections."}
        </Text>
      </Surface>

      <hr />

      <Text size="eyebrow">Routing</Text>
      <Cluster className="gap-1">
        {(['balanced', 'prefer_cycleways', 'shortest'] as RoutingPreference[]).map((preference) => (
          <Button
            key={preference}
            variant="ghost"
            size="sm"
            active={routingPreference === preference}
            onClick={() => setRoutingPreference(preference)}
          >
            {preference === 'prefer_cycleways' ? 'Cycleways' : preference.charAt(0).toUpperCase() + preference.slice(1)}
          </Button>
        ))}
      </Cluster>

      <Text size="eyebrow">Visibility</Text>
      <Cluster className="gap-1">
        {(['private', 'feed'] as RouteVisibility[]).map((option) => (
          <Button
            key={option}
            variant="ghost"
            size="sm"
            active={visibility === option}
            onClick={() => setVisibility(option)}
          >
            {option === 'feed' ? 'Feed' : 'Private'}
          </Button>
        ))}
      </Cluster>

      <hr />

      <Text size="eyebrow">Summary</Text>
      <Surface pad="sm" variant="ghost">
        <Row align="end" gap={1}>
          <Text as="h2" mono>
            {displayKm > 0 ? displayKm.toFixed(2) : "—"}
          </Text>
          <Text size="caption" color="muted">
            km
          </Text>
        </Row>
      </Surface>
      <Grid cols={2} gap={1}>
        <Surface pad="sm" variant="flat">
          <Column gap={1} align="center">
            <Text size="detail" mono>
              {timeStr}
            </Text>
            <Text size="eyebrow">Time</Text>
          </Column>
        </Surface>
        <Surface pad="sm" variant="flat">
          <Column gap={1} align="center">
            <Text size="detail" mono>
              {displayKm > 0 ? estimatedCal : "—"}
              <Text size="caption" color="muted">
                {" "}
                kcal
              </Text>
            </Text>
            <Text size="eyebrow">Energy</Text>
          </Column>
        </Surface>
      </Grid>

      <hr />

      <Text size="eyebrow">Pace</Text>
      <Row gap={1} align="end">
        <Text as="h3" mono>
          {formatPace(paceSecondsPerKm)}
        </Text>
        <Text size="caption" color="muted">
          min/km
        </Text>
      </Row>
      <Input
        className="sm"
        placeholder="m:ss"
        value={paceInput}
        onChange={(e) => setPaceInput(e.target.value)}
        onBlur={(e) => applyPaceInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter")
            applyPaceInput((e.target as HTMLInputElement).value);
        }}
      />
      <Slider
        min={120}
        max={540}
        value={paceSecondsPerKm}
        onChange={(v) => setPaceSecondsPerKm(v)}
      />
      <Cluster className="gap-1">
        {PACE_PRESETS.map((p) => (
          <Button
            key={p}
            variant="ghost"
            size="sm"
            active={pacePreset === p}
            className="pad-sm"
            onClick={() => handlePacePreset(p)}>
            <Column gap={0} align="center">
              <Text>{p.charAt(0).toUpperCase() + p.slice(1)}</Text>
              <Text size="caption" color="faint">
                {formatPace(paceForPreset(p))}
              </Text>
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
              onClick={() => setPerSegEnabled((v) => !v)}
              aria-pressed={perSegEnabled}>
              {perSegEnabled ? "On" : "Off"}
            </Button>
          </Row>
          {perSegEnabled &&
            segmentDistances.map((dist, idx) => (
              <Grid key={idx} cols="minmax(0, 1fr) auto" gap={1}>
                <Text size="caption" color="muted" className="min-w-0">
                  Seg {idx + 1} — {dist.toFixed(2)} km
                </Text>
                <Input
                  className="sm"
                  placeholder={formatPace(paceSecondsPerKm)}
                  value={segmentInputs[idx] ?? ""}
                  onChange={(e) => applySegmentPaceInput(idx, e.target.value)}
                />
              </Grid>
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

function PinsPanel({
  waypoints,
  handleDeleteWaypoint,
  segmentDistances,
}: PinsPanelProps) {
  return (
    <Column gap={1}>
      <Text size="eyebrow">Waypoints</Text>
      {waypoints.length < 2 ? (
        <Text size="caption" color="faint">
          Add at least 2 points on the map.
        </Text>
      ) : (
        waypoints.map((wp, idx) => (
          <Grid key={`wp-${idx}`} cols="auto minmax(0, 1fr) auto" gap={1}>
            <span
              className={`waypoint-badge row center align-center mono${
                idx === 0
                  ? " start"
                  : idx === waypoints.length - 1
                    ? " finish"
                    : " mid"
              }`}>
              {idx === 0 ? "S" : idx === waypoints.length - 1 ? "F" : idx}
            </span>
            <Column gap={1} className="min-w-0">
              <Text size="caption" mono>
                {wp[0].toFixed(4)}, {wp[1].toFixed(4)}
              </Text>
              {idx < segmentDistances.length && (
                <Text size="caption" color="faint">
                  +{segmentDistances[idx].toFixed(2)} km
                </Text>
              )}
            </Column>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => handleDeleteWaypoint(idx)}
              aria-label="Remove waypoint">
              <X size={12} />
            </Button>
          </Grid>
        ))
      )}
    </Column>
  );
}

interface StatsPanelProps {
  surfaceMix: Record<SurfaceKey, number>;
  displayKm: number;
  waypoints: [number, number][];
  timeStr: string;
  routeDataStatus: RouteDataStatus;
  elevationGainM: number;
  elevationLossM: number;
}

function StatsPanel({
  surfaceMix,
  displayKm,
  waypoints,
  timeStr,
  routeDataStatus,
  elevationGainM,
  elevationLossM,
}: StatsPanelProps) {
  return (
    <Column gap={1}>
      <Row align="center" gap={1}>
        <Text size="eyebrow">Surface Mix</Text>
        {routeDataStatus.surfaceMix === 'estimated' && (
          <span className="badge caption" title="Estimated from activity type — not from map data">est.</span>
        )}
      </Row>
      <Row className="surface-mix-bar">
        {SURFACES.map((s) =>
          surfaceMix[s.key] > 0 ? (
            <span
              key={s.key}
              className="surface-mix-segment"
              data-surface={s.key}
              // eslint-disable-next-line no-restricted-syntax -- Surface percentages drive segment widths through a CSS custom property.
              style={
                { "--mix-pct": `${surfaceMix[s.key]}%` } as React.CSSProperties
              }
              title={`${s.label}: ${surfaceMix[s.key]}%`}
            />
          ) : null,
        )}
      </Row>
      <Cluster className="gap-1">
        {SURFACES.filter((s) => surfaceMix[s.key] > 0).map((s) => (
          <Row key={s.key} align="center" gap={1}>
            <Row align="center" gap={1} className="caption">
              <span className="surface-mix-swatch" data-surface={s.key} />
              {s.label}
            </Row>
            <Text size="caption" color="faint">
              {surfaceMix[s.key]}%
            </Text>
          </Row>
        ))}
      </Cluster>

      <hr />

      <Text size="eyebrow">Elevation</Text>
      {routeDataStatus.elevationGain === 'unavailable' ? (
        <Text size="caption" color="muted">
          Elevation data unavailable — no terrain source connected
        </Text>
      ) : (
        <Grid cols={2} gap={1}>
          <Surface pad="sm" variant="flat">
            <Column gap={1} align="center">
              <Text size="detail" mono>
                {displayKm > 0 ? `+${elevationGainM}` : "—"}
                <Text size="caption" color="muted"> m</Text>
              </Text>
              <Text size="eyebrow">Gain</Text>
            </Column>
          </Surface>
          <Surface pad="sm" variant="flat">
            <Column gap={1} align="center">
              <Text size="detail" mono>
                {displayKm > 0 ? `-${elevationLossM}` : "—"}
                <Text size="caption" color="muted"> m</Text>
              </Text>
              <Text size="eyebrow">Loss</Text>
            </Column>
          </Surface>
        </Grid>
      )}

      <hr />

      <Text size="eyebrow">Highlights</Text>
      {[
        {
          label: "Total distance",
          value: displayKm > 0 ? `${displayKm.toFixed(2)} km` : "—",
        },
        { label: "Segments", value: String(Math.max(0, waypoints.length - 1)) },
        { label: "Estimated time", value: timeStr },
      ].map((row) => (
        <Row key={row.label} align="center" justify="between">
          <Text size="caption">{row.label}</Text>
          <Text size="caption" mono>
            {row.value}
          </Text>
        </Row>
      ))}
    </Column>
  );
}

interface SavedPanelProps {
  profileFilteredRoutes: SavedRoute[];
  handleLoadSavedRoute: (route: SavedRoute) => void;
  navigate: (path: string, opts?: { state: unknown }) => void;
}

function SavedPanel({
  profileFilteredRoutes,
  handleLoadSavedRoute,
  navigate,
}: SavedPanelProps) {
  return (
    <Column gap={1}>
      <Text size="eyebrow">Saved Routes</Text>
      {profileFilteredRoutes.length === 0 ? (
        <Text size="caption" color="faint">
          No saved routes for this activity.
        </Text>
      ) : (
        profileFilteredRoutes.map((route) => (
          <Surface
            key={route.id}
            as="button"
            variant="flat"
            pad="sm"
            interactive
            onClick={() => handleLoadSavedRoute(route)}>
            <Grid cols="auto minmax(0, 1fr) auto" gap={1}>
              <span
                className={`dot ${route.profile === "bike" ? "cycle" : "run"}`}
              />
              <Column gap={1} className="min-w-0">
                <Text size="caption">{route.name}</Text>
                <Text size="caption" color="faint">
                  {route.distanceKm.toFixed(1)} km
                </Text>
              </Column>
              <ChevronRight size={12} className="faint" />
            </Grid>
          </Surface>
        ))
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/routes")}>
        View all saved routes
      </Button>
    </Column>
  );
}
