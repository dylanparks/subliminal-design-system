#!/usr/bin/env node
/**
 * Token build pipeline for the Subliminal design system.
 *
 * Reads W3C Design Token JSON files exported by Subliminal Relay and produces:
 *   - tokens.css   — CSS custom properties (:root light + .dark + responsive media queries)
 *   - tokens.ts    — TypeScript constants (typed CSS var references)
 *   - fonts.ts     — Google Fonts metadata
 *
 * ─── Usage ────────────────────────────────────────────────────────────────────
 *
 *   Within the DS repo (uses built-in default tokens):
 *     node build-tokens.mjs
 *     npm run build:tokens
 *
 *   In a consumer project (custom Relay-exported tokens):
 *     npx sds-build-tokens --input ./my-tokens --output ./src/design-tokens
 *
 *   Flags:
 *     --input  -i   Directory containing Relay token JSON files (required for consumers)
 *     --output -o   Directory for generated output files
 *
 * ─── Required token files (export via Subliminal Relay) ──────────────────────
 *
 *     global-colors.json       — raw color palette
 *     intent-colors-light.json — semantic colors, light mode
 *     intent-colors-dark.json  — semantic colors, dark mode
 *     typography-lg.json       — typography tokens, LG (default)
 *     typography-md.json       — typography tokens, MD breakpoint
 *     typography-xs.json       — typography tokens, XS breakpoint
 *     shape.json               — border-radius values
 *     viewport-lg.json         — viewport reference values, LG (default)
 *     viewport-md.json         — viewport reference values, MD
 *     viewport-xs.json         — viewport reference values, XS
 */

