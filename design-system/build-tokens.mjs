/**
 * Token build pipeline for the Subliminal design system.
 *
 * Reads Figma variable collection exports and uses Style Dictionary to produce:
 *   - src/tokens/generated/tokens.css   — CSS custom properties (:root + .dark)
 *   - src/tokens/generated/tokens.ts    — TypeScript constants (CSS var strings)
 *
 * Usage:
 *   node build-tokens.mjs
 *
 * Designers update tokens by exporting variables from Figma and replacing files in
 * src/tokens/figma/, then running this script:
 *   - Global Colors.json
 *   - Intent Colors.json
 *   - Typography.json
 *   - Shape.json
 *   - Breakpoint.json
 */

import StyleDictionary from 'style-dictionary';
import { readFileSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rgbToHex(r, g, b) {
  return (
    '#' +
    [r, g, b]
      .map((v) => Math.round(v * 255).toString(16).padStart(2, '0'))
      .join('')
  );
}

function rgbToRgba(r, g, b, a) {
  return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${Math.round(a * 1000) / 1000})`;
}

/**
 * Convert a Figma variable name to a Style Dictionary token path array.
 * "Colors/Cobalt/50"     → ["color", "cobalt", "50"]
 * "Neutrals/Ash/50"      → ["neutral", "ash", "50"]
 * "Neutrals/White"       → ["neutral", "white"]
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
 * Handles spaces, CamelCase, hyphens, and special chars.
 * "Font size"    → "font-size"
 * "DisplaySmall" → "display-small"
 * "X-Padding"    → "x-padding"
 * "XSmall"       → "x-small"
 */
function segmentize(str) {
  return str
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')   // ABCDef → ABC-Def
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')       // camelCase → camel-Case
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Convert a full Figma variable name to a CSS variable suffix.
 * "Typography/Font size/Display/Huge" → "typography-font-size-display-huge"
 * "Border Radius/DisplaySmall"        → "border-radius-display-small"
 */
function figmaNameToCssSegment(name) {
  return name.split('/').map(segmentize).join('-');
}

/**
 * Parse a Figma variable collection for a single mode into a flat map of
 * CSS variable name → value string. Handles FLOAT and STRING types.
 *
 * FLOAT rules:
 *   - FONT_WEIGHT scope → unitless number
 *   - All others → appends "px" (font-size, line-height, letter-spacing, etc.)
 *   - Rounds to 3 decimal places to avoid float imprecision
 * STRING rules:
 *   - Multi-word values (e.g. "Work Sans") are quoted for CSS font-family use
 *
 * @param {object}   data          - Parsed Figma JSON
 * @param {string}   modeId        - The mode key to read values from
 * @param {string}   [prefix]      - Optional category prefix inserted after "--sds-"
 * @param {string[]} [skipNames]   - Variable name substrings to exclude
 */
function parseFlatTokens(data, modeId, { prefix = '', skipNames = [] } = {}) {
  const vars = {};
  for (const v of Object.values(data.variables)) {
    if (v.type !== 'FLOAT' && v.type !== 'STRING') continue;
    if (skipNames.some((s) => v.name.includes(s))) continue;

    const segment = figmaNameToCssSegment(v.name);
    const cssVar = prefix ? `--sds-${prefix}-${segment}` : `--sds-${segment}`;

    if (v.type === 'STRING') {
      const value = v.resolvedValuesByMode[modeId]?.resolvedValue;
      if (value !== undefined) {
        vars[cssVar] = value.includes(' ') ? `"${value}"` : value;
      }
    } else {
      const raw = v.resolvedValuesByMode[modeId]?.resolvedValue;
      if (raw !== undefined) {
        const rounded = Math.round(raw * 1000) / 1000;
        const isUnitless = v.scopes?.includes('FONT_WEIGHT');
        vars[cssVar] = isUnitless ? String(rounded) : `${rounded}px`;
      }
    }
  }
  return vars;
}

/**
 * Scan a Figma variable collection and return every unique font family name
 * (across all modes) and every unique font weight value (across all modes).
 * Only looks at FONT_FAMILY and FONT_WEIGHT scoped variables respectively.
 */
function extractFontMetadata(data) {
  const families = new Set();
  const weights = new Set();

  for (const v of Object.values(data.variables)) {
    if (v.type === 'STRING' && v.scopes?.includes('FONT_FAMILY')) {
      for (const m of Object.values(v.resolvedValuesByMode)) {
        if (m?.resolvedValue) families.add(m.resolvedValue);
      }
    }
    if (v.type === 'FLOAT' && v.scopes?.includes('FONT_WEIGHT')) {
      for (const m of Object.values(v.resolvedValuesByMode)) {
        if (m?.resolvedValue != null) weights.add(Math.round(m.resolvedValue));
      }
    }
  }

  return {
    families: [...families].sort(),
    weights: [...weights].sort((a, b) => a - b),
  };
}

/**
 * Build a Google Fonts CSS API v2 URL for the given font families and weights.
 * Each family gets the full weight list so any combination is available.
 * Returns null if no families are found.
 *
 * Example output:
 *   https://fonts.googleapis.com/css2?family=Manrope:wght@600;800&family=Work+Sans:wght@400;600&display=swap
 */
function buildGoogleFontsUrl(families, weights) {
  if (!families.length) return null;
  const wStr = weights.join(';');
  const params = families.map((f) => `family=${f.replace(/\s+/g, '+')}:wght@${wStr}`);
  return `https://fonts.googleapis.com/css2?${params.join('&')}&display=swap`;
}

