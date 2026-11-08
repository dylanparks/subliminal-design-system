/// <reference types="vitest" />
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';

// react-flagpack's <Flag> renders <img src="/flags/{size}/{code}.svg">, so the SVGs must be
// served from the app origin. Resolve the package through Node rather than assuming
// ./node_modules: npm workspaces hoist it to the monorepo root.
const flagpackFlagsDir = path.join(
  path.dirname(createRequire(import.meta.url).resolve('react-flagpack/package.json')),
  'dist/flags',
);

// Serves react-flagpack's flag SVGs at /flags/{size}/{code}.svg for the dev server.
const flagpackAssetsPlugin: Plugin = {
  name: 'flagpack-assets',
  configureServer(server) {
    server.middlewares.use('/flags', (req, res, next) => {
      let urlPath: string;
      try {
        urlPath = decodeURIComponent((req.url ?? '').split('?')[0]).replace(/^\//, '');
      } catch {
        return next(); // malformed escape sequence
      }
      const filePath = resolve(flagpackFlagsDir, urlPath);
      // Only serve files inside the flags directory (no ../ traversal).
      if (!filePath.startsWith(flagpackFlagsDir + path.sep)) return next();
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
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
