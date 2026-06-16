import type { StorybookConfig } from '@storybook/react-vite';
import { fileURLToPath } from 'node:url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config: StorybookConfig = {
  stories: [
    "../ui/**/*.stories.@(js|jsx|mjs|ts|tsx)",
  ],
  addons: [
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-mcp"
  ],
  framework: "@storybook/react-vite",
  staticDirs: ["../public"],
  async viteFinal(config) {
    const { mergeConfig } = await import('vite');
    return mergeConfig(config, {
      resolve: {
        alias: {
          '@app': path.resolve(__dirname, '../app'),
          '@ui': path.resolve(__dirname, '../ui'),
          '@features': path.resolve(__dirname, '../features'),
          '@data': path.resolve(__dirname, '../data'),
          '@core': path.resolve(__dirname, '../core'),
          '@shared': path.resolve(__dirname, '../shared'),
          '@styling': path.resolve(__dirname, '../styling'),
          '@config': path.resolve(__dirname, '../config'),
        }
      }
    });
  }
};
export default config;