/**
 * Verify which of the requested font families are actually available on Google Fonts
 * by fetching the generated CSS URL and checking the font-family declarations in the
 * response. Best-effort — silently treats network errors as "unable to verify".
 *
 * Returns:
 *   googleFonts  — families confirmed in the Google Fonts response
 *   unverified   — families not found (custom/purchased fonts, self-hosted, etc.)
 *   networkError — true if the request itself failed (offline build, etc.)
 */
async function verifyGoogleFonts(families, url) {
  if (!families.length || !url) {
    return { googleFonts: [], unverified: [], networkError: false };
  }
  try {
    const resp = await fetch(url, {
      // A real browser UA is required — without it Google Fonts may return
      // a very old format or reject the request entirely.
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

/**
 * Render a flat { cssVar: value } map into a CSS block under the given selector.
 */
function renderCssBlock(selector, vars) {
  const lines = Object.entries(vars).map(([k, v]) => `  ${k}: ${v};`);
  return `${selector} {\n${lines.join('\n')}\n}`;
}

/**
 * Render a flat { cssVar: value } map into a CSS block nested inside a media query.
 */
function renderMediaQuery(maxWidth, vars) {
  const inner = Object.entries(vars).map(([k, v]) => `    ${k}: ${v};`).join('\n');
  return `@media (max-width: ${maxWidth}px) {\n  :root {\n${inner}\n  }\n}`;
}

// ─── Figma JSON parsers ────────────────────────────────────────────────────────

/**
 * Parse Global Colors.json into a Style Dictionary token tree.
 * All values are resolved hex / rgba strings — no aliases at this level.
 */
function parseGlobalColors(filePath) {
  const data = JSON.parse(readFileSync(filePath, 'utf8'));
  const modeId = Object.keys(data.modes)[0];
  const tokens = {};

  for (const v of Object.values(data.variables)) {
    if (v.type !== 'COLOR') continue;
    const val = v.valuesByMode[modeId];
    if (!val || val.type === 'VARIABLE_ALIAS') continue;

    const path = figmaNameToPath(v.name);
    const colorValue =
      val.a !== undefined && val.a < 1
        ? rgbToRgba(val.r, val.g, val.b, val.a)
        : rgbToHex(val.r, val.g, val.b);

    setDeep(tokens, path, { value: colorValue, type: 'color' });
  }

  return tokens;
}

/**
 * Parse Intent Colors.json for a single mode.
 * Values are Style Dictionary references like {color.cobalt.800}.
 */
function parseIntentTokens(filePath, modeId) {
  const data = JSON.parse(readFileSync(filePath, 'utf8'));
  const tokens = {};

  for (const v of Object.values(data.variables)) {
    if (v.type !== 'COLOR') continue;
    const resolved = v.resolvedValuesByMode[modeId];
    if (!resolved) continue;

    const path = v.name
      .split('/')
      .map((p) => p.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''));

    const tokenValue = resolved.aliasName
      ? figmaNameToRef(resolved.aliasName)
      : rgbToHex(resolved.resolvedValue.r, resolved.resolvedValue.g, resolved.resolvedValue.b);

    const entry = { value: tokenValue, type: 'color' };
    if (v.description) entry.comment = v.description;
    setDeep(tokens, path, entry);
  }

  return tokens;
}

// ─── Style Dictionary custom format: TypeScript constants ────────────────────

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
 * "--sds-typography-font-size-display-huge" → { typography: { 'font-size': { display: { huge: 'var(...)' } } } }
 * Strips the "--sds-" prefix and uses the remaining segments as path.
 */
function flatVarsToNestedTs(vars) {
  const root = {};
  for (const [cssVar, _] of Object.entries(vars)) {
    const path = cssVar.replace(/^--sds-/, '').split('-');
    // Re-join hyphenated segments (e.g. "font" + "size" → this is tricky with flat splitting)
    // Instead, store as a flat camelCase key to keep it simple
    setDeep(root, path, `var(${cssVar})`);
  }
  return root;
}

// ─── Main build ───────────────────────────────────────────────────────────────

const figmaDir = join(__dirname, 'src', 'tokens', 'figma');
const outputDir = join(__dirname, 'src', 'tokens', 'generated');
const tmpDir = join(__dirname, '.tokens-tmp');

mkdirSync(outputDir, { recursive: true });
mkdirSync(tmpDir, { recursive: true });

// ─── Color tokens (Style Dictionary) ──────────────────────────────────────────

const globalColorsPath = join(figmaDir, 'Global Colors.json');
const intentColorsPath = join(figmaDir, 'Intent Colors.json');

const globalTokens = parseGlobalColors(globalColorsPath);

const intentData = JSON.parse(readFileSync(intentColorsPath, 'utf8'));
const lightModeId = Object.entries(intentData.modes).find(([, v]) => v === 'Lightmode')[0];
const darkModeId = Object.entries(intentData.modes).find(([, v]) => v === 'Darkmode')[0];

const intentLightTokens = parseIntentTokens(intentColorsPath, lightModeId);
const intentDarkTokens = parseIntentTokens(intentColorsPath, darkModeId);

writeFileSync(join(tmpDir, 'global.json'), JSON.stringify(globalTokens));
writeFileSync(join(tmpDir, 'intent-light.json'), JSON.stringify(intentLightTokens));
writeFileSync(join(tmpDir, 'intent-dark.json'), JSON.stringify(intentDarkTokens));

const globalRoots = Object.keys(globalTokens);

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
          filter: (token) => !globalRoots.includes(token.path[0]),
          options: { selector: ':root', outputReferences: false },
        },
      ],
    },
  },
});

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
          filter: (token) => !globalRoots.includes(token.path[0]),
          options: { selector: '.dark', outputReferences: false },
        },
      ],
    },
  },
});

