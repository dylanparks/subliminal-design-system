/**
 * Everything that isn't colour (Phase T.2.2): radii, sizes, border thickness, typography, viewport.
 *
 * Sources, from a Brand-layer Relay export:
 *
 *   Brand       radius, size, border thickness, font family / weight / letter-spacing.
 *               Part of the theme: a theme may override any of these.
 *   Breakpoint  font size, line height, viewport. One Figma mode per screen size; not themed.
 *
 * Names are the Figma path, mechanically: `Brand/Radius/Small` → `--sds-radius-small`,
 * `Breakpoint/Typography/Font size/Content/Medium` → `--sds-typography-font-size-content-medium`.
 * Collection names are dropped — the shortest names were chosen deliberately (2026-11-08), as
 * developers type these. (Brand *colours* keep `--sds-brand-light-*`, since components never
 * read those directly.)
 *
 * Unlike colours, nothing here is derived: every variable is a literal value, so a theme's
 * overrides on a `[data-sds-theme]` element inherit with no extra machinery, and the Breakpoint
 * `@media` blocks override on `:root` as before.
 *
 * Type styles: when the export has Figma's text styles (Relay 0.6.0+, text-styles.json), each
 * `.sds-text--*` class is built from the variables the style is bound to, so a style hooked to a
 * different variable in Figma changes the code with no other edit. Without that file, the five
 * properties are inferred from the Breakpoint › Font size names, as before.
 *
 * Nothing is guessed: a missing typography property, an unexpected type, or two tokens mapping
 * to the same CSS name fails the build.
 */

import {
  BRAND_COLLECTION, BREAKPOINT_COLLECTION, readCollection, readTextStyles, segment, tidy, relayProblem,
} from './build-token-export.mjs';

/** Used after every font family, so a font that fails to load falls back to something sensible. */
const FONT_FALLBACK = 'ui-sans-serif, system-ui, sans-serif';

const cssName = (path) => `--sds-${path.map(segment).join('-')}`;

/**
 * Figma works in px; CSS gets the unit that behaves best (Phase T.2.5):
 *
 *   unitless  font weights
 *   rem       everything that should follow the reader's browser font-size setting — font size,
 *             line height, letter-spacing, sizes, radii. With px, someone who sets their browser
 *             to 20px text still gets 16px labels in 36px-tall buttons.
 *   px        border thickness (hairlines shouldn't scale to blurry fractions), a radius of
 *             ≥ 999 (it only means "fully round"), and Viewport values (Figma frame sizes, not UI).
 *
 * The conversion is a fixed rule — px ÷ 16, the browser default — so Figma's numbers still map
 * mechanically: 36 → 2.25rem. At default settings every computed value is unchanged.
 */
const REM_BASE = 16;
const isWeight = (path) => path.some((p) => /weight/i.test(p));
const staysPx = (path, n) =>
  path[0] === 'Border-thickness' || path[0] === 'Viewport' || (path[0] === 'Radius' && n >= 999);

/** px ÷ 16, to 6 decimals: under 0.00001px of error, and none of Figma's float noise. */
const rem = (n) => `${+(n / REM_BASE).toFixed(6)}rem`;

function numberValue(path, n) {
  if (isWeight(path)) return String(tidy(n));
  if (staysPx(path, n)) return `${tidy(n)}px`;
  return n === 0 ? '0' : rem(n);
}

const fontFamilyValue = (name) => `${/\s/.test(name) ? `"${name}"` : name}, ${FONT_FALLBACK}`;

/**
 * @param {string} dir  A directory holding a Brand-layer Relay export.
 * @returns {{
 *   css: string, typographyCss: string, varNames: string[], tsPaths: string[][],
 *   fonts: { families: string[], weights: number[] }, warnings: string[], summary: object,
 * }}
 * @throws  with every problem found, so one run reports them all.
 */
