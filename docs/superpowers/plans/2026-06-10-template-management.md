# Template Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add event-sourced saved workout templates, editable outside an active session, plus deterministic recent-routine starters from the last three unplanned completed sessions.

**Architecture:** `features/templates` owns saved template state. `features/training_log` owns starting a session from a template, because it owns `SessionStarted` and `BlockAdded`. UI reads template projections through queries and uses command bindings. Recent routines are derived from finished training-log sessions and do not emit template events unless the user explicitly saves one.

**Tech Stack:** React 18, TypeScript, Vitest, existing `defineCommand`, existing ViewStore/projection pattern, existing session screens/components.

**Related spec:** `docs/product/feature-improvement-design-v2.md` Phase 4A.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `shared/contracts/templates.ts` | Create | Template and recent-routine shared shapes |
| `shared/contracts/index.ts` | Modify | Re-export template contracts |
| `features/templates/domain/types.ts` | Create | Template events, commands, state |
| `features/templates/domain/reducers.ts` | Create | Pure template state transitions |
| `features/templates/domain/reducers.test.ts` | Create | Reducer tests |
| `features/templates/projections/index.ts` | Create | `template_state`, `template_list`, `favorite_templates`, `recent_routines` |
| `features/templates/queries/index.ts` | Create | Template and recent-routine reads |
| `features/templates/commands/handlers.ts` | Create | Template CRUD/favorite/reorder commands |
| `features/templates/commands/handlers.test.ts` | Create | Command tests |
| `features/templates/contract.ts` | Create | Public type contract |
| `features/templates/index.ts` | Create | Public feature exports |
| `features/training_log/domain/types.ts` | Modify | Add `StartSessionFromTemplate` command type |
| `features/training_log/commands/handlers.ts` | Modify | Add atomic start-from-template handler |
| `features/training_log/index.ts` | Modify | Export new handler/type |
| `features/training_log/contract.ts` | Modify | Export new command type |
| `data/projections/views/schema.ts` | Modify | Add template view keys |
| `data/sources/local/persistence.ts` | Modify | Persist template state/list/favorites |
| `app/registry/bootstrap.ts` | Modify | Side-effect import `@features/templates` |
| `app/entrypoints/index.tsx` | Modify | Hydrate template projections from persisted state |
| `ui/screens/session/useFinishSession.ts` | Modify | Save finished session as template |
| `ui/screens/session/useNewSession.ts` | Modify | Load templates/recent routines and dispatch actions |
| `ui/screens/session/NewSessionScreen.tsx` | Modify | Template picker/editor controls |

---

## Task 1: Shared template contracts

**Files:**
- Create: `shared/contracts/templates.ts`
- Modify: `shared/contracts/index.ts`

- [ ] **Step 1: Create contract file**

```ts
// shared/contracts/templates.ts
import type { ExerciseCategory, SportType } from '@shared/types';

export interface WorkoutTemplateExercise {
  id: string;
  exerciseId?: string;
  name: string;
  category: ExerciseCategory;
  order: number;
  targetSets?: number;
  targetReps?: number;
  targetWeightKg?: number;
  restSeconds?: number;
  notes?: string;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  primarySport: SportType;
  favorite: boolean;
  exercises: WorkoutTemplateExercise[];
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
}

export interface RecentRoutine {
  id: string;
  name: string;
  primarySport: SportType;
  exercises: WorkoutTemplateExercise[];
  finishedAt: number;
  sourceSessionId: string;
}
```

- [ ] **Step 2: Re-export**

```ts
export type {
  RecentRoutine,
  WorkoutTemplate,
  WorkoutTemplateExercise,
} from './templates';
```

- [ ] **Step 3: Verify**

```
npx tsc --noEmit
```

---

## Task 2: Template domain types and reducer

**Files:**
- Create: `features/templates/domain/types.ts`
- Create: `features/templates/domain/reducers.ts`
- Create: `features/templates/domain/reducers.test.ts`

