# Planned Session UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve planned session UX with a LogScreenV2-style detail view, smarter wizard defaults, bug fixes, OSRM map routing, semantic media sizing, dead file cleanup, and centralised mock data.

**Architecture:** Ten isolated tasks across wizard, log screen, styling, and data layers. No new domain types. OSRM routing is a pure client-side addition. Mock data moves to `src/mocks/` to be shared across all screens.

**Tech Stack:** React, TypeScript, Leaflet, Recharts, OSRM public API (no key), CSS custom properties.

**Save plan to:** `docs/superpowers/plans/2026-05-07-planned-session-ux.md`

**Style rules (apply throughout):**
- Zero `style=""` / inline style objects — use CSS classes or combinations
- Spacing between siblings via `gap` on parent (`.column`, `.row`), not margins
- `.compact` on inner elements (`.column.compact`, `.row.compact`), never on `.surface` directly

---

## File Map

| File | Change |
|------|--------|
| `ui/layouts/LogScreenV2.tsx` | Fix cardio filter bug; replace 2-button header with Add Session dropdown; handle `selectedPlanId` |
| `ui/components/workout/UpcomingPlans.tsx` | Make items clickable via `onSelect` |
| `ui/components/workout/PlannedSessionDetail.tsx` | **New** — detail view styled like LogScreenV2 |
| `ui/components/workout/wizard/wizardUtils.ts` | **New** — `defaultSessionName(type, hour)` helper |
| `ui/components/workout/wizard/PlanWizard.tsx` | Auto-set name on type select; update `canAdvance`; add Save Draft button |
| `ui/components/workout/wizard/StepCardio.tsx` | Move targets above map; update placeholder |
| `ui/components/workout/wizard/StepSwim.tsx` | Update placeholder |
| `ui/components/workout/wizard/StepGym.tsx` | Update placeholder |
| `ui/components/workout/wizard/RouteMap.tsx` | Add OSRM snapping; expose `onRoutedDistanceChange` |
| `styling/tokens.css` | Add `--media-sm/md/lg` custom properties |
| `styling/components.css` | Add `.media-sm/md/lg` and `.action-menu` classes; update `.map` |
| `styling/wizard.css` | Update `.plan-map` to use `var(--media-md)` |
| `src/mocks/` | **New folder** — centralised mock data for events, weather, workouts, chats, posts |
| Various screens | Remove inline mock arrays; import from `src/mocks/` |

---

## Task 1: Fix cardio sessions hidden by exercise filter

**Files:**
- Modify: `ui/layouts/LogScreenV2.tsx:1701`

- [ ] **Step 1: Remove the `!exercise` guard from the cardio block**

In `LogScreenV2.tsx`, find:
```ts
if (type !== 'strength' && !exercise) {
```
Change to:
```ts
if (type !== 'strength') {
```

- [ ] **Step 2: Verify manually**

Start dev server. Open the log screen, activate an exercise filter. Confirm cardio sessions still appear. Confirm strength sessions still filter correctly.

- [ ] **Step 3: Commit**
```bash
git add ui/layouts/LogScreenV2.tsx
git commit -m "fix: show cardio sessions even when exercise filter is active"
```

---

## Task 2: Replace 2-button header with "Add Session" dropdown

**Files:**
- Modify: `ui/layouts/LogScreenV2.tsx:1759-1774`
- Modify: `styling/components.css`

The dropdown needs a positioned container with a `.action-menu` class — no inline styles.

- [ ] **Step 1: Add `.action-menu` CSS class to `styling/components.css`**

Append (find a logical grouping near modals or buttons):
```css
/* Inline action dropdown — positioned below its trigger */
.action-menu-wrap { position: relative; }
.action-menu {
  position: absolute;
  top: calc(100% + var(--s-1));
  left: 0;
  z-index: 200;
  min-width: 180px;
}
```

- [ ] **Step 2: Add dropdown state in `LogScreenV2.tsx`**

Near the `showPlan` declaration, add:
```ts
const [showAddMenu, setShowAddMenu] = useState(false);
```

- [ ] **Step 3: Replace the button row (lines ~1758–1774)**

Replace:
```tsx
<div className="row">
  <button
    type="button"
    className="surface grow neutral "
    onClick={() => startSession({ type: 'StartSession', userId: USER_ID, name: 'Workout' })}
  >
    New Workout
  </button>
  <button
    type="button"
    className="secondary"
    onClick={() => setShowPlan(true)}
  >
    Plan
  </button>
</div>
```

