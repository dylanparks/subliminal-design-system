/**
 * The colour half of the token pipeline (Phases T.2.1 and T.2.4).
 *
 * Reads a Relay export of the Brand-layer Figma file and emits CSS that *derives* intent colours
 * from Brand at runtime instead of baking them in.
 *
 * ── Themes and modes are different things ────────────────────────────────────────────
 *
 *   THEME  A whole Brand — colours (both palettes), and later typography, radii, borders —
 *          named by whoever makes it ("Lavender", "Sunset"). Dynamic and user-defined.
 *   MODE   A fixed system axis that every theme supports: light/dark today, possibly
 *          regular/high-contrast later. Static and defined here.
 *
 * ── Output ───────────────────────────────────────────────────────────────────────────
 *
 *   :root                            The default theme: --sds-brand-light-* and --sds-brand-dark-*,
 *                                    mirroring Figma's mode-less Brand collection.
 *   :root, [data-sds-theme]          Every intent token, as
 *                                      light-dark(<formula over light palette>,
 *                                                 <formula over dark palette>)
 *   :root, [data-sds-mode="light"]   color-scheme: light, plus light values of mode-dependent numbers
 *   .dark, [data-sds-mode="dark"]    color-scheme: dark, plus dark values
 *
 * ── Why it is shaped this way ────────────────────────────────────────────────────────
 *
 * A custom property resolves its var()s on the element that *declares* it, and descendants
 * inherit the resolved result. So formulas declared only on :root would ignore a Brand override
 * on a section — the theme would silently not apply. That is why formulas are redeclared on every
 * [data-sds-theme] element: there, var(--sds-brand-…) picks up that theme's values.
 *
 * Modes can't work the same way, because CSS selectors can't express "the *nearest* mode marker
 * wins" (a light section inside a dark page inside a theme). light-dark() solves that: unlike
 * var(), it resolves on the element that *uses* the colour, from that element's inherited
 * color-scheme, and inheritance always picks the nearest ancestor. A mode marker therefore only
 * needs to set color-scheme, and themes and modes compose at any nesting depth.
 *
 * light-dark() is strictly two-valued, so it covers the light/dark axis only. A future contrast
 * axis would need its own mechanism, designed when that axis exists.
 *
 * A composed colour (a Brand colour plus an opacity) becomes
 *
 *   color-mix(in srgb, var(--sds-brand-light-x) var(--sds-mix-<token>, N%), transparent)
 *
 * so one state's opacity can be retuned with a single variable. The mix variables are never
 * declared here: unset, they fall back to Figma's value. Like Brand overrides, they take effect
 * on :root or on a [data-sds-theme] element.
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

  /**
   * One mode's tokens, resolved to CSS values: name → { iPath, type, value, kind, description }.
   * `kind` records how a colour was built, for the summary and the comments.
   */
  function resolveMode({ file, tokens }, palette) {
    const out = new Map();
    for (const { path, token } of tokens) {
      const name = path.join('/');
      const where = `${file} › ${name}`;
      const ext = token.$extensions ?? {};
      const entry = { iPath: intentPath(path), type: token.$type, description: token.$description };

      if (ext['com.subliminal.unreadableValue'] || ext['com.subliminal.unsupportedExpression']) {
        errors.push(`${where}: Relay couldn't read this value. Re-export, or check the plugin's Diagnostics tab.`);
        continue;
      }

      if (token.$type === 'number') {
        if (typeof token.$value !== 'number') { errors.push(`${where}: not a number (${JSON.stringify(token.$value)})`); continue; }
        // Unitless on purpose: components apply units, e.g. calc(var(--…) * 1px).
        out.set(name, { ...entry, value: String(tidy(token.$value)), kind: 'number' });
        continue;
      }
      if (token.$type === 'boolean') {
        out.set(name, { ...entry, kind: 'boolean' }); // e.g. Images/Images: no CSS meaning yet
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
        out.set(name, { ...entry, value: cssColor(token.$value), kind: 'fixed' });
        continue;
      } else {
        const target = alias ? `${alias.targetVariableSetName ?? '?'}/${alias.targetVariableName}` : 'a literal colour';
        errors.push(`${where}: derives from ${target}, not from ${BRAND_COLLECTION}, so it would not change on a rebrand. Repoint it at a Brand colour, or (deliberately) add it to FIXED_TO_GLOBALS.`);
        continue;
      }

      if (composed) {
        const opacity = composed.opacityArg?.value;
        if (typeof opacity !== 'number') { errors.push(`${where}: composed colour has no numeric opacity`); continue; }
        out.set(name, {
          ...entry,
          value: `color-mix(in srgb, ${base} var(${mixVar(entry.iPath)}, ${tidy(opacity)}%), transparent)`,
          kind: 'composed',
        });
      } else {
        out.set(name, { ...entry, value: base, kind: 'alias' });
      }
    }
    return out;
  }

  const L = resolveMode(light[0], 'light');
  const D = resolveMode(dark[0], 'dark');

  // Both modes must define the same tokens, or one mode would fall back to the other's values.
  for (const n of L.keys()) if (!D.has(n)) errors.push(`${dark[0].file}: missing ${n}, which ${light[0].file} defines`);
  for (const n of D.keys()) if (!L.has(n)) errors.push(`${light[0].file}: missing ${n}, which ${dark[0].file} defines`);

  if (errors.length > 0) {
    throw new Error(`The colour layer can't be built from ${dir}:\n${errors.map((e) => `  • ${e}`).join('\n')}`);
  }

  // ── Combine the two modes ──
  const intentPaths = [];
  const counts = { composed: 0, aliases: 0, fixed: 0, numbers: 0, skippedBooleans: 0 };
  const colorLines = [];
  const lightNumbers = [];
  const darkNumbers = [];

  for (const [name, l] of L) {
    const d = D.get(name);
    const prop = cssVar(l.iPath);

    if (l.kind === 'boolean') { counts.skippedBooleans++; continue; }

    if (l.kind === 'number') {
      // Numbers can't use light-dark(), which only accepts colours. They're literals, though,
      // so plain inheritance from the mode blocks below already makes the nearest mode win.
      lightNumbers.push(`  ${prop}: ${l.value};${comment(l.description)}`);
      darkNumbers.push(`  ${prop}: ${d.value};`);
      counts.numbers++;
      intentPaths.push(l.iPath);
      continue;
    }

    const value = l.value === d.value ? l.value : `light-dark(${l.value}, ${d.value})`;
    const note = l.kind === 'fixed'
      ? comment(`Fixed: does not follow Brand.${l.description ? ' ' + l.description : ''}`)
      : comment(l.description);
    colorLines.push(`  ${prop}: ${value};${note}`);
    counts[l.kind === 'alias' ? 'aliases' : l.kind]++;
    intentPaths.push(l.iPath);
  }

  const brandEntries = [...brand.values()];
  const byPalette = (p) => brandEntries.filter((b) => b.path[0] === p).map((b) => `  ${brandVar(b.path)}: ${b.css};`);

  const css = [
    '/* ─── Brand: the default theme ──────────────────────────────────────────────',
    ' * Figma\'s Brand collection: both palettes. A theme is a full set of these values — set them',
    ' * on :root to rebrand everything, or on a [data-sds-theme="<name>"] element to theme a section.',
    ' */',
    ':root {',
    ...byPalette('light'),
    '',
    ...byPalette('dark'),
    '}',
    '',
    '/* ─── Color mode ────────────────────────────────────────────────────────────',
    ' * Intent tokens, derived from Brand. Redeclared on every [data-sds-theme] element so that',
    ' * section\'s Brand values apply inside it. light-dark() picks the palette on the element that',
    ' * *uses* the colour, so modes and themes nest freely. Override --sds-mix-<token> (e.g. 80%)',
    ' * on :root or a theme element to retune one state\'s opacity in both modes.',
    ' */',
    ':root, [data-sds-theme] {',
    ...colorLines,
    '}',
    '',
    '/* ─── Modes ─────────────────────────────────────────────────────────────────',
    ' * A mode only sets color-scheme, which light-dark() reads, and the few mode-dependent numbers.',
    ' * Both inherit, so the nearest marker wins: a light section works inside a dark page.',
    ' * `.dark` is what ModeProvider sets on <html>; data-sds-mode is the general form.',
    ' */',
    ':root, [data-sds-mode="light"] {',
    '  color-scheme: light;',
    ...lightNumbers,
    '}',
    '',
    '.dark, [data-sds-mode="dark"] {',
    '  color-scheme: dark;',
    ...darkNumbers,
    '}',
  ].join('\n');

  return {
    css,
    intentPaths,
    brandPaths: brandEntries.map((b) => b.path),
    summary: { brandColors: brandEntries.length, ...counts },
  };
}
