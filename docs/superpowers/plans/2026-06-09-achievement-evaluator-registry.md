# Achievement Evaluator Registry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the switch-dispatcher in `checkAchievement()` with a typed evaluator registry so adding a new achievement condition type requires only adding a file and registering it — no switch edits, no function-signature changes.

**Architecture:** Each condition type becomes an `AchievementEvaluator` — a pure function registered in a map keyed by condition type. `checkAchievement()` becomes a one-liner: look up evaluator, call it with context. The circular `viewStore` read is eliminated by passing the needed data via `EvalContext`. All evaluators live in `features/achievements/domain/evaluators/`.

**Tech Stack:** TypeScript, Vitest.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `features/achievements/domain/evaluators/types.ts` | `AchievementEvaluator` interface + `EvalContext` type |
| Create | `features/achievements/domain/evaluators/sessionCount.ts` | `session_count` evaluator |
| Create | `features/achievements/domain/evaluators/prWeight.ts` | `pr_weight` evaluator |
| Create | `features/achievements/domain/evaluators/cardioDistance.ts` | `cardio_distance` evaluator |
| Create | `features/achievements/domain/evaluators/consecutiveDays.ts` | `consecutive_days` evaluator |
| Create | `features/achievements/domain/evaluators/registry.ts` | Registry map + `getEvaluator()` |
| Create | `features/achievements/domain/evaluators/index.ts` | Re-exports |
| Create | `features/achievements/domain/evaluators/evaluators.test.ts` | Unit tests for all evaluators |
| Modify | `features/achievements/commands/handlers.ts` | Replace switch with registry lookup |

---

## Task 1: Define AchievementEvaluator interface and EvalContext

**Files:**
- Create: `features/achievements/domain/evaluators/types.ts`

- [ ] **Step 1.1: Create the types file**

```typescript
import type { SessionSnapshot, CardioSnapshot, AchievementDef } from '../types';

export interface EvalContext {
  sessions: SessionSnapshot[];
  cardioSessions: CardioSnapshot[];
}

export interface EvalResult {
  unlocked: boolean;
  progress: number;
}

export interface AchievementEvaluator {
  conditionType: string;
  check(def: AchievementDef, ctx: EvalContext): EvalResult;
}
```

- [ ] **Step 1.2: Commit**

```bash
git add features/achievements/domain/evaluators/types.ts
git commit -m "feat(achievements): add AchievementEvaluator interface and EvalContext types"
```

---

## Task 2: Create the four evaluators

**Files:**
- Create: `features/achievements/domain/evaluators/sessionCount.ts`
- Create: `features/achievements/domain/evaluators/prWeight.ts`
- Create: `features/achievements/domain/evaluators/cardioDistance.ts`
- Create: `features/achievements/domain/evaluators/consecutiveDays.ts`
- Create: `features/achievements/domain/evaluators/evaluators.test.ts`

- [ ] **Step 2.1: Write failing unit tests**

