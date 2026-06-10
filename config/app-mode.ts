export type AppMode = 'github-pages' | 'prototype';

function resolveMode(defaultMode: AppMode): AppMode {
  const stored = localStorage.getItem('workout-app:mode');
  if (stored === 'github-pages' || stored === 'prototype') return stored;
  const env = import.meta.env.VITE_APP_MODE;
  if (env === 'github-pages') return 'github-pages';
  return defaultMode;
}

export const APP_MODE: AppMode = resolveMode("prototype");
