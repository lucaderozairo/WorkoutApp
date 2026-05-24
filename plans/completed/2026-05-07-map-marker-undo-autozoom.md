> **Status (2026-05-23):** Substantially completed. Auto-zoom guard, right-click delete, long-press delete, and undo/redo refs all landed in `ui/components/workout/wizard/RouteMap.tsx`. Outstanding: surface an Undo button in StepCardio's UI (logic exists at the map level, just not wired to a visible control).

# Map Marker Delete, Undo Placement, Fix Auto-Zoom Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add right-click marker deletion and undo-last-placement to the route map, and fix auto-zoom from firing on every waypoint change.

**Architecture:** All three changes are self-contained edits to two existing files — `RouteMap.tsx` for map logic, `StepCardio.tsx` for the undo button UI. No new files, no new state, no new dependencies.

**Tech Stack:** React, TypeScript, Leaflet (via `leaflet` npm package)

---

## Files

- Modify: `ui/components/workout/wizard/RouteMap.tsx` — fixes auto-zoom + adds right-click delete
- Modify: `ui/components/workout/wizard/StepCardio.tsx` — adds Undo button

---

### Task 1: Fix auto-zoom (`RouteMap.tsx`)

**Problem:** The sync `useEffect` always calls `fitBounds`/`setView` on every waypoint change. While placing markers, the map keeps re-panning and re-zooming, making it hard to click the next point.

**Fix:** Only auto-zoom when transitioning from 0 waypoints to ≥1 (first point placed, or a saved route loaded). Track previous count with a ref.

**Files:**
- Modify: `ui/components/workout/wizard/RouteMap.tsx:71-74` (ref block), lines `135-140` (zoom block)

- [ ] **Step 1: Add `prevCountRef` alongside the other refs (around line 74)**

```typescript
const containerRef = useRef<HTMLDivElement>(null);
const mapRef = useRef<L.Map | null>(null);
const markersRef = useRef<L.CircleMarker[]>([]);
const polylineRef = useRef<L.Polyline | null>(null);
const prevCountRef = useRef(0);
```

- [ ] **Step 2: Replace the unconditional zoom block (lines 135–140) with a guarded version**

```typescript
// BEFORE:
// Fit map to waypoints immediately (no debounce needed)
if (waypoints.length >= 2) {
  map.fitBounds(L.latLngBounds(waypoints), { padding: [24, 24] });
} else {
  map.setView(waypoints[0], DEFAULT_ZOOM);
}

// AFTER:
const prevCount = prevCountRef.current;
prevCountRef.current = waypoints.length;
if (prevCount === 0 && waypoints.length > 0) {
  if (waypoints.length >= 2) {
    map.fitBounds(L.latLngBounds(waypoints), { padding: [24, 24] });
  } else {
    map.setView(waypoints[0], DEFAULT_ZOOM);
  }
}
```

- [ ] **Step 3: Verify manually**
  - Open the wizard, start a run/cycle plan, go to the route step
  - Place first marker — map should zoom/center on it
  - Place 2nd, 3rd, 4th markers — map should NOT re-zoom; you should stay at your current view
  - Click "Clear route", then place first marker again — map should zoom again

---

### Task 2: Right-click to delete a marker (`RouteMap.tsx`)

**Problem:** No way to remove an individual waypoint; only "Clear route" exists.

**Fix:** Attach a `contextmenu` listener to each `L.circleMarker`. Right-clicking removes that waypoint from the array and calls `onChange`.

**Files:**
- Modify: `ui/components/workout/wizard/RouteMap.tsx:120-133` (marker rendering loop)

- [ ] **Step 1: Add `contextmenu` handler inside the `waypoints.forEach` loop**

```typescript
// BEFORE:
waypoints.forEach((latlng, i) => {
  const isFirst = i === 0;
  const isLast = i === waypoints.length - 1 && waypoints.length > 1;
  const fillColor = isFirst ? '#22c55e' : isLast ? '#ef4444' : '#7eb8f7';
  const radius = isFirst || isLast ? 7 : 5;
  const m = L.circleMarker(latlng, {
    radius,
    fillColor,
    color: '#fff',
    weight: 2,
    fillOpacity: 1,
  }).addTo(map);
  markersRef.current.push(m);
});

// AFTER:
waypoints.forEach((latlng, i) => {
  const isFirst = i === 0;
  const isLast = i === waypoints.length - 1 && waypoints.length > 1;
  const fillColor = isFirst ? '#22c55e' : isLast ? '#ef4444' : '#7eb8f7';
  const radius = isFirst || isLast ? 7 : 5;
  const m = L.circleMarker(latlng, {
    radius,
    fillColor,
    color: '#fff',
    weight: 2,
    fillOpacity: 1,
  }).addTo(map);
  m.on('contextmenu', (e: L.LeafletMouseEvent) => {
    L.DomEvent.stopPropagation(e);
    onChange(waypoints.filter((_, j) => j !== i));
  });
  markersRef.current.push(m);
});
```

- [ ] **Step 2: Verify manually**
  - Place 4 markers
  - Right-click the 2nd marker — it should vanish and the route should redraw with 3 markers
  - Right-click the map canvas (not on a marker) — no waypoint should be removed
  - Right-click the only remaining marker — map resets to empty state

---

### Task 3: Add "Undo" button (`StepCardio.tsx`)

**Problem:** No way to undo the last-placed waypoint without clearing the whole route.

**Fix:** Add an "Undo" button that removes the last waypoint (`waypoints.slice(0, -1)`).

**Files:**
- Modify: `ui/components/workout/wizard/StepCardio.tsx:111-115` (button block)

- [ ] **Step 1: Replace the single-button block with a row containing both Undo and Clear route**

```typescript
// BEFORE:
{waypoints.length > 0 && (
  <button type="button" className="ghost sm" onClick={() => onWaypointsChange([])}>
    Clear route
  </button>
)}

// AFTER:
{waypoints.length > 0 && (
  <div className="row compact">
    <button type="button" className="ghost sm" onClick={() => onWaypointsChange(waypoints.slice(0, -1))}>
      Undo
    </button>
    <button type="button" className="ghost sm" onClick={() => onWaypointsChange([])}>
      Clear route
    </button>
  </div>
)}
```

- [ ] **Step 2: Verify manually**
  - Place 3 markers; "Undo" and "Clear route" buttons appear
  - Click "Undo" twice — last 2 markers removed one at a time
  - Click "Undo" on the final marker — both buttons disappear
  - Place a marker again — both buttons reappear
  - Click "Clear route" with multiple markers — all removed at once

---

## Verification Summary

| Feature | Test |
|---|---|
| Auto-zoom fix | First click zooms; subsequent clicks don't; re-clearing resets the zoom trigger |
| Delete marker | Right-click marker removes it; right-click canvas does nothing |
| Undo button | Removes last waypoint one at a time; disappears when no waypoints remain |