import StyleDictionary from 'style-dictionary';
import { readFileSync, mkdirSync, writeFileSync, rmSync, existsSync, readdirSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { parseArgs } from 'util';
import AdmZip from 'adm-zip';

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

/**
 * Convert a Figma variable name to a Style Dictionary token path array.
 * "Colors/Cobalt/50"     → ["color", "cobalt", "50"]
 * "Neutrals/Ash/50"      → ["neutral", "ash", "50"]
 * "Transparent/Light/50" → ["transparent", "light", "50"]
 */
function figmaNameToPath(name) {
  const parts = name.split('/');
  const prefixMap = { Colors: 'color', Neutrals: 'neutral', Transparent: 'transparent' };
  const group = prefixMap[parts[0]] ?? parts[0].toLowerCase();
  return [group, ...parts.slice(1).map((p) => p.toLowerCase())];
}

/** Convert a Figma aliasName like "Colors/Cobalt/800" to "{color.cobalt.800}". */
function figmaNameToRef(aliasName) {
  return `{${figmaNameToPath(aliasName).join('.')}}`;
}

/**
 * Convert a Relay W3C alias reference to a Style Dictionary reference.
 * "{global-colors.Colors.Cobalt.800}" → "{color.cobalt.800}"
 */
function relayAliasToRef(aliasValue) {
  const inner = aliasValue.slice(1, -1); // strip { }
  const dotIndex = inner.indexOf('.');
  if (dotIndex === -1) return aliasValue;
  const varPath = inner.slice(dotIndex + 1).replace(/\./g, '/'); // e.g. "Colors/Cobalt/800"
  return figmaNameToRef(varPath);
}

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

/**
 * Recursively traverse a W3C Design Token tree and collect all leaf tokens.
 * A leaf is any node that has a "$value" key.
 *
 * @returns {{ path: string[], value: any, type: string, description?: string }[]}
 */
function traverseW3C(obj, currentPath = [], results = []) {
  for (const [key, val] of Object.entries(obj)) {
    if (val && typeof val === 'object' && '$value' in val) {
      results.push({
        path: [...currentPath, key],
        value: val.$value,
        type: val.$type,
        description: val.$description,
      });
    } else if (val && typeof val === 'object') {
      traverseW3C(val, [...currentPath, key], results);
    }
  }
  return results;
}

// ─── W3C Token Parsers ────────────────────────────────────────────────────────

/**
 * Parse a Relay global-colors.json (W3C format) into a Style Dictionary token tree.
 * Token paths follow the Figma group hierarchy: Colors/Cobalt/50 → color.cobalt.50
 */
function parseRelayGlobalColors(filePath) {
  const data = JSON.parse(readFileSync(filePath, 'utf8'));
  const tokens = {};

  for (const { path, value, type } of traverseW3C(data)) {
    if (type !== 'color') continue;
    const figmaName = path.join('/');        // "Colors/Cobalt/50"
    const sdPath = figmaNameToPath(figmaName); // ["color", "cobalt", "50"]
    setDeep(tokens, sdPath, { value, type: 'color' });
  }

  return tokens;
}

/**
 * Parse a Relay intent-colors.json (W3C format) into a Style Dictionary token tree.
 * Alias values like "{global-colors.Colors.Cobalt.800}" are converted to
 * Style Dictionary references "{color.cobalt.800}".
 */
function parseRelayIntentTokens(filePath) {
  const data = JSON.parse(readFileSync(filePath, 'utf8'));
  const tokens = {};

  for (const { path, value, description } of traverseW3C(data)) {
    const sdPath = path.map((p) =>
      p.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    );

    const tokenValue =
      typeof value === 'string' && value.startsWith('{') && value.endsWith('}')
        ? relayAliasToRef(value)
        : value;

    const entry = { value: tokenValue, type: 'color' };
    if (description) entry.comment = description;
    setDeep(tokens, sdPath, entry);
  }

  return tokens;
}

/**
 * Parse a Relay flat-token file (shape.json, viewport.json, typography*.json)
 * into a flat { cssVar: value } map.
 *
 * FLOAT rules:
 *   - Paths containing "weight" → unitless number (font-weight)
 *   - All others → appends "px"
 * STRING rules:
 *   - Multi-word values (e.g. "Work Sans") are quoted for CSS font-family use
 *
 * @param {string}   filePath
 * @param {string}   [prefix]  — CSS segment inserted after "--sds-" (e.g. "shape")
 * @param {string[]} [skip]    — Path segments to exclude (e.g. ["Min Height"])
 */
function parseRelayFlatTokens(filePath, { prefix = '', skip = [] } = {}) {
  const data = JSON.parse(readFileSync(filePath, 'utf8'));
  const vars = {};

  for (const { path, value } of traverseW3C(data)) {
    if (skip.some((s) => path.some((p) => p.includes(s)))) continue;

    const segment = path.map(segmentize).join('-');
    const cssVar = prefix ? `--sds-${prefix}-${segment}` : `--sds-${segment}`;

    if (typeof value === 'number') {
      const isWeight = path.some((p) => /weight/i.test(p));
      vars[cssVar] = isWeight ? String(value) : `${value}px`;
    } else if (typeof value === 'string') {
      vars[cssVar] = value.includes(' ') ? `"${value}"` : value;
    }
  }

  return vars;
}

/**
 * Extract font family names and weights from a Relay typography.json (W3C format).
 * Inspects token paths for "family" / "weight" keywords to classify tokens.
 */
function extractFontMetadataW3C(filePath) {
  const data = JSON.parse(readFileSync(filePath, 'utf8'));
  const families = new Set();
  const weights = new Set();

  for (const { path, value } of traverseW3C(data)) {
    const pathStr = path.join('/').toLowerCase();
    if (pathStr.includes('family') && typeof value === 'string') {
      families.add(value);
    }
    if (pathStr.includes('weight') && typeof value === 'number') {
      weights.add(Math.round(value));
    }
  }

  return {
    families: [...families].sort(),
    weights: [...weights].sort((a, b) => a - b),
  };
}

// ─── Style Dictionary custom format: TypeScript constants ─────────────────────

function collectIntentTokens(obj, prefix, results = []) {
  for (const [key, val] of Object.entries(obj)) {
    const currentPath = [...prefix, key];
    if (val && typeof val === 'object' && 'value' in val) {
      results.push(currentPath);
    } else if (val && typeof val === 'object') {
      collectIntentTokens(val, currentPath, results);
    }
  }
  return results;
}

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

/**
 * Build a nested TypeScript object from a flat CSS var map.
 * "--sds-typography-font-size-display-huge" → nested path from segments.
 */
function flatVarsToNestedTs(vars) {
  const root = {};
  for (const [cssVar] of Object.entries(vars)) {
    const path = cssVar.replace(/^--sds-/, '').split('-');
    setDeep(root, path, `var(${cssVar})`);
  }
  return root;
}

// ─── CSS rendering ────────────────────────────────────────────────────────────

function renderCssBlock(selector, vars) {
  const lines = Object.entries(vars).map(([k, v]) => `  ${k}: ${v};`);
  return `${selector} {\n${lines.join('\n')}\n}`;
}

function renderMediaQuery(maxWidth, vars) {
  const inner = Object.entries(vars).map(([k, v]) => `    ${k}: ${v};`).join('\n');
  return `@media (max-width: ${maxWidth}px) {\n  :root {\n${inner}\n  }\n}`;
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

const outputDir = cliArgs.output
  ? resolve(process.cwd(), cliArgs.output)
  : join(__dirname, 'src', 'tokens', 'generated');

const tmpDir = join(outputDir, '.tokens-tmp');

// ─── Resolve input: --input flag, ZIP auto-detect, or DS repo default ─────────

let relayDir;
let zipExtractDir = null; // set if we extracted a ZIP — cleaned up at the end

function extractZip(zipPath) {
  const extractTo = join(outputDir, '.tokens-zip');
  if (existsSync(extractTo)) rmSync(extractTo, { recursive: true, force: true });
  mkdirSync(extractTo, { recursive: true });
  const zip = new AdmZip(zipPath);
  zip.extractAllTo(extractTo, true);
  // The ZIP contains a single top-level folder (e.g. subliminal-tokens/)
  // Find it and use it as relayDir
  const entries = readdirSync(extractTo);
  const folder = entries.find(e => existsSync(join(extractTo, e, 'global-colors.json')));
  if (!folder) {
    // No nested folder — files are at the root of the ZIP
    return extractTo;
  }
  return join(extractTo, folder);
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
  } else {
    // No ZIP found — fall back to DS repo default (src/tokens/default-values/)
    relayDir = join(__dirname, 'src', 'tokens', 'default-values');
    if (!existsSync(relayDir)) {
      console.error('✖ sds-build-tokens: No subliminal-tokens*.zip found in the current directory.');
      console.error('  Export your tokens from the Subliminal Relay Figma plugin, then re-run.');
      console.error('  Or pass the path explicitly:');
      console.error('    npx sds-build-tokens --input ./subliminal-tokens.zip');
      process.exit(1);
    }
  }
}

// Guard: ensure relay token files exist before proceeding
const requiredFiles = [
  'global-colors.json',
  'intent-colors-light.json',
  'intent-colors-dark.json',
  'typography-lg.json',
  'typography-md.json',
  'typography-xs.json',
  'shape.json',
  'spacing.json',
  'viewport-lg.json',
  'viewport-md.json',
  'viewport-xs.json',
];
const missing = requiredFiles.filter((f) => !existsSync(join(relayDir, f)));
if (missing.length > 0) {
  console.error(`✖ sds-build-tokens: Missing required token files in ${relayDir}:`);
  for (const f of missing) console.error(`  • ${f}`);
  console.error('  Export your Figma variables using Subliminal Relay, then re-run.');
  process.exit(1);
}

mkdirSync(outputDir, { recursive: true });
mkdirSync(tmpDir, { recursive: true });

// ─── Color tokens (Style Dictionary) ──────────────────────────────────────────

const globalTokens = parseRelayGlobalColors(join(relayDir, 'global-colors.json'));
const intentLightTokens = parseRelayIntentTokens(join(relayDir, 'intent-colors-light.json'));

const intentDarkTokens = parseRelayIntentTokens(join(relayDir, 'intent-colors-dark.json'));

writeFileSync(join(tmpDir, 'global.json'), JSON.stringify(globalTokens));
writeFileSync(join(tmpDir, 'intent-light.json'), JSON.stringify(intentLightTokens));
writeFileSync(join(tmpDir, 'intent-dark.json'), JSON.stringify(intentDarkTokens));


const sdLight = new StyleDictionary({
  source: [join(tmpDir, 'global.json'), join(tmpDir, 'intent-light.json')],
  platforms: {
    css: {
      transformGroup: 'css',
      prefix: 'sds',
      buildPath: tmpDir + '/',
      files: [
        {
          destination: 'light.css',
          format: 'css/variables',
          filter: (token) => !token.filePath.endsWith('global.json'),
          options: { selector: ':root', outputReferences: false },
        },
      ],
    },
  },
});

await sdLight.buildAllPlatforms();

const sdDark = new StyleDictionary({
  source: [join(tmpDir, 'global.json'), join(tmpDir, 'intent-dark.json')],
  platforms: {
    css: {
      transformGroup: 'css',
      prefix: 'sds',
      buildPath: tmpDir + '/',
      files: [
        {
          destination: 'dark.css',
          format: 'css/variables',
          filter: (token) => !token.filePath.endsWith('global.json'),
          options: { selector: '.dark', outputReferences: false },
        },
      ],
    },
  },
});
await sdDark.buildAllPlatforms();
const darkCss = readFileSync(join(tmpDir, 'dark.css'), 'utf8');

// ─── Shape tokens ──────────────────────────────────────────────────────────────

const shapeVars = parseRelayFlatTokens(join(relayDir, 'shape.json'), { prefix: 'shape' });

// ─── Spacing tokens ────────────────────────────────────────────────────────────

const spacingVars = parseRelayFlatTokens(join(relayDir, 'spacing.json'), { prefix: 'spacing' });

// ─── Viewport tokens ───────────────────────────────────────────────────────────
// Three modes (LG/MD/XS) — each emitted under the matching media query.
// Viewport/Width drives the responsive breakpoint thresholds: MD styles apply
// below LG width, XS styles apply below MD width.

const viewportLgVars = parseRelayFlatTokens(join(relayDir, 'viewport-lg.json'), { skip: ['Min Height'] });
const viewportMdVars = parseRelayFlatTokens(join(relayDir, 'viewport-md.json'), { skip: ['Min Height'] });
const viewportXsVars = parseRelayFlatTokens(join(relayDir, 'viewport-xs.json'), { skip: ['Min Height'] });

// Derive media query thresholds from viewport Width values (e.g. LG=1440 → MD applies below 1440px)
const viewportLgWidth = JSON.parse(readFileSync(join(relayDir, 'viewport-lg.json'), 'utf8')).Viewport.Width.$value;
const viewportMdWidth = JSON.parse(readFileSync(join(relayDir, 'viewport-md.json'), 'utf8')).Viewport.Width.$value;
const mdBreakpoint = viewportLgWidth - 1;  // e.g. 1439
const xsBreakpoint = viewportMdWidth - 1;  // e.g. 767

const viewportMdDiff = Object.fromEntries(
  Object.entries(viewportMdVars).filter(([k, v]) => viewportLgVars[k] !== v)
);
const viewportXsDiff = Object.fromEntries(
  Object.entries(viewportXsVars).filter(([k, v]) => viewportLgVars[k] !== v)
);

// ─── Typography tokens ─────────────────────────────────────────────────────────
// Three modes (LG/MD/XS) — same breakpoint thresholds as viewport above.

const typographyLgVars = parseRelayFlatTokens(join(relayDir, 'typography-lg.json'));
const typographyMdVars = parseRelayFlatTokens(join(relayDir, 'typography-md.json'));
const typographyXsVars = parseRelayFlatTokens(join(relayDir, 'typography-xs.json'));

// Only emit MD/XS vars that differ from LG
const typographyMdDiff = Object.fromEntries(
  Object.entries(typographyMdVars).filter(([k, v]) => typographyLgVars[k] !== v)
);
const typographyXsDiff = Object.fromEntries(
  Object.entries(typographyXsVars).filter(([k, v]) => typographyLgVars[k] !== v)
);

// ─── Google Fonts ──────────────────────────────────────────────────────────────

const { families: gFamilies, weights: gWeights } = extractFontMetadataW3C(
  join(relayDir, 'typography-lg.json')
);
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

const lightCss = readFileSync(join(tmpDir, 'light.css'), 'utf8');

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
  '/* ─── Colors (light) ──────────────────────────────────────────────────────── */',
  lightCss.trim(),
  '',
  '/* ─── Shape ───────────────────────────────────────────────────────────────── */',
  renderCssBlock(':root', shapeVars),
  '',
  '/* ─── Spacing ──────────────────────────────────────────────────────────────── */',
  renderCssBlock(':root', spacingVars),
  '',
  '/* ─── Viewport (LG — default) ─────────────────────────────────────────────── */',
  renderCssBlock(':root', viewportLgVars),
  '',
  '/* ─── Typography (LG — default) ───────────────────────────────────────────── */',
  renderCssBlock(':root', typographyLgVars),
];