await sdLight.buildAllPlatforms();
await sdDark.buildAllPlatforms();

// ─── Shape tokens ──────────────────────────────────────────────────────────────
// Single mode — border-radius values → --sds-shape-border-radius-*

const shapeData = JSON.parse(readFileSync(join(figmaDir, 'Shape.json'), 'utf8'));
const shapeModeId = Object.keys(shapeData.modes)[0];
const shapeVars = parseFlatTokens(shapeData, shapeModeId, { prefix: 'shape' });

// ─── Breakpoint tokens ─────────────────────────────────────────────────────────
// Single mode, skip Min Height — viewport reference values → --sds-breakpoint-viewport-*

const breakpointData = JSON.parse(readFileSync(join(figmaDir, 'Breakpoint.json'), 'utf8'));
const breakpointModeId = Object.keys(breakpointData.modes)[0];
const breakpointVars = parseFlatTokens(breakpointData, breakpointModeId, {
  prefix: 'breakpoint',
  skipNames: ['Min Height'],
});

// ─── Typography tokens ─────────────────────────────────────────────────────────
// Three modes: LG (default :root), MD (@media max-width:1279px), XS (@media max-width:767px)
// Variable names already start with "Typography/" so no extra prefix needed.

const typographyData = JSON.parse(readFileSync(join(figmaDir, 'Typography.json'), 'utf8'));
const typographyModes = typographyData.modes; // { "49:0": "LG", "49:1": "MD", "49:2": "XS" }
const lgModeId = Object.entries(typographyModes).find(([, v]) => v === 'LG')[0];
const mdModeId = Object.entries(typographyModes).find(([, v]) => v === 'MD')[0];
const xsModeId = Object.entries(typographyModes).find(([, v]) => v === 'XS')[0];

