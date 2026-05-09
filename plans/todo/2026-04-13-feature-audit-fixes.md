# Feature Audit Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all gaps found in the 2026-04-13 feature audit: add missing manifest documentation for 3 features, decouple the achievements cross-feature violation using the existing event bus, and standardise inline reducers into dedicated files for consistency. UI/frontend work is explicitly out of scope — this plan only touches `features/` and `core/`.

**Architecture:** Event-sourced CQRS with `LAYER_RULES.md` enforcement. Features communicate only via `core/events/bus.ts` (publish/subscribe), never direct imports. Each feature follows: `domain/types.ts` → `domain/reducers.ts` → `projections/index.ts` → `commands/handlers.ts` → `queries/index.ts` → `index.ts` → `manifest.md`.

**Tech Stack:** TypeScript strict, custom CQRS framework (`@core/*`, `@data/*`, `@shared/types`)

---

## File Map

### Phase A — Missing Manifests (documentation only)

| Action | File |
|--------|------|
| Create | `features/nutrition/manifest.md` |
| Create | `features/stretching/manifest.md` |
| Create | `features/achievements/manifest.md` |

### Phase B — Decouple Achievements from Cross-Feature Imports

| Action | File |
|--------|------|
| Create | `features/achievements/policies/index.ts` — event bus subscriber that triggers achievement checks |
| Modify | `features/achievements/commands/handlers.ts` — remove direct imports of `@features/training_log` and `@features/cardio`; accept data as command payload |
| Modify | `features/achievements/domain/types.ts` — expand `CheckAchievements` command to carry session/cardio snapshot data |
| Modify | `features/training_log/commands/handlers.ts` — publish events to `core/events/bus` after session operations |
| Modify | `features/cardio/commands/handlers.ts` — publish events to `core/events/bus` after cardio operations |

### Phase C — Standardise Reducers

| Action | File |
|--------|------|
| Create | `features/nutrition/domain/reducers.ts` |
| Create | `features/stretching/domain/reducers.ts` |
| Create | `features/achievements/domain/reducers.ts` |
| Create | `features/conditions/domain/reducers.ts` |
| Create | `features/insights/domain/reducers.ts` |
| Create | `features/news_feed/domain/reducers.ts` |
| Create | `features/social/domain/reducers.ts` |
| Create | `features/progress_analysis/domain/reducers.ts` |
| Create | `features/readiness/domain/reducers.ts` |

---

## Phase A — Missing Manifests

### Task 1: Add manifest.md for nutrition feature

**Files:**
- Create: `features/nutrition/manifest.md`

- [ ] **Step 1: Create the manifest**

```markdown
# Feature: nutrition

Track daily food, supplement, vitamin, and water intake with optional macro tracking.

## Commands
`LogNutrition`, `DeleteNutritionEntry`

## Events
`NutritionLogged`, `NutritionEntryDeleted`

## Projections
`nutrition_log`

## Queries
`getNutritionLog()`, `getTodaysNutrition()`

## Dependencies
- `core/clock`, `core/id-generator`
- Reads from `data/projections/views`
- No direct UI imports
```

- [ ] **Step 2: Verify the manifest is accurate against code**

Run:

```bash
grep -n "export.*function\|export.*Projection\|type.*Event\|type.*Command" features/nutrition/commands/handlers.ts features/nutrition/projections/index.ts features/nutrition/queries/index.ts features/nutrition/domain/types.ts
```

Expected: every command handler, projection, query, event, and command type listed in the manifest should appear in the grep output.

- [ ] **Step 3: Commit**

```bash
git add features/nutrition/manifest.md
git commit -m "docs: add manifest.md for nutrition feature"
```

---

### Task 2: Add manifest.md for stretching feature

**Files:**
- Create: `features/stretching/manifest.md`

- [ ] **Step 1: Create the manifest**

```markdown
# Feature: stretching

Log stretching sessions with support for preset routines and custom sessions. Tracks completed vs planned stretches.

## Commands
`LogStretching`

## Events
`StretchingLogged`

## Projections
`stretching_log`

## Queries
`getStretchingLog()`

## Dependencies
- `core/clock`, `core/id-generator`
- Reads from `data/projections/views`
- No direct UI imports
```

- [ ] **Step 2: Verify the manifest is accurate against code**

Run:

```bash
grep -n "export.*function\|export.*Projection\|type.*Event\|type.*Command" features/stretching/commands/handlers.ts features/stretching/projections/index.ts features/stretching/queries/index.ts features/stretching/domain/types.ts
```

