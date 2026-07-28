#!/usr/bin/env node
// Copies the already-generated token CSS into dist/ after the Vite lib build, so they ship as
// their own package.json "exports" subpaths (./tokens.css, ./typography.css). Plain Node
// fs.copyFileSync rather than a shell `cp` so this works cross-platform (Windows included) —
// npm scripts on Windows run through cmd.exe, which has no `cp`.
import { copyFileSync, renameSync } from 'node:fs';

const pairs = [
  ['src/tokens/generated/tokens.css', 'dist/tokens.css'],
  ['src/tokens/generated/typography.css', 'dist/typography.css'],
];

for (const [from, to] of pairs) {
  copyFileSync(new URL(from, import.meta.url), new URL(to, import.meta.url));
  console.log(`copied ${from} -> ${to}`);
}

// Vite's lib-mode CSS output is named after build.lib.fileName ("index.css"), matching the JS
// entry — rename to something a consumer would actually recognize as "the component styles".
renameSync(new URL('dist/index.css', import.meta.url), new URL('dist/style.css', import.meta.url));
console.log('renamed dist/index.css -> dist/style.css');
