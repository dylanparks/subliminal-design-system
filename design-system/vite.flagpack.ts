// Shared by vite.config.ts (dev server, Vitest, Storybook) and vite.lib.config.ts (npm build).
//
// PhoneField imports react-flagpack's flag SVGs as modules (see
// src/components/Fields/PhoneField/FlagImage.tsx) through this alias, so they are bundled with
// the component instead of being fetched from a /flags URL the host app would have to serve.
//
// The directory is resolved through Node rather than assumed to be ./node_modules: npm
// workspaces hoist react-flagpack to the monorepo root.
import { createRequire } from 'node:module';
import path from 'node:path';

export const FLAGPACK_FLAGS_ALIAS = '@sds-flagpack-flags';

export const flagpackFlagsDir = path.join(
  path.dirname(createRequire(import.meta.url).resolve('react-flagpack/package.json')),
  'dist/flags',
);

export const flagpackAlias = { [FLAGPACK_FLAGS_ALIAS]: flagpackFlagsDir };