Expected: `handleLogStretching`, `stretchingLogProjection`, `getStretchingLog`, `StretchingEvent`, `StretchingCommand` all appear.

- [ ] **Step 3: Commit**

```bash
git add features/stretching/manifest.md
git commit -m "docs: add manifest.md for stretching feature"
```

---

### Task 3: Add manifest.md for achievements feature

**Files:**
- Create: `features/achievements/manifest.md`

- [ ] **Step 1: Create the manifest**

```markdown
# Feature: achievements

Track user achievements across workouts. Checks conditions (session counts, PR weights, cardio distances, consecutive day streaks) and unlocks achievements when thresholds are met.

## Commands
`CheckAchievements`

## Events
`AchievementUnlocked`, `AchievementProgressUpdated`, `AchievementCheckRequested`

## Projections
`user_achievements`

## Queries
`getAchievements()`, `getUnlockedCount()`, `getAchievementById(id)`

## Dependencies
- `core/clock`, `core/events`
- Reads from `data/projections/views`
- Subscribes to: `SessionFinished` (from training_log), `CardioSessionRecorded` (from cardio)
- No direct feature imports — cross-feature data arrives via event bus
```

- [ ] **Step 2: Commit**

```bash
git add features/achievements/manifest.md
git commit -m "docs: add manifest.md for achievements feature"
```

---

## Phase B — Decouple Achievements Cross-Feature Violation

The current `achievements/commands/handlers.ts` imports `getSessionHistory` from `@features/training_log` and `getRecentCardioSessions` from `@features/cardio`. This violates `LAYER_RULES.md` ("Cross-feature talks through events only").

The fix: achievements subscribes to training_log and cardio events via `core/events/bus.ts`. When a session finishes or cardio is recorded, the bus fires an event. Achievements' policy handler reacts by running achievement checks using only its own projections and data passed through the event payload.

### Task 4: Expand CheckAchievements command to accept snapshot data

**Files:**
- Modify: `features/achievements/domain/types.ts`

- [ ] **Step 1: Add snapshot types to domain/types.ts**

At the top of `features/achievements/domain/types.ts`, after the existing imports, add:

```typescript
// ─── Cross-Feature Snapshot Types ───────────────────────────
// These mirror the minimum data achievements needs from other features.
// Data arrives via event payloads, never direct feature imports.

export interface SessionSnapshot {
  category: string;
  name: string;
  hasPR: boolean;
  startedAt: number;
}

export interface CardioSnapshot {
  sport: string;
  distanceMeters: number;
}
```

Then update the `CheckAchievements` command interface:

Replace:

```typescript
export interface CheckAchievements {
  type: 'CheckAchievements';
  userId: Id<'User'>;
}
```

With:

```typescript
export interface CheckAchievements {
  type: 'CheckAchievements';
  userId: Id<'User'>;
  sessionHistory: SessionSnapshot[];
  cardioSessions: CardioSnapshot[];
}
```

- [ ] **Step 2: Build to check type errors surface**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: Type errors in `handlers.ts` because `CheckAchievements` now requires `sessionHistory` and `cardioSessions`. This is correct — we fix those in the next task.

- [ ] **Step 3: Commit**

```bash
git add features/achievements/domain/types.ts
git commit -m "refactor(achievements): expand CheckAchievements command with snapshot data

Preparation for removing cross-feature imports. Achievement checking
will receive session and cardio data via command payload instead of
importing from other features directly."
```

---

### Task 5: Rewrite achievements handler to use command payload instead of cross-feature imports

**Files:**
- Modify: `features/achievements/commands/handlers.ts`

- [ ] **Step 1: Replace the entire handlers.ts file**