if (Object.keys(viewportMdDiff).length > 0 || Object.keys(typographyMdDiff).length > 0) {
  parts.push('');
  parts.push(`/* ─── MD — ≤${mdBreakpoint}px ─────────────────────────────────────────────────── */`);
  parts.push(renderMediaQuery(mdBreakpoint, { ...viewportMdDiff, ...typographyMdDiff }));
}

if (Object.keys(viewportXsDiff).length > 0 || Object.keys(typographyXsDiff).length > 0) {
  parts.push('');
  parts.push(`/* ─── XS — ≤${xsBreakpoint}px ──────────────────────────────────────────────────── */`);
  parts.push(renderMediaQuery(xsBreakpoint, { ...viewportXsDiff, ...typographyXsDiff }));
}

if (darkCss) {
  parts.push('');
  parts.push('/* ─── Colors (dark) ───────────────────────────────────────────────────────── */');
  parts.push(darkCss.trim());
  parts.push('');
}

writeFileSync(join(outputDir, 'tokens.css'), parts.join('\n'));

// ─── Generate TypeScript constants ────────────────────────────────────────────

const intentPaths = collectIntentTokens(intentLightTokens, []);
const sdCssPrefix = 'sds';

const colorNested = buildNestedObject(intentPaths, (path) => {
  return `var(${toCssVarName(sdCssPrefix, path)})`;
});

