#!/usr/bin/env node
/**
 * Token build pipeline for the Subliminal design system.
 *
 * Reads a Brand-layer token export from Subliminal Relay and produces:
 *   - tokens.css      — CSS custom properties: Brand, Color mode (light/dark), scale, breakpoints
 *   - typography.css  — .sds-text--{category}-{size} utility classes
 *   - tokens.ts       — TypeScript constants (typed CSS var references)
 *   - fonts.ts        — Google Fonts metadata
 *
 * ─── Usage ────────────────────────────────────────────────────────────────────
 *
 *   Within the DS repo (uses built-in default tokens):
 *     node build-tokens.mjs
 *     npm run build:tokens
 *
 *   In a consumer project (your own Relay export):
 *     npx sds-build-tokens --input ./subliminal-tokens.zip --output ./src/design-tokens
 *
 *   Flags:
 *     --input  -i   A Relay export: a ZIP, or a directory of its files. Optional if exactly one
 *                   subliminal-tokens*.zip sits in the current directory.
 *     --output -o   Directory for generated output files. Required when run from an installed
 *                   package, so tokens aren't written into node_modules.
 *
 * ─── Token input (export via Subliminal Relay ≥ 0.5.0, "Download All (.zip)") ─
 *
 *   Brand.<mode>.tokens.json        — the theme: colour palettes, radius, size, border, type
 *   Color mode.<mode>.tokens.json   — intent colours, one file per mode (light/dark)
 *   Breakpoint.<mode>.tokens.json   — font sizes, line heights, viewport, one file per breakpoint
 *   Globals.<mode>.tokens.json      — primitives (read through Brand's aliases; not emitted)
 *   effect-styles.json              — optional
 *
 *   Colours are built by build-color-layer.mjs, everything else by build-scale-layer.mjs; both
 *   read the export through build-token-export.mjs. Without --input or a subliminal-tokens*.zip in
 *   the current directory, the repo's own export in src/tokens/relay-export/ is used.
 */

