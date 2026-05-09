# Nav Restructure + Profile Tabs — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Messages tab to the mobile nav (replacing Nutrition), restructure the Profile screen into three tabs (Activities, Health, Nutrition), and verify "likes" terminology is used throughout.

**Architecture:** Component composition — each Profile tab is a self-contained component that owns its own queries. `ProfileScreen` gains a `useState` tab bar using the existing `.tabs`/`.tab`/`.tab.active` CSS pattern from `SocialScreen`. `HealthTab` extracts the body metrics and injuries blocks out of `ProfileScreen`. `ActivitiesTab` queries the social feed and filters to the current user's posts.

**Tech Stack:** React, TypeScript, React Router, lucide-react, `@ui/bindings` (useQuery/useCommand), `@features/profile`, `@features/readiness`, `@features/social`

> **Decision log:** Mobile nav slot 3 changed from Activity to Messages. `MessageScreen` already exists at `ui/layouts/MessageScreen.tsx`. Activity planning (Spec 3) will be accessible from within the app but does not occupy a mobile nav slot.

---

### Task 1: Add Messages tab to TabNavigation

**Files:**
- Modify: `ui/layouts/TabNavigation.tsx`

- [ ] **Step 1: Replace Nutrition with Messages in mobileTabs and add Messages to desktopTabs**

In `ui/layouts/TabNavigation.tsx`, add `MessageSquare` to the lucide-react import block and update both arrays:

```typescript
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
  MessageSquare,   // ← add
} from 'lucide-react';

const desktopTabs = [
  { label: 'Home',      path: '/dashboard', icon: <Home          size={18} /> },
  { label: 'Workout',   path: '/log-v2',    icon: <Dumbbell      size={18} /> },
  { label: 'Schedule',  path: '/schedule',  icon: <CalendarDays  size={18} /> },
  { label: 'Progress',  path: '/progress',  icon: <TrendingUp    size={18} /> },
  { label: 'Social',    path: '/social',    icon: <Users         size={18} /> },
  { label: 'Messages',  path: '/messages',  icon: <MessageSquare size={18} /> },  // ← add
  { label: 'Nutrition', path: '/nutrition', icon: <Utensils      size={18} /> },
  { label: 'Profile',   path: '/profile',   icon: <User          size={18} /> },
];

const mobileTabs = [
  { label: 'Home',     path: '/dashboard', icon: <Home          size={22} /> },
  { label: 'Workout',  path: '/log-v2',    icon: <Dumbbell      size={22} /> },
  { label: 'Messages', path: '/messages',  icon: <MessageSquare size={22} /> },  // ← replaces Nutrition
  { label: 'Social',   path: '/social',    icon: <Users         size={22} /> },
  { label: 'Profile',  path: '/profile',   icon: <User          size={22} /> },
];
```

- [ ] **Step 2: Verify the build**

```bash
npm run build
```

Expected: No TypeScript errors. Messages tab visible in desktop rail and mobile bar at position 3 (replacing Nutrition).

- [ ] **Step 3: Commit**

```bash
git add ui/layouts/TabNavigation.tsx
git commit -m "feat: add Messages tab to nav, remove Nutrition from mobile tab bar"
```

---

### Task 2: Wire up MessageScreen route

`MessageScreen` already exists at `ui/layouts/MessageScreen.tsx`. It just needs a barrel export and a route.

**Files:**
- Modify: `ui/layouts/index.ts` (or `index.tsx`) — barrel export
- Modify: `app/registry/App.tsx`

- [ ] **Step 1: Export MessageScreen from the layouts barrel**

Open `ui/layouts/index.ts` (or `index.tsx`) and add alongside the other screen exports:

```typescript
export { MessageScreen } from './MessageScreen';
```

- [ ] **Step 2: Add `/messages` route in App.tsx**

Add the import alongside the other screen imports at the top:

```typescript
import { MessageScreen } from '@ui/layouts';
```

Add the route inside `<Routes>` after the `/social` route:

