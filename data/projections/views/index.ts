import type { DomainEvent } from '@shared/types';
import { PERSISTED_KEYS, saveToStorage, type PersistedKey } from '@data/sources/local/persistence';

class ViewStore {
  private state = new Map<string, unknown>();
  private listeners = new Map<string, Set<() => void>>();

  get<T>(key: string): T | undefined {
    return this.state.get(key) as T | undefined;
  }

  set<T>(key: string, value: T): void {
    this.state.set(key, value);
    if ((PERSISTED_KEYS as readonly string[]).includes(key)) {
      saveToStorage(key as PersistedKey, value);
    }
    const subs = this.listeners.get(key);
    if (subs) {
      for (const fn of subs) fn();
    }
  }

  subscribe(key: string, fn: () => void): () => void {
    const subs = this.listeners.get(key) ?? new Set();
    subs.add(fn);
    this.listeners.set(key, subs);
    return () => { subs.delete(fn); };
  }
}

export const viewStore = new ViewStore();
