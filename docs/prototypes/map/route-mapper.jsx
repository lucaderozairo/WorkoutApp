// Route Mapper — Leaflet + CARTO Voyager base, footpath/plotaroute-inspired controls.
// Modes: select / add / split / delete. Plus undo/redo, reverse, clear,
// search, locate, base-layer switch, distance markers, elevation profile,
// expandable left sidebar for planning runs / hikes / rides.

const { useEffect, useMemo, useRef, useState, useCallback } = React;

// Tweaks panel imports (loaded by tweaks-panel.jsx)
const { useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakSelect, TweakToggle } = window;

// Tweak defaults — wired to the host so changes survive reload.
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "viewport": "desktop",
  "theme": "light",
  "defaultActivity": "run",
  "baseLayer": "plain",
  "showDistMarkers": true
}/*EDITMODE-END*/;

// ── Geometry ────────────────────────────────────────────────────────────
const TILE_ATTR = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>';
const DEFAULT_CENTER = [40.7745, -73.9712]; // Central Park, NYC
const DEFAULT_ZOOM = 14;
const SEARCH_ZOOM = 15;

function haversineKm(a, b) {
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
function totalDistanceKm(pts) {
  if (pts.length < 2) return 0;
  let t = 0;
  for (let i = 1; i < pts.length; i++) t += haversineKm(pts[i - 1], pts[i]);
  return t;
}
function interpolateLatLng(a, b, ratio) {
  return [a[0] + (b[0] - a[0]) * ratio, a[1] + (b[1] - a[1]) * ratio];
}
function distanceMarkerPoints(path) {
  if (path.length < 2) return [];
  let totalKm = 0;
  for (let i = 1; i < path.length; i++) totalKm += haversineKm(path[i - 1], path[i]);
  const markerCount = Math.floor(totalKm);
  if (markerCount < 1) return [];
  const markers = [];
  let nextMarkerKm = 1;
  let travelledKm = 0;
  for (let i = 1; i < path.length && nextMarkerKm <= markerCount; i++) {
    const previous = path[i - 1], current = path[i];
    const segmentKm = haversineKm(previous, current);
    if (segmentKm === 0) continue;
    while (travelledKm + segmentKm >= nextMarkerKm && nextMarkerKm <= markerCount) {
      const ratio = (nextMarkerKm - travelledKm) / segmentKm;
      markers.push({ latlng: interpolateLatLng(previous, current, ratio), km: nextMarkerKm });
      nextMarkerKm += 1;
    }
    travelledKm += segmentKm;
  }
  return markers;
}
function latLngToXY([lat, lng]) {
  return [(lng * Math.PI) / 180, (lat * Math.PI) / 180];
}
function distToSegmentSq(p, a, b) {
  const [px, py] = latLngToXY(p);
  const [ax, ay] = latLngToXY(a);
  const [bx, by] = latLngToXY(b);
  const abx = bx - ax, aby = by - ay;
  const apx = px - ax, apy = py - ay;
  const abLenSq = abx * abx + aby * aby;
  if (abLenSq === 0) return apx * apx + apy * apy;
  const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / abLenSq));
  const cx = ax + t * abx, cy = ay + t * aby;
  const dx = px - cx, dy = py - cy;
  return dx * dx + dy * dy;
}
function parseLatLngQuery(inputRaw) {
  const input = inputRaw.trim();
  if (!input) return null;
  const parts = input.split(/[, ]+/).map((s) => s.trim()).filter(Boolean);
  if (parts.length !== 2) return null;
  const a = Number(parts[0]), b = Number(parts[1]);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  if (Math.abs(a) <= 90 && Math.abs(b) <= 180) return [a, b];
  return null;
}

// Synthesize plausible elevation samples along a path
function synthElevation(path, baseElev = 30) {
  if (path.length < 2) return [];
  const samples = [];
  let dist = 0;
  for (let i = 0; i < path.length; i++) {
    if (i > 0) dist += haversineKm(path[i - 1], path[i]);
    // smooth pseudo-random elevation based on coords
    const lat = path[i][0], lng = path[i][1];
    const noise =
      Math.sin(lat * 730) * 6 +
      Math.cos(lng * 690) * 5 +
      Math.sin((lat + lng) * 410) * 4 +
      Math.cos(dist * 1.6) * 7;
    samples.push({ d: dist, ele: baseElev + noise });
  }
  // densify by linear interpolation for prettier chart
  if (samples.length > 1) {
    const dense = [];
    const total = samples[samples.length - 1].d;
    const step = Math.max(total / 200, 0.01);
    let j = 0;
    for (let d = 0; d <= total + 1e-6; d += step) {
      while (j < samples.length - 1 && samples[j + 1].d < d) j++;
      const a = samples[j], b = samples[Math.min(j + 1, samples.length - 1)];
      const span = Math.max(1e-6, b.d - a.d);
      const r = (d - a.d) / span;
      const ele = a.ele + (b.ele - a.ele) * r;
      // add medium-frequency wave for texture
      const wave = Math.sin(d * 3.1) * 3 + Math.cos(d * 7.7) * 1.6;
      dense.push({ d, ele: ele + wave });
    }
    return dense;
  }
  return samples;
}
function elevationStats(samples) {
  let gain = 0, loss = 0;
  let minE = Infinity, maxE = -Infinity;
  for (let i = 0; i < samples.length; i++) {
    const e = samples[i].ele;
    if (e < minE) minE = e;
    if (e > maxE) maxE = e;
    if (i > 0) {
      const d = samples[i].ele - samples[i - 1].ele;
      if (d > 0) gain += d; else loss += -d;
    }
  }
  if (!samples.length) { minE = 0; maxE = 0; }
  return { gain, loss, minE, maxE };
}

