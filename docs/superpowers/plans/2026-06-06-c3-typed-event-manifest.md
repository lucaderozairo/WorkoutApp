# C3: Typed Event Manifest Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a single `EventManifest` type in `shared/contracts/event-manifest.ts` that maps every cross-feature event type string to its payload type. Make `EventBus.subscribe()` generic over this manifest so policies get a compile-time error if they subscribe to an unknown event type or receive the wrong payload shape.

**Architecture:** Six features already export `EventPayloads` maps from their `contract.ts` files (`cardio`, `goals`, `habits`, `profile`, `training_log`, `training_plans`). The manifest is an intersection of those maps. `EventBusImpl.subscribe()` in `core/events/bus.ts` gains a typed overload — callers that pass a manifest key get a strongly-typed handler; the legacy untyped overload remains for feature-internal projections. No event payload types move; the manifest is purely a type-level aggregation.

**Tech Stack:** TypeScript — validation is `tsc --noEmit`. No runtime changes needed; overloads are erased at compile time.

---

## File map

| Create | `shared/contracts/event-manifest.ts` |
| Modify | `core/events/bus.ts` — add typed subscribe overload |
| Modify | `features/habits/policies/streakMilestones.ts` |
| Modify | `features/profile/policies/equipment.ts` |
| Modify | `features/training_plans/policies/trackAdherence.ts` |
| Modify | `features/achievements/policies/index.ts` |
| Modify | `features/coaching/policies/generateInsights.ts` |
| Modify | `features/goals/policies/updateGoals.ts` |
| Modify | `features/progression/policies/updateProgression.ts` |

---

### Task 1: Create the EventManifest

**Files:**
- Create: `shared/contracts/event-manifest.ts`

The manifest aggregates the per-feature `EventPayloads` types that already exist in contract files. Six features have them; they are intersected here into one map.

> **Layering note:** `shared/contracts/` sits below `features/` in the dependency hierarchy. Importing from feature contract files here is a pragmatic compromise — the same pattern is used by `data/projections/views/schema.ts`. Track with a `TODO(arch)` comment.

- [x] **Step 1: Write the manifest**

```typescript
// shared/contracts/event-manifest.ts

// TODO(arch): shared/contracts should not import from features — this is the same
// pragmatic exception used by data/projections/views/schema.ts. Once payload types
// are stable, consider moving cross-feature payloads to shared/contracts directly.

/* eslint-disable boundaries/element-types -- TODO(arch) */
import type { TrainingLogEventPayloads } from '@features/training_log/contract';
import type { CardioEventPayloads } from '@features/cardio/contract';
import type { HabitsEventPayloads } from '@features/habits/contract';
import type { GoalsEventPayloads } from '@features/goals/contract';
import type { ProfileEventPayloads } from '@features/profile/contract';
import type { TrainingPlansEventPayloads } from '@features/training_plans/contract';
/* eslint-enable boundaries/element-types */

/**
 * The complete map of every event that crosses a feature boundary.
 *
 * Rules:
 * - If an event is subscribed to by a policy OUTSIDE its owning feature, it
 *   belongs here.
 * - An event not in this manifest is either dead or must never leave its feature.
 * - This file is the authoritative list of what the system can emit across seams.
 *
 * Adding an event: find its owning feature, add the payload type to that
 * feature's `XxxEventPayloads` type in `features/xxx/contract.ts`, then the
 * intersection below picks it up automatically.
 */
export type EventManifest =
  TrainingLogEventPayloads &
  CardioEventPayloads &
  HabitsEventPayloads &
  GoalsEventPayloads &
  ProfileEventPayloads &
  TrainingPlansEventPayloads;

/** Union of all known cross-feature event type strings. */
export type ManifestEventType = keyof EventManifest;
```

- [x] **Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: 0 errors — the manifest is a pure type, nothing can fail at runtime

- [ ] **Step 3: Commit**

```bash
git add shared/contracts/event-manifest.ts
git commit -m "feat(contracts): add EventManifest — typed map of all cross-feature events"
```

---

### Task 2: Add typed subscribe overload to EventBusImpl

**Files:**
- Modify: `core/events/bus.ts`

The current `subscribe()` signature accepts `string` as the event type. We add a typed overload above it that accepts `K extends keyof EventManifest` and narrows the handler's event parameter. The untyped overload stays for feature projections that subscribe to their own events (which are not in the manifest).

