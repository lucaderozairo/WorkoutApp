> **Status (2026-05-23):** Substantially completed. SettingsScreen, TabNavigation, `/notifications` route, and the unified HealthOverviewTab (commit 3eca1d5) are all live. Outstanding: SessionListItem / ScheduleStrip components and any residual filter-bar polish.

# Nav Restructure & Session Log Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the Workout and Progress tabs with a session list, schedule strip, filter bar, session type grouping, notification bell, and a desktop `/settings` route.

**Architecture:** New focused components (ScheduleStrip, SessionFilterBar, SessionListItem) live in `ui/components/log/`. SettingsModal is refactored to extract `SettingsContent` so it renders both as a modal and as a full-page desktop route. LogScreenV2 and ProgressScreen import the new components and add queries for session data. No domain-layer changes.

**Tech Stack:** React 18, TypeScript, React Router v6, Lucide React, existing `useQuery`/`useCommand` bindings from `@ui/bindings`

**CSS policy:** Use existing semantic classes only. All new CSS is deferred to a separate styling pass — do not add or modify any `.css` files during this plan.

---

## Existing classes to reuse (do not reinvent)

| Need                            | Class                          | File                                                                            |
| ------------------------------- | ------------------------------ | ------------------------------------------------------------------------------- |
| Filter chips                    | `.chip` / `.chip.active`       | `components.css`                                                                |
| Horizontally scrolling chip row | `.scroll-row`                  | `layout.css`                                                                    |
| Wrapping option group           | `.cluster`                     | `layout.css`                                                                    |
| Default option button           | `button` (unstyled base)       | `buttons.css`                                                                   |
| Selected option button          | `button.primary`               | `buttons.css`                                                                   |
| Calendar grid                   | `.cal`                         | `components.css`                                                                |
| Calendar day cell               | `button.day` + `data-today`    | `components.css`                                                                |
| Activity dot                    | `.dot.lift` / `.dot.run`       | `components.css`                                                                |
| Small muted text                | `.caption`                     | `typography.css`                                                                |
| Clickable surface               | `.surface.compact.interactive` | `surface.css`                                                                   |
| Count badge (no dot)            | `.pill.plain.active`           | `components.css`                                                                |
| Small ghost button              | `button.ghost.sm`              | `buttons.css`                                                                   |
| Bar sparkline (SVG)             | `.spark`                       | `components.css` — **avoid name conflict; use `.spark-bars` for new bar chart** |

---

## File Map

| File                                     | Action   | Responsibility                                             |
| ---------------------------------------- | -------- | ---------------------------------------------------------- |
| `ui/components/SettingsModal.tsx`        | Modify   | Extract `SettingsContent` inner component                  |
| `ui/layouts/SettingsScreen.tsx`          | Create   | Full-page settings for desktop `/settings` route           |
| `ui/layouts/TabNavigation.tsx`           | Modify   | Bell icon; desktop settings → NavLink; mobile keeps button |
| `app/registry/App.tsx`                   | Modify   | Add `/settings` route                                      |
| `ui/layouts/index.ts`                    | Modify   | Export `SettingsScreen`                                    |
| `ui/components/log/SessionListItem.tsx`  | Create   | Strength and cardio session card components                |
| `ui/components/log/ScheduleStrip.tsx`    | Create   | Week-at-a-glance day tiles (mobile only)                   |
| `ui/components/log/SessionFilterBar.tsx` | Create   | Inline filter chips with collapsible panels                |
| `ui/layouts/LogScreenV2.tsx`             | Modify   | Import + render strip, filter bar, combined session list   |
| `ui/layouts/ProgressScreen.tsx`          | Modify   | Session type cards with sparklines instead of flat list    |
| `styling/layout.css`                     | Deferred | New CSS deferred to a separate styling pass                |
| `styling/nav.css`                        | Deferred | New CSS deferred to a separate styling pass                |

---

## Task 1: Bell icon + desktop settings route

**Files:**

- Modify: `ui/components/SettingsModal.tsx`
- Create: `ui/layouts/SettingsScreen.tsx`
- Modify: `ui/layouts/TabNavigation.tsx`
- Modify: `app/registry/App.tsx`
- Modify: `ui/layouts/index.ts`

- [ ] **Step 1: Extract SettingsContent from SettingsModal**