```typescript
import type { Result } from '@shared/types';
import { ok } from '@shared/types';
import type {
  CheckAchievements,
  AchievementEvent,
  AchievementDef,
  UserAchievement,
  SessionSnapshot,
  CardioSnapshot,
} from '../domain/types';
import {
  ACHIEVEMENT_DEFINITIONS,
} from '../domain/types';
import { systemClock } from '@core/clock';
import { projectionRegistry } from '@data/projections/builders';
import { viewStore } from '@data/projections/views';
import { achievementsProjection } from '../projections';

projectionRegistry.register('user_achievements', achievementsProjection);

// ─── Achievement Checking Logic ──────────────────────────────

function checkSessionCount(
  def: AchievementDef,
  sessions: SessionSnapshot[],
): { unlocked: boolean; progress: number } {
  let count: number;

  const cond = def.condition;
  if (cond.sport === 'strength') {
    count = sessions.filter(s => s.category === 'strength').length;
  } else {
    count = sessions.length;
  }

  return {
    unlocked: count >= def.condition.threshold,
    progress: Math.min(count, def.condition.threshold),
  };
}

function checkPRWeight(
  def: AchievementDef,
  sessions: SessionSnapshot[],
): { unlocked: boolean; progress: number } {
  const exerciseName = def.condition.exerciseName!;

  let maxWeight = 0;
  for (const session of sessions) {
    if (session.hasPR && session.name.toLowerCase().includes(exerciseName.toLowerCase())) {
      maxWeight = def.condition.threshold;
    }
  }

  return {
    unlocked: maxWeight >= def.condition.threshold,
    progress: maxWeight,
  };
}

function checkCardioDistance(
  def: AchievementDef,
  cardioSessions: CardioSnapshot[],
): { unlocked: boolean; progress: number } {
  const sport = def.condition.sport;

  let maxDistance = 0;
  for (const s of cardioSessions) {
    if (s.sport === sport) {
      maxDistance = Math.max(maxDistance, s.distanceMeters);
    }
  }

  return {
    unlocked: maxDistance >= def.condition.threshold,
    progress: maxDistance,
  };
}

function checkConsecutiveDays(
  def: AchievementDef,
  sessions: SessionSnapshot[],
): { unlocked: boolean; progress: number } {
  if (sessions.length === 0) return { unlocked: false, progress: 0 };

  const daySet = new Set<string>();
  const now = new Date();
  for (const session of sessions) {
    const d = new Date(session.startedAt);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    daySet.add(key);
  }

  let streak = 0;
  for (let i = 0; i < def.condition.threshold + 10; i++) {
    const checkDate = new Date(now);
    checkDate.setDate(checkDate.getDate() - i);
    const key = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;
    if (daySet.has(key)) {
      streak++;
    } else {
      break;
    }
  }

  return {
    unlocked: streak >= def.condition.threshold,
    progress: streak,
  };
}

function checkAchievement(
  def: AchievementDef,
  currentAchievement: UserAchievement | undefined,
  sessions: SessionSnapshot[],
  cardioSessions: CardioSnapshot[],
): AchievementEvent[] {
  if (currentAchievement?.unlockedAt) return [];

  let result: { unlocked: boolean; progress: number };

  switch (def.condition.type) {
    case 'session_count':
      result = checkSessionCount(def, sessions);
      break;
    case 'pr_weight':
      result = checkPRWeight(def, sessions);
      break;
    case 'cardio_distance':
      result = checkCardioDistance(def, cardioSessions);
      break;
    case 'consecutive_days':
      result = checkConsecutiveDays(def, sessions);
      break;
    default:
      return [];
  }

  const events: AchievementEvent[] = [];

  if (result.unlocked && !currentAchievement?.unlockedAt) {
    events.push({
      type: 'AchievementUnlocked',
      aggregateId: cmd_userId(def),
      aggregateType: 'User',
      timestamp: systemClock.now(),
      version: 1,
      payload: {
        userId: 'user-001' as import('@shared/types').Id<'User'>,
        achievementId: def.id,
        unlockedAt: systemClock.now(),
      },
    });
  } else {
    events.push({
      type: 'AchievementProgressUpdated',
      aggregateId: 'user-001' as import('@shared/types').Id<'User'>,
      aggregateType: 'User',
      timestamp: systemClock.now(),
      version: 1,
      payload: {
        userId: 'user-001' as import('@shared/types').Id<'User'>,
        achievementId: def.id,
        progress: result.progress,
      },
    });
  }

  return events;
}

// ─── Command Handler ─────────────────────────────────────────

export async function handleCheckAchievements(cmd: CheckAchievements): Promise<Result<void, string>> {
  const currentState = viewStore.get<UserAchievement[]>('user_achievements') ?? [];
  const allEvents: AchievementEvent[] = [];

  for (const def of ACHIEVEMENT_DEFINITIONS) {
    const current = currentState.find(a => a.achievementId === def.id);
    const events = checkAchievement(def, current, cmd.sessionHistory, cmd.cardioSessions);
    allEvents.push(...events);
  }

  for (const event of allEvents) {
    achievementsProjection.apply(event);
  }

  viewStore.set('user_achievements', achievementsProjection.getState());

  return ok(undefined);
}
```