Create `features/achievements/domain/evaluators/evaluators.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { sessionCountEvaluator } from './sessionCount';
import { prWeightEvaluator } from './prWeight';
import { cardioDistanceEvaluator } from './cardioDistance';
import { consecutiveDaysEvaluator } from './consecutiveDays';
import type { AchievementDef, SessionSnapshot, CardioSnapshot } from '../types';
import type { EvalContext } from './types';

// ── Helpers ──────────────────────────────────────────────────

function makeSession(overrides: Partial<SessionSnapshot> = {}): SessionSnapshot {
  return {
    id: 'sess-1',
    name: 'Workout',
    category: 'strength',
    startedAt: Date.now(),
    hasPR: false,
    ...overrides,
  };
}

function makeCardio(overrides: Partial<CardioSnapshot> = {}): CardioSnapshot {
  return {
    id: 'c-1',
    sport: 'running',
    startedAt: Date.now(),
    distanceMeters: 5000,
    durationSeconds: 1800,
    ...overrides,
  };
}

function makeDef(condition: AchievementDef['condition']): AchievementDef {
  return { id: 'ach-1', name: 'Test', description: '', condition };
}

// ── sessionCount ─────────────────────────────────────────────

describe('sessionCountEvaluator', () => {
  it('unlocks when session count meets threshold', () => {
    const def = makeDef({ type: 'session_count', threshold: 3 });
    const ctx: EvalContext = {
      sessions: [makeSession(), makeSession(), makeSession()],
      cardioSessions: [],
    };
    expect(sessionCountEvaluator.check(def, ctx).unlocked).toBe(true);
    expect(sessionCountEvaluator.check(def, ctx).progress).toBe(3);
  });

  it('does not unlock below threshold', () => {
    const def = makeDef({ type: 'session_count', threshold: 5 });
    const ctx: EvalContext = { sessions: [makeSession()], cardioSessions: [] };
    expect(sessionCountEvaluator.check(def, ctx).unlocked).toBe(false);
    expect(sessionCountEvaluator.check(def, ctx).progress).toBe(1);
  });

  it('filters by sport when specified', () => {
    const def = makeDef({ type: 'session_count', threshold: 2, sport: 'strength' });
    const ctx: EvalContext = {
      sessions: [makeSession({ category: 'strength' }), makeSession({ category: 'cardio' })],
      cardioSessions: [],
    };
    expect(sessionCountEvaluator.check(def, ctx).unlocked).toBe(false);
    expect(sessionCountEvaluator.check(def, ctx).progress).toBe(1);
  });
});

// ── prWeight ─────────────────────────────────────────────────

describe('prWeightEvaluator', () => {
  it('unlocks when session has a PR for the exercise', () => {
    const def = makeDef({ type: 'pr_weight', threshold: 100, exerciseName: 'Squat' });
    const ctx: EvalContext = {
      sessions: [makeSession({ hasPR: true, name: 'Squat Day' })],
      cardioSessions: [],
    };
    expect(prWeightEvaluator.check(def, ctx).unlocked).toBe(true);
  });

  it('does not unlock without PR', () => {
    const def = makeDef({ type: 'pr_weight', threshold: 100, exerciseName: 'Squat' });
    const ctx: EvalContext = {
      sessions: [makeSession({ hasPR: false, name: 'Squat Day' })],
      cardioSessions: [],
    };
    expect(prWeightEvaluator.check(def, ctx).unlocked).toBe(false);
  });
});

// ── cardioDistance ───────────────────────────────────────────

describe('cardioDistanceEvaluator', () => {
  it('unlocks when max distance meets threshold', () => {
    const def = makeDef({ type: 'cardio_distance', threshold: 5000, sport: 'running' });
    const ctx: EvalContext = {
      sessions: [],
      cardioSessions: [makeCardio({ distanceMeters: 5000, sport: 'running' })],
    };
    expect(cardioDistanceEvaluator.check(def, ctx).unlocked).toBe(true);
  });

  it('does not unlock for wrong sport', () => {
    const def = makeDef({ type: 'cardio_distance', threshold: 5000, sport: 'cycling' });
    const ctx: EvalContext = {
      sessions: [],
      cardioSessions: [makeCardio({ distanceMeters: 5000, sport: 'running' })],
    };
    expect(cardioDistanceEvaluator.check(def, ctx).unlocked).toBe(false);
  });
});

// ── consecutiveDays ──────────────────────────────────────────

describe('consecutiveDaysEvaluator', () => {
  it('unlocks for consecutive days at threshold', () => {
    const now = new Date();
    const sessions: SessionSnapshot[] = [0, 1, 2, 3].map(daysAgo => {
      const d = new Date(now);
      d.setDate(d.getDate() - daysAgo);
      return makeSession({ startedAt: d.getTime() });
    });
    const def = makeDef({ type: 'consecutive_days', threshold: 4 });
    const ctx: EvalContext = { sessions, cardioSessions: [] };
    expect(consecutiveDaysEvaluator.check(def, ctx).unlocked).toBe(true);
  });

  it('does not unlock when streak is broken', () => {
    const now = new Date();
    const sessions: SessionSnapshot[] = [0, 2].map(daysAgo => {
      const d = new Date(now);
      d.setDate(d.getDate() - daysAgo);
      return makeSession({ startedAt: d.getTime() });
    });
    const def = makeDef({ type: 'consecutive_days', threshold: 2 });
    const ctx: EvalContext = { sessions, cardioSessions: [] };
    expect(consecutiveDaysEvaluator.check(def, ctx).unlocked).toBe(false);
  });
});
```

- [ ] **Step 2.2: Run tests — fail**

```bash
npx vitest run features/achievements/domain/evaluators/evaluators.test.ts
```
Expected: FAIL — modules not found

- [ ] **Step 2.3: Create `sessionCount.ts`**

```typescript
import type { AchievementEvaluator, EvalResult, EvalContext } from './types';
import type { AchievementDef } from '../types';

export const sessionCountEvaluator: AchievementEvaluator = {
  conditionType: 'session_count',
  check(def: AchievementDef, ctx: EvalContext): EvalResult {
    const cond = def.condition;
    let count: number;
    if (cond.sport === 'strength') {
      count = ctx.sessions.filter(s => s.category === 'strength').length;
    } else {
      count = ctx.sessions.length;
    }
    return {
      unlocked: count >= cond.threshold,
      progress: Math.min(count, cond.threshold),
    };
  },
};
```