Read `ui/components/SettingsModal.tsx`. Move all state hooks, handlers, and inner JSX into a new exported `SettingsContent` function. `SettingsModal` becomes a thin wrapper:

```tsx
export function SettingsContent() {
  // All existing useState, useQuery, useCommand hooks and handler functions go here.
  // All inner JSX (profile form, theme toggle, units, import/export, clear data).
  // Do NOT include: modal-overlay wrapper, ✕ close button, onClose prop.
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}>
      <div className="surface">
        <header className="row space-between">
          <h2>Settings</h2>
          <button className="ghost icon" onClick={onClose}>
            ✕
          </button>
        </header>
        <SettingsContent />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create SettingsScreen**

Create `ui/layouts/SettingsScreen.tsx`:

```tsx
import { useNavigate } from "react-router-dom";
import { SettingsContent } from "@ui/components/SettingsModal";

export function SettingsScreen() {
  const navigate = useNavigate();
  return (
    <div className="column">
      <header className="row space-between">
        <h2>Settings</h2>
        <button className="ghost sm" onClick={() => navigate(-1)}>
          ← Back
        </button>
      </header>
      <SettingsContent />
    </div>
  );
}
```

- [ ] **Step 3: Export SettingsScreen**

In `ui/layouts/index.ts`, add:

```ts
export { SettingsScreen } from "./SettingsScreen";
```

- [ ] **Step 4: Add /settings route**

In `app/registry/App.tsx`:

```tsx
import { SettingsScreen } from "@ui/layouts";
// Inside <Routes> before the wildcard:
<Route path="/settings" element={<SettingsScreen />} />;
```

- [ ] **Step 5: Update TabNavigation**

Replace `ui/layouts/TabNavigation.tsx` in full:

```tsx
import { NavLink } from "react-router-dom";
import {
  Home,
  Dumbbell,
  CalendarDays,
  TrendingUp,
  Users,
  Utensils,
  User,
  Settings,
  Bell,
} from "lucide-react";

const desktopTabs = [
  { label: "Home", path: "/dashboard", icon: <Home size={18} /> },
  { label: "Workout", path: "/log-v2", icon: <Dumbbell size={18} /> },
  { label: "Schedule", path: "/schedule", icon: <CalendarDays size={18} /> },
  { label: "Progress", path: "/progress", icon: <TrendingUp size={18} /> },
  { label: "Social", path: "/social", icon: <Users size={18} /> },
  { label: "Nutrition", path: "/nutrition", icon: <Utensils size={18} /> },
  { label: "Profile", path: "/profile", icon: <User size={18} /> },
];

const mobileTabs = [
  { label: "Home", path: "/dashboard", icon: <Home size={22} /> },
  { label: "Workout", path: "/log-v2", icon: <Dumbbell size={22} /> },
  { label: "Nutrition", path: "/nutrition", icon: <Utensils size={22} /> },
  { label: "Social", path: "/social", icon: <Users size={22} /> },
  { label: "Profile", path: "/profile", icon: <User size={22} /> },
];

interface TabNavigationProps {
  onOpenSettings?: () => void;
}