// ── Constants ───────────────────────────────────────────────────────────
const BASE_LAYERS = {
  plain: { label: 'Voyager',    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png' },
  dark:  { label: 'Dark',       url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' },
  topo:  { label: 'Topo',       url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png' },
  sat:   { label: 'Satellite',  url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' },
};

const ACTIVITIES = [
  { id: 'run',   label: 'Run',   pace: 5.4,  kcalPerKm: 65, color: '#ef4a4a' }, // min/km
  { id: 'hike',  label: 'Hike',  pace: 13,   kcalPerKm: 75, color: '#e8a33d' },
  { id: 'cycle', label: 'Ride',  pace: 2.6,  kcalPerKm: 35, color: '#6fbf73' },
  { id: 'walk',  label: 'Walk',  pace: 11.5, kcalPerKm: 50, color: '#7b9ef8' },
];

const MODES = [
  { id: 'select', label: 'Select', hint: 'Drag waypoints',    kbd: 'V', icon: 'cursor' },
  { id: 'add',    label: 'Add',    hint: 'Click to add',      kbd: 'A', icon: 'plus' },
  { id: 'split',  label: 'Split',  hint: 'Click on line',     kbd: 'S', icon: 'split' },
  { id: 'delete', label: 'Delete', hint: 'Click to remove',   kbd: 'D', icon: 'trash' },
];

// Seed route — a scenic Central Park loop
const SEED_WAYPOINTS = [
  [40.7681, -73.9819],
  [40.7706, -73.9776],
  [40.7740, -73.9722],
  [40.7795, -73.9678],
  [40.7850, -73.9610],
  [40.7898, -73.9570],
];

const SAVED_ROUTES = [
  { id: 'cp-loop',   name: 'Central Park lower loop',    km: 7.2,  gain: 64,  activity: 'run',   when: 'Sun · 7:30' },
  { id: 'reservoir', name: 'Reservoir morning',          km: 4.1,  gain: 18,  activity: 'run',   when: 'Mon · 6:45' },
  { id: 'bridges',   name: 'Five Bridges ride',          km: 38.4, gain: 312, activity: 'cycle', when: 'Sat · 9:00' },
  { id: 'palisades', name: 'Palisades cliff hike',       km: 14.8, gain: 542, activity: 'hike',  when: 'Wknd' },
];

// ── Icons ───────────────────────────────────────────────────────────────
function Icon({ name, size = 16 }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'cursor': return <svg {...p}><path d="M5 3 L5 19 L10 14 L13 21 L16 20 L13 13 L20 13 Z" /></svg>;
    case 'plus':   return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></svg>;
    case 'split':  return <svg {...p}><path d="M3 12h6" /><path d="M15 12h6" /><circle cx="12" cy="12" r="2.5" /><path d="M12 6v12" /></svg>;
    case 'trash':  return <svg {...p}><path d="M4 7h16" /><path d="M9 7V4h6v3" /><path d="M6 7l1 13h10l1-13" /><path d="M10 11v6M14 11v6" /></svg>;
    case 'undo':   return <svg {...p}><path d="M9 14L4 9L9 4" /><path d="M4 9h11a5 5 0 0 1 0 10h-3" /></svg>;
    case 'redo':   return <svg {...p}><path d="M15 14l5-5-5-5" /><path d="M20 9H9a5 5 0 0 0 0 10h3" /></svg>;
    case 'reverse':return <svg {...p}><path d="M7 7h11l-3-3" /><path d="M17 17H6l3 3" /></svg>;
    case 'clear':  return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M9 9l6 6M15 9l-6 6" /></svg>;
    case 'search': return <svg {...p}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>;
    case 'zoom-in':  return <svg {...p}><path d="M5 12h14M12 5v14" /></svg>;
    case 'zoom-out': return <svg {...p}><path d="M5 12h14" /></svg>;
    case 'locate': return <svg {...p}><circle cx="12" cy="12" r="3" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3" /></svg>;
    case 'fit':    return <svg {...p}><path d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4" /></svg>;
    case 'layers': return <svg {...p}><path d="M12 3l9 5-9 5-9-5 9-5z" /><path d="M3 13l9 5 9-5" /></svg>;
    case 'flag':   return <svg {...p}><path d="M5 21V4" /><path d="M5 4h10l-2 4 2 4H5" /></svg>;
    case 'pin':    return <svg {...p}><path d="M12 21s7-7.5 7-12a7 7 0 1 0-14 0c0 4.5 7 12 7 12z" /><circle cx="12" cy="9" r="2.5" /></svg>;
    case 'collapse': return <svg {...p}><path d="M15 6l-6 6 6 6" /></svg>;
    case 'expand':   return <svg {...p}><path d="M9 6l6 6-6 6" /></svg>;
    case 'chev-up':  return <svg {...p}><path d="M6 14l6-6 6 6" /></svg>;
    case 'chev-down':return <svg {...p}><path d="M6 10l6 6 6-6" /></svg>;
    case 'ruler':  return <svg {...p}><path d="M3 17L17 3l4 4L7 21z" /><path d="M7 13l2 2M10 10l2 2M13 7l2 2" /></svg>;
    case 'gauge':  return <svg {...p}><path d="M3 14a9 9 0 1 1 18 0" /><path d="M12 14l4-4" /></svg>;
    case 'route':  return <svg {...p}><circle cx="6" cy="6" r="2" /><circle cx="18" cy="18" r="2" /><path d="M6 8v6a4 4 0 0 0 4 4h4" /></svg>;
    case 'save':   return <svg {...p}><path d="M5 4h11l3 3v13H5z" /><path d="M8 4v5h7V4" /></svg>;
    case 'share':  return <svg {...p}><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="M8 11l8-5M8 13l8 5" /></svg>;
    case 'pen':    return <svg {...p}><path d="M14 3l7 7L9 22H3v-6z" /><path d="M14 3l7 7" /></svg>;
    default: return null;
  }
}

// ── Map ─────────────────────────────────────────────────────────────────
function useRouteMap({
  waypoints, setWaypoints, mode, baseLayerId, showDistMarkers,
  setSelectedIdx, mapElRef,
}) {
  const mapRef = useRef(null);
  const baseRef = useRef(null);
  const markersRef = useRef([]);
  const segmentsRef = useRef(null);
  const distGroupRef = useRef(null);
  const locateRef = useRef(null);
  const searchPinRef = useRef(null);
  const waypointsRefLatest = useRef(waypoints);
  const modeRefLatest = useRef(mode);
  const setWaypointsRefLatest = useRef(setWaypoints);
  waypointsRefLatest.current = waypoints;
  modeRefLatest.current = mode;
  setWaypointsRefLatest.current = setWaypoints;
  const prevCountRef = useRef(0);

  // init
  useEffect(() => {
    if (!mapElRef.current || mapRef.current) return;
    const map = L.map(mapElRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: false,
      attributionControl: true,
    });
    mapRef.current = map;
    baseRef.current = L.tileLayer(BASE_LAYERS[baseLayerId].url, { attribution: TILE_ATTR, maxZoom: 19, subdomains: 'abcd' }).addTo(map);

    return () => { map.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // mode-driven map interactions
  useEffect(() => {
    const map = mapRef.current; if (!map) return;
    const handler = (e) => {
      const click = [e.latlng.lat, e.latlng.lng];
      const cur = waypointsRefLatest.current;
      const m = modeRefLatest.current;
      if (m === 'add') {
        setWaypointsRefLatest.current([...cur, click]);
      } else if (m === 'split') {
        if (cur.length < 2) return;
        let bestIdx = 0, best = Infinity;
        for (let i = 0; i < cur.length - 1; i++) {
          const d = distToSegmentSq(click, cur[i], cur[i + 1]);
          if (d < best) { best = d; bestIdx = i; }
        }
        const next = [...cur.slice(0, bestIdx + 1), click, ...cur.slice(bestIdx + 1)];
        setWaypointsRefLatest.current(next);
      }
    };
    map.on('click', handler);
    return () => { map.off('click', handler); };
  }, []);

  // dragging on/off by mode
  useEffect(() => {
    const map = mapRef.current; if (!map) return;
    if (mode === 'select' || mode === 'add' || mode === 'split') map.dragging.enable();
    else map.dragging.disable();
    markersRef.current.forEach((m) => {
      if (!m.dragging) return;
      if (mode === 'select') m.dragging.enable();
      else m.dragging.disable();
    });
  }, [mode, waypoints]);

  // base layer swap
  useEffect(() => {
    const map = mapRef.current; if (!map) return;
    baseRef.current?.remove();
    baseRef.current = L.tileLayer(BASE_LAYERS[baseLayerId].url, { attribution: TILE_ATTR, maxZoom: 19, subdomains: 'abcd' }).addTo(map);
  }, [baseLayerId]);

  // dist marker visibility
  useEffect(() => {
    const map = mapRef.current; if (!map || !distGroupRef.current) return;
    if (showDistMarkers) distGroupRef.current.addTo(map);
    else distGroupRef.current.remove();
  }, [showDistMarkers]);

  // sync waypoints → markers + polyline + distance markers
  useEffect(() => {
    const map = mapRef.current; if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    segmentsRef.current?.remove(); segmentsRef.current = null;
    distGroupRef.current?.remove(); distGroupRef.current = null;

    if (waypoints.length === 0) {
      prevCountRef.current = 0;
      return;
    }

    // anchor markers
    waypoints.forEach((latlng, i) => {
      const isFirst = i === 0;
      const isLast = i === waypoints.length - 1 && waypoints.length > 1;
      const cls = isFirst ? 'route-anchor start' : isLast ? 'route-anchor end' : 'route-anchor';
      const icon = L.divIcon({
        className: cls,
        html: '<div class="dot"></div>',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      const m = L.marker(latlng, { icon, draggable: true }).addTo(map);
      if (modeRefLatest.current !== 'select') m.dragging?.disable();
      m.on('dragend', () => {
        if (modeRefLatest.current !== 'select') return;
        const ll = m.getLatLng();
        const next = waypointsRefLatest.current.map((p, j) => (j === i ? [ll.lat, ll.lng] : p));
        setWaypointsRefLatest.current(next);
      });
      m.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        if (modeRefLatest.current === 'delete') {
          setWaypointsRefLatest.current(waypointsRefLatest.current.filter((_, j) => j !== i));
        } else {
          setSelectedIdx(i);
        }
      });
      m.on('contextmenu', (e) => {
        L.DomEvent.stopPropagation(e);
        setWaypointsRefLatest.current(waypointsRefLatest.current.filter((_, j) => j !== i));
      });
      const label = isFirst ? 'Start' : isLast ? 'Finish' : `Waypoint ${i + 1}`;
      m.bindTooltip(label, { direction: 'top', offset: [0, -6] });
      markersRef.current.push(m);
    });

    // first-fit
    const prevCount = prevCountRef.current;
    prevCountRef.current = waypoints.length;
    if (prevCount === 0 && waypoints.length >= 2) {
      map.fitBounds(L.latLngBounds(waypoints), { padding: [56, 56] });
    }

    // line
    const segments = L.layerGroup().addTo(map);
    for (let i = 0; i < waypoints.length - 1; i++) {
      const segPath = [waypoints[i], waypoints[i + 1]];
      const segKm = haversineKm(waypoints[i], waypoints[i + 1]);
      // shadow + accent stroke
      L.polyline(segPath, { color: '#0e1320', weight: 7, opacity: 0.18 }).addTo(segments);
      const pl = L.polyline(segPath, { color: '#4f8ef7', weight: 4, lineCap: 'round', lineJoin: 'round' }).addTo(segments);
      pl.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        if (modeRefLatest.current === 'split') {
          // handled by map click
          return;
        }
        L.popup({ closeButton: false, autoPan: false, offset: [0, -4] })
          .setLatLng(e.latlng)
          .setContent(`${segKm.toFixed(2)} km`)
          .openOn(map);
      });
    }
    segmentsRef.current = segments;

    // distance markers per km
    const grp = L.layerGroup();
    distanceMarkerPoints(waypoints).forEach(({ latlng, km }) => {
      const icon = L.divIcon({
        className: 'distance-marker',
        html: `<span class="distance-marker-label">${km} km</span><div class="distance-marker-line"></div>`,
        iconSize: [48, 22],
        iconAnchor: [24, 22],
      });
      L.marker(latlng, { icon, interactive: false }).addTo(grp);
    });
    distGroupRef.current = grp;
    if (showDistMarkers) grp.addTo(map);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waypoints]);

  // imperative methods
  const api = useMemo(() => ({
    zoomIn:  () => mapRef.current?.zoomIn(),
    zoomOut: () => mapRef.current?.zoomOut(),
    fit: () => {
      const map = mapRef.current; if (!map) return;
      const wp = waypointsRefLatest.current;
      if (wp.length >= 2) map.fitBounds(L.latLngBounds(wp), { padding: [56, 56], maxZoom: 17 });
      else if (wp.length === 1) map.setView(wp[0], DEFAULT_ZOOM);
    },
    locate: () => {
      const map = mapRef.current; if (!map) return;
      map.locate({ setView: true, maxZoom: 15, watch: false });
      map.once('locationfound', (e) => {
        const latlng = [e.latlng.lat, e.latlng.lng];
        locateRef.current?.remove();
        locateRef.current = L.marker(latlng, {
          interactive: false,
          icon: L.divIcon({
            className: 'route-anchor',
            html: '<div class="dot locate"></div>',
            iconSize: [14, 14],
            iconAnchor: [7, 7],
          }),
        }).addTo(map);
        setTimeout(() => { locateRef.current?.remove(); locateRef.current = null; }, 8000);
      });
    },
    search: async (raw) => {
      const map = mapRef.current; if (!map) return 'fail';
      const trimmed = raw.trim();
      if (!trimmed) return 'fail';
      const coords = parseLatLngQuery(trimmed);
      if (coords) {
        map.setView(coords, SEARCH_ZOOM);
        return 'coords';
      }
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(trimmed)}`);
        if (!res.ok) return 'fail';
        const json = await res.json();
        const first = json[0]; if (!first) return 'no_results';
        const lat = Number(first.lat), lon = Number(first.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return 'no_results';
        map.setView([lat, lon], SEARCH_ZOOM);
        searchPinRef.current?.remove();
        searchPinRef.current = L.marker([lat, lon], {
          interactive: false,
          icon: L.divIcon({
            className: 'route-anchor',
            html: '<div class="dot search"></div>',
            iconSize: [12, 12],
            iconAnchor: [6, 6],
          }),
        }).addTo(map);
        setTimeout(() => { searchPinRef.current?.remove(); searchPinRef.current = null; }, 6000);
        return 'ok';
      } catch {
        return 'fail';
      }
    },
  }), []);

  return api;
}

// ── App shell ───────────────────────────────────────────────────────────
function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Apply theme to <html> (light/dark vars)
  useEffect(() => {
    document.documentElement.dataset.theme = tweaks.theme || 'light';
  }, [tweaks.theme]);

  // ── Route state (shared across desktop/mobile shells) ─────────────────
  const [waypoints, _setWaypoints] = useState(SEED_WAYPOINTS);
  const undoRef = useRef([]);
  const redoRef = useRef([]);
  const [, force] = React.useReducer((x) => x + 1, 0);

  const setWaypoints = useCallback((next, opts) => {
    const push = (opts?.push ?? true);
    _setWaypoints((prev) => {
      const resolved = typeof next === 'function' ? next(prev) : next;
      if (push) {
        undoRef.current = [...undoRef.current, prev].slice(-60);
        redoRef.current = [];
      }
      return resolved;
    });
  }, []);
  const undo = useCallback(() => {
    const stk = undoRef.current; if (!stk.length) return;
    _setWaypoints((cur) => {
      const prev = stk[stk.length - 1];
      undoRef.current = stk.slice(0, -1);
      redoRef.current = [...redoRef.current, cur];
      return prev;
    });
    force();
  }, []);
  const redo = useCallback(() => {
    const stk = redoRef.current; if (!stk.length) return;
    _setWaypoints((cur) => {
      const nxt = stk[stk.length - 1];
      redoRef.current = stk.slice(0, -1);
      undoRef.current = [...undoRef.current, cur];
      return nxt;
    });
    force();
  }, []);

  const [mode, setMode] = useState('add');
  const [baseLayerId, setBaseLayerId] = useState(tweaks.baseLayer || 'plain');
  const [showDistMarkers, setShowDistMarkers] = useState(tweaks.showDistMarkers ?? true);
  const [activity, setActivity] = useState(tweaks.defaultActivity || 'run');
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [hoverDist, setHoverDist] = useState(null);

  // Sync derived state from tweaks so changing a default updates the live view
  useEffect(() => { setBaseLayerId(tweaks.baseLayer || 'plain'); }, [tweaks.baseLayer]);
  useEffect(() => { setShowDistMarkers(!!tweaks.showDistMarkers); }, [tweaks.showDistMarkers]);
  useEffect(() => { setActivity(tweaks.defaultActivity || 'run'); }, [tweaks.defaultActivity]);

  // Stats
  const totalKm = useMemo(() => totalDistanceKm(waypoints), [waypoints]);
  const samples = useMemo(() => synthElevation(waypoints, 28), [waypoints]);
  const eStats = useMemo(() => elevationStats(samples), [samples]);
  const activityDef = ACTIVITIES.find((a) => a.id === activity);

  // Pace state — global + per-segment overrides (min/km)
  const [globalPace, setGlobalPace] = useState(activityDef.pace);
  const [segmentPaces, setSegmentPaces] = useState({}); // { segIdx: paceMinPerKm }
  // Reset pace when the activity changes
  useEffect(() => {
    const def = ACTIVITIES.find((a) => a.id === activity);
    setGlobalPace(def.pace);
    setSegmentPaces({});
  }, [activity]);
  // Drop overrides for segments that no longer exist
  useEffect(() => {
    const segCount = Math.max(0, waypoints.length - 1);
    setSegmentPaces((prev) => {
      const next = {};
      for (const k of Object.keys(prev)) if (Number(k) < segCount) next[k] = prev[k];
      return next;
    });
  }, [waypoints.length]);

  const segmentDurations = useMemo(() => {
    const arr = [];
    for (let i = 0; i < waypoints.length - 1; i++) {
      const km = haversineKm(waypoints[i], waypoints[i + 1]);
      const overridden = segmentPaces[i] != null;
      const pace = overridden ? segmentPaces[i] : globalPace;
      arr.push({ km, pace, min: km * pace, overridden });
    }
    return arr;
  }, [waypoints, globalPace, segmentPaces]);

  const etaMin = segmentDurations.reduce((s, d) => s + d.min, 0);
  const kcal = Math.round(totalKm * activityDef.kcalPerKm + eStats.gain * 0.6);

  // Keyboard
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault(); if (e.shiftKey) redo(); else undo(); return;
      }
      const k = e.key.toLowerCase();
      const m = MODES.find((mm) => mm.kbd.toLowerCase() === k);
      if (m) { e.preventDefault(); setMode(m.id); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  const canUndo = undoRef.current.length > 0;
  const canRedo = redoRef.current.length > 0;

  const shellProps = {
    waypoints, setWaypoints, mode, setMode,
    undo, redo, canUndo, canRedo,
    baseLayerId, setBaseLayerId,
    showDistMarkers, setShowDistMarkers,
    activity, setActivity,
    selectedIdx, setSelectedIdx,
    hoverDist, setHoverDist,
    totalKm, samples, eStats, etaMin, kcal,
    globalPace, setGlobalPace, segmentPaces, setSegmentPaces, segmentDurations,
  };

  const isMobile = tweaks.viewport === 'mobile';

  return (
    <>
      {isMobile ? (
        <div className="viewport-stage">
          <div className="viewport-label"><span className="dot" />Mobile · 390 × 844</div>
          <div className="phone-frame">
            <PhoneStatusBar />
            <div className="phone-screen">
              {/* keyed so map remounts cleanly on viewport switch */}
              <MobileShell key="mobile" {...shellProps} />
            </div>
          </div>
        </div>
      ) : (
        <DesktopShell key="desktop" {...shellProps} />
      )}

      <RouteTweaksPanel tweaks={tweaks} setTweak={setTweak} />
    </>
  );
}

// ── Desktop shell ───────────────────────────────────────────────────────
function DesktopShell({
  waypoints, setWaypoints, mode, setMode, undo, redo, canUndo, canRedo,
  baseLayerId, setBaseLayerId, showDistMarkers, setShowDistMarkers,
  activity, setActivity, selectedIdx, setSelectedIdx, hoverDist, setHoverDist,
  totalKm, samples, eStats, etaMin, kcal,
  globalPace, setGlobalPace, segmentPaces, setSegmentPaces, segmentDurations,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const v = Number(localStorage.getItem('rm.sidebarWidth'));
    return Number.isFinite(v) && v >= 280 ? v : 340;
  });
  useEffect(() => { try { localStorage.setItem('rm.sidebarWidth', String(sidebarWidth)); } catch {} }, [sidebarWidth]);
  const [layersOpen, setLayersOpen] = useState(false);
  const [elevOpen, setElevOpen] = useState(true);
  const mapElRef = useRef(null);
  const api = useRouteMap({
    waypoints, setWaypoints, mode, baseLayerId, showDistMarkers, setSelectedIdx, mapElRef,
  });

  // Tell Leaflet to recompute size after sidebar transitions/resizes
  useEffect(() => {
    const id = setTimeout(() => { try { window.dispatchEvent(new Event('resize')); } catch {} }, 280);
    return () => clearTimeout(id);
  }, [sidebarOpen, sidebarWidth]);

  return (
    <div className={`mode-${mode}`} style={{
      position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column',
      background: 'var(--surface-0)',
    }}>
      <TopBar
        mode={mode} setMode={setMode}
        undo={undo} redo={redo} canUndo={canUndo} canRedo={canRedo}
        reverse={() => setWaypoints((w) => [...w].reverse())}
        clear={() => setWaypoints([])}
        onSearch={api.search}
      />

      <div style={{ flex: 1, display: 'flex', minHeight: 0, position: 'relative' }}>
        <Sidebar
          open={sidebarOpen} setOpen={setSidebarOpen}
          width={sidebarWidth} setWidth={setSidebarWidth}
          waypoints={waypoints} setWaypoints={setWaypoints}
          selectedIdx={selectedIdx} setSelectedIdx={setSelectedIdx}
          activity={activity} setActivity={setActivity}
          totalKm={totalKm} eStats={eStats}
          etaMin={etaMin} kcal={kcal}
          globalPace={globalPace} setGlobalPace={setGlobalPace}
          segmentPaces={segmentPaces} setSegmentPaces={setSegmentPaces}
          segmentDurations={segmentDurations}
        />

        <main style={{ flex: 1, position: 'relative', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <div ref={mapElRef} style={{ flex: 1, position: 'relative', zIndex: 0 }} />

          <MapControls
            api={api}
            baseLayerId={baseLayerId} setBaseLayerId={setBaseLayerId}
            layersOpen={layersOpen} setLayersOpen={setLayersOpen}
            showDistMarkers={showDistMarkers} setShowDistMarkers={setShowDistMarkers}
          />

          <ModeBadge mode={mode} />

          <ElevationStrip
            samples={samples} eStats={eStats}
            totalKm={totalKm} hoverDist={hoverDist} setHoverDist={setHoverDist}
            open={elevOpen} setOpen={setElevOpen}
          />
        </main>
      </div>
    </div>
  );
}

// ── Mobile shell ────────────────────────────────────────────────────────
function MobileShell({
  waypoints, setWaypoints, mode, setMode, undo, redo, canUndo, canRedo,
  baseLayerId, setBaseLayerId, showDistMarkers, setShowDistMarkers,
  activity, setActivity, selectedIdx, setSelectedIdx, hoverDist, setHoverDist,
  totalKm, samples, eStats, etaMin, kcal,
}) {
  const [sheet, setSheet] = useState('mid'); // 'peek' | 'mid' | 'full'
  const [layersOpen, setLayersOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const mapElRef = useRef(null);
  const api = useRouteMap({
    waypoints, setWaypoints, mode, baseLayerId, showDistMarkers, setSelectedIdx, mapElRef,
  });

  const sheetHeight = sheet === 'peek' ? 96 : sheet === 'mid' ? 240 : 520;

  return (
    <div className={`mode-${mode}`} style={{
      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      background: 'var(--surface-0)', overflow: 'hidden',
    }}>
      {/* Top app bar — sits under the 44px iOS status bar */}
      <header style={{
        flex: '0 0 auto',
        marginTop: 44, height: 48,
        background: 'var(--surface-1)', borderBottom: '1px solid var(--line)',
        display: 'flex', alignItems: 'center', padding: '0 8px', gap: 8,
        zIndex: 10, position: 'relative',
      }}>
        <button title="Menu" style={mobileIconBtnStyle}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
          <div style={{
            width: 24, height: 24, borderRadius: 7,
            background: 'linear-gradient(135deg, #4f8ef7 0%, #6fbf73 100%)',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
          }}>R</div>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Ridgeline</span>
        </div>
        <button onClick={() => setSearchOpen((v) => !v)} title="Search" style={{
          ...mobileIconBtnStyle,
          color: searchOpen ? 'var(--accent)' : 'var(--ink-muted)',
        }}>
          <Icon name="search" size={16} />
        </button>
        <button onClick={undo} disabled={!canUndo} style={{
          ...mobileIconBtnStyle,
          opacity: canUndo ? 1 : 0.4,
        }} title="Undo">
          <Icon name="undo" size={16} />
        </button>
      </header>

      {/* Search slide-down */}
      {searchOpen && <MobileSearchBar onSearch={api.search} onClose={() => setSearchOpen(false)} />}

      {/* Map fills remaining */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <div ref={mapElRef} style={{ position: 'absolute', inset: 0, zIndex: 0 }} />

        {/* Mode chips — floating top */}
        <div style={{
          position: 'absolute', top: 12, left: 12, right: 12, zIndex: 4,
          display: 'flex', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <div style={{
            display: 'flex', gap: 2,
            background: 'var(--surface-1)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--r-pill)',
            boxShadow: 'var(--shadow-2)',
            padding: 3,
            pointerEvents: 'auto',
          }}>
            {MODES.map((m) => (
              <button key={m.id} onClick={() => setMode(m.id)} style={{
                width: 38, height: 32, borderRadius: 'var(--r-pill)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: mode === m.id ? (m.id === 'delete' ? 'var(--bad)' : m.id === 'split' ? 'var(--warn)' : 'var(--accent)') : 'transparent',
                color: mode === m.id ? '#fff' : 'var(--ink-muted)',
              }} title={m.label}>
                <Icon name={m.icon} size={14} />
              </button>
            ))}
          </div>
        </div>

        {/* Map controls — right stack */}
        <div style={{
          position: 'absolute', top: 60, right: 10, zIndex: 4,
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <ControlCluster>
            <ControlBtn onClick={api.zoomIn} title="Zoom in"><Icon name="zoom-in" size={15} /></ControlBtn>
            <ControlDivider />
            <ControlBtn onClick={api.zoomOut} title="Zoom out"><Icon name="zoom-out" size={15} /></ControlBtn>
          </ControlCluster>
          <ControlCluster>
            <ControlBtn onClick={api.locate} title="My location"><Icon name="locate" size={15} /></ControlBtn>
            <ControlDivider />
            <ControlBtn onClick={api.fit} title="Fit route"><Icon name="fit" size={15} /></ControlBtn>
          </ControlCluster>
          <ControlCluster>
            <ControlBtn onClick={() => setLayersOpen((v) => !v)} active={layersOpen} title="Base layer">
              <Icon name="layers" size={15} />
            </ControlBtn>
          </ControlCluster>
        </div>

        {/* Base-layer flyout */}
        {layersOpen && (
          <div style={{
            position: 'absolute', top: 60, right: 60, zIndex: 5,
            background: 'var(--surface-1)', border: '1px solid var(--line)',
            borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-2)',
            padding: 8, width: 180,
          }}>
            <div className="eyebrow" style={{ padding: '4px 6px 8px' }}>Base map</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {Object.entries(BASE_LAYERS).map(([id, def]) => (
                <button key={id} onClick={() => { setBaseLayerId(id); setLayersOpen(false); }} style={{
                  display: 'flex', flexDirection: 'column', gap: 4, padding: 5,
                  background: 'var(--surface-2)',
                  border: '1.5px solid',
                  borderColor: baseLayerId === id ? 'var(--accent)' : 'var(--line)',
                  borderRadius: 'var(--r-sm)',
                }}>
                  <span style={{ height: 36, borderRadius: 'var(--r-xs)', background: basePreview(id), backgroundSize: 'cover' }} />
                  <span style={{ fontSize: 10, fontWeight: 500 }}>{def.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Mode hint pill — bottom-center above sheet */}
        <div style={{
          position: 'absolute', bottom: sheetHeight + 8, left: '50%', transform: 'translateX(-50%)',
          zIndex: 4,
          background: 'var(--ink)', color: 'var(--surface-1)',
          padding: '6px 12px', borderRadius: 'var(--r-pill)',
          fontSize: 11, fontWeight: 500,
          display: 'flex', alignItems: 'center', gap: 6,
          pointerEvents: 'none',
          opacity: 0.85,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: 3, background:
            mode === 'delete' ? 'var(--bad)' : mode === 'split' ? 'var(--warn)' : 'var(--accent)' }} />
          {MODES.find((m) => m.id === mode).hint}
        </div>
      </div>

      {/* Bottom sheet */}
      <MobileBottomSheet
        sheet={sheet} setSheet={setSheet} height={sheetHeight}
        waypoints={waypoints} setWaypoints={setWaypoints}
        activity={activity} setActivity={setActivity}
        totalKm={totalKm} etaMin={etaMin} kcal={kcal} eStats={eStats}
        samples={samples} hoverDist={hoverDist} setHoverDist={setHoverDist}
        showDistMarkers={showDistMarkers} setShowDistMarkers={setShowDistMarkers}
        reverse={() => setWaypoints((w) => [...w].reverse())}
        clear={() => setWaypoints([])}
        canUndo={canUndo} canRedo={canRedo} redo={redo}
      />
    </div>
  );
}

const mobileIconBtnStyle = {
  width: 36, height: 36, borderRadius: 'var(--r-sm)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: 'var(--ink-muted)',
  background: 'transparent',
};

function MobileSearchBar({ onSearch, onClose }) {
  const [q, setQ] = useState('');
  const [state, setState] = useState(null);
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);
  const submit = async (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    setState('searching');
    const r = await onSearch(q);
    setState(r);
    setTimeout(() => setState(null), 2000);
  };
  return (
    <form onSubmit={submit} style={{
      flex: '0 0 auto',
      padding: '8px 10px', background: 'var(--surface-1)',
      borderBottom: '1px solid var(--line)',
      display: 'flex', alignItems: 'center', gap: 8, zIndex: 8, position: 'relative',
    }}>
      <Icon name="search" size={14} />
      <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)}
        placeholder="Search place or lat,lng…"
        style={{
          flex: 1, background: 'transparent', border: 0,
          fontSize: 13, color: 'var(--ink)', padding: '6px 0',
        }} />
      {state && (
        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color:
          state === 'searching' ? 'var(--ink-muted)' :
          state === 'fail' || state === 'no_results' ? 'var(--bad)' : 'var(--ok)' }}>
          {state === 'searching' ? '…' : state === 'ok' ? 'found' : state === 'coords' ? 'coords' : state === 'no_results' ? 'no match' : 'failed'}
        </span>
      )}
      <button type="button" onClick={onClose} style={{
        ...mobileIconBtnStyle, width: 28, height: 28, color: 'var(--ink-faint)',
      }}>×</button>
    </form>
  );
}

function MobileBottomSheet({
  sheet, setSheet, height,
  waypoints, setWaypoints, activity, setActivity,
  totalKm, etaMin, kcal, eStats,
  samples, hoverDist, setHoverDist,
  showDistMarkers, setShowDistMarkers,
  reverse, clear,
}) {
  const cycle = () => setSheet((s) => s === 'peek' ? 'mid' : s === 'mid' ? 'full' : 'peek');
  return (
    <div style={{
      flex: '0 0 auto', height,
      background: 'var(--surface-1)',
      borderTop: '1px solid var(--line)',
      borderTopLeftRadius: 'var(--r-lg)',
      borderTopRightRadius: 'var(--r-lg)',
      boxShadow: '0 -8px 24px rgba(14,19,32,0.08)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      transition: 'height .25s var(--ease)',
      zIndex: 6, position: 'relative',
    }}>
      {/* Handle */}
      <button onClick={cycle} style={{
        padding: '8px 0 4px',
        display: 'flex', justifyContent: 'center', flex: '0 0 auto',
      }}>
        <span style={{ width: 38, height: 4, background: 'var(--surface-3)', borderRadius: 2 }} />
      </button>

      {/* Peek row — always visible */}
      <div style={{
        padding: '4px 16px 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flex: '0 0 auto',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 500, lineHeight: 1, letterSpacing: '-0.02em' }}>
              {totalKm.toFixed(2)}
            </span>
            <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>km</span>
            <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)' }}>
              +{Math.round(eStats.gain)} m
            </span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 3, fontFamily: 'var(--font-mono)' }}>
            {fmtDuration(etaMin)} · {kcal} kcal · {waypoints.length} {waypoints.length === 1 ? 'pin' : 'pins'}
          </div>
        </div>
        <button style={{
          padding: '10px 16px', borderRadius: 'var(--r-pill)',
          background: 'var(--ink)', color: 'var(--surface-1)',
          fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <Icon name="save" size={13} /> Save
        </button>
      </div>

      {/* Expanded content */}
      {sheet !== 'peek' && (
        <div className="scroll" style={{ flex: 1, overflow: 'auto', padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Activity chips */}
          <div style={{ display: 'flex', gap: 6 }}>
            {ACTIVITIES.map((a) => (
              <button key={a.id} onClick={() => setActivity(a.id)} style={{
                flex: 1, padding: '8px 4px',
                borderRadius: 'var(--r-sm)',
                border: '1px solid',
                borderColor: activity === a.id ? a.color : 'var(--line)',
                background: activity === a.id ? 'var(--surface-1)' : 'var(--surface-2)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              }}>
                <span style={{
                  width: 14, height: 14, borderRadius: 7, background: a.color,
                  opacity: activity === a.id ? 1 : 0.4,
                }} />
                <span style={{ fontSize: 10, fontWeight: 500, color: activity === a.id ? 'var(--ink)' : 'var(--ink-muted)' }}>{a.label}</span>
              </button>
            ))}
          </div>

          {/* Quick actions */}
          <div style={{ display: 'flex', gap: 6 }}>
            <SheetAction icon="reverse" label="Reverse" onClick={reverse} />
            <SheetAction icon="clear" label="Clear" onClick={clear} />
            <SheetAction icon="share" label="Share" />
            <SheetAction icon="save" label="GPX" />
          </div>

          {/* Mini elevation */}
          {samples.length > 1 && (
            <div>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Elevation</div>
              <MiniElevation samples={samples} eStats={eStats} hoverDist={hoverDist} setHoverDist={setHoverDist} />
            </div>
          )}

          {sheet === 'full' && (
            <>
              <div>
                <div className="eyebrow" style={{ marginBottom: 8 }}>Waypoints · {waypoints.length}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {waypoints.map((p, i) => {
                    const isFirst = i === 0;
                    const isLast = i === waypoints.length - 1 && waypoints.length > 1;
                    const segKm = i === 0 ? 0 : haversineKm(waypoints[i - 1], p);
                    return (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 8px', borderRadius: 'var(--r-sm)',
                        background: 'var(--surface-2)',
                      }}>
                        <span style={{
                          width: 22, height: 22, borderRadius: 6,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: isFirst ? '#4f8ef7' : isLast ? 'var(--ink)' : 'var(--surface-1)',
                          color: isFirst || isLast ? '#fff' : 'var(--ink-muted)',
                          fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
                          border: !isFirst && !isLast ? '1px solid var(--line)' : 'none',
                          flexShrink: 0,
                        }}>
                          {isFirst ? 'S' : isLast ? 'F' : i + 1}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 500 }}>
                            {isFirst ? 'Start' : isLast ? 'Finish' : `Waypoint ${i + 1}`}
                          </div>
                          <div className="mono" style={{ fontSize: 10, color: 'var(--ink-faint)' }}>
                            {p[0].toFixed(4)}, {p[1].toFixed(4)}
                          </div>
                        </div>
                        {i > 0 && (
                          <span className="mono" style={{ fontSize: 10, color: 'var(--ink-muted)' }}>
                            +{segKm.toFixed(2)} km
                          </span>
                        )}
                        <button onClick={() => setWaypoints(waypoints.filter((_, j) => j !== i))} style={{
                          width: 22, height: 22, borderRadius: 'var(--r-xs)',
                          color: 'var(--ink-faint)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Icon name="trash" size={11} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="eyebrow" style={{ marginBottom: 8 }}>Surface</div>
                <SurfaceBar activity={activity} />
              </div>

              <label style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', background: 'var(--surface-2)',
                border: '1px solid var(--line)', borderRadius: 'var(--r-sm)',
              }}>
                <input type="checkbox" checked={showDistMarkers} onChange={(e) => setShowDistMarkers(e.target.checked)} style={{ accentColor: 'var(--accent)' }} />
                <span style={{ flex: 1, fontSize: 12 }}>Show km markers on route</span>
              </label>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SheetAction({ icon, label, onClick }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: '8px 4px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
      background: 'var(--surface-2)', border: '1px solid var(--line)',
      borderRadius: 'var(--r-sm)', color: 'var(--ink-muted)',
    }}>
      <Icon name={icon} size={14} />
      <span style={{ fontSize: 10, fontWeight: 500 }}>{label}</span>
    </button>
  );
}

function MiniElevation({ samples, eStats, hoverDist, setHoverDist }) {
  const w = 358, h = 80, pad = { l: 32, r: 8, t: 6, b: 16 };
  const wrapRef = useRef(null);
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const total = samples[samples.length - 1].d;
  const eRange = Math.max(20, eStats.maxE - eStats.minE);
  const xOf = (d) => pad.l + (d / Math.max(1e-6, total)) * innerW;
  const yOf = (e) => pad.t + (1 - (e - eStats.minE) / eRange) * innerH;
  const area = useMemo(() => {
    let d = `M ${xOf(samples[0].d)} ${yOf(samples[0].ele)}`;
    for (let i = 1; i < samples.length; i++) d += ` L ${xOf(samples[i].d)} ${yOf(samples[i].ele)}`;
    d += ` L ${xOf(total)} ${pad.t + innerH} L ${pad.l} ${pad.t + innerH} Z`;
    return d;
  }, [samples]);
  const line = useMemo(() => {
    let d = `M ${xOf(samples[0].d)} ${yOf(samples[0].ele)}`;
    for (let i = 1; i < samples.length; i++) d += ` L ${xOf(samples[i].d)} ${yOf(samples[i].ele)}`;
    return d;
  }, [samples]);
  const hover = useMemo(() => {
    if (hoverDist == null) return null;
    let best = samples[0], bestD = Math.abs(samples[0].d - hoverDist);
    for (const s of samples) { const d = Math.abs(s.d - hoverDist); if (d < bestD) { bestD = d; best = s; } }
    return best;
  }, [hoverDist, samples]);
  const onMove = (e) => {
    const r = wrapRef.current.getBoundingClientRect();
    const px = (e.clientX - r.left) - pad.l;
    if (px < 0 || px > innerW) { setHoverDist(null); return; }
    setHoverDist((px / innerW) * total);
  };
  return (
    <div ref={wrapRef} onMouseMove={onMove} onTouchMove={(e) => onMove(e.touches[0])} onMouseLeave={() => setHoverDist(null)}
      style={{ width: '100%', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 'var(--r-sm)', padding: 4 }}>
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block' }}>
        <defs>
          <linearGradient id="elev-fill-m" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4f8ef7" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#4f8ef7" stopOpacity="0.04" />
          </linearGradient>
        </defs>
        <text x={pad.l - 4} y={yOf(eStats.maxE) + 3} textAnchor="end" fontFamily="var(--font-mono)" fontSize="9" fill="var(--ink-faint)">{Math.round(eStats.maxE)}</text>
        <text x={pad.l - 4} y={yOf(eStats.minE) + 3} textAnchor="end" fontFamily="var(--font-mono)" fontSize="9" fill="var(--ink-faint)">{Math.round(eStats.minE)}</text>
        <path d={area} fill="url(#elev-fill-m)" />
        <path d={line} fill="none" stroke="#4f8ef7" strokeWidth="1.4" strokeLinejoin="round" />
        {hover && (
          <g>
            <line x1={xOf(hover.d)} x2={xOf(hover.d)} y1={pad.t} y2={pad.t + innerH} stroke="var(--ink)" strokeDasharray="2 2" opacity="0.55" />
            <circle cx={xOf(hover.d)} cy={yOf(hover.ele)} r="3" fill="#4f8ef7" stroke="var(--surface-1)" strokeWidth="1.5" />
          </g>
        )}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)', padding: '0 6px 2px' }}>
        <span>0 km</span>
        {hover && <span style={{ color: 'var(--ink)' }}>{hover.d.toFixed(2)} km · {Math.round(hover.ele)} m</span>}
        <span>{total.toFixed(2)} km</span>
      </div>
    </div>
  );
}

// Phone status bar — purely decorative
function PhoneStatusBar() {
  return (
    <div className="status-bar">
      <span>9:41</span>
      <div className="status-icons">
        <svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor"><path d="M1 8h2v2H1zM5 5h2v5H5zM9 2h2v8H9zM13 0h2v10h-2z"/></svg>
        <svg width="14" height="11" viewBox="0 0 14 11" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M7 4a4 4 0 0 1 3 1.4" /><path d="M7 1a7 7 0 0 1 6 3" /><circle cx="7" cy="9" r="1" fill="currentColor" /></svg>
        <svg width="24" height="11" viewBox="0 0 24 11" fill="none" stroke="currentColor" strokeWidth="1"><rect x="0.5" y="1" width="20" height="9" rx="2" /><rect x="2" y="2.5" width="14" height="6" rx="1" fill="currentColor" /><path d="M22 4v3" strokeLinecap="round" /></svg>
      </div>
    </div>
  );
}

// ── Tweaks panel ────────────────────────────────────────────────────────
function RouteTweaksPanel({ tweaks, setTweak }) {
  return (
    <TweaksPanel>
      <TweakSection label="Viewport" />
      <TweakRadio
        label="Layout"
        value={tweaks.viewport || 'desktop'}
        options={['desktop', 'mobile']}
        onChange={(v) => setTweak('viewport', v)}
      />
      <TweakSection label="Theme" />
      <TweakRadio
        label="Color theme"
        value={tweaks.theme || 'light'}
        options={['light', 'dark']}
        onChange={(v) => setTweak('theme', v)}
      />
      <TweakSection label="Defaults" />
      <TweakSelect
        label="Activity"
        value={tweaks.defaultActivity || 'run'}
        options={ACTIVITIES.map((a) => a.id)}
        onChange={(v) => setTweak('defaultActivity', v)}
      />
      <TweakSelect
        label="Base map"
        value={tweaks.baseLayer || 'plain'}
        options={Object.keys(BASE_LAYERS)}
        onChange={(v) => setTweak('baseLayer', v)}
      />
      <TweakToggle
        label="Distance markers"
        value={!!tweaks.showDistMarkers}
        onChange={(v) => setTweak('showDistMarkers', v)}
      />
    </TweaksPanel>
  );
}

// ── Top bar ─────────────────────────────────────────────────────────────
function TopBar({ mode, setMode, undo, redo, canUndo, canRedo, reverse, clear, onSearch }) {
  const [q, setQ] = useState('');
  const [searchState, setSearchState] = useState(null); // 'searching' | 'ok' | 'fail' | 'no_results' | 'coords'
  const submit = async (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    setSearchState('searching');
    const r = await onSearch(q);
    setSearchState(r);
    setTimeout(() => setSearchState(null), 2400);
  };
  return (
    <header style={{
      flex: '0 0 56px', height: 56,
      background: 'var(--surface-1)', borderBottom: '1px solid var(--line)',
      display: 'flex', alignItems: 'center', padding: '0 12px', gap: 10,
      zIndex: 10, position: 'relative',
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingRight: 8 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: 'linear-gradient(135deg, #4f8ef7 0%, #6fbf73 100%)',
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14,
        }}>R</div>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Ridgeline</span>
          <span style={{ fontSize: 10, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)' }}>route mapper</span>
        </div>
      </div>

      <span style={{ width: 1, height: 28, background: 'var(--line)' }} />

      {/* Modes */}
      <div style={{ display: 'flex', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 'var(--r-sm)', padding: 3, gap: 2 }}>
        {MODES.map((m) => (
          <button key={m.id} onClick={() => setMode(m.id)} title={`${m.label} (${m.kbd})`}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px',
              borderRadius: 'var(--r-xs)',
              background: mode === m.id ? 'var(--surface-1)' : 'transparent',
              color: mode === m.id ? 'var(--ink)' : 'var(--ink-muted)',
              boxShadow: mode === m.id ? 'var(--shadow-1)' : 'none',
              fontSize: 12, fontWeight: 500,
            }}>
            <Icon name={m.icon} size={14} />
            <span>{m.label}</span>
            <span className="mono" style={{ fontSize: 9, padding: '1px 4px', borderRadius: 3, background: mode === m.id ? 'var(--surface-2)' : 'transparent', color: 'var(--ink-faint)' }}>{m.kbd}</span>
          </button>
        ))}
      </div>

      {/* Undo / redo / reverse / clear */}
      <div style={{ display: 'flex', gap: 2 }}>
        <IconBtn onClick={undo} disabled={!canUndo} title="Undo (⌘Z)"><Icon name="undo" /></IconBtn>
        <IconBtn onClick={redo} disabled={!canRedo} title="Redo (⌘⇧Z)"><Icon name="redo" /></IconBtn>
        <IconBtn onClick={reverse} title="Reverse direction"><Icon name="reverse" /></IconBtn>
        <IconBtn onClick={clear} title="Clear route"><Icon name="clear" /></IconBtn>
      </div>

      <span style={{ width: 1, height: 28, background: 'var(--line)' }} />

      {/* Search */}
      <form onSubmit={submit} style={{
        flex: 1, maxWidth: 460,
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '0 12px', height: 32,
        background: 'var(--surface-2)', border: '1px solid var(--line)',
        borderRadius: 'var(--r-sm)',
      }}>
        <Icon name="search" size={14} />
        <input value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Search a place, address, or lat,lng…"
          style={{
            flex: 1, background: 'transparent', border: 0,
            fontSize: 13, color: 'var(--ink)',
          }} />
        {searchState && (
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color:
            searchState === 'searching' ? 'var(--ink-muted)' :
            searchState === 'fail' || searchState === 'no_results' ? 'var(--bad)' :
            'var(--ok)' }}>
            {searchState === 'searching' ? '…' :
             searchState === 'ok' ? 'found' :
             searchState === 'coords' ? 'coords' :
             searchState === 'no_results' ? 'no match' : 'failed'}
          </span>
        )}
        <span className="mono" style={{
          fontSize: 10, color: 'var(--ink-faint)',
          padding: '1px 5px', border: '1px solid var(--line)', borderRadius: 3,
        }}>⏎</span>
      </form>

      <div style={{ flex: 1 }} />

      {/* CTA */}
      <button style={{
        padding: '8px 14px', borderRadius: 'var(--r-sm)',
        background: 'var(--ink)', color: 'var(--surface-1)',
        fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <Icon name="save" size={14} /> Save route
      </button>
    </header>
  );
}

function IconBtn({ children, onClick, disabled, title, active }) {
  return (
    <button onClick={onClick} disabled={disabled} title={title} style={{
      width: 32, height: 32, borderRadius: 'var(--r-sm)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: disabled ? 'var(--ink-faint)' : active ? 'var(--accent)' : 'var(--ink-muted)',
      background: active ? 'var(--accent-soft)' : 'transparent',
      opacity: disabled ? 0.5 : 1,
      cursor: disabled ? 'not-allowed' : 'pointer',
    }}
    onMouseEnter={(e) => { if (!disabled && !active) e.currentTarget.style.background = 'var(--surface-2)'; }}
    onMouseLeave={(e) => { if (!disabled && !active) e.currentTarget.style.background = 'transparent'; }}>
      {children}
    </button>
  );
}

// ── Sidebar ─────────────────────────────────────────────────────────────
function Sidebar({
  open, setOpen, width, setWidth,
  waypoints, setWaypoints, selectedIdx, setSelectedIdx,
  activity, setActivity, totalKm, eStats, etaMin, kcal,
  globalPace, setGlobalPace, segmentPaces, setSegmentPaces, segmentDurations,
}) {
  const [resizing, setResizing] = useState(false);
  const MIN = 280, MAX = 560;
  const w = open ? width : 56;

  const startResize = (e) => {
    e.preventDefault();
    setResizing(true);
    const startX = e.clientX;
    const startW = width;
    const onMove = (ev) => {
      const next = Math.max(MIN, Math.min(MAX, startW + (ev.clientX - startX)));
      setWidth(next);
    };
    const onUp = () => {
      setResizing(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };
  const dblReset = () => setWidth(340);

  return (
    <aside style={{
      flex: `0 0 ${w}px`, width: w,
      background: 'var(--surface-1)',
      borderRight: '1px solid var(--line)',
      display: 'flex', flexDirection: 'column',
      transition: resizing ? 'none' : 'flex .25s var(--ease), width .25s var(--ease)',
      zIndex: 5, position: 'relative', overflow: 'hidden',
    }}>
      {open ? (
        <ExpandedSidebar
          setOpen={setOpen}
          waypoints={waypoints} setWaypoints={setWaypoints}
          selectedIdx={selectedIdx} setSelectedIdx={setSelectedIdx}
          activity={activity} setActivity={setActivity}
          totalKm={totalKm} eStats={eStats} etaMin={etaMin} kcal={kcal}
          globalPace={globalPace} setGlobalPace={setGlobalPace}
          segmentPaces={segmentPaces} setSegmentPaces={setSegmentPaces}
          segmentDurations={segmentDurations}
        />
      ) : (
        <CollapsedRail setOpen={setOpen} />
      )}

      {/* Resize handle — only visible when expanded */}
      {open && (
        <div
          onMouseDown={startResize}
          onDoubleClick={dblReset}
          title="Drag to resize · double-click to reset"
          style={{
            position: 'absolute', top: 0, right: -3, bottom: 0, width: 7,
            cursor: 'col-resize', zIndex: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onMouseEnter={(e) => { e.currentTarget.firstChild.style.opacity = 1; }}
          onMouseLeave={(e) => { if (!resizing) e.currentTarget.firstChild.style.opacity = 0; }}
        >
          <span style={{
            width: 3, height: 36, borderRadius: 2,
            background: resizing ? 'var(--accent)' : 'var(--line-strong)',
            opacity: resizing ? 1 : 0,
            transition: 'opacity .15s var(--ease)',
          }} />
        </div>
      )}
    </aside>
  );
}

function CollapsedRail({ setOpen }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0', gap: 6 }}>
      <button onClick={() => setOpen(true)} title="Open planner" style={railBtn(true)}>
        <Icon name="expand" />
      </button>
      <span style={{ width: 24, height: 1, background: 'var(--line)', margin: '4px 0' }} />
      {[
        { icon: 'route',  label: 'Plan' },
        { icon: 'pin',    label: 'Waypoints' },
        { icon: 'gauge',  label: 'Elevation' },
        { icon: 'ruler',  label: 'Breakdown' },
        { icon: 'save',   label: 'Saved' },
      ].map((it) => (
        <button key={it.icon} onClick={() => setOpen(true)} title={it.label} style={railBtn(false)}>
          <Icon name={it.icon} />
        </button>
      ))}
    </div>
  );
}
function railBtn(active) {
  return {
    width: 36, height: 36, borderRadius: 'var(--r-sm)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: active ? 'var(--accent)' : 'var(--ink-muted)',
    background: active ? 'var(--accent-soft)' : 'transparent',
  };
}

function ExpandedSidebar({
  setOpen, waypoints, setWaypoints, selectedIdx, setSelectedIdx,
  activity, setActivity, totalKm, eStats, etaMin, kcal,
  globalPace, setGlobalPace, segmentPaces, setSegmentPaces, segmentDurations,
}) {
  return (
    <div className="scroll" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px 12px',
        borderBottom: '1px solid var(--line)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, background: 'var(--surface-1)', zIndex: 2,
      }}>
        <div>
          <div className="eyebrow">Planner</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, marginTop: 2 }}>New route</div>
        </div>
        <button onClick={() => setOpen(false)} title="Collapse" style={{
          width: 28, height: 28, borderRadius: 'var(--r-sm)',
          color: 'var(--ink-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-2)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
          <Icon name="collapse" />
        </button>
      </div>

      {/* Activity */}
      <Block title="Activity">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          {ACTIVITIES.map((a) => (
            <button key={a.id} onClick={() => setActivity(a.id)} style={{
              padding: '10px 4px',
              borderRadius: 'var(--r-sm)',
              border: '1px solid',
              borderColor: activity === a.id ? a.color : 'var(--line)',
              background: activity === a.id ? 'var(--surface-1)' : 'var(--surface-2)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            }}>
              <span style={{
                width: 18, height: 18, borderRadius: 9,
                background: a.color, opacity: activity === a.id ? 1 : 0.45,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 9, fontWeight: 700,
              }}>{a.label[0]}</span>
              <span style={{ fontSize: 11, fontWeight: 500, color: activity === a.id ? 'var(--ink)' : 'var(--ink-muted)' }}>{a.label}</span>
            </button>
          ))}
        </div>
      </Block>

      {/* Big summary */}
      <Block title="Summary" pad>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1 }}>
            {totalKm.toFixed(2)}
          </span>
          <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>km</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginTop: 12 }}>
          <Stat label="Time"  value={fmtDuration(etaMin)} />
          <Stat label="Gain"  value={`+${Math.round(eStats.gain)}`} unit="m" />
          <Stat label="Energy" value={kcal} unit="kcal" />
        </div>
      </Block>

      {/* Pace — global slider + per-segment overrides */}
      <Block title="Pace" pad>
        <PaceControl
          activity={activity}
          waypoints={waypoints}
          globalPace={globalPace} setGlobalPace={setGlobalPace}
          segmentPaces={segmentPaces} setSegmentPaces={setSegmentPaces}
          segmentDurations={segmentDurations}
          etaMin={etaMin}
        />
      </Block>

      {/* Waypoints */}
      <Block title={`Waypoints · ${waypoints.length}`} pad>
        {waypoints.length === 0 ? (
          <EmptyHint>Switch to <b>Add</b> and click the map to drop your first pin.</EmptyHint>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {waypoints.map((p, i) => {
              const isFirst = i === 0;
              const isLast = i === waypoints.length - 1 && waypoints.length > 1;
              const segKm = i === 0 ? 0 : haversineKm(waypoints[i - 1], p);
              const selected = selectedIdx === i;
              return (
                <div key={i} onClick={() => setSelectedIdx(i)} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 8px',
                  borderRadius: 'var(--r-sm)',
                  background: selected ? 'var(--accent-soft)' : 'transparent',
                  border: '1px solid',
                  borderColor: selected ? 'var(--accent)' : 'transparent',
                  cursor: 'pointer',
                }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: 6,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isFirst ? '#4f8ef7' : isLast ? 'var(--ink)' : 'var(--surface-2)',
                    color: isFirst || isLast ? '#fff' : 'var(--ink-muted)',
                    fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
                    border: !isFirst && !isLast ? '1px solid var(--line)' : 'none',
                    flexShrink: 0,
                  }}>
                    {isFirst ? 'S' : isLast ? 'F' : i + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>
                      {isFirst ? 'Start' : isLast ? 'Finish' : `Waypoint ${i + 1}`}
                    </div>
                    <div className="mono" style={{ fontSize: 10, color: 'var(--ink-faint)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p[0].toFixed(5)}, {p[1].toFixed(5)}
                    </div>
                  </div>
                  {i > 0 && (
                    <span className="mono" style={{ fontSize: 11, color: 'var(--ink-muted)', flexShrink: 0 }}>
                      +{segKm.toFixed(2)} km
                    </span>
                  )}
                  <button onClick={(e) => {
                    e.stopPropagation();
                    setWaypoints(waypoints.filter((_, j) => j !== i));
                    setSelectedIdx(null);
                  }} style={{
                    width: 22, height: 22, borderRadius: 'var(--r-xs)',
                    color: 'var(--ink-faint)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--bad)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--ink-faint)'; }}>
                    <Icon name="trash" size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Block>

      {/* Surface breakdown (synthetic but plausible by activity) */}
      <Block title="Surface mix" pad>
        <SurfaceBar activity={activity} />
      </Block>

      {/* Saved routes */}
      <Block title="Saved" pad>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {SAVED_ROUTES.map((r) => {
            const a = ACTIVITIES.find((x) => x.id === r.activity);
            return (
              <button key={r.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px',
                background: 'var(--surface-2)', border: '1px solid var(--line)',
                borderRadius: 'var(--r-sm)',
                textAlign: 'left',
              }}>
                <span style={{ width: 8, height: 8, borderRadius: 4, background: a.color }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink)' }}>{r.name}</div>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--ink-faint)' }}>{r.km.toFixed(1)} km · +{r.gain} m · {r.when}</div>
                </div>
                <Icon name="expand" size={12} />
              </button>
            );
          })}
        </div>
      </Block>

      {/* Tips */}
      <div style={{ padding: '12px 16px 18px', color: 'var(--ink-muted)', fontSize: 11, lineHeight: 1.55 }}>
        <span className="eyebrow" style={{ display: 'block', marginBottom: 6 }}>Tips</span>
        Drag a waypoint in <b>Select</b> to reshape. <b>Split</b> inserts on the nearest segment. Right-click any pin to remove.
      </div>
    </div>
  );
}

function Block({ title, children, pad }) {
  return (
    <div style={{ padding: pad ? '12px 16px 14px' : '8px 16px 12px', borderBottom: '1px solid var(--line)' }}>
      <div className="eyebrow" style={{ marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
}
function Stat({ label, value, unit }) {
  return (
    <div style={{
      padding: '8px 8px', background: 'var(--surface-2)', border: '1px solid var(--line)',
      borderRadius: 'var(--r-sm)', display: 'flex', flexDirection: 'column', gap: 2,
    }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 500 }}>
        {value}{unit && <span style={{ fontSize: 10, color: 'var(--ink-muted)', marginLeft: 2 }}>{unit}</span>}
      </div>
      <div style={{ fontSize: 10, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
    </div>
  );
}
function EmptyHint({ children }) {
  return (
    <div style={{
      padding: 12, fontSize: 12, color: 'var(--ink-muted)',
      background: 'var(--surface-2)', border: '1px dashed var(--line-strong)',
      borderRadius: 'var(--r-sm)', lineHeight: 1.5,
    }}>
      {children}
    </div>
  );
}
function SurfaceBar({ activity }) {
  const mixes = {
    run:   [['Asphalt', 0.52, '#3a3a3a'], ['Path', 0.36, '#6fbf73'], ['Trail', 0.12, '#a78d63']],
    cycle: [['Asphalt', 0.84, '#3a3a3a'], ['Gravel', 0.12, '#a78d63'], ['Path', 0.04, '#6fbf73']],
    hike:  [['Trail', 0.64, '#a78d63'], ['Path', 0.22, '#6fbf73'], ['Asphalt', 0.14, '#3a3a3a']],
    walk:  [['Path', 0.6, '#6fbf73'], ['Asphalt', 0.34, '#3a3a3a'], ['Trail', 0.06, '#a78d63']],
  };
  const mix = mixes[activity];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', height: 10, borderRadius: 'var(--r-pill)', overflow: 'hidden' }}>
        {mix.map(([n, p, c]) => (
          <div key={n} style={{ flex: p, background: c }} title={`${n} · ${Math.round(p * 100)}%`} />
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 11, color: 'var(--ink-muted)' }}>
        {mix.map(([n, p, c]) => (
          <span key={n} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
            <span>{n}</span>
            <span className="mono" style={{ color: 'var(--ink-faint)' }}>{Math.round(p * 100)}%</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Pace control (whole-route or per-segment) ───────────────────────────
function fmtPace(p) {
  if (!isFinite(p) || p <= 0) return '–:––';
  const min = Math.floor(p);
  const sec = Math.round((p - min) * 60);
  if (sec === 60) return `${min + 1}:00`;
  return `${min}:${String(sec).padStart(2, '0')}`;
}
function paceUnit(activity) {
  if (activity === 'cycle') return 'km/h';
  return 'min/km';
}
// Internal model is min/km. For cycling, slider is in km/h; convert.
function paceToSliderValue(pace, activity) {
  return activity === 'cycle' ? 60 / pace : pace;
}
function sliderValueToPace(v, activity) {
  return activity === 'cycle' ? 60 / Math.max(1, v) : v;
}
function paceRange(activity) {
  // returns [min, max, step] in slider units
  if (activity === 'cycle') return [10, 45, 0.5];          // km/h
  if (activity === 'hike')  return [9, 30, 1 / 60];        // min/km
  if (activity === 'walk')  return [8, 22, 1 / 60];        // min/km
  return [3, 9, 1 / 60];                                   // run min/km
}

function PaceControl({
  activity, waypoints,
  globalPace, setGlobalPace,
  segmentPaces, setSegmentPaces, segmentDurations,
  etaMin,
}) {
  const [perSegment, setPerSegment] = useState(false);
  const [min, max, step] = paceRange(activity);
  const unit = paceUnit(activity);
  const overrideCount = Object.keys(segmentPaces).length;

  const setOne = (i, value) => {
    setSegmentPaces((prev) => ({ ...prev, [i]: value }));
  };
  const clearOne = (i) => {
    setSegmentPaces((prev) => {
      const next = { ...prev };
      delete next[i];
      return next;
    });
  };
  const clearAll = () => setSegmentPaces({});

  const presetPaces = activity === 'cycle'
    ? [['Easy', 18], ['Steady', 24], ['Tempo', 30], ['Fast', 36]]   // km/h
    : activity === 'hike'
      ? [['Stroll', 15], ['Steady', 13], ['Brisk', 11], ['Trail run', 8]]
      : activity === 'walk'
        ? [['Stroll', 14], ['Brisk', 11], ['Power', 9.5], ['Jog', 7.5]]
        : [['Easy', 6], ['Steady', 5.4], ['Tempo', 4.4], ['Race', 3.8]];   // min/km

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header — current value + summary */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
            {perSegment ? 'Base pace (applies to non-custom)' : 'Whole route'}
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em' }}>
              {activity === 'cycle' ? (60 / globalPace).toFixed(1) : fmtPace(globalPace)}
            </span>
            <span style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{unit}</span>
          </div>
        </div>
        <div className="mono" style={{ fontSize: 11, color: 'var(--ink-muted)', textAlign: 'right' }}>
          {fmtDuration(etaMin)}<br />
          <span style={{ fontSize: 10, color: 'var(--ink-faint)' }}>est. time</span>
        </div>
      </div>

      {/* Slider */}
      <input
        type="range"
        min={min} max={max} step={step}
        value={paceToSliderValue(globalPace, activity)}
        onChange={(e) => setGlobalPace(sliderValueToPace(Number(e.target.value), activity))}
        style={{ width: '100%', accentColor: 'var(--accent)' }}
      />

      {/* Preset chips */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {presetPaces.map(([label, val]) => {
          const valAsMinKm = sliderValueToPace(val, activity);
          const active = Math.abs(valAsMinKm - globalPace) < 1e-3;
          return (
            <button key={label} onClick={() => setGlobalPace(valAsMinKm)} style={{
              padding: '4px 10px', borderRadius: 'var(--r-pill)',
              border: '1px solid', borderColor: active ? 'var(--accent)' : 'var(--line)',
              background: active ? 'var(--accent-soft)' : 'var(--surface-2)',
              fontSize: 11, fontWeight: 500,
              color: active ? 'var(--ink)' : 'var(--ink-muted)',
              fontFamily: 'var(--font-mono)',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ fontFamily: 'var(--font-ui)' }}>{label}</span>
              <span style={{ color: 'var(--ink-faint)' }}>
                {activity === 'cycle' ? `${val}` : fmtPace(val)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Per-segment toggle */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 10px', background: 'var(--surface-2)',
        border: '1px solid var(--line)', borderRadius: 'var(--r-sm)',
      }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flex: 1 }}>
          <input type="checkbox" checked={perSegment} onChange={(e) => setPerSegment(e.target.checked)} style={{ accentColor: 'var(--accent)' }} />
          <span style={{ fontSize: 12, fontWeight: 500 }}>Per-segment pace</span>
          {overrideCount > 0 && (
            <span className="mono" style={{
              fontSize: 10, padding: '1px 6px', borderRadius: 'var(--r-pill)',
              background: 'var(--accent-soft)', color: 'var(--accent)',
            }}>
              {overrideCount} custom
            </span>
          )}
        </label>
        {overrideCount > 0 && (
          <button onClick={clearAll} style={{
            fontSize: 11, color: 'var(--ink-muted)', padding: '2px 8px',
            borderRadius: 'var(--r-xs)',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-1)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
            Reset all
          </button>
        )}
      </div>

      {/* Segment list */}
      {perSegment && (
        segmentDurations.length === 0 ? (
          <EmptyHint>Add at least two waypoints to create segments.</EmptyHint>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {segmentDurations.map((seg, i) => (
              <PaceSegmentRow
                key={i}
                idx={i} total={segmentDurations.length}
                km={seg.km} pace={seg.pace} min={seg.min}
                overridden={seg.overridden}
                activity={activity}
                onChange={(v) => setOne(i, v)}
                onReset={() => clearOne(i)}
              />
            ))}
          </div>
        )
      )}
    </div>
  );
}

function PaceSegmentRow({ idx, total, km, pace, min, overridden, activity, onChange, onReset }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const unit = paceUnit(activity);
  const displayValue = activity === 'cycle' ? (60 / pace).toFixed(1) : fmtPace(pace);

  const beginEdit = () => {
    setDraft(displayValue);
    setEditing(true);
  };
  const commit = () => {
    setEditing(false);
    const raw = draft.trim();
    if (!raw) return;
    let newPaceMinKm;
    if (activity === 'cycle') {
      const v = parseFloat(raw);
      if (!isFinite(v) || v <= 0) return;
      newPaceMinKm = 60 / v;
    } else if (raw.includes(':')) {
      const [m, s] = raw.split(':');
      const mm = parseInt(m, 10);
      const ss = parseInt(s, 10) || 0;
      if (!isFinite(mm)) return;
      newPaceMinKm = mm + ss / 60;
    } else {
      const v = parseFloat(raw);
      if (!isFinite(v) || v <= 0) return;
      newPaceMinKm = v;
    }
    onChange(Math.max(1.5, Math.min(30, newPaceMinKm)));
  };
  const onKey = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); commit(); }
    if (e.key === 'Escape') { setEditing(false); }
  };

  // step button: faster (less time) or slower (more time)
  const bumpFaster = () => onChange(Math.max(1.5, pace - 5 / 60));   // -5 sec/km, or +5 km/h
  const bumpSlower = () => onChange(Math.min(30, pace + 5 / 60));

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '6px 6px 6px 8px',
      borderRadius: 'var(--r-sm)',
      background: overridden ? 'var(--accent-soft)' : 'var(--surface-2)',
      border: '1px solid',
      borderColor: overridden ? 'var(--accent)' : 'var(--line)',
    }}>
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
        color: 'var(--ink-muted)',
        minWidth: 30,
      }}>
        {idx + 1}→{idx + 2}
      </span>
      <span className="mono" style={{ fontSize: 11, color: 'var(--ink-muted)', minWidth: 52 }}>
        {km.toFixed(2)} km
      </span>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2 }}>
        <button onClick={bumpFaster} title="Faster" style={paceStepBtn}>−</button>
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={onKey}
            style={{
              width: 56, textAlign: 'center',
              background: 'var(--surface-1)',
              border: '1px solid var(--accent)',
              borderRadius: 'var(--r-xs)',
              padding: '3px 4px',
              fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600,
              color: 'var(--ink)',
            }}
          />
        ) : (
          <button onClick={beginEdit} title="Edit pace" style={{
            minWidth: 56, padding: '3px 6px',
            fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600,
            color: overridden ? 'var(--accent)' : 'var(--ink)',
            background: 'var(--surface-1)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--r-xs)',
          }}>
            {displayValue}
          </button>
        )}
        <button onClick={bumpSlower} title="Slower" style={paceStepBtn}>+</button>
        <span style={{ fontSize: 9, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)', width: 36, textAlign: 'right' }}>
          {unit === 'km/h' ? 'km/h' : 'min/km'}
        </span>
      </div>

      <span className="mono" style={{ fontSize: 10, color: 'var(--ink-muted)', minWidth: 42, textAlign: 'right' }}>
        {fmtDuration(min)}
      </span>

      {overridden && (
        <button onClick={onReset} title="Reset to base" style={{
          width: 18, height: 18, borderRadius: 'var(--r-xs)',
          color: 'var(--ink-faint)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-1)'; e.currentTarget.style.color = 'var(--ink)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--ink-faint)'; }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 5v5h5"/></svg>
        </button>
      )}
    </div>
  );
}

const paceStepBtn = {
  width: 22, height: 22, borderRadius: 'var(--r-xs)',
  fontSize: 14, fontWeight: 600,
  color: 'var(--ink-muted)',
  background: 'transparent',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  lineHeight: 1,
};


// ── Map controls cluster (floating, top-right area) ─────────────────────
function MapControls({ api, baseLayerId, setBaseLayerId, layersOpen, setLayersOpen, showDistMarkers, setShowDistMarkers }) {
  return (
    <>
      {/* Zoom + locate + fit (top-right) */}
      <div style={{
        position: 'absolute', top: 14, right: 14, zIndex: 4,
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        <ControlCluster>
          <ControlBtn onClick={api.zoomIn} title="Zoom in"><Icon name="zoom-in" /></ControlBtn>
          <ControlDivider />
          <ControlBtn onClick={api.zoomOut} title="Zoom out"><Icon name="zoom-out" /></ControlBtn>
        </ControlCluster>

        <ControlCluster>
          <ControlBtn onClick={api.fit} title="Fit route"><Icon name="fit" /></ControlBtn>
          <ControlDivider />
          <ControlBtn onClick={api.locate} title="My location"><Icon name="locate" /></ControlBtn>
        </ControlCluster>

        <ControlCluster>
          <ControlBtn onClick={() => setLayersOpen((v) => !v)} active={layersOpen} title="Base layer"><Icon name="layers" /></ControlBtn>
        </ControlCluster>

        <ControlCluster>
          <ControlBtn onClick={() => setShowDistMarkers((v) => !v)} active={showDistMarkers} title="Distance markers">
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700 }}>KM</span>
          </ControlBtn>
        </ControlCluster>
      </div>

      {/* Base-layer flyout */}
      {layersOpen && (
        <div style={{
          position: 'absolute', top: 14, right: 70, zIndex: 5,
          background: 'var(--surface-1)', border: '1px solid var(--line)',
          borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-2)',
          padding: 8, width: 220,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 6px 8px' }}>
            <span className="eyebrow">Base map</span>
            <button onClick={() => setLayersOpen(false)} style={{ color: 'var(--ink-faint)', fontSize: 14 }}>×</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {Object.entries(BASE_LAYERS).map(([id, def]) => (
              <button key={id} onClick={() => setBaseLayerId(id)} style={{
                display: 'flex', flexDirection: 'column', gap: 6, padding: 6,
                background: 'var(--surface-2)',
                border: '1.5px solid',
                borderColor: baseLayerId === id ? 'var(--accent)' : 'var(--line)',
                borderRadius: 'var(--r-sm)',
                textAlign: 'left',
              }}>
                <span style={{ height: 48, borderRadius: 'var(--r-xs)', background: basePreview(id), backgroundSize: 'cover' }} />
                <span style={{ fontSize: 11, fontWeight: 500 }}>{def.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
function basePreview(id) {
  if (id === 'plain') return 'linear-gradient(135deg, #f2efe6 0%, #ddebd2 50%, #c9def0 100%)';
  if (id === 'dark')  return 'linear-gradient(135deg, #0a0e1a 0%, #1f3550 50%, #232c4f 100%)';
  if (id === 'topo')  return 'linear-gradient(135deg, #efe7d2 0%, #b89a6b 60%, #6e5a3c 100%)';
  if (id === 'sat')   return 'linear-gradient(135deg, #1c2a18 0%, #3a5a2a 50%, #1f3550 100%)';
  return 'var(--surface-2)';
}
function ControlCluster({ children }) {
  return (
    <div style={{
      background: 'var(--surface-1)',
      border: '1px solid var(--line)',
      borderRadius: 'var(--r-sm)',
      boxShadow: 'var(--shadow-2)',
      overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>
      {children}
    </div>
  );
}
function ControlBtn({ children, onClick, title, active }) {
  return (
    <button onClick={onClick} title={title} style={{
      width: 38, height: 38,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: active ? 'var(--accent)' : 'var(--ink-muted)',
      background: active ? 'var(--accent-soft)' : 'transparent',
    }}
    onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--surface-2)'; }}
    onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
      {children}
    </button>
  );
}
function ControlDivider() { return <span style={{ height: 1, background: 'var(--line)' }} />; }

function ModeBadge({ mode }) {
  const def = MODES.find((m) => m.id === mode);
  return (
    <div style={{
      position: 'absolute', top: 14, left: 14, zIndex: 4,
      background: 'var(--surface-1)', border: '1px solid var(--line)',
      boxShadow: 'var(--shadow-2)', borderRadius: 'var(--r-pill)',
      padding: '6px 12px 6px 8px',
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <span style={{
        width: 22, height: 22, borderRadius: '50%',
        background: mode === 'delete' ? 'var(--bad)' : mode === 'split' ? 'var(--warn)' : 'var(--accent)',
        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name={def.icon} size={12} />
      </span>
      <span style={{ fontSize: 12, fontWeight: 600 }}>{def.label}</span>
      <span style={{ fontSize: 11, color: 'var(--ink-muted)' }}>· {def.hint}</span>
    </div>
  );
}

// ── Elevation strip (bottom collapsible) ────────────────────────────────
function ElevationStrip({ samples, eStats, totalKm, hoverDist, setHoverDist, open, setOpen }) {
  const wrapRef = useRef(null);
  const [w, setW] = useState(800);
  const h = open ? 132 : 0;
  const pad = { l: 44, r: 12, t: 8, b: 18 };

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setW(e.contentRect.width);
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  const innerW = Math.max(80, w - pad.l - pad.r);
  const innerH = h - pad.t - pad.b;
  const total = samples.length ? samples[samples.length - 1].d : 0;
  const minE = eStats.minE, maxE = eStats.maxE;
  const eRange = Math.max(20, maxE - minE);
  const xOf = (d) => pad.l + (d / Math.max(1e-6, total)) * innerW;
  const yOf = (e) => pad.t + (1 - (e - minE) / eRange) * innerH;

  const areaPath = useMemo(() => {
    if (!samples.length || !open) return '';
    let d = `M ${xOf(samples[0].d)} ${yOf(samples[0].ele)}`;
    for (let i = 1; i < samples.length; i++) d += ` L ${xOf(samples[i].d)} ${yOf(samples[i].ele)}`;
    d += ` L ${xOf(samples[samples.length - 1].d)} ${pad.t + innerH}`;
    d += ` L ${xOf(samples[0].d)} ${pad.t + innerH} Z`;
    return d;
  }, [samples, w, open]);
  const linePath = useMemo(() => {
    if (!samples.length || !open) return '';
    let d = `M ${xOf(samples[0].d)} ${yOf(samples[0].ele)}`;
    for (let i = 1; i < samples.length; i++) d += ` L ${xOf(samples[i].d)} ${yOf(samples[i].ele)}`;
    return d;
  }, [samples, w, open]);

  const xTicks = [];
  for (let km = 0; km <= total; km += Math.max(1, Math.ceil(total / 12))) xTicks.push(km);
  const eTicks = [];
  const eStep = eRange > 200 ? 50 : eRange > 100 ? 25 : 10;
  const eStart = Math.ceil(minE / eStep) * eStep;
  for (let e = eStart; e <= maxE; e += eStep) eTicks.push(e);

  const hover = useMemo(() => {
    if (hoverDist == null || !samples.length) return null;
    let best = samples[0], bestD = Math.abs(samples[0].d - hoverDist);
    for (const s of samples) {
      const d = Math.abs(s.d - hoverDist);
      if (d < bestD) { bestD = d; best = s; }
    }
    return best;
  }, [hoverDist, samples]);

  const onMove = (e) => {
    if (!open) return;
    const r = wrapRef.current.getBoundingClientRect();
    const px = (e.clientX - r.left) - pad.l;
    if (px < 0 || px > innerW) { setHoverDist(null); return; }
    setHoverDist((px / innerW) * total);
  };

  return (
    <div style={{
      flex: '0 0 auto',
      background: 'var(--surface-1)',
      borderTop: '1px solid var(--line)',
      boxShadow: '0 -2px 12px rgba(14,19,32,0.04)',
      zIndex: 3, position: 'relative',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 16px', gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
          <button onClick={() => setOpen(!open)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            color: 'var(--ink-muted)', fontSize: 11, letterSpacing: '0.12em',
            textTransform: 'uppercase', fontWeight: 500,
          }}>
            <Icon name={open ? 'chev-down' : 'chev-up'} size={12} />
            Elevation
          </button>
          {samples.length > 0 && (
            <span className="mono" style={{ fontSize: 11, color: 'var(--ink-muted)' }}>
              +{Math.round(eStats.gain)} m gain · −{Math.round(eStats.loss)} m loss · {Math.round(minE)}–{Math.round(maxE)} m
            </span>
          )}
        </div>
        {hover && (
          <div className="mono" style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--ink-muted)' }}>
            <span>{hover.d.toFixed(2)} km</span>
            <span style={{ color: 'var(--ink)' }}>{Math.round(hover.ele)} m</span>
          </div>
        )}
        <span className="mono" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
          {totalKm.toFixed(2)} km total
        </span>
      </div>

      {/* Chart */}
      <div ref={wrapRef} onMouseMove={onMove} onMouseLeave={() => setHoverDist(null)}
        style={{ height: h, overflow: 'hidden', transition: 'height .2s var(--ease)', cursor: open ? 'crosshair' : 'default' }}>
        {open && samples.length > 1 && (
          <svg width={w} height={h} style={{ display: 'block' }}>
            <defs>
              <linearGradient id="elev-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4f8ef7" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#4f8ef7" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            {/* y-grid */}
            {eTicks.map((e) => (
              <g key={e}>
                <line x1={pad.l} x2={pad.l + innerW} y1={yOf(e)} y2={yOf(e)} stroke="var(--line)" strokeWidth="1" />
                <text x={pad.l - 6} y={yOf(e) + 3} textAnchor="end" fontFamily="var(--font-mono)" fontSize="10" fill="var(--ink-faint)">{e}</text>
              </g>
            ))}
            {/* x-ticks */}
            {xTicks.map((km) => (
              <g key={km}>
                <line x1={xOf(km)} x2={xOf(km)} y1={pad.t + innerH} y2={pad.t + innerH + 4} stroke="var(--line-strong)" strokeWidth="1" />
                <text x={xOf(km)} y={pad.t + innerH + 14} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10" fill="var(--ink-faint)">{km}</text>
              </g>
            ))}
            <path d={areaPath} fill="url(#elev-fill)" />
            <path d={linePath} fill="none" stroke="#4f8ef7" strokeWidth="1.6" strokeLinejoin="round" />
            {hover && (
              <g>
                <line x1={xOf(hover.d)} x2={xOf(hover.d)} y1={pad.t} y2={pad.t + innerH} stroke="var(--ink)" strokeWidth="1" strokeDasharray="3 3" opacity="0.55" />
                <circle cx={xOf(hover.d)} cy={yOf(hover.ele)} r="4" fill="#4f8ef7" stroke="var(--surface-1)" strokeWidth="2" />
              </g>
            )}
          </svg>
        )}
        {open && samples.length < 2 && (
          <div style={{
            height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--ink-faint)', fontSize: 12,
          }}>
            Add at least two waypoints to see elevation
          </div>
        )}
      </div>
    </div>
  );
}

// ── helpers ─────────────────────────────────────────────────────────────
function fmtDuration(min) {
  if (!isFinite(min) || min <= 0) return '0:00';
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}` : `${m} min`;
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