- [x] **Step 1: Add the import and typed overload**

At the top of `core/events/bus.ts`, add the import:

```typescript
import type { EventManifest } from '@shared/contracts/event-manifest';
```

Before the `subscribe` implementation method (which starts with `subscribe<E extends DomainEvent...`), add two declaration overloads:

```typescript
// Typed overload: for policies subscribing to manifest events.
// The handler parameter is automatically narrowed to DomainEvent<K, EventManifest[K]>.
subscribe<K extends keyof EventManifest>(
  eventType: K,
  handler: EventHandler<DomainEvent<K, EventManifest[K]>>,
  options?: SubscriptionOptions,
): SubscriptionToken;

// Legacy overload: for feature projections subscribing to their own events.
// Keep the existing signature exactly — projections and anything that is not in
// the manifest continues to use this path.
subscribe<E extends DomainEvent<string, object>>(
  eventType: string,
  handler: EventHandler<E>,
  options?: SubscriptionOptions,
): SubscriptionToken;
```

The implementation signature and body are UNCHANGED — only the two declaration overloads above it are new.

The resulting structure in bus.ts looks like:

```typescript
// --- two declaration overloads (new) ---
subscribe<K extends keyof EventManifest>(
  eventType: K,
  handler: EventHandler<DomainEvent<K, EventManifest[K]>>,
  options?: SubscriptionOptions,
): SubscriptionToken;
subscribe<E extends DomainEvent<string, object>>(
  eventType: string,
  handler: EventHandler<E>,
  options?: SubscriptionOptions,
): SubscriptionToken;

// --- existing implementation (unchanged) ---
subscribe<E extends DomainEvent<string, object>>(
  eventType: string,
  handler: EventHandler<E>,
  options: SubscriptionOptions = {}
): SubscriptionToken {
  const entries = this.subscribers.get(eventType) ?? [];
  // ...existing body...
}
```

- [x] **Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: 0 errors — the overloads are additive and nothing at call sites has changed yet

- [ ] **Step 3: Commit**

```bash
git add core/events/bus.ts
git commit -m "feat(events): add typed subscribe overload for EventManifest keys"
```

---

### Task 3: Update policy call sites to use typed subscriptions

Each policy file currently passes a raw string to `eventBus.subscribe()`. After this task, each policy passes a manifest key constant — TypeScript validates the string and the handler's payload type.

**Files:**
- Modify: `features/habits/policies/streakMilestones.ts`
- Modify: `features/profile/policies/equipment.ts`
- Modify: `features/training_plans/policies/trackAdherence.ts`
- Modify: `features/achievements/policies/index.ts`
- Modify: `features/coaching/policies/generateInsights.ts`
- Modify: `features/goals/policies/updateGoals.ts`
- Modify: `features/progression/policies/updateProgression.ts`

**Pattern (same for all files):**

```typescript
// BEFORE — raw string, no type checking on the handler parameter:
eventBus.subscribe<DomainEvent<'SessionFinished', SessionFinishedPayload>>(
  'SessionFinished',
  async (event) => { ... }
);

// AFTER — manifest key constant, handler parameter is inferred from the manifest:
import { TrainingLogEvents } from '@features/training_log/contract';

eventBus.subscribe(TrainingLogEvents.SessionFinished, async (event) => {
  // event is automatically typed as DomainEvent<'SessionFinished', SessionFinishedPayload>
  // No explicit type annotation needed — remove the <DomainEvent<...>> generic
});
```

The keys are already defined as constants in the contract files:
- `TrainingLogEvents.SessionFinished` → `'SessionFinished'`
- `CardioEvents.CardioSessionRecorded` → `'CardioSessionRecorded'`
- `HabitsEvents.HabitCompleted` → `'HabitCompleted'`

- [x] **Step 1: Update streakMilestones policy**