**Key changes:**
- Removed `import { getSessionHistory } from '@features/training_log'`
- Removed `import { getRecentCardioSessions } from '@features/cardio'`
- All check functions now take `sessions: SessionSnapshot[]` and `cardioSessions: CardioSnapshot[]` as parameters instead of calling cross-feature queries
- `handleCheckAchievements` reads data from `cmd.sessionHistory` and `cmd.cardioSessions`

- [ ] **Step 2: Build to verify no cross-feature imports remain**

```bash
grep -n "@features/" features/achievements/commands/handlers.ts
```

Expected: zero matches.

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: clean build (or only pre-existing errors unrelated to achievements).

- [ ] **Step 3: Commit**

```bash
git add features/achievements/commands/handlers.ts
git commit -m "refactor(achievements): remove cross-feature imports from handlers

Achievement checking now receives session and cardio data via the
CheckAchievements command payload. No more direct imports from
training_log or cardio features. Fixes LAYER_RULES.md violation."
```

---

### Task 6: Create achievements policy — event bus subscriber

**Files:**
- Create: `features/achievements/policies/index.ts`
- Modify: `features/achievements/index.ts` — re-export policy registration

- [ ] **Step 1: Create the policy file**

Create `features/achievements/policies/index.ts`:

```typescript
import { eventBus } from '@core/events/bus';
import { viewStore } from '@data/projections/views';
import { handleCheckAchievements } from '../commands/handlers';
import type { SessionSnapshot, CardioSnapshot } from '../domain/types';

/**
 * Achievement policies react to domain events from other features.
 * This is the sanctioned cross-feature communication path per LAYER_RULES.md:
 * features communicate through events, never direct imports.
 */

interface SessionHistoryItem {
  category: string;
  name: string;
  hasPR: boolean;
  startedAt: number;
}

interface CardioSessionView {
  sport: string;
  distanceMeters: number;
}

function buildSnapshots(): { sessions: SessionSnapshot[]; cardio: CardioSnapshot[] } {
  const sessionHistory = viewStore.get<SessionHistoryItem[]>('session_history') ?? [];
  const cardioView = viewStore.get<{ sessions: CardioSessionView[] }>('recent_cardio_sessions');

  const sessions: SessionSnapshot[] = sessionHistory.map(s => ({
    category: s.category,
    name: s.name,
    hasPR: s.hasPR,
    startedAt: s.startedAt,
  }));

  const cardio: CardioSnapshot[] = (cardioView?.sessions ?? []).map(s => ({
    sport: s.sport,
    distanceMeters: s.distanceMeters,
  }));

  return { sessions, cardio };
}

/**
 * Register event bus subscriptions for achievement checking.
 * Call this once during app initialization.
 */
export function registerAchievementPolicies(): void {
  // When a training session finishes, check achievements
  eventBus.subscribe('SessionFinished', async () => {
    const { sessions, cardio } = buildSnapshots();
    await handleCheckAchievements({
      type: 'CheckAchievements',
      userId: 'user-001' as import('@shared/types').Id<'User'>,
      sessionHistory: sessions,
      cardioSessions: cardio,
    });
  });

  // When a cardio session is recorded, check achievements
  eventBus.subscribe('CardioSessionRecorded', async () => {
    const { sessions, cardio } = buildSnapshots();
    await handleCheckAchievements({
      type: 'CheckAchievements',
      userId: 'user-001' as import('@shared/types').Id<'User'>,
      sessionHistory: sessions,
      cardioSessions: cardio,
    });
  });
}
```

**Design notes:**
- The policy reads from the ViewStore (shared projection views) not from feature modules. This is the "shared projections" path allowed by `LAYER_RULES.md`.
- `buildSnapshots()` converts ViewStore data into the `SessionSnapshot[]` / `CardioSnapshot[]` types that `CheckAchievements` expects.
- The `eventBus.subscribe` call uses the typed event bus from `core/events/bus.ts`.

- [ ] **Step 2: Update achievements index.ts to export the policy registration**

Replace `features/achievements/index.ts` with:

```typescript
export type {
  AchievementRarity,
  AchievementDef,
  AchievementCondition,
  UserAchievement,
  AchievementsState,
  AchievementEvent,
  AchievementUnlockedPayload,
  AchievementProgressUpdatedPayload,
  AchievementCheckRequestedPayload,
  AchievementCommand,
  CheckAchievements,
  SessionSnapshot,
  CardioSnapshot,
} from './domain/types';

export { ACHIEVEMENT_DEFINITIONS } from './domain/types';

export type { AchievementView } from './queries';

export { achievementsProjection } from './projections';

export { handleCheckAchievements } from './commands/handlers';

export { getAchievements, getUnlockedCount, getAchievementById } from './queries';

export { registerAchievementPolicies } from './policies';
```