- [ ] **Step 2.4: Create `prWeight.ts`**

```typescript
import type { AchievementEvaluator, EvalResult, EvalContext } from './types';
import type { AchievementDef } from '../types';

export const prWeightEvaluator: AchievementEvaluator = {
  conditionType: 'pr_weight',
  check(def: AchievementDef, ctx: EvalContext): EvalResult {
    const exerciseName = def.condition.exerciseName ?? '';
    let maxWeight = 0;
    for (const session of ctx.sessions) {
      if (session.hasPR && session.name.toLowerCase().includes(exerciseName.toLowerCase())) {
        maxWeight = def.condition.threshold;
      }
    }
    return {
      unlocked: maxWeight >= def.condition.threshold,
      progress: maxWeight,
    };
  },
};
```

- [ ] **Step 2.5: Create `cardioDistance.ts`**

```typescript
import type { AchievementEvaluator, EvalResult, EvalContext } from './types';
import type { AchievementDef } from '../types';

export const cardioDistanceEvaluator: AchievementEvaluator = {
  conditionType: 'cardio_distance',
  check(def: AchievementDef, ctx: EvalContext): EvalResult {
    const sport = def.condition.sport;
    let maxDistance = 0;
    for (const s of ctx.cardioSessions) {
      if (s.sport === sport) {
        maxDistance = Math.max(maxDistance, s.distanceMeters);
      }
    }
    return {
      unlocked: maxDistance >= def.condition.threshold,
      progress: maxDistance,
    };
  },
};
```

- [ ] **Step 2.6: Create `consecutiveDays.ts`**

```typescript
import type { AchievementEvaluator, EvalResult, EvalContext } from './types';
import type { AchievementDef } from '../types';

export const consecutiveDaysEvaluator: AchievementEvaluator = {
  conditionType: 'consecutive_days',
  check(def: AchievementDef, ctx: EvalContext): EvalResult {
    if (ctx.sessions.length === 0) return { unlocked: false, progress: 0 };

    const dayKey = (date: Date) =>
      `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

    const daySet = new Set(ctx.sessions.map(s => dayKey(new Date(s.startedAt))));

    const now = new Date();
    let streak = 0;
    for (let i = 0; i < def.condition.threshold + 10; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      if (daySet.has(dayKey(d))) {
        streak++;
      } else {
        break;
      }
    }

    return {
      unlocked: streak >= def.condition.threshold,
      progress: streak,
    };
  },
};
```

- [ ] **Step 2.7: Run tests — pass**

```bash
npx vitest run features/achievements/domain/evaluators/evaluators.test.ts
```
Expected: PASS (all tests)

- [ ] **Step 2.8: Commit**

```bash
git add features/achievements/domain/evaluators/
git commit -m "feat(achievements): add pure evaluator functions for all 4 condition types"
```

---

## Task 3: Create the evaluator registry

**Files:**
- Create: `features/achievements/domain/evaluators/registry.ts`
- Create: `features/achievements/domain/evaluators/index.ts`

- [ ] **Step 3.1: Create `registry.ts`**

```typescript
import type { AchievementEvaluator, EvalContext, EvalResult } from './types';
import type { AchievementDef } from '../types';
import { sessionCountEvaluator } from './sessionCount';
import { prWeightEvaluator } from './prWeight';
import { cardioDistanceEvaluator } from './cardioDistance';
import { consecutiveDaysEvaluator } from './consecutiveDays';

const evaluators: Map<string, AchievementEvaluator> = new Map([
  [sessionCountEvaluator.conditionType, sessionCountEvaluator],
  [prWeightEvaluator.conditionType, prWeightEvaluator],
  [cardioDistanceEvaluator.conditionType, cardioDistanceEvaluator],
  [consecutiveDaysEvaluator.conditionType, consecutiveDaysEvaluator],
]);

export function checkAchievementCondition(
  def: AchievementDef,
  ctx: EvalContext,
): EvalResult {
  const evaluator = evaluators.get(def.condition.type);
  if (!evaluator) return { unlocked: false, progress: 0 };
  return evaluator.check(def, ctx);
}
```

- [ ] **Step 3.2: Create `index.ts`**

```typescript
export { checkAchievementCondition } from './registry';
export type { EvalContext, EvalResult, AchievementEvaluator } from './types';
```

- [ ] **Step 3.3: Write a test for the registry dispatch**

Add to `evaluators.test.ts`:

```typescript
import { checkAchievementCondition } from './registry';