With:
```tsx
<div className="action-menu-wrap">
  <button
    type="button"
    className="primary"
    onClick={() => setShowAddMenu(m => !m)}
  >
    + Add Session
  </button>
  {showAddMenu && (
    <>
      <div
        className="modal-overlay"
        onClick={() => setShowAddMenu(false)}
      />
      <div className="action-menu surface column compact">
        <button
          type="button"
          className="ghost"
          onClick={() => {
            setShowAddMenu(false);
            startSession({ type: 'StartSession', userId: USER_ID, name: 'Workout' });
          }}
        >
          ▶ Start now
        </button>
        <button
          type="button"
          className="ghost"
          onClick={() => {
            setShowAddMenu(false);
            setShowPlan(true);
          }}
        >
          📅 Schedule
        </button>
      </div>
    </>
  )}
</div>
```

Note: `.modal-overlay` already has `z-index` isolation — the menu sits above it via the stacking order of siblings. Check `modal-overlay` z-index in components.css and ensure `action-menu` z-index is higher.

- [ ] **Step 4: Verify manually**

Button appears; dropdown shows "Start now" + "Schedule"; clicking outside closes it; both actions work.

- [ ] **Step 5: Commit**
```bash
git add ui/layouts/LogScreenV2.tsx styling/components.css
git commit -m "feat: replace two-button header with Add Session dropdown"
```

---

## Task 3: Time-of-day name defaults + optional session names

**Files:**
- Create: `ui/components/workout/wizard/wizardUtils.ts`
- Modify: `ui/components/workout/wizard/PlanWizard.tsx`
- Modify: `ui/components/workout/wizard/StepCardio.tsx`
- Modify: `ui/components/workout/wizard/StepSwim.tsx`
- Modify: `ui/components/workout/wizard/StepGym.tsx`

- [ ] **Step 1: Create `wizardUtils.ts`**

```ts
// ui/components/workout/wizard/wizardUtils.ts
import type { PlanType } from '@features/planning';

const ACTIVITY_LABEL: Record<PlanType, string> = {
  gym: 'Workout',
  run: 'Run',
  cycle: 'Ride',
  swim: 'Swim',
};

export function defaultSessionName(type: PlanType, hour = new Date().getHours()): string {
  const period = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
  return `${period} ${ACTIVITY_LABEL[type]}`;
}
```

- [ ] **Step 2: Auto-set `sessionName` in PlanWizard when type is selected**

In `PlanWizard.tsx`:
```ts
import { defaultSessionName } from './wizardUtils';
```

In `renderStep()` case 0, update `onSelect`:
```ts
onSelect={type => {
  update({ type, sessionName: defaultSessionName(type) });
  setStep(1);
}}
```

- [ ] **Step 3: Remove sessionName requirement from `canAdvance`**

```ts
if (data.type === 'gym') return true;
if (data.type === 'run' || data.type === 'cycle') return data.paceSecPerKm > 0;
if (data.type === 'swim') return data.targetDistanceM > 0 && data.paceSecPer100m > 0;
```

- [ ] **Step 4: Update placeholders**

`StepCardio.tsx` line ~53: `placeholder={planType === 'run' ? 'e.g. Morning Run' : 'e.g. Morning Ride'}`

`StepSwim.tsx`: `placeholder="e.g. Morning Swim"`

`StepGym.tsx`: `placeholder="e.g. Morning Workout"`

- [ ] **Step 5: Verify**

Select Run at 9am → name pre-filled "Morning Run". Clear name → still advances. Save → plan name falls back to `defaultSessionName` via the existing `name: data.sessionName || data.type` in `handleSave`.

- [ ] **Step 6: Commit**
```bash
git add ui/components/workout/wizard/wizardUtils.ts ui/components/workout/wizard/PlanWizard.tsx ui/components/workout/wizard/StepCardio.tsx ui/components/workout/wizard/StepSwim.tsx ui/components/workout/wizard/StepGym.tsx
git commit -m "feat: time-of-day name defaults; session name optional in wizard"
```

---

## Task 4: Move targets above map in StepCardio

**Files:**
- Modify: `ui/components/workout/wizard/StepCardio.tsx`

New order: name → pace → tabs/map → markers. (No layout changes to other files.)

- [ ] **Step 1: Reorder the JSX `return` block**

