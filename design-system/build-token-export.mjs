/**
 * Reading a Brand-layer Relay export, shared by the token build's layers.
 *
 * The export is Figma's native "Export variables" shape: one `<Collection>.<Mode>.tokens.json`
 * file per collection per mode. The Brand-layer file has four collections:
 *
 *   Globals     primitives (never emitted directly; Brand aliases into it)
 *   Brand       the theme: colour palettes, radii, sizes, border thickness, font family/weight/spacing
 *   Color mode  intent colours, one Figma mode per CSS mode (light/dark)
 *   Breakpoint  font sizes, line heights, viewport — one Figma mode per screen-size breakpoint
 *
 * Every CSS name is a mechanical translation of the Figma path, using `segment` below, so a name
 * in Figma always predicts the name in code. Fix awkward names in Figma, not here.
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

export const BRAND_COLLECTION = 'Brand';
export const COLOR_MODE_COLLECTION = 'Color mode';
export const BREAKPOINT_COLLECTION = 'Breakpoint';

/** Every token leaf, with its Figma path. The file-level `$extensions` is metadata, not a token. */
export function leaves(obj, path = [], out = []) {
  for (const [key, value] of Object.entries(obj)) {
    if (path.length === 0 && key === '$extensions') continue;
    if (value && typeof value === 'object' && '$value' in value) out.push({ path: [...path, key], token: value });
    else if (value && typeof value === 'object') leaves(value, [...path, key], out);
  }
  return out;
}

/** `<Collection>.<Mode>.tokens.json` files for one collection, as { file, mode, tokens[] }. */
export function readCollection(dir, collection) {
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
    return [BRAND_COLLECTION, COLOR_MODE_COLLECTION, BREAKPOINT_COLLECTION]
      .every((c) => readCollection(dir, c).length > 0);
  } catch {
    return false;
  }
}

/** One Figma path segment as a CSS identifier: "Font size" → "font-size", "XLarge" → "xlarge". */
export const segment = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

/** Drop float32 noise: 0.20000000298023224 → 0.2, 93 → 93. */
export const tidy = (n) => +Number(n).toFixed(4);

/** A Relay problem marker means the plugin couldn't read the value — never guess at one. */
export const relayProblem = (token) =>
  Boolean(token.$extensions?.['com.subliminal.unreadableValue'] || token.$extensions?.['com.subliminal.unsupportedExpression']);
