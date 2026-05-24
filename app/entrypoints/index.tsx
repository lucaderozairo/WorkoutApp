import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { App } from '@app/registry/App';
import { viewStore } from '@data/projections/views';
import { PERSISTED_KEYS, loadFromStorage, clearStorage, checkStorageQuota, saveCheckpointTimestamp, loadCheckpointTimestamp } from '@data/sources/local/persistence';
import { clearEventDB } from '@data/sources/local/event-db';
import { inMemoryEventStore } from '@data/store/event-store';
import { seedMockDataIfEmpty } from '@data/mock/seed';
import { APP_MODE } from '@config/app-mode';
import {
  replayTrainingLogEvents,
  sessionProjection,
  recentExercisesProjection,
  type TrainingLogEvent,
  type ActivitiesState,
  type RecentExercise,
} from '@features/training_log';
import { recentCardioProjection } from '@features/cardio/projections';
import type { RecentCardioView } from '@features/cardio/projections';
import { savedTemplatesProjection } from '@features/planning';
import type { SavedTemplate } from '@features/planning';
import { telemetry } from '@core/telemetry/TelemetryLogger';
import '@styling/global.css';

window.addEventListener('unhandledrejection', (e) => {
  telemetry.logError('unhandled', e.reason instanceof Error ? e.reason : new Error(String(e.reason)));
});

(async () => {
  if (APP_MODE === 'github-pages' && !localStorage.getItem('workout-app:gh-initialized')) {
    clearStorage();
    try { await clearEventDB(); } catch { /* ignore */ }
    localStorage.setItem('workout-app:gh-initialized', '1');
  }

  // One-time migration: editing_session (legacy) → sessions (unified)
  try {
    const legacyRaw = localStorage.getItem('workout-app:editing_session');
    const currentRaw = localStorage.getItem('workout-app:sessions');
    if (legacyRaw && !currentRaw) {
      const legacy = JSON.parse(legacyRaw) as { sessions?: Array<{ id: string; name: string; startedAt: number | null; finishedAt?: number | null; blocks: unknown[]; notes: string }> };
      if (Array.isArray(legacy.sessions)) {
        const byId: Record<string, unknown> = {};
        for (const s of legacy.sessions) {
          byId[s.id] = {
            id: s.id, name: s.name,
            status: s.finishedAt != null ? 'finished' : 'active',
            startedAt: s.startedAt, finishedAt: s.finishedAt ?? null,
            blocks: s.blocks, notes: s.notes,
          };
        }
        const activeId = legacy.sessions.find(s => s.finishedAt == null)?.id ?? null;
        localStorage.setItem('workout-app:sessions', JSON.stringify({ byId, activeId }));
      }
      localStorage.removeItem('workout-app:editing_session');
    }
  } catch { /* skip if malformed */ }

  // Hydrate event store from IndexedDB
  await inMemoryEventStore.hydrate();

  if (inMemoryEventStore.hasAnyEvents()) {
    const allEvents = inMemoryEventStore.getAllEventsFlat() as TrainingLogEvent[];
    const checkpointTs = loadCheckpointTimestamp();
    const savedSessions = loadFromStorage<ActivitiesState>('sessions');

    if (checkpointTs !== null && savedSessions) {
      // Fast path: restore projections from localStorage snapshots, replay only delta
      sessionProjection.setState(savedSessions);
      viewStore.set('sessions', savedSessions);

      const savedExercises = loadFromStorage<RecentExercise[]>('recent_exercises');
      if (savedExercises) {
        recentExercisesProjection.setState(savedExercises);
        viewStore.set('recent_exercises', savedExercises);
      }

      const delta = allEvents.filter(e => e.timestamp > checkpointTs);
      if (delta.length > 0) replayTrainingLogEvents(delta);
    } else {
      // Slow path: full replay (first run with events, or snapshots missing)
      replayTrainingLogEvents(allEvents);
    }

    // Advance checkpoint to the last processed event
    if (allEvents.length > 0) {
      saveCheckpointTimestamp(allEvents[allEvents.length - 1].timestamp);
    }

    // Load remaining non-event-sourced keys from localStorage
    for (const key of PERSISTED_KEYS) {
      if (key === 'sessions' || key === 'recent_exercises') continue;
      const saved = loadFromStorage(key);
      if (saved !== null) viewStore.set(key, saved);
    }
  } else {
    // No events yet (first run / migration): load snapshot from localStorage
    for (const key of PERSISTED_KEYS) {
      const saved = loadFromStorage(key);
      if (saved !== null) viewStore.set(key, saved);
    }
    // Seed sessionProjection so the first command doesn't overwrite saved state
    const savedSessions = viewStore.get<ActivitiesState>('sessions');
    if (savedSessions) sessionProjection.setState(savedSessions);
  }

  if (APP_MODE === 'prototype') {
    seedMockDataIfEmpty();
  }

  // Sync cardio projection from whatever is now in viewStore (seeded or loaded).
  // Mirrors the sessionProjection.setState() call above so the first cardio
  // command doesn't overwrite live data with the projection's empty initial state.
  const savedCardio = viewStore.get<RecentCardioView>('recent_cardio_sessions');
  if (savedCardio) recentCardioProjection.setState(savedCardio);

  const savedTemplates = viewStore.get<SavedTemplate[]>('saved_templates');
  if (savedTemplates) savedTemplatesProjection.setState(savedTemplates);

  // Surface storage problems to the user via the StorageWarningBanner.
  if (!inMemoryEventStore.isPersistenceWorking()) {
    viewStore.set('storage_warning', 'Your workouts are not being saved between sessions — storage is unavailable. Export your data as a backup.');
  } else {
    const quotaWarning = await checkStorageQuota();
    if (quotaWarning) viewStore.set('storage_warning', quotaWarning);
  }

  document.getElementById('app-loading')?.remove();

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <HashRouter>
        <App />
      </HashRouter>
    </React.StrictMode>
  );
})();
