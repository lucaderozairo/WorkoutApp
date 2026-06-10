import { useState, useCallback, useEffect } from 'react';
// Note: ui/bindings is the designated bridge between the view store and React.
// This is the one sanctioned ui→data import; see LAYER_RULES.md.
import { viewStore } from '@data/projections/views';
import type { ViewRegistry } from '@data/projections/views/schema';

/**
 * useQuery subscribes to a view store key and re-renders when it changes.
 * Uses subscription-based change notification instead of polling.
 */
export function useQuery<K extends keyof ViewRegistry>(key: K): ViewRegistry[K] | null;
export function useQuery<T>(key: string): T | null;
export function useQuery<T>(key: string): T | null {
  const [data, setData] = useState<T | null>(() => (viewStore.get(key) as T | undefined) ?? null);

  useEffect(() => {
    // Sync on mount in case the view was set before this component rendered
    const current = (viewStore.get(key) as T | undefined) ?? null;
    setData(prev => (prev === current ? prev : current));

    return viewStore.subscribe(key, () => {
      setData((viewStore.get(key) as T | undefined) ?? null);
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
