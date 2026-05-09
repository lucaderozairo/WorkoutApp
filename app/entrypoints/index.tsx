import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from '@app/registry/App';
import { viewStore } from '@data/projections/views';
import { PERSISTED_KEYS, loadFromStorage } from '@data/sources/local/persistence';
import { seedMockDataIfEmpty } from '@data/mock/seed';
import { APP_MODE } from '@config/app-mode';
import '@styling/global.css';

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
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