- [ ] **Step 3: Build to verify**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: clean build. No cross-feature imports in achievements.

- [ ] **Step 4: Verify no cross-feature imports anywhere in achievements**

```bash
grep -rn "@features/" features/achievements/ --include="*.ts"
```

Expected: zero matches. Achievements now only imports from `@shared`, `@core`, and `@data`.

- [ ] **Step 5: Commit**

```bash
git add features/achievements/policies/index.ts features/achievements/index.ts
git commit -m "feat(achievements): add event bus policies for cross-feature communication

Achievements now subscribes to SessionFinished and CardioSessionRecorded
events via core/events/bus. Reads snapshot data from the shared ViewStore
and passes it to CheckAchievements as command payload. Zero cross-feature
imports — fully compliant with LAYER_RULES.md."
```

---

### Task 7: Publish events from training_log command handlers

**Files:**
- Modify: `features/training_log/commands/handlers.ts`

- [ ] **Step 1: Read the current handlers file**

```bash
grep -n "import\|export.*function\|eventBus" features/training_log/commands/handlers.ts
```

Review the file to understand the current import structure and handler functions.

- [ ] **Step 2: Add event bus import and publish call to handleFinishSession**

At the top of `features/training_log/commands/handlers.ts`, add:

```typescript
import { eventBus } from '@core/events/bus';
```

Then, inside `handleFinishSession`, after the events are applied to projections and the viewStore is updated, add:

```typescript
  // Notify other features via event bus
  await eventBus.publish({
    type: 'SessionFinished',
    aggregateId: cmd.sessionId,
    aggregateType: 'TrainingSession',
    timestamp: systemClock.now(),
    version: 1,
    payload: { sessionId: cmd.sessionId },
  });
```

Add this publish call just before the `return ok(undefined);` at the end of `handleFinishSession`.

- [ ] **Step 3: Build to verify**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: clean build.

- [ ] **Step 4: Commit**

```bash
git add features/training_log/commands/handlers.ts
git commit -m "feat(training_log): publish SessionFinished event to bus

Other features (achievements) can now subscribe to session completion
events via core/events/bus instead of importing training_log directly."
```

---

### Task 8: Publish events from cardio command handlers

**Files:**
- Modify: `features/cardio/commands/handlers.ts`

- [ ] **Step 1: Read the current handlers file**

```bash
grep -n "import\|export.*function\|eventBus" features/cardio/commands/handlers.ts
```

- [ ] **Step 2: Add event bus import and publish call to handleRecordCardioSession**

At the top of `features/cardio/commands/handlers.ts`, add:

```typescript
import { eventBus } from '@core/events/bus';
```

Then, inside `handleRecordCardioSession`, after the events are applied and viewStore is updated, add:

```typescript
  // Notify other features via event bus
  await eventBus.publish({
    type: 'CardioSessionRecorded',
    aggregateId: cmd.userId,
    aggregateType: 'User',
    timestamp: systemClock.now(),
    version: 1,
    payload: { userId: cmd.userId },
  });
```

Add this just before the `return ok(undefined);` at the end of `handleRecordCardioSession`.

- [ ] **Step 3: Build to verify**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: clean build.

- [ ] **Step 4: Commit**

```bash
git add features/cardio/commands/handlers.ts
git commit -m "feat(cardio): publish CardioSessionRecorded event to bus

Other features (achievements) can now subscribe to cardio session
events via core/events/bus instead of importing cardio directly."
```

---

## Phase C — Standardise Reducers

Nine features handle state transitions inline in their projection event handlers. Four features (training_log, profile, cardio, scheduling) have dedicated `domain/reducers.ts` files with pure reducer functions. For consistency, extract reducers from the inline projections into dedicated files.

### Task 9: Extract nutrition reducers

**Files:**
- Create: `features/nutrition/domain/reducers.ts`

- [ ] **Step 1: Create reducers file**