```typescript
// features/habits/policies/streakMilestones.ts
import { eventBus } from '@core/events/bus';
import { eventRepository } from '@data/event-repository';
import { systemClock } from '@core/clock';
import { HabitsEvents } from '../contract';

const STREAK_MILESTONES = [7, 30, 100] as const;

let registered = false;

export function registerStreakMilestonePolicy(): void {
  if (registered) return;
  registered = true;

  eventBus.subscribe(HabitsEvents.HabitCompleted, async (event) => {
    const { newStreak, userId } = event.payload;
    if (!(STREAK_MILESTONES as readonly number[]).includes(newStreak)) return;

    await eventRepository.commit([{
      type: HabitsEvents.AchievementUnlocked,
      aggregateId: userId,
      aggregateType: 'User',
      timestamp: systemClock.now(),
      version: 1,
      payload: {
        userId,
        achievementId: `habit_streak_${newStreak}`,
        unlockedAt: systemClock.now(),
      },
    }]);
  });
}
```

Note: the `import type { HabitCompletedPayload }` and `import type { DomainEvent }` imports are no longer needed — the typed overload infers them. Remove those imports if they become unused.

- [x] **Step 2: Update equipment policy**

```typescript
// features/profile/policies/equipment.ts
import { eventBus } from '@core/events/bus';
import { eventRepository } from '@data/event-repository';
import { viewStore } from '@data/projections/views';
import { CardioEvents } from '@features/cardio/contract';
import type { Equipment, EquipmentMileageUpdatedPayload } from '../domain/body';

let registered = false;

export function registerEquipmentMileagePolicy(): void {
  if (registered) return;
  registered = true;

  eventBus.subscribe(CardioEvents.CardioSessionRecorded, async (event) => {
    const deltaKm = (event.payload.distanceMeters ?? 0) / 1000;
    if (deltaKm <= 0) return;

    const equipment = viewStore.get('equipment_list') ?? [];
    for (const item of equipment) {
      const payload: EquipmentMileageUpdatedPayload = {
        equipmentId: item.id,
        deltaKm,
      };
      await eventRepository.commit([{
        type: 'EquipmentMileageUpdated',
        aggregateId: item.id,
        aggregateType: 'Equipment',
        timestamp: Date.now(),
        version: 1,
        payload,
      }]);
    }
  });
}
```

- [x] **Step 3: Update trackAdherence policy**

Replace the raw string `TrainingLogEvents.SessionFinished` is already used here — just remove the explicit generic type annotation on `subscribe<DomainEvent<...>>`:

```typescript
// Change:
eventBus.subscribe<DomainEvent<'SessionFinished', SessionFinishedPayload>>(
  TrainingLogEvents.SessionFinished,
  async (event) => { ... }
);

// To (remove the explicit generic; typed overload infers it):
eventBus.subscribe(TrainingLogEvents.SessionFinished, async (event) => { ... });
```

The `import type { DomainEvent }` import can be removed if it's no longer used elsewhere in the file.

- [x] **Step 4: Update achievements, coaching, goals, progression policies**

Apply the same pattern to the remaining four files:

For `achievements/policies/index.ts`:
```typescript
// Two subscribe calls. Change both to use constants:
eventBus.subscribe(TrainingLogEvents.SessionFinished, async () => { ... });
eventBus.subscribe(CardioEvents.CardioSessionRecorded, async () => { ... });
// (These policies don't use the event payload directly, so no handler type change needed)
```

For `coaching/policies/generateInsights.ts`:
```typescript
// Remove explicit generic annotation:
eventBus.subscribe(TrainingLogEvents.SessionFinished, (event) => { ... });
```

For `goals/policies/updateGoals.ts`:
```typescript
// Remove explicit generic annotation:
eventBus.subscribe(TrainingLogEvents.SessionFinished, async (event) => { ... });
```

For `progression/policies/updateProgression.ts`:
```typescript
// Remove explicit generic annotation:
eventBus.subscribe(TrainingLogEvents.SessionFinished, (event) => { ... });
```

- [x] **Step 5: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: 0 errors — all policy subscribe calls now use typed manifest keys

- [x] **Step 6: Run tests**

Run: `npx vitest run`
Expected: all tests PASS — no runtime behaviour changes

- [ ] **Step 7: Commit**

```bash
git add features/habits/policies/streakMilestones.ts features/profile/policies/equipment.ts features/training_plans/policies/trackAdherence.ts features/achievements/policies/index.ts features/coaching/policies/generateInsights.ts features/goals/policies/updateGoals.ts features/progression/policies/updateProgression.ts
git commit -m "refactor(policies): use typed EventManifest keys in all cross-feature subscriptions"
```
