/**
 * The colour half of the token pipeline (Phase T.2.1).
 *
 * Reads a Relay export of the Brand-layer Figma file and emits CSS that *derives* intent colours
 * from Brand at runtime instead of baking them in:
 *
 *   :root   Brand: both palettes, --sds-brand-light-* and --sds-brand-dark-*. This mirrors Figma's
 *           mode-less Brand collection, and it's the write surface: a new brand is a set of
 *           overrides here, with no rebuild.
 *   :root   Color mode, Lightmode: every intent token as a formula over the light palette.
 *   .dark   Color mode, Darkmode: every formula redeclared over the dark palette.
 *
 * Darkmode redeclares *every* formula, not just the ones that differ, because a custom property
 * resolves where it's declared and descendants inherit the resolved value. Formulas declared only
 * on :root would hand a `.dark` subtree its light colours.
 *
 * A composed colour (a Brand colour plus an opacity) becomes
 *
 *   color-mix(in srgb, var(--sds-brand-light-x) var(--sds-mix-<token>, N%), transparent)
 *
 * so a theme can retune one state's opacity with a single variable. The mix variables are never
 * declared here: unset, they fall back to Figma's value.
 *
 * Nothing is inferred. Every relationship is read from the export's `aliasData` / `composedColor`,
 * and anything this can't place fails the build rather than being guessed at.
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const BRAND_COLLECTION = 'Brand';
const COLOR_MODE_COLLECTION = 'Color mode';

/**
 * Intent tokens allowed to reach past Brand straight into Globals. Each one is a token that will
 * NOT change when someone rebrands, so this list is a product decision, not a convenience:
 * the gradient is a fixed Subliminal signature for now (decided 2026-11-08). Making it
 * rebrandable means two new Brand tokens and an empty list.
 */
const FIXED_TO_GLOBALS = new Set(['Accents/Gradient/PrimaryStart', 'Accents/Gradient/PrimaryEnd']);

// ─── Reading the export ───────────────────────────────────────────────────────

/** Every token leaf, with its Figma path. The file-level `$extensions` is metadata, not a token. */
function leaves(obj, path = [], out = []) {
  for (const [key, value] of Object.entries(obj)) {
    if (path.length === 0 && key === '$extensions') continue;
    if (value && typeof value === 'object' && '$value' in value) out.push({ path: [...path, key], token: value });
    else if (value && typeof value === 'object') leaves(value, [...path, key], out);
  }
  return out;
}

/** `<Collection>.<Mode>.tokens.json` files for one collection, as { mode, tokens[] }. */
function readCollection(dir, collection) {
  return readdirSync(dir)
    .filter((f) => f.startsWith(`${collection}.`) && f.endsWith('.tokens.json'))
    .map((file) => {
      const json = JSON.parse(readFileSync(join(dir, file), 'utf8'));
      return { file, mode: json.$extensions?.['com.figma.modeName'] ?? file, tokens: leaves(json) };
    });
}

/** True when `dir` holds a Brand-layer export (as opposed to the legacy 12-collection files). */
export function hasBrandLayerExport(dir) {
  try {
    return readCollection(dir, BRAND_COLLECTION).length > 0 && readCollection(dir, COLOR_MODE_COLLECTION).length > 0;
  } catch {
    return false;
  }
}

// ─── Naming ───────────────────────────────────────────────────────────────────

/** One path segment as a CSS identifier: "Primary-foreground" → "primary-foreground". */
const segment = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

/** Intent token path → the path used for both its CSS name and its key in `tokens.ts`. */
const intentPath = (figmaPath) => figmaPath.map(segment);

/**
 * "Colors/Light/Primary-foreground" → ["light", "primary-foreground"].
 * The `Colors` group is dropped: inside Brand, `--sds-brand-light-*` / `--sds-brand-dark-*` is
 * unambiguous, and these are the variables people will type most.
 */
function brandColorPath(figmaName) {
  const parts = figmaName.split('/');
  if (parts[0] !== 'Colors' || parts.length < 3) return null;
  return parts.slice(1).map(segment);
}

const cssVar = (path) => `--sds-${path.join('-')}`;
const mixVar = (path) => `--sds-mix-${path.join('-')}`;
const brandVar = (path) => `--sds-brand-${path.join('-')}`;

// ─── Values ───────────────────────────────────────────────────────────────────

/** Drop float32 noise: 0.20000000298023224 → 0.2, 93 → 93. */
const tidy = (n) => +Number(n).toFixed(4);

