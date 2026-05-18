import type { DomainEvent } from '@shared/types';

const DB_NAME = 'workout-app-events';
const STORE   = 'events';

function openEventDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { autoIncrement: true });
        store.createIndex('aggregateId', 'aggregateId');
        store.createIndex('timestamp',   'timestamp');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

export async function persistEvent(event: DomainEvent<string, object>): Promise<void> {
  const db = await openEventDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).add(event);
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  });
}

export async function loadAllEvents(): Promise<DomainEvent<string, object>[]> {
  const db = await openEventDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result as DomainEvent<string, object>[]);
    req.onerror   = () => reject(req.error);
  });
}

export async function clearEventDB(): Promise<void> {
  const db = await openEventDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  });
}