Replace the entire `return (...)` with:
```tsx
return (
  <div className="column">
    <div className="column compact">
      <label className="caption">Session name</label>
      <input
        type="text"
        value={sessionName}
        onChange={e => onSessionNameChange(e.target.value)}
        placeholder={planType === 'run' ? 'e.g. Morning Run' : 'e.g. Morning Ride'}
      />
    </div>

    <div className="column compact">
      <label className="caption">Target pace (min/km)</label>
      <div className="row compact align-center">
        <input
          type="text"
          value={paceInput}
          onChange={e => setPaceInput(e.target.value)}
          onBlur={handlePaceBlur}
          placeholder="5:00"
          aria-label="Target pace"
        />
        <span className="caption muted">min/km</span>
        {estMinutes && (
          <span className="caption muted">· ~{estMinutes} min est.</span>
        )}
      </div>
    </div>

    <div className="tabs">
      <button
        type="button"
        className={`tab${routeTab === 'draw' ? ' active' : ''}`}
        onClick={() => setRouteTab('draw')}
      >
        🗺 Draw route
      </button>
      <button
        type="button"
        className={`tab${routeTab === 'saved' ? ' active' : ''}`}
        onClick={() => setRouteTab('saved')}
      >
        📂 Saved
      </button>
    </div>

    {routeTab === 'draw' ? (
      <div className="column compact">
        <RouteMap waypoints={waypoints} onChange={onWaypointsChange} />
        {waypoints.length > 0 && (
          <button type="button" className="ghost sm" onClick={() => onWaypointsChange([])}>
            Clear route
          </button>
        )}
        <span className="caption muted">
          {waypoints.length < 2
            ? 'Tap the map to place waypoints'
            : `Distance: ${distanceKm} km · ${waypoints.length} waypoints`}
        </span>
      </div>
    ) : (
      <div className="surface">
        <p className="caption muted">
          Select from recent {planType} sessions to reuse a route.
        </p>
        <p className="caption faint">(Route selection from history — coming soon)</p>
      </div>
    )}

    {markers.length > 0 && (
      <div className="column compact">
        <span className="caption">Distance markers</span>
        <div className="surface column compact">
          {markers.map(m => (
            <div key={m.distanceKm} className="row space-between">
              <span className="caption muted">{m.distanceKm} km</span>
              <span className="caption mono">{m.cumulativeTime}</span>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);
```

- [ ] **Step 2: Verify**

Run wizard → select Run → confirm pace input appears above the map.

- [ ] **Step 3: Commit**
```bash
git add ui/components/workout/wizard/StepCardio.tsx
git commit -m "feat: show pace target before map in cardio planning step"
```

---

## Task 5: Save draft mid-wizard

**Files:**
- Modify: `ui/components/workout/wizard/PlanWizard.tsx`

- [ ] **Step 1: Add `handleSaveDraft` alongside `handleSave`**

```ts
async function handleSaveDraft() {
  if (!data.type) return;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(7, 30, 0, 0);
  const scheduledAt = data.scheduledDate
    ? parseScheduledAt(data.scheduledDate, data.scheduledTime || '07:30')
    : tomorrow.getTime();

  const distanceKm = (data.type === 'run' || data.type === 'cycle')
    ? totalDistanceKm(data.waypoints)
    : data.type === 'swim'
      ? data.targetDistanceM / 1000
      : undefined;

  await planSession({
    type: 'PlanSession',
    userId: USER_ID,
    planType: data.type,
    name: data.sessionName || defaultSessionName(data.type),
    scheduledAt,
    notes: data.notes,
    exercises: data.type === 'gym' ? data.exercises : undefined,
    routeWaypoints: (data.type === 'run' || data.type === 'cycle') ? data.waypoints : undefined,
    distanceKm,
    paceSecPerKm: (data.type === 'run' || data.type === 'cycle') ? data.paceSecPerKm : undefined,
    distanceMarkers: undefined,
    poolLengthM: data.type === 'swim' ? data.poolLengthM : undefined,
    targetDistanceM: data.type === 'swim' ? data.targetDistanceM : undefined,
    paceSecPer100m: data.type === 'swim' ? data.paceSecPer100m : undefined,
  });
  onSaved();
}
```

- [ ] **Step 2: Add "Save draft" to wizard footer from step 1 onwards**

