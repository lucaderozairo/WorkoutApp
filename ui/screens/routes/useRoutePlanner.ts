import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@ui/bindings';
import { formatPace, parsePace } from '@features/planning';
import { handleSaveRoute, handleUpdateRoute, resolveRoutePath, sampleRouteElevation, sampleRouteSurface } from '@features/routes';
import type { ElevationSample, RoutingPreference, RouteVisibility, SavedRoute, SurfaceSegment } from '@features/routes/contract';
import { summarizeElevation } from '@features/routes/domain/elevation';
import { summarizeSurfaceMix } from '@features/routes/domain/surface';
import { pathDistanceKm as totalDistanceKm, distanceKm as haversineKm } from '@shared/geo';
import { formatDuration } from '@shared/utils';
import type { MapCanvasHandle } from '@ui/components/workout/wizard/RouteMap';
import { cryptoIdGenerator } from '@core/id-generator';

// ─── Types ────────────────────────────────────────────────────────────────────

export type EditMode = 'select' | 'add' | 'split' | 'delete';
export type BaseLayerId = 'plain' | 'dark' | 'topo' | 'sat';
export type ActivityId = 'run' | 'hike' | 'ride' | 'walk';
export type PacePreset = 'easy' | 'steady' | 'tempo' | 'race';
export type SurfaceKey = 'paved' | 'gravel' | 'trail' | 'unpaved';
export type RouteFieldStatus = 'real' | 'estimated' | 'unavailable';

export interface RouteDataStatus {
  elevationGain: RouteFieldStatus;
  elevationProfile: RouteFieldStatus;
  surfaceMix: RouteFieldStatus;
}

interface RouteDraft {
  waypoints: [number, number][];
  profile: 'foot' | 'bike';
  routeName: string;
  routeDescription: string;
  baseLayerId: BaseLayerId;
  showDistanceMarkers: boolean;
  segmentPaces: Record<number, number>;
  paceSecondsPerKm: number;
}

interface RoutePlannerState {
  waypoints?: [number, number][];
  profile?: 'foot' | 'bike';
  returnTo?: string;
  callerState?: unknown;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DRAFT_KEY = 'routeplanner_draft';

const DRAFT_DEFAULTS: RouteDraft = {
  waypoints: [],
  profile: 'foot',
  routeName: '',
  routeDescription: '',
  baseLayerId: 'plain',
  showDistanceMarkers: true,
  segmentPaces: {},
  paceSecondsPerKm: 324,
};

export const BASE_LAYERS: { id: BaseLayerId; label: string }[] = [
  { id: 'plain', label: 'Plain' },
  { id: 'dark', label: 'Dark' },
  { id: 'topo', label: 'Topo' },
  { id: 'sat', label: 'Sat' },
];

export const ACTIVITIES: { id: ActivityId; label: string }[] = [
  { id: 'run', label: 'Run' },
  { id: 'hike', label: 'Hike' },
  { id: 'ride', label: 'Ride' },
  { id: 'walk', label: 'Walk' },
];

export const PACE_PRESETS: PacePreset[] = ['easy', 'steady', 'tempo', 'race'];

export const PACE_FACTORS: Record<PacePreset, number> = {
  easy: 1.2, steady: 1.0, tempo: 0.85, race: 0.7,
};

export const SURFACES: { key: SurfaceKey; label: string }[] = [
  { key: 'paved',   label: 'Paved'   },
  { key: 'gravel',  label: 'Gravel'  },
  { key: 'trail',   label: 'Trail'   },
  { key: 'unpaved', label: 'Unpaved' },
];

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function saveRouteDraft(state: RouteDraft) {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(state)); } catch { }
}

function loadRouteDraft(): RouteDraft {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return { ...DRAFT_DEFAULTS };
    return { ...DRAFT_DEFAULTS, ...(JSON.parse(raw) as Partial<RouteDraft>) };
  } catch {
    return { ...DRAFT_DEFAULTS };
  }
}

function clearRouteDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch { }
}

export function paceForPreset(preset: PacePreset): number {
  return Math.round(300 * PACE_FACTORS[preset]);
}

export function estimateCalories(distanceKm: number, activity: ActivityId): number {
  const perKm = activity === 'ride' ? 30 : activity === 'walk' ? 50 : 60;
  return Math.round(distanceKm * perKm);
}

