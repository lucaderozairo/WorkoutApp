import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: '/WorkoutApp/',
  plugins: [react()],
  define: {
    __BUNDLED_DEV__: JSON.stringify(true),
  },
  resolve: {
    alias: {
      '@app': path.resolve(__dirname, 'app'),
      '@ui': path.resolve(__dirname, 'ui'),
      '@features': path.resolve(__dirname, 'features'),
      '@data': path.resolve(__dirname, 'data'),
      '@core': path.resolve(__dirname, 'core'),
      '@shared': path.resolve(__dirname, 'shared'),
      '@styling': path.resolve(__dirname, 'styling'),
      '@config': path.resolve(__dirname, 'config'),
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    exclude: ['**/node_modules/**', '**/.git/**', '**/.claude/**'],
    alias: {
      '@app': path.resolve(__dirname, 'app'),
      '@ui': path.resolve(__dirname, 'ui'),
      '@features': path.resolve(__dirname, 'features'),
      '@data': path.resolve(__dirname, 'data'),
      '@core': path.resolve(__dirname, 'core'),
      '@shared': path.resolve(__dirname, 'shared'),
      '@styling': path.resolve(__dirname, 'styling'),
      '@config': path.resolve(__dirname, 'config'),
    }
  }
});