```typescript
import type { NutritionEvent, NutritionLoggedPayload, NutritionEntryDeletedPayload } from './types';

export interface NutritionEntryView {
  id: import('@shared/types').Id<'NutritionEntry'>;
  category: string;
  name: string;
  notes: string;
  time: string;
  macros: { kcal: number; proteinG: number; carbsG: number; fatG: number } | null;
  loggedAt: number;
}

export function applyNutritionLogged(state: NutritionEntryView[], event: NutritionEvent): NutritionEntryView[] {
  if (event.type !== 'NutritionLogged') return state;
  const p = event.payload as NutritionLoggedPayload;
  const entry: NutritionEntryView = {
    id: p.entryId,
    category: p.category,
    name: p.name,
    notes: p.notes,
    time: p.time,
    macros: p.macros,
    loggedAt: event.timestamp,
  };
  return [entry, ...state];
}

export function applyNutritionEntryDeleted(state: NutritionEntryView[], event: NutritionEvent): NutritionEntryView[] {
  if (event.type !== 'NutritionEntryDeleted') return state;
  return state.filter(e => e.id !== event.payload.entryId);
}
```

- [ ] **Step 2: Update projections to use the reducer functions**

Replace `features/nutrition/projections/index.ts` with:

```typescript
import type { NutritionEvent } from '../domain/types';
import { ProjectionBuilder } from '@data/projections/builders';
import { applyNutritionLogged, applyNutritionEntryDeleted } from '../domain/reducers';
import type { NutritionEntryView } from '../domain/reducers';

export type { NutritionEntryView };

/** `nutrition_log` — all nutrition entries, newest first */
export const nutritionLogProjection = new ProjectionBuilder<
  NutritionEntryView[],
  NutritionEvent
>(
  'nutrition_log',
  [],
  {
    NutritionLogged: applyNutritionLogged,
    NutritionEntryDeleted: applyNutritionEntryDeleted,
  }
);
```

- [ ] **Step 3: Build to verify**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: clean build. The `NutritionEntryView` type is now re-exported from projections so existing imports (`from '../projections'`) still work.

- [ ] **Step 4: Commit**

```bash
git add features/nutrition/domain/reducers.ts features/nutrition/projections/index.ts
git commit -m "refactor(nutrition): extract reducers into domain/reducers.ts"
```

---

### Task 10: Extract stretching reducers

**Files:**
- Create: `features/stretching/domain/reducers.ts`

- [ ] **Step 1: Create reducers file**

```typescript
import type { StretchingEvent, StretchingLoggedPayload } from './types';

export interface StretchingSessionView {
  id: import('@shared/types').Id<'StretchingSession'>;
  mode: string;
  routineName: string | null;
  durationMinutes: number;
  stretches: string[];
  completedStretches: string[];
  notes: string;
  loggedAt: number;
}

export function applyStretchingLogged(state: StretchingSessionView[], event: StretchingEvent): StretchingSessionView[] {
  if (event.type !== 'StretchingLogged') return state;
  const p = event.payload as StretchingLoggedPayload;
  const session: StretchingSessionView = {
    id: p.sessionId,
    mode: p.mode,
    routineName: p.routineName,
    durationMinutes: p.durationMinutes,
    stretches: p.stretches,
    completedStretches: p.completedStretches,
    notes: p.notes,
    loggedAt: event.timestamp,
  };
  return [session, ...state];
}
```

- [ ] **Step 2: Update projections to use the reducer**

Replace `features/stretching/projections/index.ts` with:

```typescript
import type { StretchingEvent } from '../domain/types';
import { ProjectionBuilder } from '@data/projections/builders';
import { applyStretchingLogged } from '../domain/reducers';
import type { StretchingSessionView } from '../domain/reducers';

export type { StretchingSessionView };

/** `stretching_log` — sorted session history, newest first */
export const stretchingLogProjection = new ProjectionBuilder<
  StretchingSessionView[],
  StretchingEvent
>(
  'stretching_log',
  [],
  {
    StretchingLogged: applyStretchingLogged,
  }
);
```

- [ ] **Step 3: Build to verify**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: clean build.

- [ ] **Step 4: Commit**

```bash
git add features/stretching/domain/reducers.ts features/stretching/projections/index.ts
git commit -m "refactor(stretching): extract reducers into domain/reducers.ts"
```

---

### Task 11: Extract achievements reducers

**Files:**
- Create: `features/achievements/domain/reducers.ts`

- [ ] **Step 1: Create reducers file**