Read the existing `<footer>` JSX in `PlanWizard.tsx` and replace it with:
```tsx
<footer>
  <div className="row space-between align-center">
    <div>
      {step > 0 && (
        <button type="button" className="ghost" onClick={handleSaveDraft} disabled={saving}>
          Save draft
        </button>
      )}
    </div>
    <div className="row compact">
      {step > 0 && (
        <button type="button" className="secondary" onClick={() => setStep(s => s - 1)}>
          Back
        </button>
      )}
      {step < STEP_LABELS.length - 1 ? (
        <button
          type="button"
          className="primary"
          disabled={!canAdvance(step, data)}
          onClick={() => setStep(s => s + 1)}
        >
          Next
        </button>
      ) : (
        <button type="button" className="primary" disabled={saving} onClick={handleSave}>
          {saving ? 'Saving…' : 'Save plan'}
        </button>
      )}
    </div>
  </div>
</footer>
```

- [ ] **Step 3: Verify**

Wizard step 2 → click "Save draft" → wizard closes → plan appears in UpcomingPlans. Check the plan has a scheduledAt of tomorrow 07:30 if no schedule was entered.

- [ ] **Step 4: Commit**
```bash
git add ui/components/workout/wizard/PlanWizard.tsx
git commit -m "feat: save draft button in plan wizard available from step 1 onwards"
```

---

## Task 6: Semantic media container sizing

**Files:**
- Modify: `styling/tokens.css`
- Modify: `styling/components.css`
- Modify: `styling/wizard.css`

- [ ] **Step 1: Add `--media-*` tokens in `styling/tokens.css`**

Inside the `:root` block, append:
```css
/* Media container heights */
--media-sm: 160px;
--media-md: 240px;
--media-lg: 320px;
```

- [ ] **Step 2: Add semantic media classes and update `.map` in `styling/components.css`**

Find the `.map { height: 300px; }` rule. Replace it with:
```css
.media-sm { height: var(--media-sm); }
.media-md { height: var(--media-md); }
.media-lg { height: var(--media-lg); }

@media (min-width: 600px) {
  .media-sm { height: var(--media-md); }
  .media-md { height: var(--media-lg); }
}

.map { height: var(--media-lg); }
```

- [ ] **Step 3: Update `.plan-map` in `styling/wizard.css`**

Replace:
```css
.plan-map {
  width: 100%;
  height: 240px;
  border-radius: var(--r-md);
  overflow: hidden;
  border: 1px solid var(--line);
}

@media (min-width: 600px) {
  .plan-map {
    height: 320px;
  }
}
```

With:
```css
.plan-map {
  width: 100%;
  height: var(--media-md);
  border-radius: var(--r-md);
  overflow: hidden;
  border: 1px solid var(--line);
}

@media (min-width: 600px) {
  .plan-map {
    height: var(--media-lg);
  }
}
```

- [ ] **Step 4: Verify visually**

Map in wizard renders at 240px mobile / 320px tablet. Any `.map` element renders at 320px. No regressions on chart sizes.

- [ ] **Step 5: Commit**
```bash
git add styling/tokens.css styling/components.css styling/wizard.css
git commit -m "refactor: semantic media container heights via CSS custom properties"
```

---

## Task 7: OSRM path snapping in RouteMap

**Files:**
- Modify: `ui/components/workout/wizard/RouteMap.tsx`
- Modify: `ui/components/workout/wizard/StepCardio.tsx`
- Modify: `ui/components/workout/wizard/PlanWizard.tsx`

OSRM public API (no key):
```
GET https://router.project-osrm.org/route/v1/{profile}/{lng,lat;lng,lat}?geometries=geojson&overview=full
```
- `profile`: `foot` (run), `bike` (cycle)
- Coords: `lng,lat` order — opposite of our `[lat, lng]` tuples
- Response: `routes[0].geometry.coordinates = [lng, lat][]`, `routes[0].distance` = metres

- [ ] **Step 1: Update `RouteMapProps` interface**

```ts
interface RouteMapProps {
  waypoints: [number, number][];
  onChange: (waypoints: [number, number][]) => void;
  profile?: 'foot' | 'bike';
  onRoutedDistanceChange?: (km: number) => void;
}
```

- [ ] **Step 2: Add `fetchRoute` inside the component**

Add inside `RouteMap` function, before the refs:
```ts
export function RouteMap({ waypoints, onChange, profile = 'foot', onRoutedDistanceChange }: RouteMapProps) {
```