export function TabNavigation({ onOpenSettings }: TabNavigationProps) {
  return (
    <>
      {/* Desktop rail */}
      <aside className="app-rail">
        <div className="app-rail__logo">Fittrack</div>
        <nav className="app-rail__nav">
          {desktopTabs.map((tab) => (
            <NavLink key={tab.path} to={tab.path}>
              <span className="icon">{tab.icon}</span>
              <span className="detail">{tab.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="app-rail__foot">
          <NavLink to="/settings" title="Settings">
            <span className="icon">
              <Settings size={18} />
            </span>
            <span className="detail">Settings</span>
          </NavLink>
          <button className="ghost icon notif-btn" title="Notifications">
            <Bell size={18} />
            <span className="notification-badge" />
          </button>
        </div>
      </aside>

      {/* Mobile topbar */}
      <header className="app-topbar">
        <span className="app-topbar__logo">Fittrack</span>
        <div className="row">
          <button className="ghost icon notif-btn" title="Notifications">
            <Bell size={20} />
            <span className="notification-badge" />
          </button>
          {onOpenSettings && (
            <button
              className="ghost icon"
              onClick={onOpenSettings}
              title="Settings">
              <Settings size={20} />
            </button>
          )}
        </div>
      </header>

      {/* Mobile bottom tabbar */}
      <nav className="app-tabbar">
        <div className="app-tabbar__list">
          {mobileTabs.map((tab) => (
            <NavLink key={tab.path} to={tab.path}>
              <span className="icon">{tab.icon}</span>
              <span className="detail">{tab.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
}
```

- [ ] **Step 6: Verify**

Run `npm run dev`.

- Desktop > 780px: settings rail link navigates to `/settings` page. Bell icon visible in rail foot (badge styling deferred).
- Mobile ≤ 780px: Bell + Settings icons visible in topbar. Settings still opens modal.

- [ ] **Step 7: Commit**

```bash
git add ui/components/SettingsModal.tsx ui/layouts/SettingsScreen.tsx ui/layouts/TabNavigation.tsx app/registry/App.tsx ui/layouts/index.ts
git commit -m "feat: add desktop /settings route, notification bell placeholder"
```

---

## Task 2: SessionListItem component

**Files:**

- Create: `ui/components/log/SessionListItem.tsx`

Uses `.surface.compact.interactive` (existing) for click affordance. Cardio border uses `--c-cardio` token. Match badge uses `.pill.plain.active` (existing — no dot, outlined).

- [ ] **Step 1: Create the component file**

```tsx
// ui/components/log/SessionListItem.tsx
import { useNavigate } from "react-router-dom";
import type { SessionHistoryItem } from "@features/training_log";
import type { CardioSession } from "@features/cardio";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

function formatPace(durationSeconds: number, distanceMeters: number): string {
  if (!distanceMeters || !durationSeconds) return "";
  const secsPerKm = durationSeconds / (distanceMeters / 1000);
  return `${Math.floor(secsPerKm / 60)}:${String(Math.floor(secsPerKm % 60)).padStart(2, "0")}/km`;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

interface StrengthItemProps {
  session: SessionHistoryItem;
  matchedExercise?: string;
}

export function StrengthSessionItem({
  session,
  matchedExercise,
}: StrengthItemProps) {
  const navigate = useNavigate();
  return (
    <section
      className="surface compact interactive"
      onClick={() => navigate(`/sessions/${session.id}`)}>
      <header className="row space-between">
        <span>{session.name}</span>
        <time className="caption">{formatDate(session.startedAt)}</time>
      </header>
      <p className="caption">
        {session.exerciseCount} exercises ·{" "}
        {formatDuration(session.durationSeconds)}
        {session.hasPR ? " · 🏆 PR" : ""}
      </p>
      {matchedExercise && (
        <span className="pill plain active">{matchedExercise} ✓</span>
      )}
    </section>
  );
}

interface CardioItemProps {
  session: CardioSession;
}

export function CardioSessionItem({ session }: CardioItemProps) {
  const navigate = useNavigate();
  const distKm = (session.distanceMeters / 1000).toFixed(1);
  const pace = formatPace(session.durationSeconds, session.distanceMeters);
  const title =
    session.title ||
    session.sport.charAt(0).toUpperCase() + session.sport.slice(1);

  return (
    <section
      className="surface compact interactive"
      onClick={() => navigate(`/sessions/${session.id}`)}>
      <header className="row space-between">
        <span>{title}</span>
        <time className="caption">{formatDate(session.startedAt)}</time>
      </header>
      <p className="caption">
        {distKm} km · {formatDuration(session.durationSeconds)}
        {pace ? ` · ${pace}` : ""}
      </p>
    </section>
  );
}
```

- [ ] **Step 2: Verify compile**

```bash
npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add ui/components/log/SessionListItem.tsx
git commit -m "feat: add StrengthSessionItem and CardioSessionItem components"
```

---

## Task 3: ScheduleStrip component

**Files:**

- Create: `ui/components/log/ScheduleStrip.tsx`

Uses existing `.cal` grid, `button.day` cells, `data-today` attribute, `.dot.lift`/`.dot.run`, `.caption`, `button.ghost.sm`. No new CSS — styling deferred.

- [ ] **Step 1: Create ScheduleStrip**

```tsx
// ui/components/log/ScheduleStrip.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { SessionHistoryItem } from "@features/training_log";
import type { CardioSession } from "@features/cardio";

function isoDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function buildWeekDays(weekOffset: number): Date[] {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7) + weekOffset * 7);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface ScheduleStripProps {
  strengthSessions: SessionHistoryItem[];
  cardioSessions: CardioSession[];
}

export function ScheduleStrip({
  strengthSessions,
  cardioSessions,
}: ScheduleStripProps) {
  const [weekOffset, setWeekOffset] = useState(0);
  const navigate = useNavigate();

  const days = buildWeekDays(weekOffset);
  const todayIso = isoDate(new Date());

  const sessionByDay = new Map<
    string,
    { sessionId: string; kind: "strength" | "cardio" }
  >();
  for (const s of strengthSessions) {
    const key = isoDate(new Date(s.startedAt));
    if (!sessionByDay.has(key))
      sessionByDay.set(key, { sessionId: s.id, kind: "strength" });
  }
  for (const s of cardioSessions) {
    const key = isoDate(new Date(s.startedAt));
    if (!sessionByDay.has(key))
      sessionByDay.set(key, { sessionId: s.id, kind: "cardio" });
  }

  const monthLabel = days[0].toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="schedule-strip">
      <div className="row space-between">
        <span>{monthLabel}</span>
        <div className="row compact">
          <button
            className="ghost sm"
            onClick={() => setWeekOffset((w) => w - 1)}>
            ‹ prev
          </button>
          <button
            className="ghost sm"
            onClick={() => setWeekOffset((w) => w + 1)}
            disabled={weekOffset >= 0}>
            next ›
          </button>
        </div>
      </div>

      <div className="cal">
        {days.map((day, i) => {
          const key = isoDate(day);
          const isToday = key === todayIso;
          const meta = sessionByDay.get(key);
          const isFuture = !isToday && day > new Date();

          return (
            <button
              key={key}
              className={["day", isFuture ? "locked" : ""].filter(Boolean).join(" ")}
              data-today={isToday ? "" : undefined}
              data-kind={meta?.kind}
              onClick={() => meta && navigate(`/sessions/${meta.sessionId}`)}
              disabled={isFuture || (!meta && !isToday)}>
              <span className="caption">{DAY_LABELS[i]}</span>
              <span>{day.getDate()}</span>
              {meta && !isToday && (
                <span
                  className={`dot ${meta.kind === "strength" ? "lift" : "run"}`}
                />
              )}
              {isToday && <span className="caption">Today</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify compile**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add ui/components/log/ScheduleStrip.tsx
git commit -m "feat: add ScheduleStrip week-at-a-glance component (mobile only)"
```

---

## Task 4: SessionFilterBar component

**Files:**

- Create: `ui/components/log/SessionFilterBar.tsx`

Chips use `.chip` / `.chip.active`. The chip row uses `.scroll-row`. Options panel uses `.cluster`. Option buttons use default `button` / `button.primary`. Search uses `input` (already styled). No new CSS — styling deferred.

- [ ] **Step 1: Create SessionFilterBar**

```tsx
// ui/components/log/SessionFilterBar.tsx
import { useState } from "react";
import type { CardioSport } from "@features/cardio";

export type DateRange = "7d" | "30d" | "3m" | "all";
export type TypeFilter = "all" | "strength" | CardioSport;

export interface SessionFilters {
  dateRange: DateRange;
  type: TypeFilter;
  exercise: string;
}

export const DEFAULT_FILTERS: SessionFilters = {
  dateRange: "all",
  type: "all",
  exercise: "",
};

const DATE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "3m", label: "Last 3 months" },
  { value: "all", label: "All time" },
];

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "strength", label: "Strength" },
  { value: "run", label: "Run" },
  { value: "cycle", label: "Cycling" },
  { value: "swim", label: "Swimming" },
  { value: "row", label: "Rowing" },
];

type PanelId = "date" | "type" | "exercise";

interface SessionFilterBarProps {
  filters: SessionFilters;
  onChange: (f: SessionFilters) => void;
  exerciseOptions: string[];
}

export function SessionFilterBar({
  filters,
  onChange,
  exerciseOptions,
}: SessionFilterBarProps) {
  const [openPanel, setOpenPanel] = useState<PanelId | null>(null);
  const [exerciseSearch, setExerciseSearch] = useState("");

  const toggle = (panel: PanelId) =>
    setOpenPanel((p) => (p === panel ? null : panel));

  const isActive = (chip: PanelId): boolean => {
    if (chip === "date") return filters.dateRange !== "all";
    if (chip === "type") return filters.type !== "all";
    return filters.exercise !== "";
  };

  const chipLabel = (chip: PanelId): string => {
    if (chip === "date")
      return filters.dateRange !== "all"
        ? DATE_OPTIONS.find((o) => o.value === filters.dateRange)!.label
        : "Date";
    if (chip === "type")
      return filters.type !== "all"
        ? TYPE_OPTIONS.find((o) => o.value === filters.type)!.label
        : "Type";
    return filters.exercise || "Exercise";
  };

  const matchingExercises = exerciseOptions.filter((n) =>
    n.toLowerCase().includes(exerciseSearch.toLowerCase()),
  );

  return (
    <div className="filter-bar">
      {/* Chip row — .scroll-row handles overflow-x: auto + no scrollbar */}
      <div className="scroll-row">
        {(["date", "type", "exercise"] as PanelId[]).map((chip) => (
          <button
            key={chip}
            className={[
              "chip",
              isActive(chip) || openPanel === chip ? "active" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => toggle(chip)}>
            {chipLabel(chip)} {openPanel === chip ? "▴" : "▾"}
          </button>
        ))}
      </div>

      {/* Date panel */}
      {openPanel === "date" && (
        <div className="cluster">
          {DATE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={filters.dateRange === opt.value ? "primary" : ""}
              onClick={() => {
                onChange({ ...filters, dateRange: opt.value });
                setOpenPanel(null);
              }}>
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Type panel */}
      {openPanel === "type" && (
        <div className="cluster">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={filters.type === opt.value ? "primary" : ""}
              onClick={() => {
                onChange({ ...filters, type: opt.value });
                setOpenPanel(null);
              }}>
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Exercise panel */}
      {openPanel === "exercise" && (
        <div className="column compact">
          <input
            placeholder="Search exercises…"
            value={exerciseSearch}
            onChange={(e) => setExerciseSearch(e.target.value)}
            autoFocus
          />
          <div className="cluster">
            {matchingExercises.slice(0, 8).map((name) => (
              <button
                key={name}
                className={filters.exercise === name ? "primary" : ""}
                onClick={() => {
                  onChange({
                    ...filters,
                    exercise: filters.exercise === name ? "" : name,
                  });
                  setOpenPanel(null);
                  setExerciseSearch("");
                }}>
                {name}
              </button>
            ))}
            {filters.exercise && (
              <button
                className="ghost sm"
                onClick={() => {
                  onChange({ ...filters, exercise: "" });
                  setOpenPanel(null);
                }}>
                Clear ✕
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify compile**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add ui/components/log/SessionFilterBar.tsx
git commit -m "feat: add SessionFilterBar using existing chip/cluster/scroll-row classes"
```

---

## Task 5: Wire session list into LogScreenV2

**Files:**

- Modify: `ui/layouts/LogScreenV2.tsx`

- [ ] **Step 1: Add new imports at the top of LogScreenV2.tsx**

After the existing imports block, add:

```tsx
import { ScheduleStrip } from "@ui/components/log/ScheduleStrip";
import {
  SessionFilterBar,
  DEFAULT_FILTERS,
} from "@ui/components/log/SessionFilterBar";
import type { SessionFilters } from "@ui/components/log/SessionFilterBar";
import {
  StrengthSessionItem,
  CardioSessionItem,
} from "@ui/components/log/SessionListItem";
import type {
  SessionHistoryItem,
  EditingSessionsView,
} from "@features/training_log";
import type { RecentCardioView, CardioSession } from "@features/cardio";
import "@features/cardio";
```

- [ ] **Step 2: Add session state and queries inside the LogScreenV2 function body**

Find the existing `useState` / `useQuery` block and add alongside:

```tsx
const [sessionFilters, setSessionFilters] =
  useState<SessionFilters>(DEFAULT_FILTERS);

const strengthHistory = (useQuery<SessionHistoryItem[]>("session_history") ??
  []) as SessionHistoryItem[];
const cardioView = (useQuery<RecentCardioView>("recent_cardio_sessions") ?? {
  sessions: [],
}) as RecentCardioView;
const editingState = useQuery<EditingSessionsView>("editing_session");

// sessionId → Set of exercise names (for exercise filter)
const exercisesBySession = useMemo(() => {
  const map = new Map<string, Set<string>>();
  if (editingState) {
    for (const session of (editingState as EditingSessionsView).sessions) {
      map.set(session.id, new Set(session.blocks.map((b) => b.exerciseName)));
    }
  }
  return map;
}, [editingState]);

const allExerciseNames = useMemo(() => {
  const names = new Set<string>();
  exercisesBySession.forEach((set) => set.forEach((n) => names.add(n)));
  return Array.from(names).sort();
}, [exercisesBySession]);
```

`useMemo` is already imported in LogScreenV2 — confirm before adding it to imports.

- [ ] **Step 3: Add combined + filtered session computation**

After the state from Step 2:

```tsx
type CombinedEntry =
  | { kind: "strength"; session: SessionHistoryItem; matchedExercise?: string }
  | { kind: "cardio"; session: CardioSession };

const combinedSessions = useMemo((): CombinedEntry[] => {
  const { type, exercise, dateRange } = sessionFilters;
  const now = Date.now();
  const cutoff =
    dateRange === "7d"
      ? now - 7 * 86_400_000
      : dateRange === "30d"
        ? now - 30 * 86_400_000
        : dateRange === "3m"
          ? now - 90 * 86_400_000
          : 0;

  const result: CombinedEntry[] = [];

  if (type === "all" || type === "strength") {
    for (const s of strengthHistory) {
      if (s.startedAt < cutoff) continue;
      if (exercise) {
        const names = exercisesBySession.get(s.id);
        if (!names?.has(exercise)) continue;
      }
      result.push({
        kind: "strength",
        session: s,
        matchedExercise: exercise || undefined,
      });
    }
  }

  if (type === "all" || type !== "strength") {
    for (const s of cardioView.sessions) {
      if (s.startedAt < cutoff) continue;
      if (type !== "all" && type !== "strength" && s.sport !== type) continue;
      result.push({ kind: "cardio", session: s });
    }
  }

  return result.sort((a, b) => b.session.startedAt - a.session.startedAt);
}, [strengthHistory, cardioView.sessions, sessionFilters, exercisesBySession]);
```

- [ ] **Step 4: Add schedule strip + filter bar + session list to the home render**

Find the section that renders when there is no active session (the "new workout" button area). After the button, add:

```tsx
<ScheduleStrip
  strengthSessions={strengthHistory}
  cardioSessions={cardioView.sessions}
/>

<SessionFilterBar
  filters={sessionFilters}
  onChange={setSessionFilters}
  exerciseOptions={allExerciseNames}
/>

<div className="column compact">
  {combinedSessions.length === 0 ? (
    <p className="caption">No sessions found</p>
  ) : (
    combinedSessions.map(entry =>
      entry.kind === 'strength' ? (
        <StrengthSessionItem
          key={entry.session.id}
          session={entry.session}
          matchedExercise={entry.matchedExercise}
        />
      ) : (
        <CardioSessionItem key={entry.session.id} session={entry.session} />
      )
    )
  )}
</div>
```

- [ ] **Step 5: Verify in browser**

Run `npm run dev`. Navigate to `/log-v2` with no active session.

- Mobile ≤ 780px: schedule strip shows current week with month header and prev/next arrows. Days with sessions show a coloured dot and highlight border. Tapping navigates to `/sessions/:id`.
- Filter chips sit inline and scroll; each opens its panel below. Type → "Strength" hides cardio entries. Exercise search shows match badges.
- Desktop: schedule strip hidden. Session list + filter bar visible.

- [ ] **Step 6: Commit**

```bash
git add ui/layouts/LogScreenV2.tsx
git commit -m "feat: wire schedule strip, filter bar, and session list into workout tab"
```

---

## Task 6: Progress tab — session type grouping with sparklines

**Files:**

- Modify: `ui/layouts/ProgressScreen.tsx`

Uses `.surface.compact.interactive`, `.pill.plain.active` (count badge), `.caption`. The existing `.spark` class is SVG-based — use `.spark-bars` / `.spark-bars__bar` for the new bar chart to avoid the name conflict. No new CSS — styling deferred.

- [ ] **Step 1: Add useMemo import and SparkBars component to ProgressScreen.tsx**

Update React import:

```tsx
import React, { useState, useMemo } from "react";
```

Add this function just before `ProgressScreen` (after `CardioSessionCard`):

```tsx
function SparkBars({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  return (
    <div className="spark-bars">
      {values.map((v, i) => (
        <div
          key={i}
          className="spark-bars__bar"
          style={
            { "--bar-h": `${Math.round((v / max) * 100)}%` } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
```

> **Note:** `--bar-h` is a CSS custom property (data bridge), not a visual inline style. The `.spark-bars__bar { height: var(--bar-h); }` rule is added in the deferred styling pass.

- [ ] **Step 2: Add session type grouping inside ProgressScreen**

Inside `ProgressScreen`, after the existing `history` query line, add:

```tsx
// useNavigate is imported at the top of the file — confirm it's also called in
// ProgressScreen's function body (not just inside SessionCard) before adding:
const navigate = useNavigate();

const sessionsByType = useMemo(() => {
  const map = new Map<string, SessionHistoryItem[]>();
  for (const s of history) {
    map.set(s.name, [...(map.get(s.name) ?? []), s]);
  }
  return map;
}, [history]);
```

- [ ] **Step 3: Replace flat SessionCard list with session type cards**

Find the block that renders `filteredHistory.map(s => <SessionCard key={s.id} session={s} />)` and replace:

```tsx
{
  Array.from(sessionsByType.entries()).map(([typeName, sessions]) => {
    const values = sessions.slice(-5).map((s) => s.totalSets);
    return (
      <section
        key={typeName}
        className="surface compact interactive"
        onClick={() => navigate(`/exercise/${encodeURIComponent(typeName)}`)}>
        <div className="row space-between">
          <span>{typeName}</span>
          <span className="pill plain active">{sessions.length}×</span>
        </div>
        <SparkBars values={values} />
        <p className="caption">Volume trend · last {values.length} sessions</p>
      </section>
    );
  });
}
{
  sessionsByType.size === 0 && (
    <EmptyState
      icon="📋"
      title="No sessions yet"
      message="Log your first workout in the Workout tab."
      action={
        onOpenSettings ? (
          <button type="button" className="secondary" onClick={onOpenSettings}>
            Import history
          </button>
        ) : undefined
      }
    />
  );
}
```

- [ ] **Step 4: Replace cardio per-sport flat list with sparkline cards**

Find the existing `sportsToShow.map(sport => ...)` block. Replace the `<React.Fragment>` contents:

```tsx
{
  sportsToShow.map((sport) => {
    const sessions = cardioBySport(sport);
    const meta = SPORT_META[sport];
    const values = sessions
      .slice(-5)
      .map((s) => +(s.distanceMeters / 1000).toFixed(1));
    const totalKm = sessions.reduce((a, s) => a + s.distanceMeters / 1000, 0);
    return (
      <section key={sport} className="surface compact">
        <div className="row space-between">
          <span>{meta.label}</span>
          <span className="pill plain">{sessions.length}×</span>
        </div>
        <SparkBars values={values} />
        <p className="caption">
          Distance trend · last {values.length} sessions
        </p>
        <div className="row space-between">
          <span className="caption">Total distance</span>
          <span>{totalKm.toFixed(1)} km</span>
        </div>
      </section>
    );
  });
}
```

- [ ] **Step 5: Verify in browser**

Run `npm run dev`. Navigate to `/progress`.

- Strength sessions grouped by name. Each card shows a count badge and a bar sparkline (unstyled until CSS pass).
- Cardio sports appear as separate cards with distance sparklines.
- Old flat expandable session list is gone from this tab.

- [ ] **Step 6: Commit**

```bash
git add ui/layouts/ProgressScreen.tsx
git commit -m "feat: group progress tab by session type with SparkBars trend"
```

---

## Verification Checklist

- [ ] Desktop `/settings` route renders settings content without a modal overlay; rail settings icon highlights when active.
- [ ] Mobile settings icon still opens the modal.
- [ ] Bell icon visible in both mobile topbar and desktop rail foot (badge styling deferred to CSS pass).
- [ ] Workout tab mobile: schedule strip with month header, prev/next; session days show `.dot.lift`/`.dot.run`; tap navigates to session.
- [ ] Workout tab: session list shows strength and cardio sessions, newest first, no set count.
- [ ] Filter chips sit inline (scroll-row, not full-width); one panel opens at a time.
- [ ] Type → "Strength" hides cardio; exercise search shows match badge on card.
- [ ] Progress tab: session type cards with `.spark-bars` trend; cardio sports as own cards.
- [ ] `npx tsc --noEmit` passes with no new errors.