```typescript
import type {
  AchievementEvent,
  AchievementUnlockedPayload,
  AchievementProgressUpdatedPayload,
  UserAchievement,
} from './types';

export function applyAchievementUnlocked(state: UserAchievement[], event: AchievementEvent): UserAchievement[] {
  if (event.type !== 'AchievementUnlocked') return state;
  const p = event.payload as AchievementUnlockedPayload;
  const existing = state.find(a => a.achievementId === p.achievementId);
  if (existing) {
    return state.map(a =>
      a.achievementId === p.achievementId
        ? { ...a, unlockedAt: p.unlockedAt, progress: 100 }
        : a
    );
  }
  return [
    ...state,
    { achievementId: p.achievementId, unlockedAt: p.unlockedAt, progress: 100 },
  ];
}

export function applyAchievementProgressUpdated(state: UserAchievement[], event: AchievementEvent): UserAchievement[] {
  if (event.type !== 'AchievementProgressUpdated') return state;
  const p = event.payload as AchievementProgressUpdatedPayload;
  const existing = state.find(a => a.achievementId === p.achievementId);
  if (existing) {
    return state.map(a =>
      a.achievementId === p.achievementId
        ? { ...a, progress: p.progress }
        : a
    );
  }
  return [
    ...state,
    { achievementId: p.achievementId, unlockedAt: null, progress: p.progress },
  ];
}

export function applyAchievementCheckRequested(state: UserAchievement[]): UserAchievement[] {
  return state;
}
```

- [ ] **Step 2: Update projections to use reducer functions**

Replace `features/achievements/projections/index.ts` with:

```typescript
import type { AchievementEvent, UserAchievement } from '../domain/types';
import { ProjectionBuilder } from '@data/projections/builders';
import {
  applyAchievementUnlocked,
  applyAchievementProgressUpdated,
  applyAchievementCheckRequested,
} from '../domain/reducers';

/** `user_achievements` — all user achievements with unlock status */
export const achievementsProjection = new ProjectionBuilder<
  UserAchievement[],
  AchievementEvent
>(
  'user_achievements',
  [],
  {
    AchievementUnlocked: applyAchievementUnlocked,
    AchievementProgressUpdated: applyAchievementProgressUpdated,
    AchievementCheckRequested: applyAchievementCheckRequested,
  }
);
```

- [ ] **Step 3: Build to verify**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: clean build.

- [ ] **Step 4: Commit**

```bash
git add features/achievements/domain/reducers.ts features/achievements/projections/index.ts
git commit -m "refactor(achievements): extract reducers into domain/reducers.ts"
```

---

### Task 12: Extract conditions reducers

**Files:**
- Create: `features/conditions/domain/reducers.ts`
- Modify: `features/conditions/projections/index.ts`

- [ ] **Step 1: Read the current projections file**

```bash
cat features/conditions/projections/index.ts
```

- [ ] **Step 2: Create reducers file based on the inline projection handlers**

Extract each event handler into a named pure function in `features/conditions/domain/reducers.ts`. The function signatures must match `(state: TState, event: TEvent) => TState` to be compatible with `ProjectionBuilder`.

- [ ] **Step 3: Update projections to reference the new reducer functions**

Replace inline handlers with imported reducer function references, following the same pattern as Tasks 9-11.

- [ ] **Step 4: Build to verify**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 5: Commit**

```bash
git add features/conditions/domain/reducers.ts features/conditions/projections/index.ts
git commit -m "refactor(conditions): extract reducers into domain/reducers.ts"
```

---

### Task 13: Extract insights reducers

**Files:**
- Create: `features/insights/domain/reducers.ts`
- Modify: `features/insights/projections/index.ts`

- [ ] **Step 1: Read the current projections file**

```bash
cat features/insights/projections/index.ts
```

- [ ] **Step 2: Create reducers file based on inline projection handlers**

Extract each event handler into a named pure function.

- [ ] **Step 3: Update projections to reference the new reducer functions**

- [ ] **Step 4: Build to verify**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 5: Commit**

```bash
git add features/insights/domain/reducers.ts features/insights/projections/index.ts
git commit -m "refactor(insights): extract reducers into domain/reducers.ts"
```

---

### Task 14: Extract news_feed reducers

**Files:**
- Create: `features/news_feed/domain/reducers.ts`
- Modify: `features/news_feed/projections/index.ts`

- [ ] **Step 1: Read the current projections file**

```bash
cat features/news_feed/projections/index.ts
```

- [ ] **Step 2: Create reducers file based on inline projection handlers**

- [ ] **Step 3: Update projections to reference the new reducer functions**

- [ ] **Step 4: Build to verify**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 5: Commit**

```bash
git add features/news_feed/domain/reducers.ts features/news_feed/projections/index.ts
git commit -m "refactor(news_feed): extract reducers into domain/reducers.ts"
```

---

### Task 15: Extract social reducers