- [ ] **Step 1: Write reducer tests first**

Test cases:
- `TemplateCreated` adds template to `byId` and order.
- `TemplateFavoriteChanged` updates favorite and `updatedAt`.
- `TemplateDuplicated` adds a new template id and preserves exercise order.
- `TemplateDeleted` hides template from visible list.
- `TemplateExercisesReordered` rewrites exercise order.

- [ ] **Step 2: Create domain types**

Include:
- `TemplateState`
- `TemplateEvent`
- payload interfaces for all template events
- commands for create/rename/duplicate/delete/favorite/exercise add/update/remove/reorder

- [ ] **Step 3: Create reducer**

```ts
export const initialTemplateState: TemplateState = {
  byId: {},
  order: [],
};

export function reduceTemplateState(
  state: TemplateState,
  event: TemplateEvent,
): TemplateState {
  // Dispatch to event reducers.
}

export function getVisibleTemplates(state: TemplateState): WorkoutTemplate[] {
  return state.order
    .map(id => state.byId[id])
    .filter(template => template && !template.deletedAt)
    .sort((a, b) => Number(b.favorite) - Number(a.favorite) || b.updatedAt - a.updatedAt);
}
```

- [ ] **Step 4: Run reducer tests**

```
npx vitest run features/templates/domain/reducers.test.ts
```

Expected: all reducer tests pass.

---

## Task 3: Template projections and queries

**Files:**
- Create: `features/templates/projections/index.ts`
- Create: `features/templates/queries/index.ts`
- Create: `features/templates/contract.ts`
- Create: `features/templates/index.ts`

- [ ] **Step 1: Create projections**

Projection keys:
- `template_state`
- `template_list`
- `favorite_templates`
- `recent_routines`

`template_list` and `favorite_templates` derive from `template_state`. Register all projections with `projectionRegistry`.

- [ ] **Step 2: Add recent routine builder**

```ts
export function buildRecentRoutinesFromSessions(
  sessions: Record<string, SessionSnapshot>,
): RecentRoutine[] {
  return Object.values(sessions)
    .flatMap(session => {
      // finished only
      // strength segments only
      // exclude planned/template-origin sessions when origin metadata exists
    })
    .sort((a, b) => b.finishedAt - a.finishedAt)
    .slice(0, 3);
}
```

- [ ] **Step 3: Create queries**

```ts
export function getTemplates(): WorkoutTemplate[];
export function getFavoriteTemplates(): WorkoutTemplate[];
export function getTemplate(templateId: string): WorkoutTemplate | null;
export function getRecentRoutines(): RecentRoutine[];
```

- [ ] **Step 4: Export contract and barrel**

`contract.ts` exports types only. `index.ts` exports public handlers, queries, projections, and types.

---

## Task 4: Template commands

**Files:**
- Create: `features/templates/commands/handlers.ts`
- Create: `features/templates/commands/handlers.test.ts`

- [ ] **Step 1: Create command handlers using `defineCommand`**

Handlers:
- `handleCreateTemplate`
- `handleRenameTemplate`
- `handleDuplicateTemplate`
- `handleDeleteTemplate`
- `handleSetTemplateFavorite`
- `handleAddTemplateExercise`
- `handleUpdateTemplateExercise`
- `handleRemoveTemplateExercise`
- `handleReorderTemplateExercises`

- [ ] **Step 2: Add validation**

Rules:
- Template name required.
- Template must have at least one exercise on create.
- Delete/rename/favorite/update require an existing non-deleted template.
- Reorder must include every exercise exactly once.

- [ ] **Step 3: Write command tests**

Test:
- create -> `template_list` contains template
- favorite -> favorite sort updates
- duplicate -> new id and new exercise ids
- delete -> hidden from `template_list`
- reorder -> exercise order changes

- [ ] **Step 4: Run command tests**

```
npx vitest run features/templates/commands/handlers.test.ts
```

---

## Task 5: Start session from template in training_log