```typescript
<Route path="/messages" element={<MessageScreen />} />
```

- [ ] **Step 3: Verify routing**

Run the app, tap Messages in the mobile nav, confirm `/messages` loads `MessageScreen` (shows "Upcoming Calls" and "Recent Messages" sections) without crashing.

- [ ] **Step 4: Commit**

```bash
git add ui/layouts/index.ts app/registry/App.tsx
git commit -m "feat: wire /messages route to existing MessageScreen"
```

---

### Task 3: Create HealthTab component

**Files:**
- Create: `ui/components/profile/HealthTab.tsx`

- [ ] **Step 1: Create the directory if it doesn't exist**

```bash
mkdir -p ui/components/profile
```

- [ ] **Step 2: Create HealthTab**

This component owns its own queries — same hooks as the sections it's replacing in `ProfileScreen`:

```typescript
// ui/components/profile/HealthTab.tsx
import { useQuery, useCommand } from '@ui/bindings';
import { handleResolveInjury, getBodyweightLog } from '@features/profile';
import type { HealthMetricsView } from '@features/readiness';
import type { Id } from '@shared/types';

type InjuryView = { id: Id<'Injury'>; description: string; bodyPart: string; recordedAt: number };

const USER_ID = 'user-001' as Id<'User'>;

export function HealthTab() {
  const injuries = (useQuery<InjuryView[]>('active_injuries') ?? []) as InjuryView[];
  const bwEntries = getBodyweightLog().slice(0, 2);
  const healthMetrics = (useQuery<HealthMetricsView[]>('health_metrics') ?? []) as HealthMetricsView[];
  const { dispatch: dispatchResolveInjury } = useCommand(handleResolveInjury);

  const latestHm = healthMetrics[0] ?? null;
  const latestBw = bwEntries[0] ?? null;
  const prevBw   = bwEntries[1] ?? null;
  const bwDelta  = latestBw && prevBw ? latestBw.weightKg - prevBw.weightKg : null;

  return (
    <div className="stack">

      {/* ── Body Metrics ── */}
      <h2 className="eyebrow">Body metrics</h2>
      <div className="grid-4">
        <div className="surface">
          <span className="eyebrow">Weight</span>
          <span>
            {latestBw?.weightKg ?? '—'}<span className="faint">kg</span>
          </span>
          {bwDelta !== null && (
            <span className={`stat__trend ${bwDelta <= 0 ? 'stat__trend--down' : 'stat__trend--up'} mono`}>
              {bwDelta <= 0 ? '↓' : '↑'} {Math.abs(bwDelta).toFixed(1)} since last
            </span>
          )}
        </div>
        <div className="surface">
          <span className="eyebrow">Resting HR</span>
          <span>
            {latestHm?.restingHr ?? '—'}<span className="faint">bpm</span>
          </span>
        </div>
        <div className="surface">
          <span className="eyebrow">HRV</span>
          <span>
            {latestHm?.hrv ?? '—'}<span className="faint">ms</span>
          </span>
        </div>
        <div className="surface">
          <span className="eyebrow">VO₂ Max</span>
          <span>
            {latestHm?.vo2max ?? '—'}<span className="faint">ml/kg</span>
          </span>
        </div>
      </div>

      {/* ── Sleep ── */}
      <h2 className="eyebrow">Sleep</h2>
      <div className="surface">
        <p className="muted">Sleep data will appear here once connected.</p>
      </div>

      {/* ── Injuries ── */}
      <h2 className="eyebrow">Injuries</h2>
      {injuries.length === 0 ? (
        <p className="muted">No active injuries.</p>
      ) : injuries.map(inj => (
        <div key={inj.id} className="surface">
          <div className="row space-between align-center">
            <span className="pill pill--bad">Active</span>
            <span className="mono muted">{new Date(inj.recordedAt).toLocaleDateString()}</span>
          </div>
          <div className="stack">
            <h3>{inj.bodyPart}</h3>
            <p className="muted">{inj.description}</p>
          </div>
          <button
            className="sm"
            onClick={() => dispatchResolveInjury({ type: 'ResolveInjury', userId: USER_ID, injuryId: inj.id })}
          >
            Mark resolved
          </button>
        </div>
      ))}

    </div>
  );
}
```