const channel = (c) => Math.round(c * 255);

/** A Figma colour value as CSS: hex when opaque, rgba() otherwise. */
function cssColor(value) {
  const [r, g, b] = value.components.map(channel);
  if (value.alpha === 1) return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
  return `rgba(${r}, ${g}, ${b}, ${tidy(value.alpha)})`;
}

const isColor = (v) => v && typeof v === 'object' && 'colorSpace' in v && Array.isArray(v.components);

/** A CSS comment can't contain its own terminator. */
const comment = (text) => (text ? ` /** ${text.replace(/\*\//g, '* /')} */` : '');

// ─── Build ────────────────────────────────────────────────────────────────────

/**
 * @param {string} dir  A directory holding a Brand-layer Relay export.
 * @returns {{ css: string, intentPaths: string[][], brandPaths: string[][], summary: object }}
 * @throws  with every problem found, so one run reports them all.
 */
export function buildColorLayer(dir) {
  const errors = [];

  // ── Brand ──
  const brandFiles = readCollection(dir, BRAND_COLLECTION);
  if (brandFiles.length !== 1) {
    throw new Error(`Expected exactly one ${BRAND_COLLECTION} file in ${dir}, found ${brandFiles.length}. Brand is mode-less by design.`);
  }

  const brand = new Map(); // Figma name → { path, css }
  for (const { path, token } of brandFiles[0].tokens) {
    if (token.$type !== 'color') continue; // numbers and strings arrive in T.2.2
    const name = path.join('/');
    const where = `${brandFiles[0].file} › ${name}`;
    const bPath = brandColorPath(name);
    if (!bPath) { errors.push(`${where}: Brand colours must live under Colors/<Light|Dark>/…`); continue; }
    if (!isColor(token.$value)) { errors.push(`${where}: not a colour value (${JSON.stringify(token.$value).slice(0, 80)})`); continue; }
    // A translucent Brand colour compounds with every opacity derived from it, quietly washing
    // out each state. Brand colours are opaque by contract; opacity belongs in Color mode.
    if (token.$value.alpha !== 1) {
      errors.push(`${where}: Brand colours must be opaque (alpha is ${tidy(token.$value.alpha)}). Set the solid colour here and put the opacity in Color mode.`);
      continue;
    }
    brand.set(name, { path: bPath, css: cssColor(token.$value) });
  }

  // ── Color mode ──
  const modeFiles = readCollection(dir, COLOR_MODE_COLLECTION);
  const dark = modeFiles.filter((m) => /dark/i.test(m.mode));
  const light = modeFiles.filter((m) => !/dark/i.test(m.mode));
  if (light.length !== 1 || dark.length !== 1) {
    throw new Error(
      `Expected one light and one dark ${COLOR_MODE_COLLECTION} mode in ${dir}; found ` +
      `${JSON.stringify(modeFiles.map((m) => m.mode))}. The dark one is recognised by "dark" in its name.`,
    );
  }

  const intentPaths = [];
  const counts = { composed: 0, aliases: 0, fixed: 0, numbers: 0, skippedBooleans: 0 };

  function renderMode({ file, tokens }, palette) {
    const lines = [];
    for (const { path, token } of tokens) {
      const name = path.join('/');
      const where = `${file} › ${name}`;
      const ext = token.$extensions ?? {};
      const iPath = intentPath(path);
      const decl = (value, note) => lines.push(`  ${cssVar(iPath)}: ${value};${note}`);
      const desc = palette === 'light' ? comment(token.$description) : '';

      if (ext['com.subliminal.unreadableValue'] || ext['com.subliminal.unsupportedExpression']) {
        errors.push(`${where}: Relay couldn't read this value. Re-export, or check the plugin's Diagnostics tab.`);
        continue;
      }

      if (token.$type === 'number') {
        if (typeof token.$value !== 'number') { errors.push(`${where}: not a number (${JSON.stringify(token.$value)})`); continue; }
        // Unitless on purpose: components apply units, e.g. calc(var(--…) * 1px).
        decl(tidy(token.$value), desc);
        if (palette === 'light') { intentPaths.push(iPath); counts.numbers++; }
        continue;
      }
      if (token.$type === 'boolean') {
        // e.g. Images/Images: a Figma-side flag with no CSS meaning yet. Not emitted.
        if (palette === 'light') counts.skippedBooleans++;
        continue;
      }
      if (token.$type !== 'color') { errors.push(`${where}: unsupported type "${token.$type}"`); continue; }

      const composed = ext['com.figma.composedColor'];
      const alias = composed ? composed.colorArg.alias : ext['com.figma.aliasData'];

      // Resolve the variable this token is built on.
      let base = null;
      if (alias && alias.targetVariableSetName === BRAND_COLLECTION) {
        const b = brand.get(alias.targetVariableName);
        if (!b) { errors.push(`${where}: points at ${BRAND_COLLECTION}/${alias.targetVariableName}, which isn't an opaque Brand colour in this export`); continue; }
        if (b.path[0] !== palette) {
          errors.push(`${where}: the ${palette} mode uses ${BRAND_COLLECTION}/${alias.targetVariableName}, from the other palette`);
          continue;
        }
        base = `var(${brandVar(b.path)})`;
      } else if (alias && !alias.targetVariableSetName && alias.targetVariableName) {
        // Short form: a base inside Color mode itself. That token is checked on its own pass.
        base = `var(${cssVar(intentPath(alias.targetVariableName.split('/')))})`;
      } else if (FIXED_TO_GLOBALS.has(name) && !composed && isColor(token.$value)) {
        decl(cssColor(token.$value), comment(`Fixed: does not follow Brand.${token.$description ? ' ' + token.$description : ''}`));
        if (palette === 'light') { intentPaths.push(iPath); counts.fixed++; }
        continue;
      } else {
        const target = alias ? `${alias.targetVariableSetName ?? '?'}/${alias.targetVariableName}` : 'a literal colour';
        errors.push(`${where}: derives from ${target}, not from ${BRAND_COLLECTION}, so it would not change on a rebrand. Repoint it at a Brand colour, or (deliberately) add it to FIXED_TO_GLOBALS.`);
        continue;
      }

      if (composed) {
        const opacity = composed.opacityArg?.value;
        if (typeof opacity !== 'number') { errors.push(`${where}: composed colour has no numeric opacity`); continue; }
        decl(`color-mix(in srgb, ${base} var(${mixVar(iPath)}, ${tidy(opacity)}%), transparent)`, desc);
        if (palette === 'light') counts.composed++;
      } else {
        decl(base, desc);
        if (palette === 'light') counts.aliases++;
      }
      if (palette === 'light') intentPaths.push(iPath);
    }
    return lines;
  }

  const lightLines = renderMode(light[0], 'light');
  const darkLines = renderMode(dark[0], 'dark');

  // Both modes must define the same tokens, or `.dark` would leave some resolving to light.
  const names = (m) => new Set(m.tokens.filter((t) => t.token.$type !== 'boolean').map((t) => t.path.join('/')));
  const [ln, dn] = [names(light[0]), names(dark[0])];
  for (const n of ln) if (!dn.has(n)) errors.push(`${dark[0].file}: missing ${n}, which ${light[0].file} defines`);
  for (const n of dn) if (!ln.has(n)) errors.push(`${light[0].file}: missing ${n}, which ${dark[0].file} defines`);

  if (errors.length > 0) {
    throw new Error(`The colour layer can't be built from ${dir}:\n${errors.map((e) => `  • ${e}`).join('\n')}`);
  }

  const brandEntries = [...brand.values()];
  const byPalette = (p) => brandEntries.filter((b) => b.path[0] === p).map((b) => `  ${brandVar(b.path)}: ${b.css};`);

  const css = [
    '/* ─── Brand ──────────────────────────────────────────────────────────────────',
    ' * The brand file: Figma\'s Brand collection, both palettes. Rebrand by overriding these.',
    ' * Colour mode tokens below derive from them at runtime, so nothing needs rebuilding.',
    ' */',
    ':root {',
    ...byPalette('light'),
    '',
    ...byPalette('dark'),
    '}',
    '',
    '/* ─── Color mode: light ─────────────────────────────────────────────────────',
    ' * Override any --sds-mix-<token> (e.g. 80%) to retune that one state\'s opacity.',
    ' */',
    ':root {',
    ...lightLines,
    '}',
    '',
    '/* ─── Color mode: dark ──────────────────────────────────────────────────────',
    ' * Every token is redeclared, so `.dark` also works on a section of a light page.',
    ' */',
    '.dark {',
    ...darkLines,
    '}',
  ].join('\n');

  return {
    css,
    intentPaths,
    brandPaths: brandEntries.map((b) => b.path),
    summary: { brandColors: brandEntries.length, ...counts },
  };
}
