#!/usr/bin/env node
// Prints CSP source hashes ('sha256-...') for every inline <script>/<style> block found in
// site/dist/**/*.html. Astro's own island-hydration runtime injects a couple of small inline
// blocks (framework boilerplate, not application code) whenever a page uses client:load /
// client:only — these hashes let public/_headers pin CSP to exactly those known blocks instead
// of weakening script-src/style-src with 'unsafe-inline'.
//
// Run after `npm run build` whenever Astro, @astrojs/react, or the set of hydrated islands on a
// page changes, and update public/_headers with whatever this prints.
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';

const scriptHashes = new Set();
const styleHashes = new Set();

function hash(content) {
  return `'sha256-${createHash('sha256').update(content, 'utf8').digest('base64')}'`;
}

for await (const file of glob('dist/**/*.html', { cwd: import.meta.dirname + '/..' })) {
  const html = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');

  for (const m of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)) {
    scriptHashes.add(hash(m[1]));
  }
  for (const m of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) {
    styleHashes.add(hash(m[1]));
  }
}

console.log('script-src additions:');
for (const h of scriptHashes) console.log(' ', h);
console.log('\nstyle-src additions:');
for (const h of styleHashes) console.log(' ', h);
