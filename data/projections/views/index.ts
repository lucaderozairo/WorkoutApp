import type { DomainEvent } from '@shared/types';
import { PERSISTED_KEYS, saveToStorage, type PersistedKey } from '@data/sources/local/persistence';
import type { ViewRegistry } from './schema';

class ViewStore {
  private state = new Map<string, unknown>();
  private listeners = new Map<string, Set<() => void>>();

  // Typed overload: infers the value type from the registry key.
  get<K extends keyof ViewRegistry>(key: K): ViewRegistry[K] | undefined;
  // Legacy fallback: explicit type param at call site (e.g. viewStore.get<T>('key')).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- legacy overload, callers will be migrated (TODO arch)
  get<T = unknown>(key: string): T | undefined;
  get(key: string): unknown {
    return this.state.get(key);
  }

  // Typed overload: enforces value type matches the registry for known keys.
  set<K extends keyof ViewRegistry>(key: K, value: ViewRegistry[K]): void;
  // Legacy fallback: untyped key/value pairs (mock seeds, unknown keys, etc.).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- legacy overload, callers will be migrated (TODO arch)
  set<T = unknown>(key: string, value: T): void;
  set(key: string, value: unknown): void {
    this.state.set(key, value);
    if ((PERSISTED_KEYS as readonly string[]).includes(key)) {
      saveToStorage(key as PersistedKey, value);
    }
    const subs = this.listeners.get(key);
    if (subs) {
      for (const fn of subs) fn();
    }
  }

  // Typed overload: callback receives the typed value for the key.
  subscribe<K extends keyof ViewRegistry>(key: K, fn: (v: ViewRegistry[K]) => void): () => void;
  // Legacy fallback: no-arg callback (existing internal usage in ui/bindings).
  subscribe(key: string, fn: () => void): () => void;
  subscribe(key: string, fn: (v?: unknown) => void): () => void {
    const subs = this.listeners.get(key) ?? new Set<() => void>();
    subs.add(fn as () => void);
    this.listeners.set(key, subs);
    return () => { subs.delete(fn as () => void); };
  }
}

export const viewStore = new ViewStore();
