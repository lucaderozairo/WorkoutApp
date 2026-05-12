import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Crosshair, Eye, Layers, Minus, Plus, Redo2, Search, Trash2, Undo2, X } from 'lucide-react';
import { FiScissors } from 'react-icons/fi';
import { Cursor } from 'phosphor-react';
import { MapPin } from 'iconoir-react';

const TILE_ATTR = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>';
const DEFAULT_CENTER: L.LatLngTuple = [51.463955, -0.305095];  // London — replaced once user taps
const DEFAULT_ZOOM = 13;
const SEARCH_ZOOM = 15;
const DISTANCE_MARKER_PANE = 'route-distance-pane';
const LONG_PRESS_MS = 650;

export function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLon = ((b[1] - a[1]) * Math.PI) / 180;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon;
  return R * 2 * Math.asin(Math.sqrt(h));
}

export function totalDistanceKm(waypoints: [number, number][]): number {
  if (waypoints.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < waypoints.length; i++) {
    total += haversineKm(waypoints[i - 1], waypoints[i]);
  }
  return Math.round(total * 100) / 100;
}

function interpolateLatLng(
  a: [number, number],
  b: [number, number],
  ratio: number,
): [number, number] {
  return [
    a[0] + (b[0] - a[0]) * ratio,
    a[1] + (b[1] - a[1]) * ratio,
  ];
}

function distanceMarkerPoints(path: [number, number][]): { latlng: [number, number]; km: number }[] {
  if (path.length < 2) return [];

  let totalKm = 0;
  for (let i = 1; i < path.length; i++) {
    totalKm += haversineKm(path[i - 1], path[i]);
  }

  const markerCount = Math.floor(totalKm);
  if (markerCount < 1) return [];

  const markers: { latlng: [number, number]; km: number }[] = [];
  let nextMarkerKm = 1;
  let travelledKm = 0;

  for (let i = 1; i < path.length && nextMarkerKm <= markerCount; i++) {
    const previous = path[i - 1];
    const current = path[i];
    const segmentKm = haversineKm(previous, current);
    if (segmentKm === 0) continue;

    while (travelledKm + segmentKm >= nextMarkerKm && nextMarkerKm <= markerCount) {
      const ratio = (nextMarkerKm - travelledKm) / segmentKm;
      markers.push({
        latlng: interpolateLatLng(previous, current, ratio),
        km: nextMarkerKm,
      });
      nextMarkerKm += 1;
    }

    travelledKm += segmentKm;
  }

  return markers;
}

interface RouteMapProps {
  waypoints: [number, number][];
  onChange: (waypoints: [number, number][]) => void;
  profile?: 'foot' | 'bike';
  onRoutedDistanceChange?: (km: number) => void;
}

type EditMode = 'select' | 'add' | 'split';
type BaseLayerId = 'plain' | 'dark' | 'topo' | 'sat';

function parseLatLngQuery(inputRaw: string): [number, number] | null {
  const input = inputRaw.trim();
  if (!input) return null;

  const parts = input
    .split(/[, ]+/)
    .map(s => s.trim())
    .filter(Boolean);
  if (parts.length !== 2) return null;

  const a = Number(parts[0]);
  const b = Number(parts[1]);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;

  const absA = Math.abs(a);
  const absB = Math.abs(b);

  // Prefer lat,lng when it fits; fall back to lng,lat when that fits.
  if (absA <= 90 && absB <= 180) return [a, b];
  if (absA <= 180 && absB <= 90) return [b, a];
  return null;
}

function clampLatLng([lat, lng]: [number, number]): [number, number] {
  return [
    Math.max(-90, Math.min(90, lat)),
    Math.max(-180, Math.min(180, lng)),
  ];
}

function latLngToXY([lat, lng]: [number, number]): [number, number] {
  // Equirectangular projection (good enough for local route editing UI)
  const x = (lng * Math.PI) / 180;
  const y = (lat * Math.PI) / 180;
  return [x, y];
}

