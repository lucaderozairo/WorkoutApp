# C4: Typed Query Stubs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate every feature query file from the legacy `viewStore.get<T>('raw-string')` call to the typed `viewStore.get('key')` overload, so all ViewStore key references are compile-time checked against `ViewRegistry` in `data/projections/views/schema.ts`.

**Architecture:** `ViewStore.get()` already has two overloads. The typed overload (`get<K extends keyof ViewRegistry>(key: K): ViewRegistry[K] | undefined`) validates the key literal against `ViewRegistry` and infers the return type automatically. The legacy overload (`get<T = unknown>(key: string): T | undefined`) bypasses this. When a call site writes an explicit type param (`viewStore.get<Habit[]>('habits_today')`), TypeScript routes it to the legacy overload and the key string is unchecked. Removing the explicit type param lets the typed overload win — the key is validated, the return type is inferred. No new files needed; this is a pure migration of 12 query files.

**Tech Stack:** TypeScript — `tsc --noEmit` is the test (no runtime behaviour changes)

---

## File map

| Modify | `features/achievements/queries/index.ts` |
| Modify | `features/cardio/queries/index.ts` |
| Modify | `features/conditions/queries/index.ts` |
| Modify | `features/goals/queries/index.ts` |
| Modify | `features/habits/queries/index.ts` |
| Modify | `features/insights/queries/index.ts` |
| Modify | `features/news_feed/queries/index.ts` |
| Modify | `features/nutrition/queries/index.ts` |
| Modify | `features/planning/queries/index.ts` |
| Modify | `features/profile/queries/index.ts` |
| Modify | `features/progress_analysis/queries/index.ts` |
| Modify | `features/training_log/queries/index.ts` |

---

### Task 1: Migrate habits and goals queries (warm-up)

These are the smallest files. Use them to confirm the pattern before touching the larger ones.

**Files:**
- Modify: `features/habits/queries/index.ts`
- Modify: `features/goals/queries/index.ts`

**Pattern (applies to every file in this plan):**

```typescript
// BEFORE — legacy overload, key is an unchecked raw string:
viewStore.get<Habit[]>('habits_today')

// AFTER — typed overload, key is validated against ViewRegistry,
// return type is inferred as ViewRegistry['habits_today'] = Habit[]:
viewStore.get('habits_today')
```

The `?? []` / `?? null` fallbacks stay exactly as they are.

- [x] **Step 1: Update habits queries**

```typescript
// features/habits/queries/index.ts
import { viewStore } from '@data/projections/views';
import type { Id } from '@shared/types';
import type { Habit } from '../domain/types';

export function getHabitsToday(): Habit[] {
  return viewStore.get('habits_today') ?? [];
}

export function getHabitById(habitId: Id<'Habit'>): Habit | undefined {
  return getHabitsToday().find((habit) => habit.id === habitId);
}
```

- [x] **Step 2: Update goals queries**

```typescript
// features/goals/queries/index.ts
import { viewStore } from '@data/projections/views';
import type { Id } from '@shared/types';
import type { Goal } from '../domain/types';

export function getActiveGoals(): Goal[] {
  return viewStore.get('active_goals') ?? [];
}

export function getCompletedGoals(): Goal[] {
  return viewStore.get('completed_goals') ?? [];
}

export function getGoalById(goalId: Id<'Goal'>): Goal | undefined {
  return [...getActiveGoals(), ...getCompletedGoals()].find((goal) => goal.id === goalId);
}
```

- [x] **Step 3: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: 0 errors in habits and goals query files

- [ ] **Step 4: Commit**

```bash
git add features/habits/queries/index.ts features/goals/queries/index.ts
git commit -m "refactor(queries): use typed viewStore.get overload in habits and goals"
```

---

### Task 2: Migrate achievements and cardio queries

**Files:**
- Modify: `features/achievements/queries/index.ts`
- Modify: `features/cardio/queries/index.ts`

- [x] **Step 1: Update achievements queries**

Remove `<UserAchievement[]>` type param from the `viewStore.get` call:

