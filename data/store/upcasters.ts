import type { DomainEvent } from '@shared/types';

type UpcasterFn = (payload: unknown) => unknown;

// keyed by `${eventType}:${fromSchemaVersion}`
const registry = new Map<string, UpcasterFn>();

/**
 * Register an upcaster that transforms an old payload shape to the current one.
 * Called during event replay — convert `fromVersion` payloads to `fromVersion + 1`.
 *
 * Example:
 *   registerUpcaster('SessionStarted', 1, payload => ({
 *     ...payload,
 *     primarySport: (payload as any).sport ?? 'strength',
 *   }));
 */
export function registerUpcaster(
  eventType: string,
  fromVersion: number,
  upcaster: UpcasterFn,
): void {
  registry.set(`${eventType}:${fromVersion}`, upcaster);
}

/**
 * Apply all registered upcasters to an event, chaining until no upcaster exists
 * for the current version. Returns the event unchanged if no upcasters match.
 */
export function upcastEvent<E extends DomainEvent<string, object>>(event: E): E {
  if (registry.size === 0) return event;

  let current = event;
  for (;;) {
    const version = current.schemaVersion ?? 1;
    const key = `${current.type}:${version}`;
    const upcaster = registry.get(key);
    if (!upcaster) break;
    current = { ...current, payload: upcaster(current.payload) as object, schemaVersion: version + 1 };
  }
  return current;
}
