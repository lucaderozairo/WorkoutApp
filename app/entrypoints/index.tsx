import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { App } from '@app/registry/App';
import { viewStore } from '@data/projections/views';
import { PERSISTED_KEYS, loadFromStorage, clearStorage } from '@data/sources/local/persistence';
import { seedMockDataIfEmpty } from '@data/mock/seed';
import { APP_MODE } from '@config/app-mode';
import '@styling/global.css';

if (APP_MODE === 'github-pages' && !localStorage.getItem('workout-app:gh-initialized')) {
  clearStorage();
  localStorage.setItem('workout-app:gh-initialized', '1');
}

// Hydrate persisted view keys before first render so projections start with saved state.
for (const key of PERSISTED_KEYS) {
  const saved = loadFromStorage(key);
  if (saved !== null) viewStore.set(key, saved);
}

if (APP_MODE === 'prototype') {
  seedMockDataIfEmpty();
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);
