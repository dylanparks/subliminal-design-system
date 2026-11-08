#!/usr/bin/env node
// Runs the Chromatic CLI for `npm run chromatic`.
//
// Resolves the CLI through Node instead of hard-coding node_modules/chromatic/...: npm workspaces
// hoist the package to the monorepo root, and the CLI file itself has moved between releases
// (dist/bin.js → dist/bin.cjs). The package's own "bin" field is the source of truth.
//
// The npm script loads .env.local (CHROMATIC_PROJECT_TOKEN) via `node --env-file`, and arguments
// after `npm run chromatic --` pass straight through: process.argv is [node, this file, ...args],
// which is the shape the CLI expects.
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const pkgPath = require.resolve('chromatic/package.json');
const { bin } = require(pkgPath);
const binPath = typeof bin === 'string' ? bin : bin.chromatic;

require(join(dirname(pkgPath), binPath));