```typescript
// features/achievements/queries/index.ts
import type { UserAchievement } from '../domain/types';
import { viewStore } from '@data/projections/views';
import { ACHIEVEMENT_DEFINITIONS, AchievementDef } from '../domain/types';

export interface AchievementView {
  id: string;
  name: string;
  description: string;
  rarity: AchievementDef['rarity'];
  unlocked: boolean;
  unlockedAt: number | null;
  progress: number;
}

export function getAchievements(): AchievementView[] {
  const userAchievements = viewStore.get('user_achievements') ?? [];

  return ACHIEVEMENT_DEFINITIONS.map(def => {
    const user = userAchievements.find(a => a.achievementId === def.id);
    return {
      id: def.id,
      name: def.name,
      description: def.description,
      rarity: def.rarity,
      unlocked: !!user?.unlockedAt,
      unlockedAt: user?.unlockedAt ?? null,
      progress: user?.progress ?? 0,
    };
  });
}

export function getUnlockedCount(): number {
  const userAchievements = viewStore.get('user_achievements') ?? [];
  return userAchievements.filter(a => a.unlockedAt).length;
}

export function getAchievementById(id: string): AchievementView | null {
  const achievements = getAchievements();
  return achievements.find(a => a.id === id) ?? null;
}
```

- [x] **Step 2: Update cardio queries**

```typescript
// features/cardio/queries/index.ts
import { viewStore } from '@data/projections/views';
import type { RecentCardioView, MonthlyCardioEntry } from '../projections';
import type { CardioSport } from '../domain/types';

export function getRecentCardioSessions(sport?: CardioSport): RecentCardioView {
  const view = viewStore.get('recent_cardio_sessions');
  if (!view) return { sessions: [] };
  return sport ? { sessions: view.sessions.filter(s => s.sport === sport) } : view;
}

export function getMonthlyProgression(sport?: CardioSport): MonthlyCardioEntry[] {
  const all = viewStore.get('monthly_cardio_progression') ?? [];
  return sport ? all.filter(m => m.sport === sport) : all;
}
```

- [x] **Step 3: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add features/achievements/queries/index.ts features/cardio/queries/index.ts
git commit -m "refactor(queries): use typed viewStore.get overload in achievements and cardio"
```

---

### Task 3: Migrate conditions, insights, news_feed, and nutrition queries

**Files:**
- Modify: `features/conditions/queries/index.ts`
- Modify: `features/insights/queries/index.ts`
- Modify: `features/news_feed/queries/index.ts`
- Modify: `features/nutrition/queries/index.ts`

For each file: read the current content, remove all explicit `<T>` type params from `viewStore.get<T>(key)` calls, let the typed overload infer the return types.

- [x] **Step 1: Apply the pattern to all four files**

Open each file. For every `viewStore.get<SomeType>('some_key')` call, change it to `viewStore.get('some_key')`. Do not change any other code. If a line reads `viewStore.get<WeatherCondition | null>('current_conditions')`, it becomes `viewStore.get('current_conditions')`.

- [x] **Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: 0 errors — TypeScript infers the same type it was previously annotated with

- [ ] **Step 3: Commit**

```bash
git add features/conditions/queries/index.ts features/insights/queries/index.ts features/news_feed/queries/index.ts features/nutrition/queries/index.ts
git commit -m "refactor(queries): use typed viewStore.get overload in conditions, insights, news_feed, nutrition"
```

---

### Task 4: Migrate planning and profile queries

**Files:**
- Modify: `features/planning/queries/index.ts`
- Modify: `features/profile/queries/index.ts`

- [x] **Step 1: Apply the pattern to both files** (same as Task 3 — remove explicit type params)

- [x] **Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add features/planning/queries/index.ts features/profile/queries/index.ts
git commit -m "refactor(queries): use typed viewStore.get overload in planning and profile"
```

---

### Task 5: Migrate progress_analysis and training_log queries

`training_log/queries/index.ts` is the largest — it has real logic and multiple keys. Read the full file before editing.

**Files:**
- Modify: `features/progress_analysis/queries/index.ts`
- Modify: `features/training_log/queries/index.ts`

- [x] **Step 1: Apply the pattern to progress_analysis queries** (remove explicit type params)

- [x] **Step 2: Apply the pattern to training_log queries**

This file uses multiple keys: `sessions`, `recent_exercises`, and possibly others. Remove `<T>` from each call. The logic and fallbacks (`?? null`, `?? []`) stay unchanged.

Example of what changes:
```typescript
// Before:
const state = viewStore.get<ActivitiesState>('sessions');

// After:
const state = viewStore.get('sessions');
// TypeScript now infers state as ActivitiesState | undefined — same as before
```

- [x] **Step 3: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: 0 errors across entire project

- [x] **Step 4: Run tests**

Run: `npx vitest run features/training_log features/progress_analysis`
Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add features/progress_analysis/queries/index.ts features/training_log/queries/index.ts
git commit -m "refactor(queries): use typed viewStore.get overload in progress_analysis and training_log"
```