export function estimateSurfaceMix(activity: ActivityId, waypointCount: number, distanceKm: number): Record<SurfaceKey, number> {
  const base: Record<ActivityId, Record<SurfaceKey, number>> = {
    run: { paved: 70, gravel: 10, trail: 15, unpaved: 5 },
    walk: { paved: 75, gravel: 10, trail: 10, unpaved: 5 },
    hike: { paved: 10, gravel: 20, trail: 60, unpaved: 10 },
    ride: { paved: 80, gravel: 15, trail: 0, unpaved: 5 },
  };
  const m = { ...base[activity] };
  const wobble = ((waypointCount * 7 + Math.round(distanceKm * 13)) % 11) - 5;
  m.paved = Math.max(0, Math.min(100, m.paved + wobble));
  const sum = m.paved + m.gravel + m.trail + m.unpaved;
  if (sum !== 100) m.gravel = Math.max(0, m.gravel + (100 - sum));
  return m;
}

export function formatMin(min: number): string {
  return min <= 0 ? '—' : formatDuration(Math.round(min) * 60);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UseRoutePlannerOptions {
  routeId?: SavedRoute['id'];
}

export function useRoutePlanner(options: UseRoutePlannerOptions = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const incoming = (location.state ?? {}) as RoutePlannerState;
  const savedRoutes = (useQuery('saved_routes') ?? []) as SavedRoute[];
  const editingRoute = options.routeId
    ? savedRoutes.find(route => route.id === options.routeId)
    : undefined;

  const savedState = useRef(loadRouteDraft()).current;
  const createRouteId = useRef(cryptoIdGenerator.next<'SavedRoute'>()).current;
  if (incoming.waypoints || options.routeId) clearRouteDraft();

  const mapRef = useRef<MapCanvasHandle>(null);
  const [waypoints, setWaypoints] = useState<[number, number][]>(
    editingRoute?.waypoints ?? incoming.waypoints ?? savedState.waypoints,
  );
  const [routedPath, setRoutedPath] = useState<[number, number][]>(
    editingRoute?.routePath ?? editingRoute?.waypoints ?? incoming.waypoints ?? savedState.waypoints,
  );
  const [routingStatus, setRoutingStatus] = useState<'routed' | 'straight_line'>(
    editingRoute?.routingStatus ?? 'straight_line',
  );
  const [routingPreference, setRoutingPreference] = useState<RoutingPreference>(
    editingRoute?.routingPreference ?? 'balanced',
  );
  const [visibility, setVisibility] = useState<RouteVisibility>(
    editingRoute?.visibility ?? 'private',
  );
  const [routedKm, setRoutedKm] = useState(0);
  const [elevationProfile, setElevationProfile] = useState<ElevationSample[]>(
    editingRoute?.elevationProfile ?? [],
  );
  const [elevationGainM, setElevationGainM] = useState(editingRoute?.elevationGainM ?? 0);
  const [elevationLossM, setElevationLossM] = useState(editingRoute?.elevationLossM ?? 0);
  const [surfaceSegments, setSurfaceSegments] = useState<SurfaceSegment[]>(
    editingRoute?.surfaceSegments ?? [],
  );
  const [routeName, setRouteName] = useState(
    editingRoute?.name ?? (incoming.waypoints ? '' : savedState.routeName),
  );
  const [routeDescription, setRouteDescription] = useState(
    editingRoute?.description ?? (incoming.waypoints ? '' : savedState.routeDescription),
  );
  const [mode, setMode] = useState<EditMode>('select');
  const [undoCount, setUndoCount] = useState(0);
  const [redoCount, setRedoCount] = useState(0);
  const [baseLayerId, setBaseLayerId] = useState<BaseLayerId>(incoming.waypoints ? 'plain' : savedState.baseLayerId);
  const [showDistanceMarkers, setShowDistanceMarkers] = useState(incoming.waypoints ? true : savedState.showDistanceMarkers);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchBusy, setSearchBusy] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [sideOpen, setSideOpen] = useState(true);
  const [snap, setSnap] = useState<'peek' | 'mid' | 'full'>('mid');
  const [activity, setActivity] = useState<ActivityId>(
    (editingRoute?.profile ?? incoming.profile ?? savedState.profile) === 'bike' ? 'ride' : 'run',
  );
  const [paceSecondsPerKm, setPaceSecondsPerKm] = useState(savedState.paceSecondsPerKm);
  const [pacePreset, setPacePreset] = useState<PacePreset>('steady');
  const [paceInput, setPaceInput] = useState(formatPace(savedState.paceSecondsPerKm));
  const [segmentPaces, setSegmentPaces] = useState<Record<number, number>>(savedState.segmentPaces);
  const [segmentInputs, setSegmentInputs] = useState<Record<number, string>>(() => {
    const out: Record<number, string> = {};
    for (const [k, v] of Object.entries(savedState.segmentPaces)) out[Number(k)] = formatPace(v);
    return out;
  });
  const [layerPickerOpen, setLayerPickerOpen] = useState(false);

  const profile: 'foot' | 'bike' = activity === 'ride' ? 'bike' : 'foot';
  const displayKm = routedKm > 0 ? routedKm : totalDistanceKm(routedPath.length >= 2 ? routedPath : waypoints);
  const isStandalone = !incoming.callerState;
  const isEditing = !!options.routeId;
  const routeNotFound = !!options.routeId && !editingRoute;

  const segmentDistances = (() => {
    if (waypoints.length < 2) return [] as number[];
    const out: number[] = [];
    for (let i = 1; i < waypoints.length; i++) out.push(haversineKm(waypoints[i - 1], waypoints[i]));
    return out;
  })();

  const totalTimeMin = (() => {
    if (displayKm <= 0) return 0;
    if (segmentDistances.length === 0) return (displayKm * paceSecondsPerKm) / 60;
    const haversineKmTotal = segmentDistances.reduce((s, x) => s + x, 0);
    const scale = haversineKmTotal > 0 ? displayKm / haversineKmTotal : 1;
    let sec = 0;
    for (let i = 0; i < segmentDistances.length; i++) {
      const km = segmentDistances[i] * scale;
      const pace = segmentPaces[i] ?? paceSecondsPerKm;
      sec += km * pace;
    }
    return sec / 60;
  })();
  const timeStr = formatMin(totalTimeMin);

  const hasRealSurface = surfaceSegments.length > 0;
  const surfaceMix = hasRealSurface
    ? summarizeSurfaceMix(surfaceSegments, displayKm)
    : estimateSurfaceMix(activity, waypoints.length, displayKm);

  const routeDataStatus: RouteDataStatus = {
    elevationGain: elevationProfile.length > 0 ? 'real' : 'unavailable',
    elevationProfile: elevationProfile.length > 0 ? 'real' : 'unavailable',
    surfaceMix: hasRealSurface ? 'real' : 'estimated',
  };

  const profileFilteredRoutes = savedRoutes.filter(r => r.profile === profile).slice(0, 5);

  useEffect(() => {
    if (isEditing) return;
    saveRouteDraft({ waypoints, profile, routeName, routeDescription, baseLayerId, showDistanceMarkers, segmentPaces, paceSecondsPerKm });
  }, [isEditing, waypoints, profile, routeName, routeDescription, baseLayerId, showDistanceMarkers, segmentPaces, paceSecondsPerKm]);

  useEffect(() => {
    if (!editingRoute) return;
    setWaypoints(editingRoute.waypoints);
    setRoutedPath(editingRoute.routePath ?? editingRoute.waypoints);
    setRoutingStatus(editingRoute.routingStatus ?? 'straight_line');
    setRoutingPreference(editingRoute.routingPreference ?? 'balanced');
    setVisibility(editingRoute.visibility ?? 'private');
    setElevationProfile(editingRoute.elevationProfile ?? []);
    setElevationGainM(editingRoute.elevationGainM ?? 0);
    setElevationLossM(editingRoute.elevationLossM ?? 0);
    setSurfaceSegments(editingRoute.surfaceSegments ?? []);
    setRouteName(editingRoute.name);
    setRouteDescription(editingRoute.description ?? '');
    setActivity(editingRoute.profile === 'bike' ? 'ride' : 'run');
    setSegmentPaces({});
    setSegmentInputs({});
  }, [editingRoute]);

  useEffect(() => {
    setPaceInput(formatPace(paceSecondsPerKm));
  }, [paceSecondsPerKm]);

  useEffect(() => {
    if (waypoints.length < 2) {
      setRoutedPath(waypoints);
      setRoutingStatus('straight_line');
      setRoutedKm(0);
      return;
    }
    const controller = new AbortController();
    const debounceId = setTimeout(() => {
      resolveRoutePath({
        waypoints,
        profile,
        preference: routingPreference,
        signal: controller.signal,
      }).then(result => {
        if (controller.signal.aborted) return;
        setRoutedPath(result.path);
        setRoutingStatus(result.status);
        setRoutedKm(result.distanceKm);
      });
    }, 400);
    return () => {
      clearTimeout(debounceId);
      controller.abort();
    };
  }, [waypoints, profile, routingPreference]);

  useEffect(() => {
    if (routedPath.length < 2) {
      setElevationProfile([]);
      setElevationGainM(0);
      setElevationLossM(0);
      return;
    }
    const controller = new AbortController();
    const debounceId = setTimeout(() => {
      sampleRouteElevation(routedPath, controller.signal).then(samples => {
        if (controller.signal.aborted) return;
        setElevationProfile(samples);
        const totals = summarizeElevation(samples);
        setElevationGainM(totals.gainM);
        setElevationLossM(totals.lossM);
      });
    }, 400);
    return () => {
      clearTimeout(debounceId);
      controller.abort();
    };
  }, [routedPath]);

  useEffect(() => {
    if (routedPath.length < 2) {
      setSurfaceSegments([]);
      return;
    }
    const controller = new AbortController();
    const debounceId = setTimeout(() => {
      sampleRouteSurface(routedPath, controller.signal).then(segments => {
        if (controller.signal.aborted) return;
        setSurfaceSegments(segments);
      });
    }, 400);
    return () => {
      clearTimeout(debounceId);
      controller.abort();
    };
  }, [routedPath]);

  async function handleSave() {
    const name = routeName.trim() || (profile === 'bike' ? 'Cycle Route' : 'Run Route');
    if (isEditing && options.routeId) {
      const result = await handleUpdateRoute({
        type: 'UpdateRoute',
        routeId: options.routeId,
        name,
        description: routeDescription,
        profile,
        waypoints,
        routePath: routedPath,
        routingStatus,
        distanceKm: displayKm,
        elevationProfile,
        elevationGainM,
        elevationLossM,
        surfaceSegments,
        visibility,
        routingPreference,
        elevation: elevationProfile.length > 0
          ? { source: 'synced', provider: 'app', confidence: 'medium', importedAt: Date.now() }
          : { source: 'unavailable', provider: 'app', confidence: 'low' },
        surface: hasRealSurface
          ? { source: 'synced', provider: 'app', confidence: 'medium', importedAt: Date.now() }
          : { source: 'estimated', provider: 'app', confidence: 'low' },
        dataUpdatedAt: Date.now(),
      });
      if (!result.ok) return;
      clearRouteDraft();
      navigate(`/routes/${options.routeId}`, { replace: true });
      return;
    }

    if (isStandalone && waypoints.length >= 2 && displayKm > 0) {
      const result = await handleSaveRoute({
        type: 'SaveRoute',
        routeId: createRouteId,
        name,
        description: routeDescription,
        profile,
        waypoints,
        routePath: routedPath,
        routingStatus,
        distanceKm: displayKm,
        elevationProfile,
        elevationGainM,
        elevationLossM,
        surfaceSegments,
        visibility,
        routingPreference,
        elevation: elevationProfile.length > 0
          ? { source: 'synced', provider: 'app', confidence: 'medium', importedAt: Date.now() }
          : { source: 'unavailable', provider: 'app', confidence: 'low' },
        surface: hasRealSurface
          ? { source: 'synced', provider: 'app', confidence: 'medium', importedAt: Date.now() }
          : { source: 'estimated', provider: 'app', confidence: 'low' },
        dataUpdatedAt: Date.now(),
      });
      clearRouteDraft();
      if (result.ok && result.value) {
        navigate(`/routes/${result.value.routeId}`, { replace: true });
      }
      return;
    }

    const dest = incoming.returnTo ?? (-1 as never);
    clearRouteDraft();
    navigate(dest, {
      replace: typeof dest === 'string',
      state: { waypoints, distanceKm: displayKm, callerState: incoming.callerState },
    });
  }

  function handleBack() {
    clearRouteDraft();
    if (isEditing && options.routeId) {
      navigate(`/routes/${options.routeId}`);
      return;
    }
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
    return result;
  }

  function applyPaceInput(raw: string) {
    const secs = parsePace(raw);
    if (secs > 0) {
      const clamped = Math.max(120, Math.min(540, secs));
      setPaceSecondsPerKm(clamped);
      const ratio = clamped / 300;
      const closest = (Object.entries(PACE_FACTORS) as [PacePreset, number][]).reduce((prev, curr) =>
        Math.abs(curr[1] - ratio) < Math.abs(prev[1] - ratio) ? curr : prev,
      )[0];
      setPacePreset(closest);
    } else {
      setPaceInput(formatPace(paceSecondsPerKm));
    }
  }

  function applySegmentPaceInput(idx: number, raw: string) {
    setSegmentInputs(prev => ({ ...prev, [idx]: raw }));
    if (!raw.trim()) {
      setSegmentPaces(prev => { const next = { ...prev }; delete next[idx]; return next; });
      return;
    }
    const secs = parsePace(raw);
    if (secs > 0) {
      const clamped = Math.max(120, Math.min(720, secs));
      setSegmentPaces(prev => ({ ...prev, [idx]: clamped }));
    }
  }

  function handleDeleteWaypoint(idx: number) {
    setWaypoints(prev => prev.filter((_, i) => i !== idx));
    setSegmentPaces(prev => {
      const next: Record<number, number> = {};
      for (const [k, v] of Object.entries(prev)) {
        const ki = Number(k);
        if (ki < idx - 1) next[ki] = v;
        else if (ki >= idx) next[ki - 1] = v;
      }
      return next;
    });
    setSegmentInputs(prev => {
      const next: Record<number, string> = {};
      for (const [k, v] of Object.entries(prev)) {
        const ki = Number(k);
        if (ki < idx - 1) next[ki] = v;
        else if (ki >= idx) next[ki - 1] = v;
      }
      return next;
    });
  }

  function handleLoadSavedRoute(route: SavedRoute) {
    setWaypoints(route.waypoints);
    setRoutedPath(route.routePath ?? route.waypoints);
    setRoutingStatus(route.routingStatus ?? 'straight_line');
    setRoutingPreference(route.routingPreference ?? 'balanced');
    setVisibility(route.visibility ?? 'private');
    setElevationProfile(route.elevationProfile ?? []);
    setElevationGainM(route.elevationGainM ?? 0);
    setElevationLossM(route.elevationLossM ?? 0);
    setSurfaceSegments(route.surfaceSegments ?? []);
    setRouteName(route.name);
    setActivity(route.profile === 'bike' ? 'ride' : 'run');
    setSegmentPaces({});
    setSegmentInputs({});
  }

  function handlePacePreset(preset: PacePreset) {
    setPacePreset(preset);
    setPaceSecondsPerKm(paceForPreset(preset));
  }

  return {
    mapRef,
    navigate,
    waypoints,
    setWaypoints,
    routedPath,
    routingStatus,
    routingPreference,
    setRoutingPreference,
    visibility,
    setVisibility,
    routedKm,
    setRoutedKm,
    elevationProfile,
    elevationGainM,
    elevationLossM,
    surfaceSegments,
    routeName,
    setRouteName,
    routeDescription,
    setRouteDescription,
    mode,
    setMode,
    undoCount,
    redoCount,
    baseLayerId,
    showDistanceMarkers,
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
    savedRoutes,
    editingRoute,
    isEditing,
    routeNotFound,
    profile,
    displayKm,
    isStandalone,
    segmentDistances,
    timeStr,
    surfaceMix,
    routeDataStatus,
    profileFilteredRoutes,
    handleSave,
    handleBack,
    handleUndoRedo,
    handleLayerSwitch,
    handleToggleDistanceMarkers,
    handleSearch,
    applyPaceInput,
    applySegmentPaceInput,
    handleDeleteWaypoint,
    handleLoadSavedRoute,
    handlePacePreset,
  };
}