Add the fetch helper (declared inside the component to capture `profile`):
```ts
async function fetchRoute(anchors: [number, number][]): Promise<{ path: [number, number][]; km: number } | null> {
  if (anchors.length < 2) return null;
  const coords = anchors.map(([lat, lng]) => `${lng},${lat}`).join(';');
  try {
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/${profile}/${coords}?geometries=geojson&overview=full`,
    );
    if (!res.ok) return null;
    const json = await res.json();
    const route = json.routes?.[0];
    if (!route) return null;
    const path: [number, number][] = route.geometry.coordinates.map(
      ([lng, lat]: [number, number]) => [lat, lng] as [number, number],
    );
    return { path, km: route.distance / 1000 };
  } catch {
    return null;
  }
}
```

- [ ] **Step 3: Update the waypoints/polyline `useEffect` to use routed path**

Find the `useEffect` that clears and redraws markers and polyline. Replace the polyline drawing portion with:

```ts
useEffect(() => {
  const map = mapRef.current;
  if (!map) return;

  markersRef.current.forEach(m => m.remove());
  markersRef.current = [];
  polylineRef.current?.remove();
  polylineRef.current = null;

  if (waypoints.length === 0) {
    onRoutedDistanceChange?.(0);
    return;
  }

  waypoints.forEach((latlng, i) => {
    const isFirst = i === 0;
    const isLast = i === waypoints.length - 1 && waypoints.length > 1;
    const fillColor = isFirst ? '#22c55e' : isLast ? '#ef4444' : '#7eb8f7';
    const radius = isFirst || isLast ? 7 : 5;
    const m = L.circleMarker(latlng, { radius, fillColor, color: '#fff', weight: 2, fillOpacity: 1 }).addTo(map);
    markersRef.current.push(m);
  });

  fetchRoute(waypoints).then(result => {
    const pathToUse = result ? result.path : waypoints;
    const km = result ? result.km : totalDistanceKm(waypoints);
    onRoutedDistanceChange?.(km);
    polylineRef.current = L.polyline(pathToUse, {
      color: '#7eb8f7',
      weight: 3,
      dashArray: result ? undefined : '6 4',
    }).addTo(map);
  });

  if (waypoints.length >= 2) {
    map.fitBounds(L.latLngBounds(waypoints), { padding: [24, 24] });
  } else {
    map.setView(waypoints[0], DEFAULT_ZOOM);
  }
}, [waypoints, profile]);
```

- [ ] **Step 4: Add `routedKm` state in `StepCardio`; use it for distance**

```ts
const [routedKm, setRoutedKm] = useState(0);
const distanceKm = useMemo(
  () => (routedKm > 0 ? routedKm : totalDistanceKm(waypoints)),
  [routedKm, waypoints],
);
```

Pass profile and callback to `RouteMap`:
```tsx
<RouteMap
  waypoints={waypoints}
  onChange={onWaypointsChange}
  profile={planType === 'cycle' ? 'bike' : 'foot'}
  onRoutedDistanceChange={setRoutedKm}
/>
```

Update distance caption:
```tsx
`Distance: ${distanceKm} km · ${waypoints.length} waypoints · snapped to path`
```

- [ ] **Step 5: Propagate routed distance to `WizardData`**

In `PlanWizard.tsx`, add `routedKm: number` to `WizardData` and `routedKm: 0` to `EMPTY`.

Add `onRoutedKmChange` prop to `StepCardio` interface:
```ts
onRoutedKmChange?: (km: number) => void;
```

In StepCardio, update the handler so both state and prop are called:
```ts
function handleRoutedKm(km: number) {
  setRoutedKm(km);
  onRoutedKmChange?.(km);
}
```

Pass to RouteMap: `onRoutedDistanceChange={handleRoutedKm}`

In PlanWizard `renderStep()` for run/cycle:
```tsx
onRoutedKmChange={(km) => update({ routedKm: km })}
```

In `handleSave`, update distanceKm calculation:
```ts
const distanceKm = (data.type === 'run' || data.type === 'cycle')
  ? (data.routedKm > 0 ? data.routedKm : totalDistanceKm(data.waypoints))
  : data.type === 'swim'
    ? data.targetDistanceM / 1000
    : undefined;
