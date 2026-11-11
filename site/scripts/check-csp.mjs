#!/usr/bin/env node
// Fails the build when the site's Content-Security-Policy (public/_headers) would block something
// in the page that was just built.
//
// The CSP allows inline <script> and <style> blocks by hash instead of 'unsafe-inline'. A hash is
// only valid for the exact text, so any edit to inline content (a design-token rename in an inline
// style, an Astro upgrade) silently invalidates it, and the browser then drops the script or
// style in production with nothing but a console error. This runs after `astro build` and turns
// that into a failed deploy, which leaves the previous working version live.
//
// When it fails, run `npm run csp-hashes -w site` and copy the hashes into public/_headers.
import { createHash } from 'node:crypto';
import { readFile, glob } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const sha = (text) => `'sha256-${createHash('sha256').update(text, 'utf8').digest('base64')}'`;

const headers = await readFile(new URL('public/_headers', root), 'utf8');
const csp = headers.split('\n').map((l) => l.trim()).find((l) => l.startsWith('Content-Security-Policy:'));
if (!csp) {
  console.error('✖ check-csp: public/_headers has no Content-Security-Policy line.');
  process.exit(1);
}
const directive = (name) => {
  const m = csp.match(new RegExp(`(?:^|[:;])\\s*${name}\\s+([^;]*)`));
  return m ? m[1].split(/\s+/) : null;
};
const allowed = { script: directive('script-src') ?? directive('default-src'), style: directive('style-src') ?? directive('default-src') };

const errors = [];
const used = { script: new Set(), style: new Set() };
let pages = 0;

for await (const file of glob('dist/**/*.html', { cwd: root.pathname })) {
  pages++;
  const html = await readFile(new URL(file, root), 'utf8');
  const check = (kind, body) => {
    const h = sha(body);
    used[kind].add(h);
    if (!allowed[kind].includes(h) && !allowed[kind].includes("'unsafe-inline'")) {
      errors.push(`${file}: an inline <${kind}> (${h.slice(0, 20)}…) isn't allowed by the CSP.`);
    }
  };
  for (const m of html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*\btype=["']application\/(?:ld\+)?json["'])[^>]*>([\s\S]*?)<\/script>/g)) check('script', m[1]);
  for (const m of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) check('style', m[1]);
  if (/\sstyle="/.test(html) && !allowed.style.includes("'unsafe-inline'")) {
    errors.push(`${file}: has a style="" attribute, which this CSP blocks. Use a class or a <style> block.`);
  }
  if (/\son[a-z]+="/i.test(html.replace(/<(script|style)[\s\S]*?<\/\1>/g, ''))) {
    errors.push(`${file}: has an inline event handler attribute, which this CSP blocks.`);
  }
}

if (pages === 0) errors.push('no built pages found in dist/ — run `astro build` first.');

for (const [kind, hashes] of Object.entries(allowed)) {
  const stale = hashes.filter((h) => h.startsWith("'sha256-") && !used[kind].has(h));
  if (stale.length) console.warn(`⚠ check-csp: ${stale.length} ${kind}-src hash(es) in _headers match nothing in the build (harmless, but can be removed).`);
}

if (errors.length) {
  console.error(`✖ check-csp:\n${errors.map((e) => `  • ${e}`).join('\n')}\n  Run \`npm run csp-hashes -w site\` and update public/_headers.`);
  process.exit(1);
}
console.log(`✓ check-csp: every inline script and style in ${pages} page(s) is allowed by the CSP.`);
