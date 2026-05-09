// IndexedDB data source for persistence
// Provides appendEvents, readStream, saveSnapshot, loadSnapshot

import type { Id, DomainEvent } from '@shared/types';

export function isIndexedDbAvailable(): boolean {
  try {
    return typeof indexedDB !== 'undefined';
  } catch {
    return false;
  }
}

export async function appendEvents(_events: DomainEvent<string, object>[]): Promise<void> {
  // Stub — IndexedDB persistence layer
  // In production, write events to IndexedDB 'events' object store
}

export async function readStream(_streamName: Id): Promise<DomainEvent<string, object>[]> {
  // Stub — read events from IndexedDB
  return [];
}

export async function saveSnapshot(_streamName: string, _state: unknown, _lastSequence: number): Promise<void> {
  // Stub — save projection snapshot to IndexedDB
}

export async function loadSnapshot(_streamName: string): Promise<{ state: unknown; lastSequence: number } | null> {
  // Stub — load projection snapshot from IndexedDB
  return null;
}
