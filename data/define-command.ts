import type { DomainEvent } from '@shared/types';
import { EventRepository, eventRepository as defaultRepo } from './event-repository';

export interface CommandDefinition<TCmd, TResult = void> {
  execute(cmd: TCmd): Promise<{ events: DomainEvent[]; result?: TResult }>;
}

/**
 * Returns a typed async handler `(cmd: TCmd) => Promise<TResult>`.
 *
 * The handler calls `definition.execute(cmd)`, commits all returned events via
 * `eventRepository.commit()`, then returns the result. The second `repo`
 * parameter is only used in tests - production code uses the singleton.
 */
export function defineCommand<TCmd, TResult = void>(
  definition: CommandDefinition<TCmd, TResult>,
  repo: EventRepository = defaultRepo,
): (cmd: TCmd) => Promise<TResult> {
  return async (cmd) => {
    const { events, result } = await definition.execute(cmd);
    await repo.commit(events);
    return result as TResult;
  };
}