```

- [ ] **Step 6: Verify**

Place 2–3 waypoints for a run → polyline follows roads (solid line). If offline, falls back to straight dashed lines. Distance uses OSRM metres. Cycle uses bike routing.

- [ ] **Step 7: Commit**
```bash
git add ui/components/workout/wizard/RouteMap.tsx ui/components/workout/wizard/StepCardio.tsx ui/components/workout/wizard/PlanWizard.tsx
git commit -m "feat: snap route waypoints to actual paths via OSRM"
```

---

## Task 8: PlannedSessionDetail view (LogScreenV2 style)

**Files:**
- Create: `ui/components/workout/PlannedSessionDetail.tsx`
- Modify: `ui/components/workout/UpcomingPlans.tsx`
- Modify: `ui/layouts/LogScreenV2.tsx`

- [ ] **Step 1: Create `PlannedSessionDetail.tsx`**

```tsx
// ui/components/workout/PlannedSessionDetail.tsx
import { useQuery } from '@ui/bindings';
import type { PlannedSession } from '@features/planning';
import type { Id } from '@shared/types';

interface PlannedSessionDetailProps {
  planId: Id<'PlannedSession'>;
  onClose: () => void;
  onStartNow: (plan: PlannedSession) => void;
}

function formatWhen(ts: number): string {
  return new Date(ts).toLocaleString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

function GymDetail({ plan }: { plan: PlannedSession }) {
  const exercises = plan.exercises ?? [];
  if (exercises.length === 0) return <p className="caption muted">No exercises planned.</p>;
  return (
    <div className="column compact">
      {exercises.map((ex, i) => (
        <div key={i} className="surface column compact">
          <span className="detail">{ex.name}</span>
          <div className="row compact align-center">
            <span className="caption muted">{ex.sets} sets</span>
            <span className="caption muted">×</span>
            <span className="caption muted">{ex.reps} reps</span>
            {ex.weightKg > 0 && (
              <>
                <span className="caption muted">@</span>
                <span className="caption muted">{ex.weightKg} kg</span>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function CardioDetail({ plan }: { plan: PlannedSession }) {
  const paceLabel = plan.paceSecPerKm
    ? `${Math.floor(plan.paceSecPerKm / 60)}:${String(plan.paceSecPerKm % 60).padStart(2, '0')} /km`
    : null;
  const estMin = plan.distanceKm && plan.paceSecPerKm
    ? Math.round((plan.distanceKm * plan.paceSecPerKm) / 60)
    : null;
  return (
    <div className="surface column compact">
      {plan.distanceKm && (
        <div className="row space-between">
          <span className="caption muted">Distance</span>
          <span className="detail">{plan.distanceKm} km</span>
        </div>
      )}
      {paceLabel && (
        <div className="row space-between">
          <span className="caption muted">Target pace</span>
          <span className="detail">{paceLabel}</span>
        </div>
      )}
      {estMin && (
        <div className="row space-between">
          <span className="caption muted">Est. duration</span>
          <span className="detail">{estMin} min</span>
        </div>
      )}
    </div>
  );
}

function SwimDetail({ plan }: { plan: PlannedSession }) {
  const paceLabel = plan.paceSecPer100m
    ? `${Math.floor(plan.paceSecPer100m / 60)}:${String(plan.paceSecPer100m % 60).padStart(2, '0')} /100m`
    : null;
  return (
    <div className="surface column compact">
      {plan.targetDistanceM && (
        <div className="row space-between">
          <span className="caption muted">Distance</span>
          <span className="detail">{plan.targetDistanceM} m</span>
        </div>
      )}
      {plan.poolLengthM && (
        <div className="row space-between">
          <span className="caption muted">Pool</span>
          <span className="detail">{plan.poolLengthM} m</span>
        </div>
      )}
      {paceLabel && (
        <div className="row space-between">
          <span className="caption muted">Target pace</span>
          <span className="detail">{paceLabel}</span>
        </div>
      )}
    </div>
  );
}

export function PlannedSessionDetail({ planId, onClose, onStartNow }: PlannedSessionDetailProps) {
  const all = (useQuery<PlannedSession[]>('planned_sessions') ?? []) as PlannedSession[];
  const plan = all.find(p => p.id === planId);

  if (!plan) return null;

  return (
    <div className="surface column">
      <div className="row space-between align-center">
        <div className="column compact">
          <span className="detail">{plan.name}</span>
          <span className="caption muted">{formatWhen(plan.scheduledAt)}</span>
        </div>
        <button type="button" className="ghost" onClick={onClose}>✕</button>
      </div>

      {plan.type === 'gym' && <GymDetail plan={plan} />}
      {(plan.type === 'run' || plan.type === 'cycle') && <CardioDetail plan={plan} />}
      {plan.type === 'swim' && <SwimDetail plan={plan} />}

      {plan.notes ? (
        <div className="surface card--flat">
          <p className="caption muted">{plan.notes}</p>
        </div>
      ) : null}

      <button type="button" className="primary" onClick={() => onStartNow(plan)}>
        ▶ Start now
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Update `UpcomingPlans.tsx`**

Add `Id` import and `onSelect` prop. Make items render as interactive buttons:

```tsx
import { useQuery } from '@ui/bindings';
import type { PlannedSession } from '@features/planning';
import type { Id } from '@shared/types';

const TYPE_EMOJI: Record<string, string> = {
  gym: '🏋️', run: '🏃', cycle: '🚴', swim: '🏊',
};

function formatWhen(scheduledAt: number): string {
  return new Date(scheduledAt).toLocaleString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

interface UpcomingPlansProps {
  onSelect?: (id: Id<'PlannedSession'>) => void;
}

export function UpcomingPlans({ onSelect }: UpcomingPlansProps) {
  const all = (useQuery<PlannedSession[]>('planned_sessions') ?? []) as PlannedSession[];
  const upcoming = all
    .filter(p => p.scheduledAt > Date.now())
    .slice(0, 5);

  if (upcoming.length === 0) return null;

  return (
    <div className="surface column compact">
      <span className="eyebrow">Upcoming</span>
      <div className="column compact">
        {upcoming.map(plan => (
          <button
            key={plan.id}
            type="button"
            className="row align-center interactive"
            onClick={() => onSelect?.(plan.id)}
          >
            <span aria-hidden>{TYPE_EMOJI[plan.type] ?? '📋'}</span>
            <div className="column compact grow">
              <span className="detail">{plan.name}</span>
              <span className="caption muted">{formatWhen(plan.scheduledAt)}</span>
            </div>
            <span className="caption muted">›</span>
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Wire `selectedPlanId` in `LogScreenV2.tsx`**

```ts
import { PlannedSessionDetail } from '@ui/components/workout/PlannedSessionDetail';
// ...
const [selectedPlanId, setSelectedPlanId] = useState<Id<'PlannedSession'> | null>(null);
```

In the `!hasSession && !isEditing` branch, replace `<UpcomingPlans />` with:
```tsx
<UpcomingPlans onSelect={id => setSelectedPlanId(id)} />
{selectedPlanId && (
  <PlannedSessionDetail
    planId={selectedPlanId}
    onClose={() => setSelectedPlanId(null)}
    onStartNow={plan => {
      setSelectedPlanId(null);
      startSession({ type: 'StartSession', userId: USER_ID, name: plan.name });
    }}
  />
)}
```

- [ ] **Step 4: Verify**

Add a gym plan with exercises. Tap it → detail view shows exercise block cards. Tap a run plan → shows distance/pace. "Start now" starts session. "✕" closes.

- [ ] **Step 5: Commit**
```bash
git add ui/components/workout/PlannedSessionDetail.tsx ui/components/workout/UpcomingPlans.tsx ui/layouts/LogScreenV2.tsx
git commit -m "feat: planned session detail view styled like LogScreenV2"
```

---

## Task 9: Remove dead TSX files

**Files:**
- Various `ui/` files not referenced in any import or route

Dead files accumulate outside `legacy/` when screens are renamed or replaced. This task finds and removes them.

- [ ] **Step 1: Identify all TSX files outside `legacy/`**

```bash
# List every .tsx file outside of any legacy folder
find ui -name "*.tsx" ! -path "*/legacy/*" | sort
```

- [ ] **Step 2: Check each file for any importer**

For each file `ui/path/to/File.tsx`, run:
```bash
grep -r "from.*path/to/File" ui src features --include="*.ts" --include="*.tsx" -l
grep -r "from.*path/to/File" ui src features --include="*.ts" --include="*.tsx" -l
```

Alternatively, run a single sweep:
```bash
# For each tsx file, print it and the count of files that import it
for f in $(find ui -name "*.tsx" ! -path "*/legacy/*"); do
  name=$(basename "$f" .tsx)
  count=$(grep -r "from.*$name" ui src features --include="*.ts" --include="*.tsx" -l 2>/dev/null | wc -l)
  echo "$count $f"
done | sort -n
```

Files with count `0` are candidates for removal.

- [ ] **Step 3: Verify each zero-import file is truly unused**

Before deleting, also check:
- Is it a route component registered in the router (e.g., `App.tsx` or router config)?
- Is it imported via a barrel `index.ts`?

```bash
grep -r "LogScreen\b" ui src --include="*.ts" --include="*.tsx" -l
```

Repeat for each candidate name.

- [ ] **Step 4: Delete confirmed dead files**

```bash
rm ui/path/to/DeadComponent.tsx
# repeat for each confirmed dead file
```

- [ ] **Step 5: Verify build passes**

```bash
npx tsc --noEmit
```

Expected: no errors (or only pre-existing errors unrelated to deleted files).

- [ ] **Step 6: Commit**
```bash
git add -A
git commit -m "chore: remove dead TSX files outside legacy folder"
```

---

## Task 10: Centralise mock data

**Files:**
- Create: `src/mocks/` folder with separate files per domain
- Modify: any screen or component that declares inline mock arrays

Mock data for events, weather, workouts, chats, and posts should live in one place so all screens share the same fixtures. This prevents inconsistency (e.g. "Run on Saturday" showing in feed but not in schedule).

- [ ] **Step 1: Find all inline mock data in screens**

```bash
grep -r "const mock\|const MOCK\|const fake\|const sample\|// mock\|// TODO.*mock" ui --include="*.tsx" -l
grep -r "\[\s*{.*id:.*name:" ui --include="*.tsx" -rn | head -40
```

Note every file and the shape of its mock data.

- [ ] **Step 2: Create `src/mocks/` with typed files**

For each domain found, create a file. Example shapes (fill in actual data from what was found in step 1):

**`src/mocks/workouts.ts`**
```ts
import type { TrainingSession } from '@features/training_log';
export const MOCK_SESSIONS: TrainingSession[] = [ /* ... */ ];
```

**`src/mocks/events.ts`**
```ts
export interface MockEvent { id: string; title: string; date: string; /* ... */ }
export const MOCK_EVENTS: MockEvent[] = [ /* ... */ ];
```

**`src/mocks/weather.ts`**
```ts
export interface MockWeather { temp: number; condition: string; /* ... */ }
export const MOCK_WEATHER: MockWeather = { /* ... */ };
```

**`src/mocks/chats.ts`**
```ts
export interface MockMessage { id: string; author: string; text: string; ts: number; }
export const MOCK_MESSAGES: MockMessage[] = [ /* ... */ ];
```

**`src/mocks/posts.ts`**
```ts
export interface MockPost { id: string; author: string; content: string; ts: number; }
export const MOCK_POSTS: MockPost[] = [ /* ... */ ];
```

Each file should export the actual fixture data found in step 1, not empty arrays.

- [ ] **Step 3: Update each screen to import from mocks**

For each screen that had inline mock data, replace:
```ts
const mockEvents = [{ id: '1', title: 'Park Run', ... }];
```
With:
```ts
import { MOCK_EVENTS } from '@/mocks/events';
```

(Use whatever path alias the project uses — check `tsconfig.json` for `@/` or `@ui/`.)

- [ ] **Step 4: Verify build and screens**

```bash
npx tsc --noEmit
```

Visually check each screen that was modified — confirm mock data still renders correctly.

- [ ] **Step 5: Commit**
```bash
git add src/mocks/ ui/
git commit -m "refactor: centralise mock data into src/mocks/ for consistency across screens"
```

---

## Verification Checklist

- [ ] **Cardio filter**: exercise filter active → runs/rides/swims still visible
- [ ] **Add Session button**: dropdown shows "Start now" + "Schedule"; both work; clicking outside closes
- [ ] **Name defaults**: "Morning Run" pre-filled; clearing name still advances wizard
- [ ] **Targets before map**: pace input above the route map in cardio step
- [ ] **Save draft**: mid-wizard → "Save draft" → plan appears in Upcoming with tomorrow 07:30
- [ ] **Media tokens**: `.plan-map` uses `var(--media-md)`; `.map` uses `var(--media-lg)`; no raw pixel heights in wizard.css
- [ ] **OSRM**: 2+ run waypoints → solid polyline follows roads; cycling uses bike profile; offline fallback is dashed straight lines
- [ ] **Plan detail**: tap upcoming gym plan → block card exercise list; tap run plan → distance/pace/est; "Start now" works
- [ ] **Dead files**: `npx tsc --noEmit` passes; no import errors
- [ ] **Mock data**: all screens still render their data; same fixtures used across feed, schedule, and log
