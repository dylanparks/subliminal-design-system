import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'));

// Never bundle anything a consumer's own node_modules should provide — react/react-dom
// (peerDependencies) and every real npm dependency (@floating-ui/dom, libphonenumber-js,
// react-flagpack, flagpack-core, @material-symbols/svg-400, adm-zip, style-dictionary).
const external = [
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.peerDependencies ?? {}),
];

export default defineConfig({
  plugins: [
    react(),
    dts({
      entryRoot: 'src',
      include: [
        'src/lib.ts',
        'src/components/**/*.{ts,tsx}',
        'src/theme/**/*.ts',
        'src/utilities/**/*.{ts,tsx}',
        'src/tokens/generated/tokens.ts',
      ],
      exclude: ['**/*.stories.tsx', '**/*.test.tsx'],
      rollupTypes: true,
      insertTypesEntry: true,
    }),
  ],
  publicDir: false, // don't copy the CRA demo app's public/ (favicon, manifest.json, etc.)
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    cssCodeSplit: false,
    lib: {
      entry: new URL('./src/lib.ts', import.meta.url).pathname,
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external,
    },
  },
});