function distToSegmentSq(
  p: [number, number],
  a: [number, number],
  b: [number, number],
): number {
  const [px, py] = latLngToXY(p);
  const [ax, ay] = latLngToXY(a);
  const [bx, by] = latLngToXY(b);

  const abx = bx - ax;
  const aby = by - ay;
  const apx = px - ax;
  const apy = py - ay;
  const abLenSq = abx * abx + aby * aby;
  if (abLenSq === 0) return apx * apx + apy * apy;
  const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / abLenSq));
  const cx = ax + t * abx;
  const cy = ay + t * aby;
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy;
}

export function RouteMap({ waypoints, onChange, profile = 'foot', onRoutedDistanceChange }: RouteMapProps) {
  async function fetchRoute(
    anchors: [number, number][],
    signal?: AbortSignal,
  ): Promise<{ path: [number, number][]; km: number } | null> {
    if (anchors.length < 2) return null;

    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), 8000);
    signal?.addEventListener('abort', () => timeoutController.abort(), { once: true });

    try {
      const coords = anchors.map(([lat, lng]) => `${lng},${lat}`).join(';');
      const res = await fetch(
        `https://routing.openstreetmap.de/routed-${profile}/route/v1/${profile}/${coords}?geometries=geojson&overview=full`,
        { signal: timeoutController.signal },
      );
      clearTimeout(timeoutId);
      if (!res.ok) return null;
      const json = await res.json();
      const route = json.routes?.[0];
      if (!route) return null;
      const path: [number, number][] = route.geometry.coordinates.map(
        ([lng, lat]: [number, number]) => [lat, lng] as [number, number],
      );
      return { path, km: route.distance / 1000 };
    } catch {
      clearTimeout(timeoutId);
      return null;
    }
  }

  const mapWrapRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const polylineRef = useRef<L.Polyline | null>(null);
  const routePathRef = useRef<[number, number][]>([]);
  const distanceMarkersRef = useRef<L.LayerGroup | null>(null);
  const locateMarkerRef = useRef<L.Marker | null>(null);
  const showDistanceMarkersRef = useRef(true);
  const baseLayerRef = useRef<L.TileLayer | null>(null);
  const baseLayerIdRef = useRef<BaseLayerId>('plain');
  const prevCountRef = useRef(0);
  // Latest-ref pattern: keep stable refs to callbacks so they never appear in effect deps
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onRoutedDistanceChangeRef = useRef(onRoutedDistanceChange);
  onRoutedDistanceChangeRef.current = onRoutedDistanceChange;

  const [mode, setMode] = useState<EditMode>('add');
  const modeRef = useRef<EditMode>(mode);
  modeRef.current = mode;

  const [searchQuery, setSearchQuery] = useState('');
  const [searchBusy, setSearchBusy] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);
  const searchMarkerRef = useRef<L.Marker | null>(null);

  const [layersOpen, setLayersOpen] = useState(false);
  const [overlaysOpen, setOverlaysOpen] = useState(false);
  const [baseLayerId, setBaseLayerId] = useState<BaseLayerId>('plain');
  const [showDistanceMarkers, setShowDistanceMarkers] = useState(true);
  showDistanceMarkersRef.current = showDistanceMarkers;

  const [selectedWaypointIdx, setSelectedWaypointIdx] = useState<number | null>(null);
  const selectedWaypointIdxRef = useRef<number | null>(null);
  selectedWaypointIdxRef.current = selectedWaypointIdx;

  const internalChangeRef = useRef(false);
  const undoRef = useRef<[number, number][][]>([]);
  const redoRef = useRef<[number, number][][]>([]);

  const baseLayers = useMemo(() => {
    return {
      plain: {
        id: 'plain' as const,
        label: 'Plain',
        url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      },
      dark: {
        id: 'dark' as const,
        label: 'Dark',
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      },
      topo: {
        id: 'topo' as const,
        label: 'Topography',
        url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      },
      sat: {
        id: 'sat' as const,
        label: 'Satellite',
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      },
    };
  }, []);

  function commitWaypoints(next: [number, number][], opts?: { pushHistory?: boolean }) {
    const pushHistory = opts?.pushHistory ?? true;
    const current = waypointsRef.current;
    if (pushHistory) {
      undoRef.current = [...undoRef.current, current];
      redoRef.current = [];
    }
    internalChangeRef.current = true;
    onChangeRef.current(next);
  }

  function deleteSelectedWaypoint() {
    const idx = selectedWaypointIdxRef.current;
    if (idx == null) return;
    commitWaypoints(waypointsRef.current.filter((_, i) => i !== idx));
    setSelectedWaypointIdx(null);
  }

  function handleUndo() {
    const stack = undoRef.current;
    if (stack.length === 0) return;
    const current = waypointsRef.current;
    const prev = stack[stack.length - 1];
    undoRef.current = stack.slice(0, -1);
    redoRef.current = [...redoRef.current, current];
    internalChangeRef.current = true;
    onChangeRef.current(prev);
  }

  function handleRedo() {
    const stack = redoRef.current;
    if (stack.length === 0) return;
    const current = waypointsRef.current;
    const next = stack[stack.length - 1];
    redoRef.current = stack.slice(0, -1);
    undoRef.current = [...undoRef.current, current];
    internalChangeRef.current = true;
    onChangeRef.current(next);
  }

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: false,
    });
    mapRef.current = map;

    const distanceMarkerPane = map.createPane(DISTANCE_MARKER_PANE);
    distanceMarkerPane.classList.add('route-distance-pane');

    const initial = baseLayers[baseLayerIdRef.current];
    baseLayerRef.current = L.tileLayer(initial.url, { attribution: TILE_ATTR, maxZoom: 19 }).addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [baseLayers]);

  // Stable ref to latest waypoints so the click handler (bound once) always sees current value
  const waypointsRef = useRef(waypoints);
  waypointsRef.current = waypoints;

  // If parent changes waypoints externally, reset local history.
  useEffect(() => {
    if (internalChangeRef.current) {
      internalChangeRef.current = false;
      return;
    }
    undoRef.current = [];
    redoRef.current = [];
  }, [waypoints]);

  // Map click behavior depends on mode.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handler = (e: L.LeafletMouseEvent) => {
      const click: [number, number] = [e.latlng.lat, e.latlng.lng];
      const currentMode = modeRef.current;
      const current = waypointsRef.current;

      if (currentMode === 'add') {
        commitWaypoints([...current, click]);
        return;
      }

      if (currentMode === 'split') {
        if (current.length < 2) return;
        let bestIdx = 0;
        let best = Infinity;
        for (let i = 0; i < current.length - 1; i++) {
          const d = distToSegmentSq(click, current[i], current[i + 1]);
          if (d < best) {
            best = d;
            bestIdx = i;
          }
        }
        const next = [...current.slice(0, bestIdx + 1), click, ...current.slice(bestIdx + 1)];
        commitWaypoints(next);
        return;
      }
    };

    map.on('click', handler);
    return () => {
      map.off('click', handler);
    };
  }, [mode]);

  // Keep map dragging aligned with mode.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (mode === 'select') {
      map.dragging.enable();
    } else {
      map.dragging.disable();
    }
  }, [mode]);

  // Keep marker dragging aligned with mode.
  useEffect(() => {
    const isSelect = mode === 'select';
    markersRef.current.forEach(m => {
      if (!m.dragging) return;
      if (isSelect) m.dragging.enable();
      else m.dragging.disable();
    });
  }, [mode, waypoints]);

  function fitToRoute() {
    const map = mapRef.current;
    if (!map) return;
    const path = routePathRef.current.length >= 2 ? routePathRef.current : waypointsRef.current;
    if (path.length >= 2) {
      map.fitBounds(L.latLngBounds(path), { padding: [48, 64], maxZoom: 17 });
    } else if (path.length === 1) {
      map.setView(path[0], DEFAULT_ZOOM);
    }
  }

  function handleLocate() {
    const map = mapRef.current;
    if (!map) return;
    map.locate({ setView: true, maxZoom: 16, watch: false });
  }

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const onFound = (e: L.LocationEvent) => {
      const latlng: [number, number] = [e.latlng.lat, e.latlng.lng];
      locateMarkerRef.current?.remove();
      locateMarkerRef.current = L.marker(latlng, {
        interactive: false,
        icon: L.divIcon({
          className: 'route-locate-icon',
          html: '<div class="route-locate-dot"></div>',
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        }),
      }).addTo(map);
      setTimeout(() => {
        locateMarkerRef.current?.remove();
        locateMarkerRef.current = null;
      }, 4000);
    };
    const onError = () => {
      // Silent for v1 (UI could show a toast later)
    };

    map.on('locationfound', onFound);
    map.on('locationerror', onError);
    return () => {
      map.off('locationfound', onFound);
      map.off('locationerror', onError);
    };
  }, []);

  async function runSearch() {
    const map = mapRef.current;
    if (!map) return;
    const raw = searchQuery.trim();
    setSearchError(null);

    if (!raw) return;

    const coords = parseLatLngQuery(raw);
    if (coords) {
      const ll = clampLatLng(coords);
      map.setView(ll, SEARCH_ZOOM);
      return;
    }

    searchAbortRef.current?.abort();
    const controller = new AbortController();
    searchAbortRef.current = controller;
    setSearchBusy(true);
    try {
      const params = new URLSearchParams({
        format: 'json',
        q: raw,
        limit: '1',
      });
      const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
        signal: controller.signal,
      });
      if (!res.ok) {
        setSearchError('Search failed');
        return;
      }
      const json = (await res.json()) as Array<{ lat: string; lon: string }>;
      const first = json[0];
      if (!first) {
        setSearchError('No results');
        return;
      }
      const lat = Number(first.lat);
      const lon = Number(first.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        setSearchError('No results');
        return;
      }
      const ll: [number, number] = clampLatLng([lat, lon]);
      map.setView(ll, SEARCH_ZOOM);
      searchMarkerRef.current?.remove();
      searchMarkerRef.current = L.marker(ll, {
        interactive: false,
        icon: L.divIcon({
          className: 'route-search-icon',
          html: '<div class="route-search-dot"></div>',
          iconSize: [10, 10],
          iconAnchor: [5, 5],
        }),
      }).addTo(map);
      setTimeout(() => {
        searchMarkerRef.current?.remove();
        searchMarkerRef.current = null;
      }, 5000);
    } catch (e) {
      if ((e as { name?: string }).name !== 'AbortError') {
        setSearchError('Search failed');
      }
    } finally {
      setSearchBusy(false);
    }
  }

  function clearSearch() {
    setSearchQuery('');
    setSearchError(null);
    searchAbortRef.current?.abort();
    searchMarkerRef.current?.remove();
    searchMarkerRef.current = null;
  }

  function switchBaseLayer(next: BaseLayerId) {
    const map = mapRef.current;
    if (!map) return;
    const current = baseLayerRef.current;
    if (current) current.remove();
    const config = baseLayers[next];
    baseLayerRef.current = L.tileLayer(config.url, { attribution: TILE_ATTR, maxZoom: 19 }).addTo(map);
    baseLayerIdRef.current = next;
    setBaseLayerId(next);
  }

  function toggleDistanceMarkers(next: boolean) {
    setShowDistanceMarkers(next);
    const map = mapRef.current;
    const distanceMarkers = distanceMarkersRef.current;
    if (!map || !distanceMarkers) return;
    if (next) distanceMarkers.addTo(map);
    else distanceMarkers.remove();
  }

  // Sync waypoints → map markers + polyline
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const controller = new AbortController();

    // Clear existing markers and polyline
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    polylineRef.current?.remove();
    polylineRef.current = null;
    routePathRef.current = [];
    distanceMarkersRef.current?.remove();
    distanceMarkersRef.current = null;

    if (waypoints.length === 0) {
      prevCountRef.current = 0;
      onRoutedDistanceChangeRef.current?.(0);
      setSelectedWaypointIdx(null);
      return;
    }

    // Draw anchor markers
    waypoints.forEach((latlng, i) => {
      const isFirst = i === 0;
      const isLast = i === waypoints.length - 1 && waypoints.length > 1;
      let longPressId: ReturnType<typeof setTimeout> | null = null;
      const removeWaypoint = () => {
        commitWaypoints(waypointsRef.current.filter((_, j) => j !== i));
      };
      const clearLongPress = () => {
        if (longPressId == null) return;
        clearTimeout(longPressId);
        longPressId = null;
      };
      const iconClass =
        isFirst ? 'route-anchor route-anchor--start' : isLast ? 'route-anchor route-anchor--end' : 'route-anchor';
      const icon = L.divIcon({
        className: iconClass,
        html: '<div class="route-anchor__dot"></div>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      const m = L.marker(latlng, { icon, draggable: true }).addTo(map);

      // Toggle drag ability by mode (select only).
      if (modeRef.current !== 'select') {
        m.dragging?.disable();
      }

      m.on('dragstart', () => {
        if (modeRef.current !== 'select') {
          m.dragging?.disable();
        }
      });
      m.on('dragend', () => {
        if (modeRef.current !== 'select') return;
        const ll = m.getLatLng();
        const next = waypointsRef.current.map((p, j) => (j === i ? ([ll.lat, ll.lng] as [number, number]) : p));
        commitWaypoints(next);
      });

      m.on('click', (e: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(e);
        setSelectedWaypointIdx(i);
      });

      m.on('contextmenu', (e: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(e);
        removeWaypoint();
      });
      m.on('touchstart', () => {
        clearLongPress();
        longPressId = setTimeout(removeWaypoint, LONG_PRESS_MS);
      });
      m.on('touchend touchcancel touchmove', clearLongPress);
      m.on('remove', clearLongPress);
      m.bindTooltip('<span class="caption">Long-press to delete</span>', { direction: 'top' });
      markersRef.current.push(m);
    });

    // Only auto-zoom on first placement or when loading a saved route (0 → N)
    const prevCount = prevCountRef.current;
    prevCountRef.current = waypoints.length;
    if (prevCount === 0 && waypoints.length > 0) {
      if (waypoints.length >= 2) {
        map.fitBounds(L.latLngBounds(waypoints), { padding: [24, 24] });
      } else {
        map.setView(waypoints[0], DEFAULT_ZOOM);
      }
    }

    // Debounce Valhalla — wait 400ms after last waypoint change before fetching
    const debounceId = setTimeout(() => {
      fetchRoute(waypoints, controller.signal).then(result => {
        if (controller.signal.aborted) return;

        const pathToUse = result ? result.path : waypoints;
        routePathRef.current = pathToUse;
        const km = result ? result.km : totalDistanceKm(waypoints);
        onRoutedDistanceChangeRef.current?.(km);
        polylineRef.current = L.polyline(pathToUse, {
          color: '#7eb8f7',
          weight: 3,
          dashArray: result ? undefined : '6 4',
        }).addTo(map);

        const distanceMarkers = L.layerGroup();
        distanceMarkerPoints(pathToUse).forEach(({ latlng, km }) => {
          L.circleMarker(latlng, {
            pane: DISTANCE_MARKER_PANE,
            radius: 0,
            stroke: false,
            fillOpacity: 0,
            interactive: false,
          })
            .bindTooltip(`<span class="pill plain active">${km} km</span>`, {
              permanent: true,
              direction: 'center',
              className: 'route-distance-tooltip',
              opacity: 1,
            })
            .addTo(distanceMarkers);
        });
        distanceMarkersRef.current = distanceMarkers;
        if (showDistanceMarkersRef.current) {
          distanceMarkers.addTo(map);
        }
      });
    }, 400);

    return () => {
      clearTimeout(debounceId);
      controller.abort();
    };
  }, [waypoints, profile]);

  return (
    <div className="column compact">
      <div className="route-map-mobile-controls column compact">
        <div className="surface tight row compact align-center">
          <span aria-hidden="true"><Search size={16} /></span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void runSearch();
              }
            }}
            placeholder="Search place or coords"
            aria-label="Search location"
            className="grow"
          />
          {searchQuery && (
            <button type="button" className="ghost icon sm" onClick={clearSearch} aria-label="Clear search">
              <X size={16} />
            </button>
          )}
        </div>

        <div className="row compact">
          <button type="button" className="ghost icon" onClick={() => mapRef.current?.zoomIn()} aria-label="Zoom in">
            <Plus size={18} />
          </button>
          <button type="button" className="ghost icon" onClick={() => mapRef.current?.zoomOut()} aria-label="Zoom out">
            <Minus size={18} />
          </button>
          <button type="button" className="ghost icon" onClick={fitToRoute} aria-label="Route overview">
            <Crosshair size={18} />
          </button>
          <button type="button" className="ghost icon" onClick={handleLocate} aria-label="Locate me">
            <MapPin width={18} height={18} />
          </button>
          <span className="grow" />
          <button type="button" className="ghost icon" onClick={handleUndo} aria-label="Undo" disabled={undoRef.current.length === 0}>
            <Undo2 size={18} />
          </button>
          <button type="button" className="ghost icon" onClick={handleRedo} aria-label="Redo" disabled={redoRef.current.length === 0}>
            <Redo2 size={18} />
          </button>
          <button type="button" className="ghost icon danger" onClick={() => commitWaypoints([])} aria-label="Clear route" disabled={waypoints.length === 0}>
            <Trash2 size={18} />
          </button>
        </div>

        {searchError && <div className="caption muted">{searchError}</div>}
        {searchBusy && <div className="caption muted">Searching…</div>}
      </div>

      <div ref={mapWrapRef} className="plan-map map-root media-md route-map-wrap">
      <div ref={containerRef} className="route-map-canvas" />

      <div
        className="row compact align-center route-map-search-pill surface tight"
        role="search"
        onMouseDown={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
      >
        <span className="route-map-search-icon" aria-hidden="true">
          <Search size={16} />
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void runSearch();
            }
          }}
          placeholder="Search place or coords"
          aria-label="Search location"
        />
        {searchQuery && (
          <button type="button" className="ghost icon sm" onClick={clearSearch} aria-label="Clear search">
            <X size={16} />
          </button>
        )}
      </div>

      {searchError && (
        <div
          className="route-map-search-hint caption"
          onMouseDown={e => e.stopPropagation()}
          onClick={e => e.stopPropagation()}
        >
          {searchError}
        </div>
      )}

      <div
        className="column compact route-map-rail route-map-rail--left"
        aria-label="Map controls"
        onMouseDown={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
      >
        <button type="button" className="ghost icon" onClick={() => mapRef.current?.zoomIn()} aria-label="Zoom in">
          <Plus size={18} />
        </button>
        <button type="button" className="ghost icon" onClick={() => mapRef.current?.zoomOut()} aria-label="Zoom out">
          <Minus size={18} />
        </button>
        <button type="button" className="ghost icon" onClick={fitToRoute} aria-label="Route overview">
          <Crosshair size={18} />
        </button>
        <button type="button" className="ghost icon" onClick={handleLocate} aria-label="Locate me">
          <MapPin width={18} height={18} />
        </button>
      </div>

      <div
        className="column compact route-map-rail route-map-rail--left-bottom"
        aria-label="Edit modes"
        onMouseDown={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
      >
        <button
          type="button"
          className={`${mode === 'select' ? 'primary' : 'ghost'} icon`}
          onClick={() => setMode('select')}
          aria-label="Select / pan"
          aria-pressed={mode === 'select'}
        >
          <Cursor size={18} />
        </button>
        <button
          type="button"
          className={`${mode === 'add' ? 'primary' : 'ghost'} icon`}
          onClick={() => setMode('add')}
          aria-label="Add waypoint"
          aria-pressed={mode === 'add'}
        >
          <Plus size={18} />
        </button>
        <button
          type="button"
          className={`${mode === 'split' ? 'primary' : 'ghost'} icon`}
          onClick={() => setMode('split')}
          aria-label="Split route (insert waypoint)"
          aria-pressed={mode === 'split'}
        >
          <FiScissors size={18} />
        </button>
      </div>

      <div
        className="column compact route-map-rail route-map-rail--right"
        aria-label="Route history"
        onMouseDown={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
      >
        <button
          type="button"
          className="ghost icon"
          onClick={handleUndo}
          aria-label="Undo"
          disabled={undoRef.current.length === 0}
        >
          <Undo2 size={18} />
        </button>
        <button
          type="button"
          className="ghost icon"
          onClick={handleRedo}
          aria-label="Redo"
          disabled={redoRef.current.length === 0}
        >
          <Redo2 size={18} />
        </button>
        <button
          type="button"
          className="ghost icon danger"
          onClick={() => commitWaypoints([])}
          aria-label="Clear route"
          disabled={waypoints.length === 0}
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div
        className="column compact route-map-rail route-map-rail--bottom-right"
        aria-label="Visibility controls"
        onMouseDown={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
      >
        <button
          type="button"
          className={`${layersOpen ? 'primary' : 'ghost'} icon`}
          onClick={() => {
            setLayersOpen(v => !v);
            setOverlaysOpen(false);
          }}
          aria-label="Map layers"
          aria-expanded={layersOpen}
        >
          <Layers size={18} />
        </button>
        <button
          type="button"
          className={`${overlaysOpen ? 'primary' : 'ghost'} icon`}
          onClick={() => {
            setOverlaysOpen(v => !v);
            setLayersOpen(false);
          }}
          aria-label="Overlays"
          aria-expanded={overlaysOpen}
        >
          <Eye size={18} />
        </button>

        {layersOpen && (
          <div className="surface compact route-map-popover">
            <div className="column compact">
              {(Object.keys(baseLayers) as BaseLayerId[]).map(id => (
                <button
                  key={id}
                  type="button"
                  className={`${baseLayerId === id ? 'primary' : 'ghost'} sm`}
                  onClick={() => switchBaseLayer(id)}
                >
                  {baseLayers[id].label}
                </button>
              ))}
            </div>
          </div>
        )}

        {overlaysOpen && (
          <div className="surface compact route-map-popover">
            <div className="column compact">
              <button
                type="button"
                className={`${showDistanceMarkers ? 'primary' : 'ghost'} sm`}
                onClick={() => toggleDistanceMarkers(!showDistanceMarkers)}
                aria-pressed={showDistanceMarkers}
              >
                Distance markers
              </button>
            </div>
          </div>
        )}
      </div>

      {searchBusy && (
        <div
          className="route-map-busy caption"
          onMouseDown={e => e.stopPropagation()}
          onClick={e => e.stopPropagation()}
        >
          Searching…
        </div>
      )}
    </div>

      <div className="route-map-mobile-controls column compact">
        <div className="row compact">
          <button
            type="button"
            className={`${mode === 'select' ? 'primary' : 'ghost'} icon`}
            onClick={() => setMode('select')}
            aria-label="Select / pan"
            aria-pressed={mode === 'select'}
          >
            <Cursor size={18} />
          </button>
          <button
            type="button"
            className={`${mode === 'add' ? 'primary' : 'ghost'} icon`}
            onClick={() => setMode('add')}
            aria-label="Add waypoint"
            aria-pressed={mode === 'add'}
          >
            <Plus size={18} />
          </button>
          <button
            type="button"
            className={`${mode === 'split' ? 'primary' : 'ghost'} icon`}
            onClick={() => setMode('split')}
            aria-label="Split route (insert waypoint)"
            aria-pressed={mode === 'split'}
          >
            <FiScissors size={18} />
          </button>
          <span className="grow" />
          <button
            type="button"
            className={`${layersOpen ? 'primary' : 'ghost'} icon`}
            onClick={() => { setLayersOpen(v => !v); setOverlaysOpen(false); }}
            aria-label="Map layers"
            aria-expanded={layersOpen}
          >
            <Layers size={18} />
          </button>
          <button
            type="button"
            className={`${overlaysOpen ? 'primary' : 'ghost'} icon`}
            onClick={() => { setOverlaysOpen(v => !v); setLayersOpen(false); }}
            aria-label="Overlays"
            aria-expanded={overlaysOpen}
          >
            <Eye size={18} />
          </button>
          <button
            type="button"
            className="ghost icon danger"
            onClick={deleteSelectedWaypoint}
            aria-label="Delete selected waypoint"
            disabled={selectedWaypointIdx == null}
          >
            <Trash2 size={18} />
          </button>
        </div>
        {layersOpen && (
          <div className="row compact">
            <span className="grow"></span>
            {(Object.keys(baseLayers) as BaseLayerId[]).map(id => (
              <button
                key={id}
                type="button"
                className={`${baseLayerId === id ? 'primary' : 'ghost'} sm`}
                onClick={() => switchBaseLayer(id)}
              >
                {baseLayers[id].label}
              </button>
            ))}
          </div>
        )}
        {overlaysOpen && (
          <div className="row compact">
            <span className="grow"></span>
            <button
              type="button"
              className={`${showDistanceMarkers ? 'primary' : 'ghost'} sm`}
              onClick={() => toggleDistanceMarkers(!showDistanceMarkers)}
              aria-pressed={showDistanceMarkers}
            >
              Distance markers
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