**Files:**
- Modify: `features/training_log/domain/types.ts`
- Modify: `features/training_log/commands/handlers.ts`
- Modify: `features/training_log/index.ts`
- Modify: `features/training_log/contract.ts`

- [ ] **Step 1: Add command type**

```ts
export interface StartSessionFromTemplate {
  type: 'StartSessionFromTemplate';
  userId: Id<'User'>;
  name: string;
  primarySport: SportType;
  exercises: WorkoutTemplateExercise[];
}
```

- [ ] **Step 2: Add handler**

Handler emits one `SessionStarted` event followed by one `BlockAdded` event per template exercise, then commits once.

- [ ] **Step 3: Export handler and type**

Update `index.ts` and `contract.ts`.

- [ ] **Step 4: Test atomic start**

Test that one command creates a session with expected blocks in `sessions`.

---

## Task 6: Persistence and bootstrap

**Files:**
- Modify: `data/projections/views/schema.ts`
- Modify: `data/sources/local/persistence.ts`
- Modify: `app/registry/bootstrap.ts`
- Modify: `app/entrypoints/index.tsx`

- [ ] **Step 1: Add ViewStore keys**

```ts
template_state: TemplateState;
template_list: WorkoutTemplate[];
favorite_templates: WorkoutTemplate[];
recent_routines: RecentRoutine[];
```

- [ ] **Step 2: Persist template keys**

Add `template_state`, `template_list`, and `favorite_templates` to `PERSISTED_KEYS`.

- [ ] **Step 3: Bootstrap templates**

Add:

```ts
import '@features/templates';
```

- [ ] **Step 4: Hydrate projections**

After persisted keys load, seed `templateStateProjection`, derive `template_list`, and derive `favorite_templates`.

---

## Task 7: UI integration

**Files:**
- Modify: `ui/screens/session/useFinishSession.ts`
- Modify: `ui/screens/session/useNewSession.ts`
- Modify: `ui/screens/session/NewSessionScreen.tsx`

- [ ] **Step 1: Save finished session as template**

Replace planning `handleSaveTemplate` usage with templates `handleCreateTemplate`. Map session segments to `WorkoutTemplateExercise` input.

- [ ] **Step 2: Load templates and recent routines in new session hook**

Read:
- `template_list`
- `sessions` subscription for recent routines

Expose handlers for:
- use template/routine
- rename
- duplicate
- delete
- favorite
- move exercise up/down
- remove exercise

- [ ] **Step 3: Render template controls**

New-session screen shows:
- Saved templates
- Recent routines
- Use button
- Favorite, rename, duplicate, delete actions
- Exercise reorder/remove controls

- [ ] **Step 4: Empty states**

When no saved templates or recent routines exist, the template section stays hidden. Existing session start flow remains unchanged.

---

## Task 8: Full verification

- [ ] `npx tsc --noEmit`
- [ ] `npx vitest run features/templates/domain/reducers.test.ts features/templates/commands/handlers.test.ts`
- [ ] `npx vitest run`
- [ ] `npm run lint`
- [ ] `npm run build`

- [ ] Manual checks:
1. Finish session -> save as template.
2. New session -> saved template appears.
3. Use template -> session starts with all exercises.
4. Favorite changes sort state.
5. Rename changes display name.
6. Duplicate creates separate editable copy.
7. Delete hides template.
8. Move exercise up/down changes order.
9. Recent routines show last three finished strength sessions.
10. Mobile 320 px has no overlapping action buttons.

- [ ] Rebuild graphify:

```powershell
$env:PYTHONIOENCODING='utf-8'; $env:PYTHONUTF8='1'; python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** rename, duplicate, delete, favorite, reorder, edit without starting, start from template, recent routines.
- [x] **Architecture:** templates own templates; training_log owns sessions; UI uses queries/bindings.
- [x] **Out of scope preserved:** no template suggestions, no program builder, no recurring sessions.
- [x] **Tests planned:** reducer, command, and start-from-template coverage.
