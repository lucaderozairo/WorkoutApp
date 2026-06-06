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
