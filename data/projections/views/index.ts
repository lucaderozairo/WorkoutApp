import type { DomainEvent } from '@shared/types';
import { PERSISTED_KEYS, saveToStorage, type PersistedKey } from '@data/sources/local/persistence';
import type { ViewRegistry } from './schema';

class ViewStore {
  private state = new Map<string, unknown>();
  private listeners = new Map<string, Set<(v: unknown) => void>>();

  // Typed overload: infers the value type from the registry key.
  get<K extends keyof ViewRegistry>(key: K): ViewRegistry[K] | undefined;
  get(key: string): unknown {
    return this.state.get(key);
  }

  // Typed overload: enforces value type matches the registry for known keys.
  set<K extends keyof ViewRegistry>(key: K, value: ViewRegistry[K]): void;
  set(key: string, value: unknown): void {
    this.state.set(key, value);
    if ((PERSISTED_KEYS as readonly string[]).includes(key)) {
      saveToStorage(key as PersistedKey, value);
    }
    const subs = this.listeners.get(key);
    if (subs) {
      for (const fn of subs) fn(value);
    }
  }

  // Typed overload: callback receives the typed value for the key.
  subscribe<K extends keyof ViewRegistry>(key: K, fn: (v: ViewRegistry[K]) => void): () => void;
  subscribe(key: string, fn: (v?: unknown) => void): () => void {
    const subs = this.listeners.get(key) ?? new Set<(v: unknown) => void>();
    subs.add(fn);
    this.listeners.set(key, subs);
    return () => { subs.delete(fn); };
  }
}

export const viewStore = new ViewStore();
