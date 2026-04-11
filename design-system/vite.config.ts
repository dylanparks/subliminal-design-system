/// <reference types="vitest" />
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import path from 'path';
import fs from 'fs';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';

// Serves react-flagpack's flag SVGs at /flags/{size}/{code}.svg for the dev server.
const flagpackAssetsPlugin: Plugin = {
  name: 'flagpack-assets',
  configureServer(server) {
    const flagsDir = resolve(__dirname, 'node_modules/react-flagpack/dist/flags');
    server.middlewares.use('/flags', (req, res, next) => {
      const filePath = resolve(flagsDir, (req.url ?? '').replace(/^\//, ''));
      if (fs.existsSync(filePath)) {
        res.setHeader('Content-Type', 'image/svg+xml');
        res.end(fs.readFileSync(filePath));
      } else {
        next();
      }
    });
  },
};

export default defineConfig({
  plugins: [react(), flagpackAssetsPlugin],
  optimizeDeps: {
    include: ['react-flagpack'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['**/*.stories.*', '**/node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
    projects: [
      // Unit tests — jsdom
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['src/**/*.test.{ts,tsx}'],
          environment: 'jsdom',
        },
      },
      // Storybook story tests — browser mode
      {
        extends: true,
        plugins: [
          storybookTest({ configDir: path.join(import.meta.dirname, '.storybook') }),
        ],
        test: {
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