- [ ] **Step 3: Verify the build**

```bash
npm run build
```

Expected: Compiles cleanly.

- [ ] **Step 4: Commit**

```bash
git add ui/components/profile/HealthTab.tsx
git commit -m "feat: add HealthTab component (metrics, sleep placeholder, injuries)"
```

---

### Task 4: Create ActivitiesTab component

**Files:**
- Create: `ui/components/profile/ActivitiesTab.tsx`

- [ ] **Step 1: Create ActivitiesTab**

Queries the social feed and filters to posts authored by the current user. `SharedPost` extends `Post` with optional fields present on seed posts:

```typescript
// ui/components/profile/ActivitiesTab.tsx
import { useQuery } from '@ui/bindings';
import { useNavigate } from 'react-router-dom';
import type { Post } from '@features/social';
import type { Id } from '@shared/types';

type SharedPost = Post & {
  sessionId?: Id<'Session'>;
  sport?: string;
  sessionName?: string;
};

const USER_ID = 'user-001' as Id<'User'>;

const SPORT_LABELS: Record<string, string> = {
  lift:  '🏋️ Gym',
  run:   '🏃 Run',
  cycle: '🚴 Cycle',
  swim:  '🏊 Swim',
  row:   '🚣 Row',
};

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60_000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function ActivitiesTab() {
  const navigate = useNavigate();
  const allPosts = (useQuery<SharedPost[]>('social_feed') ?? []) as SharedPost[];
  const myPosts  = allPosts.filter(p => p.authorId === USER_ID);

  if (myPosts.length === 0) {
    return (
      <div className="surface">
        <p className="muted">No shared sessions yet. Share a workout from your session history.</p>
      </div>
    );
  }

  return (
    <div className="stack">
      {myPosts.map(post => (
        <div
          key={post.id}
          className="surface"
          onClick={() => post.sessionId && navigate(`/sessions/${post.sessionId}`)}
          style={post.sessionId ? { cursor: 'pointer' } : undefined}
        >
          <div className="row space-between align-center">
            <div className="stack">
              <span>{post.sessionName ?? 'Workout'}</span>
              {post.sport && <span className="muted">{SPORT_LABELS[post.sport] ?? post.sport}</span>}
            </div>
            <time className="mono muted">{timeAgo(post.createdAt)}</time>
          </div>
          <p className="muted">{post.body}</p>
          <div className="row">
            <span className="caption">❤️ {post.likeCount} likes</span>
            <span className="caption">💬 {post.comments.length}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verify the build**

```bash
npm run build
```

Expected: Compiles cleanly. If `Post` from `@features/social` already defines `sessionId`, TypeScript will flag the duplicate in `SharedPost` — remove it from the local type if so.

- [ ] **Step 3: Commit**

```bash
git add ui/components/profile/ActivitiesTab.tsx
git commit -m "feat: add ActivitiesTab showing current user's social posts"
```

---

### Task 5: Refactor ProfileScreen with tab bar

**Files:**
- Modify: `ui/layouts/ProfileScreen.tsx`

- [ ] **Step 1: Replace ProfileScreen contents**

The body metrics and injuries blocks are removed (now owned by `HealthTab`). Achievements, PRs, and Goals stay in the hero. A three-tab bar is added below:

```typescript
// ui/layouts/ProfileScreen.tsx
import { useState } from 'react';
import { useQuery } from '@ui/bindings';
import {
  registerBodyProjections,
  registerEquipmentMileagePolicy,
} from '@features/profile';
import type { UnitSystem } from '@features/profile';
import type { PersonalRecord, StatsSummary } from '@features/progress_analysis';

import { HealthTab } from '../components/profile/HealthTab';
import { ActivitiesTab } from '../components/profile/ActivitiesTab';
import { NutritionScreen } from './NutritionScreen';

