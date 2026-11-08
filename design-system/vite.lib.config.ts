import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { readFileSync } from 'node:fs';
import { flagpackAlias } from './vite.flagpack';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'));

// Never bundle anything a consumer's own node_modules should provide — react/react-dom
// (peerDependencies) and every real npm dependency (@floating-ui/dom, libphonenumber-js,
// @material-symbols/svg-400, adm-zip). react-flagpack is a devDependency:
// PhoneField's flag SVGs and flag CSS are bundled into dist (see vite.flagpack.ts).
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
        'src/vite-env.d.ts', // vite/client types (import.meta.glob in PhoneField/FlagImage.tsx)
        'src/components/**/*.{ts,tsx}',
        'src/mode/**/*.{ts,tsx}',
        'src/utilities/**/*.{ts,tsx}',
        'src/tokens/generated/tokens.ts',
      ],
      exclude: ['**/*.stories.tsx', '**/*.test.tsx'],
      rollupTypes: true,
      insertTypesEntry: true,
    }),
  ],
  resolve: {
    alias: flagpackAlias,
  },
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
