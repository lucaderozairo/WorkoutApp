/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  base: '/WorkoutApp/',
  plugins: [react()],
  define: {
    __BUNDLED_DEV__: JSON.stringify(true)
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
      '@config': path.resolve(__dirname, 'config')
    }
  },
  test: {
    projects: [{
      extends: true,
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
          '@config': path.resolve(__dirname, 'config')
        }
      }
    }, {
      extends: true,
      plugins: [
      // The plugin will run tests for the stories defined in your Storybook config
      // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
      storybookTest({
        configDir: path.join(dirname, '.storybook')
      })],
      test: {
        name: 'storybook',
        browser: {
          enabled: true,
          headless: true,
          provider: playwright({}),
          instances: [{
            browser: 'chromium'
          }]
        }
      }
    }]
  }
});