import '@features/progress_analysis';
import '@features/readiness';

registerBodyProjections();
registerEquipmentMileagePolicy();

type ProfileView = { displayName: string; email: string; unitPreference: UnitSystem };

const ACHIEVEMENTS = [
  { name: 'Century Club', emoji: '🏋️', desc: '100+ workouts', unlocked: true },
  { name: 'First 5',      emoji: '✅', desc: 'First 5 sessions', unlocked: true },
  { name: '100kg Bench',  emoji: '💪', desc: 'Bench 1RM est.', unlocked: true },
  { name: '140kg Squat',  emoji: '🏆', desc: '1RM goal', unlocked: false },
  { name: 'Sub-20 5K',    emoji: '🏃', desc: 'Best: not yet', unlocked: false },
  { name: 'Century Ride', emoji: '🚴', desc: '100km cycle', unlocked: false },
  { name: 'Marathon',     emoji: '🏅', desc: 'Finish 42.2km', unlocked: false },
  { name: '30-day streak',emoji: '📅', desc: 'Best: 14 days', unlocked: false },
];

const GOALS = [
  { name: 'Squat 140 kg',          current: 120, target: 140 },
  { name: 'Run 5K under 25 min',   current: 28,  target: 25, lowerIsBetter: true },
  { name: 'Log 20 sessions',        current: 0,   target: 20 },
];

type ProfileTab = 'activities' | 'health' | 'nutrition';

