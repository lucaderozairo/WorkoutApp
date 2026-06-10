import type { DomainEvent } from '@shared/types';
import { EventRepository, eventRepository as defaultRepo } from './event-repository';
import { PERSISTED_KEYS, loadFromStorage, type PersistedKey } from './sources/local/persistence';
import { viewStore } from './projections/views';

type ProjectionEvent = DomainEvent<string, object>;

export interface ProjectionLike<TState, TEvent extends ProjectionEvent = ProjectionEvent> {
  apply(event: TEvent): void;
  getState(): TState;
  setState(state: TState): void;
}

export interface ProjectionSlot<TKey extends string, TState, TEvent extends ProjectionEvent = ProjectionEvent> {
  key: TKey;
  projection: ProjectionLike<TState, TEvent>;
}

type InferState<TSlots extends readonly ProjectionSlot<string, unknown, ProjectionEvent>[]> = {
  [K in TSlots[number] as K['key']]: K extends ProjectionSlot<K['key'], infer TState, ProjectionEvent>
    ? TState
    : never;
};

export interface CommandContext<TSlots extends readonly ProjectionSlot<string, unknown, ProjectionEvent>[]> {
  state: InferState<TSlots>;
  commit(events: DomainEvent[]): Promise<void>;
}

export interface CommandDefinitionLegacy<TCmd, TResult = void> {
  execute(cmd: TCmd): Promise<{ events: DomainEvent[]; result?: TResult }>;
}

export interface CommandDefinitionWithProjections<
  TCmd,
  TSlots extends readonly ProjectionSlot<string, unknown, ProjectionEvent>[],
  TResult = void,
> {
  projections: TSlots;
  execute(cmd: TCmd, ctx: CommandContext<TSlots>): Promise<TResult>;
}

export type CommandDefinition<TCmd, TResult = void> =
  | CommandDefinitionLegacy<TCmd, TResult>
  | CommandDefinitionWithProjections<TCmd, readonly ProjectionSlot<string, unknown, ProjectionEvent>[], TResult>;

function hasProjections<TCmd, TResult>(
  definition: CommandDefinition<TCmd, TResult>,
): definition is CommandDefinitionWithProjections<
  TCmd,
  readonly ProjectionSlot<string, unknown, ProjectionEvent>[],
  TResult
> {
  return 'projections' in definition;
}

function isPersistedKey(key: string): key is PersistedKey {
  return (PERSISTED_KEYS as readonly string[]).includes(key);
}

/**
 * Returns a typed async handler `(cmd: TCmd) => Promise<TResult>`.
 *
 * Legacy definitions return events; projection-aware definitions declare their
 * projection slots and use `ctx.commit(events)` to apply + persist atomically.
 * New handlers that touch projections should prefer the projection-aware form:
 * declare slots once, read `ctx.state`, then call `ctx.commit(events)`.
 * The second `repo` parameter is only used in tests - production code uses the singleton.
 */
export function defineCommand<
  TCmd,
  TResult = void,
  TSlots extends readonly ProjectionSlot<string, unknown, ProjectionEvent>[] = readonly ProjectionSlot<string, unknown, ProjectionEvent>[],
>(
  definition: CommandDefinitionWithProjections<TCmd, TSlots, TResult>,
  repo?: EventRepository,
): (cmd: TCmd) => Promise<TResult>;

export function defineCommand<TCmd, TResult = void>(
  definition: CommandDefinitionLegacy<TCmd, TResult>,
  repo?: EventRepository,
): (cmd: TCmd) => Promise<TResult>;

export function defineCommand<TCmd, TResult = void>(
  definition: CommandDefinition<TCmd, TResult>,
  repo: EventRepository = defaultRepo,
): (cmd: TCmd) => Promise<TResult> {
  if (hasProjections(definition)) {
    return async (cmd) => {
      const state: Record<string, unknown> = {};

      for (const slot of definition.projections) {
        const live = viewStore.get(slot.key);
        const stored = live === undefined && isPersistedKey(slot.key)
          ? loadFromStorage(slot.key)
          : null;
        const nextState = live ?? stored;

        if (nextState !== null && nextState !== undefined) {
          slot.projection.setState(nextState);
        }
        state[slot.key] = slot.projection.getState();
      }

      const ctx: CommandContext<typeof definition.projections> = {
        state: state as InferState<typeof definition.projections>,
        commit: async (events) => {
          for (const event of events) {
            for (const slot of definition.projections) {
              slot.projection.apply(event as ProjectionEvent);
            }
          }
          for (const slot of definition.projections) {
            viewStore.set(slot.key, slot.projection.getState());
          }
          await repo.commit(events);
        },
      };

      return definition.execute(cmd, ctx);
    };
  }

  return async (cmd) => {
    const { events, result } = await definition.execute(cmd);
    await repo.commit(events);
    return result as TResult;
  };
}