describe('checkAchievementCondition registry', () => {
  it('dispatches to the correct evaluator', () => {
    const def = makeDef({ type: 'session_count', threshold: 2 });
    const ctx: EvalContext = { sessions: [makeSession(), makeSession()], cardioSessions: [] };
    expect(checkAchievementCondition(def, ctx).unlocked).toBe(true);
  });

  it('returns unlocked:false for unknown condition type', () => {
    const def = makeDef({ type: 'unknown_type' as AchievementDef['condition']['type'], threshold: 1 });
    const ctx: EvalContext = { sessions: [], cardioSessions: [] };
    expect(checkAchievementCondition(def, ctx).unlocked).toBe(false);
  });
});
```

- [ ] **Step 3.4: Run tests — pass**

```bash
npx vitest run features/achievements/domain/evaluators/evaluators.test.ts
```

- [ ] **Step 3.5: Commit**

```bash
git add features/achievements/domain/evaluators/registry.ts features/achievements/domain/evaluators/index.ts
git commit -m "feat(achievements): add evaluator registry — checkAchievementCondition dispatches by type"
```

---

## Task 4: Wire registry into the command handler

**Files:**
- Modify: `features/achievements/commands/handlers.ts`

- [ ] **Step 4.1: Write test to confirm handler still works after refactor**

Add to or create `features/achievements/commands/handlers.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { handleCheckAchievements } from './handlers';
import { viewStore } from '@data/projections/views';
import type { UserAchievement } from '../domain/types';
import type { SessionSnapshot } from '../domain/types';
import type { Id } from '@shared/types';

function makeSession(startedAt: number): SessionSnapshot {
  return {
    id: `sess-${startedAt}`,
    name: 'Test',
    category: 'strength',
    startedAt,
    hasPR: false,
  };
}

beforeEach(() => {
  viewStore.set('user_achievements', []);
});

describe('handleCheckAchievements', () => {
  it('unlocks achievement when condition met', async () => {
    const sessions: SessionSnapshot[] = Array.from({ length: 10 }, (_, i) =>
      makeSession(Date.now() - i * 86400000),
    );

    await handleCheckAchievements({
      type: 'CheckAchievements',
      userId: 'u-1' as Id<'User'>,
      sessionHistory: sessions,
      cardioSessions: [],
    });

    const achievements = viewStore.get<UserAchievement[]>('user_achievements') ?? [];
    const unlocked = achievements.filter(a => a.unlockedAt !== undefined);
    expect(unlocked.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 4.2: Run test — pass (baseline before refactor)**

```bash
npx vitest run features/achievements/commands/handlers.test.ts
```
Expected: PASS

- [ ] **Step 4.3: Replace switch in handlers.ts with registry call**

In `features/achievements/commands/handlers.ts`:

Add import:

```typescript
import { checkAchievementCondition } from '../domain/evaluators';
import type { EvalContext } from '../domain/evaluators';
```

Replace the `checkAchievement` function:

```typescript
function checkAchievement(
  def: AchievementDef,
  currentAchievement: UserAchievement | undefined,
  ctx: EvalContext,
): AchievementEvent[] {
  if (currentAchievement?.unlockedAt) return [];

  const result = checkAchievementCondition(def, ctx);
  const events: AchievementEvent[] = [];

  if (result.unlocked && !currentAchievement?.unlockedAt) {
    events.push({
      type: 'AchievementUnlocked',
      aggregateId: 'user-001' as import('@shared/types').Id<'User'>,
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
```

Update the call site in `handleCheckAchievements.execute`:

```typescript
execute: async (cmd) => {
  const currentState = viewStore.get<UserAchievement[]>('user_achievements') ?? [];
  const allEvents: AchievementEvent[] = [];

  const ctx: EvalContext = {
    sessions: cmd.sessionHistory,
    cardioSessions: cmd.cardioSessions,
  };

  for (const def of ACHIEVEMENT_DEFINITIONS) {
    const current = currentState.find(a => a.achievementId === def.id);
    const events = checkAchievement(def, current, ctx);
    allEvents.push(...events);
  }

  for (const event of allEvents) {
    achievementsProjection.apply(event);
  }
  viewStore.set('user_achievements', achievementsProjection.getState());

  return { events: allEvents, result: ok(undefined) };
},
```

Delete the now-dead functions: `checkSessionCount`, `checkPRWeight`, `checkCardioDistance`, `checkConsecutiveDays`.

- [ ] **Step 4.4: Run all achievement tests — pass**

```bash
npx vitest run features/achievements
```
Expected: PASS

- [ ] **Step 4.5: `npx tsc --noEmit` — 0 errors**

- [ ] **Step 4.6: Commit**

```bash
git add features/achievements/commands/handlers.ts features/achievements/commands/handlers.test.ts
git commit -m "refactor(achievements): replace switch dispatcher with evaluator registry"
```