export function ProfileScreen() {
  const [activeTab, setActiveTab] = useState<ProfileTab>('activities');

  const profile = useQuery<ProfileView>('profile');
  const prs     = (useQuery<PersonalRecord[]>('personal_records') ?? []) as PersonalRecord[];
  const stats   = useQuery<StatsSummary>('stats_summary');

  const initial = profile?.displayName?.charAt(0).toUpperCase() ?? 'Y';

  return (
    <div className="stack">

      {/* ── Hero ── */}
      <div className="surface">
        <div className="row align-center">
          <div className="avatar avatar--xl">{initial}</div>
          <div className="stack">
            <span>{profile?.displayName ?? 'You'}</span>
            <span className="mono muted">{profile?.email ?? ''}</span>
            <div className="cluster">
              <span className="pill pill--accent">🔥 Active</span>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="stat">
            <span className="eyebrow">Workouts</span>
            <span className="num">{stats?.totalSessions ?? '—'}</span>
          </div>
          <div className="stat">
            <span className="eyebrow">Lifts</span>
            <span className="num">{stats?.liftSessions ?? '—'}</span>
          </div>
          {(stats?.kmRan ?? 0) > 0 && (
            <div className="stat">
              <span className="eyebrow">Km ran</span>
              <span className="num">
                {stats!.kmRan.toFixed(0)}<span className="stat__unit">km</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Achievements ── */}
      <h2 className="eyebrow">Achievements</h2>
      <div className="scroll-row">
        {ACHIEVEMENTS.map((a, i) => (
          <div key={i} className={`surface compact${a.unlocked ? '' : ' card--inset'}`}>
            <span>{a.emoji}</span>
            <span className="eyebrow">{a.name}</span>
            <span className="muted">{a.desc}</span>
          </div>
        ))}
      </div>

      {/* ── Personal Records ── */}
      <h2 className="eyebrow">Personal Records</h2>
      {prs.length === 0 ? (
        <p className="muted">No PRs recorded yet.</p>
      ) : (
        <div className="surface card--bare">
          <div className="trend-">
            {prs.map(pr => (
              <div key={pr.exerciseName} className="trend-">
                <div className="stack">
                  <span>{pr.exerciseName}</span>
                </div>
                {pr.valueKg !== undefined && (
                  <span>
                    {pr.valueKg}<span className="faint">kg 1RM</span>
                  </span>
                )}
                <span className="pill pill--accent">PR</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Goals ── */}
      <h2 className="eyebrow">Goals</h2>
      <div className="stack">
        {GOALS.map(goal => {
          const pct = goal.lowerIsBetter
            ? Math.max(0, Math.min(100, (goal.target / goal.current) * 100))
            : Math.min(100, (goal.current / goal.target) * 100);
          const done = pct >= 100;
          return (
            <div key={goal.name} className="surface">
              <div className="row space-between align-center">
                <span>{goal.name}</span>
                <span className={`pill ${done ? 'pill--ok' : 'pill--warn'}`}>
                  {done ? 'Done' : 'In progress'}
                </span>
              </div>
              <div className="bar">
                <div
                  className="bar__fill"
                  style={{
                    '--fill': `${pct}%`,
                    '--bar-color': done ? 'var(--ok)' : 'var(--accent)',
                  } as React.CSSProperties}
                />
              </div>
              <div className="row space-between">
                <span className="mono muted">{goal.current} / {goal.target}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Tabs ── */}
      <div className="tabs">
        <button className={`tab${activeTab === 'activities' ? ' active' : ''}`} onClick={() => setActiveTab('activities')}>Activities</button>
        <button className={`tab${activeTab === 'health'     ? ' active' : ''}`} onClick={() => setActiveTab('health')}>Health</button>
        <button className={`tab${activeTab === 'nutrition'  ? ' active' : ''}`} onClick={() => setActiveTab('nutrition')}>Nutrition</button>
      </div>

      {activeTab === 'activities' && <ActivitiesTab />}
      {activeTab === 'health'     && <HealthTab />}
      {activeTab === 'nutrition'  && <NutritionScreen />}

    </div>
  );
}
```

Note: `NutritionScreen` is imported via relative path (`./NutritionScreen`) rather than the barrel (`@ui/layouts`) to avoid a circular import — both files live in the same barrel.

- [ ] **Step 2: Verify the build**

```bash
npm run build
```

Expected: No TypeScript errors.

- [ ] **Step 3: Manually verify each tab in the app**

Navigate to Profile and confirm:
- Hero section: avatar, name, stats
- Achievements scroll row, PRs list, Goals — all visible below hero
- Tab bar: Activities | Health | Nutrition
- **Activities tab**: empty state message ("No shared sessions yet…") — seed posts are authored by `user-jd`, `user-sr`, `user-dk`, not `user-001`
- **Health tab**: Body metrics grid (showing `—` if no data), Sleep placeholder, Injuries section
- **Nutrition tab**: Full nutrition logging UI renders identically to the old standalone tab
- Body metrics and injuries are NOT duplicated above the tab bar

- [ ] **Step 4: Commit**

```bash
git add ui/layouts/ProfileScreen.tsx
git commit -m "feat: restructure ProfileScreen with Activities/Health/Nutrition tabs"
```

---

### Task 6: Verify likes terminology

- [ ] **Step 1: Grep for "kudos" in source files**

```bash
grep -ri "kudos" ui/ app/ --include="*.tsx" --include="*.ts"
```

Expected: No matches. The social feed already uses `likeCount`, `likedByMe`, and heart emoji (❤️/🤍). No rename work is needed.

- [ ] **Step 2: Confirm in the running app**

Open the Social feed. Each post's action row shows `❤️ <count>` or `🤍 <count>` — no "kudos" text.

---

## Final Verification Checklist

- [ ] Mobile nav: Home · Workout · Messages · Social · Profile (Nutrition tab gone)
- [ ] Desktop rail: all previous tabs + Messages; Nutrition remains
- [ ] Tapping Messages navigates to `/messages` and shows MessageScreen (calls + messages), no crash
- [ ] Profile → Activities tab: empty state shown (no posts from user-001 in seed data)
- [ ] Profile → Health tab: body metrics grid, sleep placeholder, injuries section
- [ ] Profile → Nutrition tab: full nutrition logging UI, identical to before
- [ ] Achievements, PRs, Goals visible in hero — above the tab bar
- [ ] Body metrics and injuries NOT present in the hero section
- [ ] No "kudos" text visible anywhere in the UI
- [ ] `npm run build` exits clean