import { readFileSync, mkdirSync, writeFileSync, rmSync, existsSync, readdirSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { parseArgs } from 'util';
import AdmZip from 'adm-zip';
import { buildColorLayer } from './build-color-layer.mjs';
import { buildScaleLayer } from './build-scale-layer.mjs';
import {
  hasBrandLayerExport, tidy, BRAND_COLLECTION, COLOR_MODE_COLLECTION, BREAKPOINT_COLLECTION,
} from './build-token-export.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── CLI args ─────────────────────────────────────────────────────────────────

const { values: cliArgs } = parseArgs({
  options: {
    input:  { type: 'string', short: 'i' },
    output: { type: 'string', short: 'o' },
  },
  strict: false,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Set a value deep inside a nested object given an array path. */
function setDeep(obj, path, value) {
  let node = obj;
  for (let i = 0; i < path.length - 1; i++) {
    if (!node[path[i]]) node[path[i]] = {};
    node = node[path[i]];
  }
  node[path[path.length - 1]] = value;
}

/**
 * Convert a camelCase property name to kebab-case for CSS var naming.
 * "boxShadow"       → "box-shadow"
 * "backdropFilter"  → "backdrop-filter"
 */
function camelToKebab(str) {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase();
}

/**
 * Convert a Figma segment string to a kebab-case CSS-safe identifier.
 * "Font size"    → "font-size"
 * "DisplaySmall" → "display-small"
 * "X-Padding"    → "x-padding"
 * "XSmall"       → "x-small"
 */
function segmentize(str) {
  return str
    .replace(/([A-Z]{2,})([A-Z][a-z])/g, '$1-$2') // ABCDef → ABC-Def (single-letter prefix like X stays joined)
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')       // camelCase → camel-Case
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// ─── Effect styles ────────────────────────────────────────────────────────────
// Token layers are built by ./build-color-layer.mjs and ./build-scale-layer.mjs.

/**
 * Parse effect-styles.json exported by Subliminal Relay into a flat CSS var map.
 *
 * Each effect style leaf has a $value.css object of camelCase CSS properties.
 * One CSS custom property is emitted per CSS property per effect style:
 *   Static/elevation/low + boxShadow → --sds-effect-static-elevation-low-box-shadow
 *
 * WebkitBackdropFilter is skipped — the unprefixed backdropFilter var is sufficient;
 * consumers can apply the webkit prefix at usage time if needed.
 *
 * @param {string} filePath
 * @returns {Record<string, string>} flat { cssVar: value } map
 */
function parseEffectStyles(filePath) {
  const data = JSON.parse(readFileSync(filePath, 'utf8'));
  const vars = {};

  function walk(node, path) {
    if (node && typeof node === 'object' && '$type' in node && node.$type === 'effect') {
      const css = node.$value?.css ?? {};
      const pathSegments = path.map(p => segmentize(p)).join('-');
      for (const [prop, value] of Object.entries(css)) {
        if (prop === 'WebkitBackdropFilter') continue;
        const cssVar = `--sds-effect-${pathSegments}-${camelToKebab(prop)}`;
        // Relay writes Figma's float32 values verbatim (rgba(…, 0.10000000149011612)); round them.
        vars[cssVar] = String(value).replace(/\d+\.\d{5,}/g, (n) => String(tidy(n)));
      }
    } else if (node && typeof node === 'object') {
      for (const [key, child] of Object.entries(node)) {
        if (!key.startsWith('$')) walk(child, [...path, key]);
      }
    }
  }

  walk(data, []);
  return vars;
}

/**
 * Build a nested TypeScript object from effect-styles.json.
 * Each leaf becomes an object of { camelCaseProp: 'var(--sds-effect-...)' }
 * for direct use as React inline styles or Emotion css() arguments.
 *
 * Example:
 *   effectTokens.Static.elevation.low.boxShadow
 *   → 'var(--sds-effect-static-elevation-low-box-shadow)'
 *
 * @param {string} filePath
 * @returns {object}
 */
function buildEffectNestedTs(filePath) {
  const data = JSON.parse(readFileSync(filePath, 'utf8'));
  const root = {};

  function walk(node, path) {
    if (node && typeof node === 'object' && '$type' in node && node.$type === 'effect') {
      const css = node.$value?.css ?? {};
      const pathSegments = path.map(p => segmentize(p)).join('-');
      const leaf = {};
      for (const [prop, _value] of Object.entries(css)) {
        if (prop === 'WebkitBackdropFilter') continue;
        const cssVar = `--sds-effect-${pathSegments}-${camelToKebab(prop)}`;
        leaf[prop] = `var(${cssVar})`;
      }
      if (Object.keys(leaf).length > 0) setDeep(root, path, leaf);
    } else if (node && typeof node === 'object') {
      for (const [key, child] of Object.entries(node)) {
        if (!key.startsWith('$')) walk(child, [...path, key]);
      }
    }
  }

  walk(data, []);
  return root;
}

// ─── TypeScript constants ─────────────────────────────────────────────────────

function buildNestedObject(paths, valueFactory) {
  const root = {};
  for (const path of paths) {
    setDeep(root, path, valueFactory(path));
  }
  return root;
}

function toCssVarName(prefix, path) {
  return `--${prefix}-${path.join('-')}`;
}

function objectToTs(obj, indent = 2) {
  const pad = ' '.repeat(indent);
  const entries = Object.entries(obj).map(([k, v]) => {
    const key = /^[a-z_$][a-z0-9_$]*$/i.test(k) ? k : JSON.stringify(k);
    const value =
      typeof v === 'object' ? objectToTs(v, indent + 2) : JSON.stringify(v);
    return `${pad}${key}: ${value},`;
  });
  return `{\n${entries.join('\n')}\n${' '.repeat(indent - 2)}}`;
}

// ─── CSS rendering ────────────────────────────────────────────────────────────

function renderCssBlock(selector, vars) {
  const lines = Object.entries(vars).map(([k, v]) => `  ${k}: ${v};`);
  return `${selector} {\n${lines.join('\n')}\n}`;
}

// ─── Google Fonts ─────────────────────────────────────────────────────────────

function buildGoogleFontsUrl(families, weights) {
  if (!families.length) return null;
  const wStr = weights.join(';');
  const params = families.map((f) => `family=${f.replace(/\s+/g, '+')}:wght@${wStr}`);
  return `https://fonts.googleapis.com/css2?${params.join('&')}&display=swap`;
}

async function verifyGoogleFonts(families, url) {
  if (!families.length || !url) {
    return { googleFonts: [], unverified: [], networkError: false };
  }
  try {
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; build-tokens/1.0)' },
    });
    if (!resp.ok) {
      return { googleFonts: [], unverified: families, networkError: false };
    }
    const css = await resp.text();
    const googleFonts = families.filter(
      (f) => css.includes(`'${f}'`) || css.includes(`"${f}"`)
    );
    const unverified = families.filter((f) => !googleFonts.includes(f));
    return { googleFonts, unverified, networkError: false };
  } catch {
    return { googleFonts: [], unverified: [], networkError: true };
  }
}

// ─── Main build ───────────────────────────────────────────────────────────────

// Run from an installed package (npx sds-build-tokens) rather than from this repo. Its defaults
// point inside this package — writing there would bury a consumer's tokens in node_modules, to be
// wiped on the next install, and the repo's own export isn't shipped — so consumers must be explicit.
const runFromInstall = __dirname.split(/[\\/]/).includes('node_modules');

if (runFromInstall && !cliArgs.output) {
  console.error('✖ sds-build-tokens: pass --output — where to write tokens.css, typography.css, tokens.ts and fonts.ts.');
  console.error('    npx sds-build-tokens --input ./subliminal-tokens.zip --output ./src/design-tokens');
  process.exit(1);
}

const outputDir = cliArgs.output
  ? resolve(process.cwd(), cliArgs.output)
  : join(__dirname, 'src', 'tokens', 'generated');

// ─── Resolve input: --input flag, ZIP auto-detect, or DS repo default ─────────

let relayDir;
let zipExtractDir = null; // set if we extracted a ZIP — cleaned up at the end

function extractZip(zipPath) {
  const extractTo = join(outputDir, '.tokens-zip');
  if (existsSync(extractTo)) rmSync(extractTo, { recursive: true, force: true });
  mkdirSync(extractTo, { recursive: true });
  const zip = new AdmZip(zipPath);
  zip.extractAllTo(extractTo, true);
  // Relay's "Download All (.zip)" puts the files at the root; a hand-made ZIP may wrap them in one
  // top-level folder. Use whichever holds the export.
  if (hasBrandLayerExport(extractTo)) return extractTo;
  const folder = readdirSync(extractTo).find((e) => hasBrandLayerExport(join(extractTo, e)));
  return folder ? join(extractTo, folder) : extractTo;
}

if (cliArgs.input) {
  const inputPath = resolve(process.cwd(), cliArgs.input);
  if (inputPath.toLowerCase().endsWith('.zip')) {
    if (!existsSync(inputPath)) {
      console.error(`✖ sds-build-tokens: File not found: ${inputPath}`);
      process.exit(1);
    }
    console.log(`  Extracting ${inputPath}...`);
    zipExtractDir = join(outputDir, '.tokens-zip');
    relayDir = extractZip(inputPath);
  } else {
    relayDir = inputPath;
  }
} else {
  // Auto-detect subliminal-tokens*.zip in the current working directory
  const cwd = process.cwd();
  const zipMatches = readdirSync(cwd).filter(f => /^subliminal-tokens.*\.zip$/i.test(f));

  if (zipMatches.length === 1) {
    const zipPath = join(cwd, zipMatches[0]);
    console.log(`  Found ${zipMatches[0]} — extracting...`);
    zipExtractDir = join(outputDir, '.tokens-zip');
    relayDir = extractZip(zipPath);
  } else if (zipMatches.length > 1) {
    console.error('✖ sds-build-tokens: Multiple Subliminal token ZIPs found in this directory:');
    for (const f of zipMatches) console.error(`    ${f}`);
    console.error('  Specify which one to use:');
    console.error(`    npx sds-build-tokens --input ./${zipMatches[0]}`);
    process.exit(1);
  } else if (runFromInstall) {
    console.error(`✖ sds-build-tokens: no --input, and no subliminal-tokens*.zip in ${cwd}.`);
    console.error('  Export from Figma with Subliminal Relay ("Download All (.zip)"), then:');
    console.error('    npx sds-build-tokens --input ./subliminal-tokens.zip --output ./src/design-tokens');
    process.exit(1);
  } else {
    // No ZIP found — fall back to the DS repo's own export
    relayDir = join(__dirname, 'src', 'tokens', 'relay-export');
  }
}

if (!hasBrandLayerExport(relayDir)) {
  console.error(`✖ sds-build-tokens: No Subliminal token export found in ${relayDir}.`);
  console.error(`  Expected ${BRAND_COLLECTION}, ${COLOR_MODE_COLLECTION} and ${BREAKPOINT_COLLECTION} files`);
  console.error('  (e.g. "Brand.Default.tokens.json"), as exported by Subliminal Relay ≥ 0.5.0.');
  console.error('  Export from Figma with Relay\'s "Download All (.zip)", then:');
  console.error('    npx sds-build-tokens --input ./subliminal-tokens.zip');
  process.exit(1);
}

mkdirSync(outputDir, { recursive: true });

// ─── Build the layers ──────────────────────────────────────────────────────────
// Colours: Brand palettes + intent formulas (build-color-layer.mjs).
// Everything else: radii, sizes, borders, typography, viewport (build-scale-layer.mjs).

let colorLayer;
let scaleLayer;
try {
  colorLayer = buildColorLayer(relayDir);
  scaleLayer = buildScaleLayer(relayDir);
} catch (err) {
  console.error(`✖ sds-build-tokens: ${err.message}`);
  process.exit(1);
}

// Two layers producing the same CSS name would silently overwrite each other.
{
  const colorNames = [
    ...colorLayer.intentPaths.map((p) => toCssVarName('sds', p)),
    ...colorLayer.brandPaths.map((p) => toCssVarName('sds-brand', p)),
  ];
  const clashes = scaleLayer.varNames.filter((n) => colorNames.includes(n));
  if (clashes.length > 0) {
    console.error(`✖ sds-build-tokens: these names are produced by both the colour and scale layers: ${clashes.join(', ')}`);
    process.exit(1);
  }
}

for (const w of scaleLayer.warnings) console.warn(`⚠  build-tokens: ${w}`);

// ─── Effect style tokens (optional) ───────────────────────────────────────────

const effectStylesPath = join(relayDir, 'effect-styles.json');
const effectVars = existsSync(effectStylesPath) ? parseEffectStyles(effectStylesPath) : {};
const effectNested = existsSync(effectStylesPath) ? buildEffectNestedTs(effectStylesPath) : {};

// ─── Google Fonts ──────────────────────────────────────────────────────────────

const { families: gFamilies, weights: gWeights } = scaleLayer.fonts;
const googleFontsUrl = buildGoogleFontsUrl(gFamilies, gWeights);
const fontVerification = await verifyGoogleFonts(gFamilies, googleFontsUrl);

if (fontVerification.networkError) {
  console.warn('⚠  build-tokens: Could not reach Google Fonts to verify font families (network error).');
} else if (fontVerification.unverified.length > 0) {
  console.warn('⚠  build-tokens: The following font families were not found on Google Fonts:');
  for (const f of fontVerification.unverified) {
    console.warn(`   • ${f} — custom or purchased font. Other users will need the file or a self-hosted @font-face.`);
  }
}

// ─── Merge all CSS outputs ─────────────────────────────────────────────────────

const parts = [
  '/* Generated by build-tokens.mjs — do not edit manually */',
  '/* Re-run: npm run build:tokens                         */',
  '',
  ...(googleFontsUrl
    ? [
        '/* ─── Google Fonts ─────────────────────────────────────────────────────────── */',
        `@import url('${googleFontsUrl}');`,
        '',
      ]
    : []),
  colorLayer.css,
  '',
  ...(Object.keys(effectVars).length > 0
    ? [
        '/* ─── Effect styles ──────────────────────────────────────────────────────── */',
        renderCssBlock(':root', effectVars),
        '',
      ]
    : []),
  scaleLayer.css,
  '',
];

writeFileSync(join(outputDir, 'tokens.css'), parts.join('\n'));

// ─── Generate typography utility classes ──────────────────────────────────────

writeFileSync(join(outputDir, 'typography.css'), scaleLayer.typographyCss);

// ─── Generate TypeScript constants ────────────────────────────────────────────

const sdCssPrefix = 'sds';

// Components read these (the Color mode layer)…
const colorNested = buildNestedObject(colorLayer.intentPaths, (path) => {
  return `var(${toCssVarName(sdCssPrefix, path)})`;
});

// …and themes write these (the Brand layer): brandTokens.light.primary → var(--sds-brand-light-primary)
const brandNested = buildNestedObject(colorLayer.brandPaths, (path) => {
  return `var(${toCssVarName(`${sdCssPrefix}-brand`, path)})`;
});

// One export per top-level group of the scale layer: radiusTokens, sizeTokens,
// borderThicknessTokens, typographyTokens, viewportTokens.
const scaleNested = buildNestedObject(scaleLayer.tsPaths, (path) => `var(${toCssVarName(sdCssPrefix, path)})`);
const exportName = (group) => `${group.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase())}Tokens`;
const scaleTsLines = Object.entries(scaleNested).flatMap(([group, tree]) => [
  `export const ${exportName(group)} = ${objectToTs(tree)} as const;`,
  '',
]);

const effectTsLines = Object.keys(effectNested).length > 0
  ? [
      '/**',
      ' * Effect style tokens — each leaf is a CSS style object for direct use',
      ' * as React inline styles or Emotion css() arguments.',
      ' * Example: css(effectTokens.Static.elevation.low)',
      ' */',
      `export const effectTokens = ${objectToTs(effectNested)} as const;`,
      '',
    ]
  : [];

const tokensTs = [
  '/* Generated by build-tokens.mjs — do not edit manually */',
  '/* Re-run: npm run build:tokens                         */',
  '',
  `export const tokens = ${objectToTs(colorNested)} as const;`,
  '',
  'export type Tokens = typeof tokens;',
  '',
  '/**',
  ' * The Brand layer — both palettes. Theme by overriding these CSS variables; components',
  ' * should read `tokens` (the Color mode layer), never these directly.',
  ' */',
  `export const brandTokens = ${objectToTs(brandNested)} as const;`,
  '',
  ...scaleTsLines,
  ...effectTsLines,
].join('\n');

writeFileSync(join(outputDir, 'tokens.ts'), tokensTs);

// ─── Generate font metadata ────────────────────────────────────────────────────

const fontsTs = [
  '/* Generated by build-tokens.mjs — do not edit manually */',
  '/* Re-run: npm run build:tokens                         */',
  '',
  '/** All font families declared in the Brand collection, with Google Fonts verification status. */',
  'export const fontFamilies: {',
  '  /** Every unique family across all typography tokens. */',
  '  all: string[];',
  '  /** Confirmed present on Google Fonts (loaded via @import in tokens.css). */',
  '  googleFonts: string[];',
  '  /** Not found on Google Fonts — custom, purchased, or self-hosted. */',
  '  unverified: string[];',
  '} = {',
  `  all: ${JSON.stringify(gFamilies)},`,
  `  googleFonts: ${JSON.stringify(fontVerification.networkError ? [] : fontVerification.googleFonts)},`,
  `  unverified: ${JSON.stringify(fontVerification.networkError ? [] : fontVerification.unverified)},`,
  '};',
  '',
].join('\n');

writeFileSync(join(outputDir, 'fonts.ts'), fontsTs);

// ─── Cleanup ───────────────────────────────────────────────────────────────────

if (zipExtractDir) rmSync(zipExtractDir, { recursive: true, force: true });

{
  const s = colorLayer.summary;
  console.log(
    `✓ colour layer — ${s.brandColors} Brand colours; ${s.composed} composed + ${s.aliases} aliased intent colours` +
    `${s.fixed ? `, ${s.fixed} fixed to Globals` : ''}, ${s.numbers} numbers` +
    `${s.skippedBooleans ? ` (${s.skippedBooleans} boolean flag not emitted)` : ''}`,
  );
}
{
  const s = scaleLayer.summary;
  console.log(
    `✓ scale layer — ${s.brand} Brand values (radius, size, border, type), ${s.breakpoint} per breakpoint ` +
    `(${s.breakpoints.join(' → ')}), ${s.typeStyles} type styles`,
  );
}
console.log('✓ tokens.css');
console.log('✓ typography.css');
console.log('✓ tokens.ts');
console.log('✓ fonts.ts');
if (Object.keys(effectVars).length > 0) {
  console.log(`  ✓ effectTokens — ${Object.keys(effectVars).length} effect vars`);
}
console.log(`  → ${outputDir}`);
