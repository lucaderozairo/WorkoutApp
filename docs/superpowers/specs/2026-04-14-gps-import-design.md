# GPS/GPX/TCX/FIT File Import — Design Spec
**Date:** 2026-04-14  
**Status:** Approved

---

## Overview

A unified file import system that accepts GPX, TCX, and FIT files and normalises them into the existing `GpsTrack` / `GpsPoint` types. Import is accessible from three entry points: during cardio logging, on an existing session, and as a standalone flow. All three share one parser pipeline and one modal component.

---

## Section 1: Parser Pipeline & Data Layer

### `data/sources/files/gps.ts`

Single entry point for all file formats:

```ts
export async function parseGpsFile(file: File): Promise<GpsTrack>
```

Routes internally by file extension:
- `.gpx` → `DOMParser` (XML, no library needed)
- `.tcx` → `DOMParser` (XML, same approach)
- `.fit` → `@garmin/fitsdk` (binary)

All three paths normalise to the existing `GpsTrack` / `GpsPoint` types from the master spec. No format leaks past this file.

**New packages:**
- `@garmin/fitsdk` — FIT binary decoding only

### `data/sources/files/merge.ts`

```ts
export function mergeSessionWithTrack(
  session: Partial<CardioSession>,
  track: GpsTrack
): CardioSession
```

**Merge rules (D-merge):**
- File wins: `distance`, `duration`, `avgHeartRate`, `avgPace`, `avgSpeed`, `elevationGain`, `gpsTrack`
- Session wins: `rpe`, `notes`, `title`, `activityType`

### Event

`GpsTrackImported` — payload: `{ sessionId: string; track: GpsTrack }`

- Cardio feature policy listens → enriches session record
- Analytics feature listens → makes track available for route map

### `CardioSession` extension

Add `gpsTrack?: GpsTrack` to the `CardioSession` domain type. Set by the cardio feature's policy on receiving `GpsTrackImported`.

### Duplicate detection

Before emitting `GpsTrackImported`, check existing sessions for a matching `duration + startTimestamp` (first point's timestamp from `GpsTrack.points[0].timestamp`). If found, surface a warning in the modal (step 2) — user can still proceed.

---

## Section 2: ImportModal Component

**`ui/components/ImportModal.tsx`**

```ts
type ImportModalProps = {
  context: 'new-session' | 'enrich-session' | 'standalone';
  sessionId?: string;  // required for 'enrich-session'
  onComplete: (sessionId: string) => void;
  onClose: () => void;
}
```

### Step 1 — File selection
- `.surface` with drag-and-drop zone (dashed border via CSS)
- Hidden `input[type="file"]` accept `.gpx,.tcx,.fit`
- "or browse files" `button.secondary`
- Format chips: `.pill.bg-surface` — GPX · TCX · FIT
- On file select → parse immediately, `.row.align-center` spinner during parse

### Step 2 — Preview & confirm
- `.surface` summary: activity type (`p`), distance, duration, elevation, avg HR (`.detail` each)
- `enrich-session` context only: `.surface` diff table (File column / Existing column), conflicts shown transparently, D-merge applied automatically
- Duplicate warning: `.alert.warning` if same file already imported
- "Looks wrong?" `button.ghost` → back to step 1

### Step 3 — RPE & notes
- Skipped for `enrich-session` context
- "How hard was that?" `input[type="range"]` 1–10
- Optional notes `textarea`
- `button.primary` → "Save session"

### Error states
- Parse failure → `.alert.warning` with format hint, back to step 1
- Unsupported format → shown immediately on drop

### Dismissal
- Backdrop click or ESC closes the modal only after step 1 is complete (no accidental mid-parse dismissal)

---

## Section 3: Entry Points

### Entry point 1 — Cardio logger (`ui/layouts/LogScreen.tsx`)
- "Import GPS file" `button.secondary` alongside the manual entry form
- Opens `<ImportModal context="new-session" />`
- Manual form fields pre-filled from parsed track — user can still edit
- On complete: navigate to new session detail

### Entry point 2 — Existing session (session detail view)
- "Attach GPS file" `button.ghost` in the action row
- Only shown on cardio sessions without a GPS track attached
- Opens `<ImportModal context="enrich-session" sessionId={session.id} />`
- On complete: session detail refreshes; button replaced by "GPS attached" `.pill.bg-surface`

### Entry point 3 — Standalone import
- "Import file" `button.secondary` in the Log tab nav
- Opens `<ImportModal context="standalone" />`
- On complete: navigate to newly created session detail

---

## Section 4: Map Display

### `ui/components/Map.tsx`

Shared Leaflet map component used in both contexts:

```ts
type MapProps = {
  track: GpsTrack;
  interactive: boolean;
  colourMode: 'pace' | 'hr';
}
```

- Leaflet tiles: OpenStreetMap (no API key)
- Polyline colour-coded by pace or HR zone (5 zones, CSS custom properties)
- `import 'leaflet/dist/leaflet.css'` in `Map.tsx`

**New packages:**
- `leaflet`
- `@types/leaflet`

### Compact preview (`ui/components/SessionGpsPreview.tsx`)
- `.surface` card, `height: 200px`, non-interactive
- Tap navigates to Analytics → Route tab with the session pre-selected
- Only rendered when `session.gpsTrack` exists — absent entirely otherwise

### Full Analytics map (`ui/layouts/AnalyticsScreen.tsx`)
- New "Route" `.tab` in existing Analytics sub-tab strip
- Full-height Leaflet map, interactive
- Colour mode toggle: pace / HR — `.tabs` strip above map
- Session selector: `select` if multiple GPS sessions exist
- No GPS data state: `.alert` with import CTA

---

## Integration Points

Matches the master spec (`2026-04-14-new-features-design.md`) Section 1A and Section 3:

- `GpsTrackImported` → cardio feature enriches session
- `GpsTrackImported` → analytics makes track available for route map and HR zone breakdown
- No other features are aware of the import flow

---

## Out of Scope

| Feature | Reason |
|---|---|
| Live GPS recording | Requires background geolocation service |
| Strava / Garmin device sync | Separate integration design (Phase 28 in master spec) |
| `.gps` proprietary formats | Negligible usage, add later if requested |
| Multi-file batch import | Not needed for v1 |