const typographyLgVars = parseFlatTokens(typographyData, lgModeId);
const typographyMdVars = parseFlatTokens(typographyData, mdModeId);
const typographyXsVars = parseFlatTokens(typographyData, xsModeId);

// Only emit MD/XS vars that differ from LG — keeps the output lean
const typographyMdDiff = Object.fromEntries(
  Object.entries(typographyMdVars).filter(([k, v]) => typographyLgVars[k] !== v)
);
const typographyXsDiff = Object.fromEntries(
  Object.entries(typographyXsVars).filter(([k, v]) => typographyLgVars[k] !== v)
);

// ─── Merge all CSS outputs ─────────────────────────────────────────────────────

const lightCss = readFileSync(join(tmpDir, 'light.css'), 'utf8');
const darkCss = readFileSync(join(tmpDir, 'dark.css'), 'utf8');

// ─── Google Fonts import ───────────────────────────────────────────────────────
// Derived automatically from FONT_FAMILY + FONT_WEIGHT variables in Typography.json

const { families: gFamilies, weights: gWeights } = extractFontMetadata(typographyData);
const googleFontsUrl = buildGoogleFontsUrl(gFamilies, gWeights);

const fontVerification = await verifyGoogleFonts(gFamilies, googleFontsUrl);

if (fontVerification.networkError) {
  console.warn('⚠  build-tokens: Could not reach Google Fonts to verify font families (network error).');
  console.warn('   Font availability checks will be skipped.');
} else if (fontVerification.unverified.length > 0) {
  console.warn('⚠  build-tokens: The following font families were not found on Google Fonts:');
  for (const f of fontVerification.unverified) {
    console.warn(`   • ${f} — custom or purchased font. Other users will need the file or a self-hosted @font-face.`);
  }
}

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
  '/* ─── Breakpoint ──────────────────────────────────────────────────────────── */',
  renderCssBlock(':root', breakpointVars),
  '',
  '/* ─── Typography (LG — default) ───────────────────────────────────────────── */',
  renderCssBlock(':root', typographyLgVars),
];

if (Object.keys(typographyMdDiff).length > 0) {
  parts.push('');
  parts.push('/* ─── Typography (MD — ≤1279px) ───────────────────────────────────────────── */');
  parts.push(renderMediaQuery(1279, typographyMdDiff));
}

if (Object.keys(typographyXsDiff).length > 0) {
  parts.push('');
  parts.push('/* ─── Typography (XS — ≤767px) ────────────────────────────────────────────── */');
  parts.push(renderMediaQuery(767, typographyXsDiff));
}

parts.push('');
parts.push('/* ─── Colors (dark) ───────────────────────────────────────────────────────── */');
parts.push(darkCss.trim());
parts.push('');

writeFileSync(join(outputDir, 'tokens.css'), parts.join('\n'));

// ─── Generate TypeScript constants ────────────────────────────────────────────

const intentPaths = collectIntentTokens(intentLightTokens, []);
const sdCssPrefix = 'sds';

const colorNested = buildNestedObject(intentPaths, (path) => {
  return `var(${toCssVarName(sdCssPrefix, path)})`;
});

// Build flat TS maps for non-color tokens (use LG values as the canonical var names)
const shapeNested = flatVarsToNestedTs(shapeVars);
const typographyNested = flatVarsToNestedTs(typographyLgVars);
const breakpointNested = flatVarsToNestedTs(breakpointVars);

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
  `export const typographyTokens = ${objectToTs(typographyNested)} as const;`,
  '',
  `export const breakpointTokens = ${objectToTs(breakpointNested)} as const;`,
  '',
].join('\n');

writeFileSync(join(outputDir, 'tokens.ts'), tokensTs);

// ─── Generate font metadata ────────────────────────────────────────────────────
//
// Consumed by the Storybook preview to warn when a font isn't on Google Fonts
// or fails to load entirely (custom/purchased/locally-installed fonts).

const fontsTs = [
  '/* Generated by build-tokens.mjs — do not edit manually */',
  '/* Re-run: npm run build:tokens                         */',
  '',
  '/** All font families declared in Typography.json, with Google Fonts verification status. */',
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

// ─── Cleanup temp files ────────────────────────────────────────────────────────

rmSync(tmpDir, { recursive: true, force: true });

console.log('✓ tokens.css');
console.log('✓ tokens.ts');
console.log('✓ fonts.ts');
console.log(`  → ${outputDir}`);