export function buildScaleLayer(dir) {
  const errors = [];
  const warnings = [];

  // ── Brand: theme-level numbers and font families ──
  const brandFiles = readCollection(dir, BRAND_COLLECTION);
  if (brandFiles.length !== 1) {
    throw new Error(`Expected exactly one ${BRAND_COLLECTION} file in ${dir}, found ${brandFiles.length}.`);
  }

  const brandVars = new Map(); // CSS name → { value, path }
  const families = new Set();
  const weights = new Set();

  for (const { path, token } of brandFiles[0].tokens) {
    if (token.$type === 'color') continue; // the colour layer's job
    const where = `${brandFiles[0].file} › ${path.join('/')}`;
    if (relayProblem(token)) { errors.push(`${where}: Relay couldn't read this value. Re-export.`); continue; }

    let value;
    if (token.$type === 'number' && typeof token.$value === 'number') {
      value = numberValue(path, token.$value);
      if (isWeight(path)) weights.add(Math.round(token.$value));
    } else if (token.$type === 'string' && typeof token.$value === 'string' && /family/i.test(path.join('/'))) {
      value = fontFamilyValue(token.$value);
      families.add(token.$value);
    } else {
      errors.push(`${where}: unsupported ${token.$type} value ${JSON.stringify(token.$value)}`);
      continue;
    }
    brandVars.set(cssName(path), { value, path });
  }

  // ── Breakpoint: one mode per screen size ──
  const modes = readCollection(dir, BREAKPOINT_COLLECTION).map((m) => {
    const vars = new Map();
    let width = null;
    for (const { path, token } of m.tokens) {
      const where = `${m.file} › ${path.join('/')}`;
      if (relayProblem(token)) { errors.push(`${where}: Relay couldn't read this value. Re-export.`); continue; }
      if (token.$type !== 'number' || typeof token.$value !== 'number') {
        errors.push(`${where}: Breakpoint tokens must be numbers, got ${token.$type} ${JSON.stringify(token.$value)}`);
        continue;
      }
      if (path.join('/') === 'Viewport/Width') width = token.$value;

      vars.set(cssName(path), { value: numberValue(path, token.$value), path });
    }
    if (width === null) errors.push(`${m.file}: no Viewport/Width — it sets where this breakpoint applies`);
    return { ...m, vars, width };
  });
  if (modes.length === 0) errors.push(`No ${BREAKPOINT_COLLECTION} files in ${dir}`);

  // Widest first: it's the default on :root, and each narrower one applies below the previous width.
  modes.sort((a, b) => b.width - a.width);
  for (let i = 1; i < modes.length; i++) {
    for (const name of modes[0].vars.keys()) {
      if (!modes[i].vars.has(name)) errors.push(`${modes[i].file}: missing ${name}, which ${modes[0].file} defines`);
    }
  }

  // ── No two tokens may claim the same CSS name ──
  for (const name of brandVars.keys()) {
    if (modes[0]?.vars.has(name)) errors.push(`${name} is produced by both ${BRAND_COLLECTION} and ${BREAKPOINT_COLLECTION}`);
  }

  // ── Typography classes: every property must exist, or the build fails ──
  // The old generator silently skipped a missing property, which is exactly how a line height
  // could vanish from a class without anyone noticing.
  const has = (name) => brandVars.has(name) || modes[0]?.vars.has(name);
  const textStyles = readTextStyles(dir);
  const stylesBySize = new Map(); // `--sds-…` font-size variable → style name
  for (const [styleName, style] of textStyles ?? []) {
    const size = style.bound.fontSize;
    if (size) stylesBySize.set(cssName(size.name.split('/')), styleName);
    else errors.push(`Text style "${styleName}" has no variable bound to its font size.`);
  }
  const usedStyles = new Set();
  const FIELD_PROPS = {
    fontFamily: 'font-family', fontSize: 'font-size', fontWeight: 'font-weight',
    lineHeight: 'line-height', letterSpacing: 'letter-spacing',
  };

  const classes = [];
  for (const [name, { path }] of modes[0]?.vars ?? []) {
    if (path[0] !== 'Typography' || path[1] !== 'Font size') continue;
    const [category, size] = path.slice(2).map(segment);
    let props;
    if (textStyles) {
      const styleName = stylesBySize.get(name);
      if (!styleName) {
        errors.push(`.sds-text--${category}-${size}: no Figma text style uses ${path.join('/')} for its font size.`);
        continue;
      }
      usedStyles.add(styleName);
      props = {};
      const missing = [];
      for (const [field, prop] of Object.entries(FIELD_PROPS)) {
        const ref = textStyles.get(styleName).bound[field];
        if (!ref) { missing.push(`${field} (no variable bound)`); continue; }
        const varName = cssName(ref.name.split('/'));
        if (!has(varName)) { missing.push(`${field} (${ref.collection} › ${ref.name} isn't in the export)`); continue; }
        props[prop] = varName;
      }
      if (missing.length) {
        errors.push(`Text style "${styleName}" (.sds-text--${category}-${size}): ${missing.join(', ')}. Every type style needs all five properties.`);
        continue;
      }
    } else {
      props = {
        'font-family': `--sds-typography-font-family-${category}`,
        'font-size': name,
        'font-weight': `--sds-typography-font-weight-${category}`,
        'line-height': `--sds-typography-line-height-${category}-${size}`,
        'letter-spacing': `--sds-typography-letter-spacing-${category}-${size}`,
      };
      const missing = Object.values(props).filter((v) => !has(v));
      if (missing.length) {
        errors.push(`.sds-text--${category}-${size} has no ${missing.join(', ')}. Every type style needs all five properties.`);
        continue;
      }
    }
    classes.push(
      `.sds-text--${category}-${size} {\n` +
      Object.entries(props).map(([prop, v]) => `  ${`${prop}:`.padEnd(15)} var(${v});`).join('\n') +
      '\n}',
    );
  }
  for (const styleName of textStyles?.keys() ?? []) {
    if (!usedStyles.has(styleName) && stylesBySize.has(cssName(textStyles.get(styleName).bound.fontSize?.name.split('/') ?? []))) {
      errors.push(`Text style "${styleName}" is bound to a font size no type class is built from (${textStyles.get(styleName).bound.fontSize.name}). Is it a Breakpoint › Font size variable?`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`The scale layer can't be built from ${dir}:\n${errors.map((e) => `  • ${e}`).join('\n')}`);
  }

  // ── CSS ──
  const block = (selector, vars, indent = '') => [
    `${indent}${selector} {`,
    ...[...vars].map(([name, { value }]) => `${indent}  ${name}: ${value};`),
    `${indent}}`,
  ].join('\n');

  const parts = [
    '/* ─── Brand: radius, size, border thickness, typography ─────────────────────',
    ' * Part of the theme — override any of these on :root, or on a [data-sds-theme] element.',
    ' */',
    block(':root', brandVars),
    '',
    `/* ─── Breakpoint: ${modes[0].mode} (default, ≥ ${modes[0].width}px) ${'─'.repeat(Math.max(0, 44 - modes[0].mode.length))}`,
    ' * Font sizes, line heights, viewport. Narrower breakpoints override below.',
    ' */',
    block(':root', modes[0].vars),
  ];
  // Each narrower breakpoint overrides only what differs from the next-wider one. Diffing against
  // the next-wider mode (not the default) matters: at the narrowest width every @media block
  // applies, so a value that returns to the default must be restated or the middle one would win.
  // Media queries use em, which follows the reader's browser font-size setting, and the range
  // syntax `width < X`, which is exact where `max-width: X-1px` was off by one. At a 20px setting
  // the layout switches to MD earlier (below 1800px instead of 1440px): the text is bigger, so the
  // layout needs room sooner. That's the point of em breakpoints.
  for (let i = 1; i < modes.length; i++) {
    const below = +(modes[i - 1].width / REM_BASE).toFixed(6);
    const diff = [...modes[i].vars].filter(([name, { value }]) => modes[i - 1].vars.get(name)?.value !== value);
    if (diff.length === 0) continue;
    parts.push(
      '',
      `/* ─── Breakpoint: ${modes[i].mode} (narrower than ${modes[i - 1].width}px = ${below}em at default size) */`,
      `@media (width < ${below}em) {`,
      block(':root', diff, '  '),
      '}',
    );
  }

  const typographyCss = [
    '/* Generated by build-tokens.mjs — do not edit manually */',
    '/* Re-run: npm run build:tokens                         */',
    '',
    '/*',
    ' * Typography utility classes — one per type style: .sds-text--{category}-{size}.',
    ' * Each sets all five font properties. Breakpoints and themes change the underlying',
    ' * variables, so these classes stay correct at every screen size and in every theme.',
    ' */',
    '',
    classes.join('\n\n'),
    '',
  ].join('\n');

  const all = [...brandVars, ...modes[0].vars];
  return {
    css: parts.join('\n'),
    typographyCss,
    varNames: all.map(([name]) => name),
    tsPaths: all.map(([, { path }]) => path.map(segment)),
    fonts: { families: [...families].sort(), weights: [...weights].sort((a, b) => a - b) },
    warnings,
    summary: {
      brand: brandVars.size,
      breakpoint: modes[0].vars.size,
      breakpoints: modes.map((m) => `${m.mode} ${m.width}px`),
      typeStyles: classes.length,
      typeStylesFrom: textStyles ? `${textStyles.size} Figma text styles` : 'Font size names',
    },
  };
}