const shapeNested = flatVarsToNestedTs(shapeVars);
const spacingNested = flatVarsToNestedTs(spacingVars);
const typographyNested = flatVarsToNestedTs(typographyLgVars);
const breakpointNested = flatVarsToNestedTs(viewportLgVars);

const tokensTs = [
  '/* Generated by build-tokens.mjs — do not edit manually */',
  '/* Re-run: npm run build:tokens                         */',
  '',
  `export const tokens = ${objectToTs(colorNested)} as const;`,
  '',
  'export type Tokens = typeof tokens;',
  '',
  `export const shapeTokens = ${objectToTs(shapeNested)} as const;`,
  '',
  `export const spacingTokens = ${objectToTs(spacingNested)} as const;`,
  '',
  `export const typographyTokens = ${objectToTs(typographyNested)} as const;`,
  '',
  `export const breakpointTokens = ${objectToTs(breakpointNested)} as const;`,
  '',
].join('\n');

writeFileSync(join(outputDir, 'tokens.ts'), tokensTs);

// ─── Generate font metadata ────────────────────────────────────────────────────

const fontsTs = [
  '/* Generated by build-tokens.mjs — do not edit manually */',
  '/* Re-run: npm run build:tokens                         */',
  '',
  '/** All font families declared in typography-lg.json, with Google Fonts verification status. */',
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

rmSync(tmpDir, { recursive: true, force: true });
if (zipExtractDir) rmSync(zipExtractDir, { recursive: true, force: true });

console.log('✓ tokens.css');
console.log('✓ tokens.ts');
console.log('✓ fonts.ts');
console.log(`  → ${outputDir}`);
