import { useState, useCallback, useEffect } from 'react';
// Note: ui/bindings is the designated bridge between the view store and React.
// This is the one sanctioned ui→data import; see LAYER_RULES.md.
import { viewStore } from '@data/projections/views';
import type { ViewRegistry } from '@data/projections/views/schema';

/**
 * useQuery subscribes to a view store key and re-renders when it changes.
 * Uses subscription-based change notification instead of polling.
 *
 * Typed overload: key is inferred from ViewRegistry — no explicit type param needed.
 * Legacy overload: explicit type param still accepted while call sites are migrated (TODO arch).
 */
// Typed overload — preferred: useQuery('sessions') infers ActivitiesState | null
export function useQuery<K extends keyof ViewRegistry>(key: K): ViewRegistry[K] | null;
// Legacy overload — callers that pass useQuery<T>('key') still compile (TODO arch: migrate away)
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- legacy overload, callers will be migrated (TODO arch)
export function useQuery<T = unknown>(key: string): T | null;
export function useQuery(key: string): unknown {
  const [data, setData] = useState<unknown>(() => viewStore.get(key as keyof ViewRegistry) ?? null);

  useEffect(() => {
    // Sync on mount in case the view was set before this component rendered
    const current = viewStore.get(key as keyof ViewRegistry) ?? null;
    setData((prev: unknown) => (prev === current ? prev : current));

    return viewStore.subscribe(key as keyof ViewRegistry, () => {
      setData(viewStore.get(key as keyof ViewRegistry) ?? null);
    });
  }, [key]);

  return data;
}

/**
 * useCommand wraps a command handler and provides a dispatch function.
 */
export function useCommand<TCmd, TResult>(
  handler: (cmd: TCmd) => Promise<TResult>
): { dispatch: (cmd: TCmd) => Promise<TResult>; pending: boolean } {
  const [pending, setPending] = useState(false);

  const dispatch = useCallback(async (cmd: TCmd) => {
    setPending(true);
    try {
      return await handler(cmd);
    } finally {
      setPending(false);
    }
  }, [handler]);

  return { dispatch, pending };
}