**Files:**
- Create: `features/social/domain/reducers.ts`
- Modify: `features/social/projections/index.ts`

- [ ] **Step 1: Read the current projections file**

```bash
cat features/social/projections/index.ts
```

- [ ] **Step 2: Create reducers file based on inline projection handlers**

- [ ] **Step 3: Update projections to reference the new reducer functions**

- [ ] **Step 4: Build to verify**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 5: Commit**

```bash
git add features/social/domain/reducers.ts features/social/projections/index.ts
git commit -m "refactor(social): extract reducers into domain/reducers.ts"
```

---

### Task 16: Extract progress_analysis reducers

**Files:**
- Create: `features/progress_analysis/domain/reducers.ts`
- Modify: `features/progress_analysis/projections/index.ts`

- [ ] **Step 1: Read the current projections file**

```bash
cat features/progress_analysis/projections/index.ts
```

- [ ] **Step 2: Create reducers file based on inline projection handlers**

- [ ] **Step 3: Update projections to reference the new reducer functions**

- [ ] **Step 4: Build to verify**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 5: Commit**

```bash
git add features/progress_analysis/domain/reducers.ts features/progress_analysis/projections/index.ts
git commit -m "refactor(progress_analysis): extract reducers into domain/reducers.ts"
```

---

### Task 17: Extract readiness reducers

**Files:**
- Create: `features/readiness/domain/reducers.ts`
- Modify: `features/readiness/projections/index.ts`

- [ ] **Step 1: Read the current projections file**

```bash
cat features/readiness/projections/index.ts
```

- [ ] **Step 2: Create reducers file based on inline projection handlers**

- [ ] **Step 3: Update projections to reference the new reducer functions**

- [ ] **Step 4: Build to verify**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 5: Commit**

```bash
git add features/readiness/domain/reducers.ts features/readiness/projections/index.ts
git commit -m "refactor(readiness): extract reducers into domain/reducers.ts"
```

---

## Final Verification

### Task 18: Full build and cross-feature import audit

**Files:**
- No files modified — verification only

- [ ] **Step 1: Full TypeScript build**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 2: Audit cross-feature imports**

```bash
grep -rn "from '@features/" features/ --include="*.ts" | grep -v "__tests__"
```

Expected: zero results. No feature should import from another feature.

- [ ] **Step 3: Verify all 13 features have manifest.md**

```bash
for dir in features/*/; do
  name=$(basename "$dir")
  if [ -f "$dir/manifest.md" ]; then
    echo "OK: $name"
  else
    echo "MISSING: $name"
  fi
done
```

Expected: all 13 features report `OK`.

- [ ] **Step 4: Verify all 13 features have domain/reducers.ts**

```bash
for dir in features/*/; do
  name=$(basename "$dir")
  if [ -f "$dir/domain/reducers.ts" ]; then
    echo "OK: $name"
  else
    echo "MISSING: $name"
  fi
done
```

Expected: all 13 features report `OK`.

- [ ] **Step 5: Vite build**

```bash
npx vite build
```

Expected: build succeeds with no warnings related to feature modules.

---

## Summary

| Task | Phase | Description | Risk |
|------|-------|-------------|------|
| 1 | A | Nutrition manifest.md | None |
| 2 | A | Stretching manifest.md | None |
| 3 | A | Achievements manifest.md | None |
| 4 | B | Expand CheckAchievements command type | Low — type-only change |
| 5 | B | Rewrite achievements handler (remove cross-feature imports) | Medium — logic change |
| 6 | B | Create achievements event bus policies | Medium — new wiring |
| 7 | B | Publish SessionFinished from training_log | Low — additive change |
| 8 | B | Publish CardioSessionRecorded from cardio | Low — additive change |
| 9 | C | Extract nutrition reducers | Low — mechanical refactor |
| 10 | C | Extract stretching reducers | Low — mechanical refactor |
| 11 | C | Extract achievements reducers | Low — mechanical refactor |
| 12 | C | Extract conditions reducers | Low — mechanical refactor |
| 13 | C | Extract insights reducers | Low — mechanical refactor |
| 14 | C | Extract news_feed reducers | Low — mechanical refactor |
| 15 | C | Extract social reducers | Low — mechanical refactor |
| 16 | C | Extract progress_analysis reducers | Low — mechanical refactor |
| 17 | C | Extract readiness reducers | Low — mechanical refactor |
| 18 | — | Final verification | None |

**Total:** 18 tasks across 3 phases + final verification. Each task is independently committable.
