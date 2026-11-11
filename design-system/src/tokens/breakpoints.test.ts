import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Media queries can't read CSS variables, so a component that switches layout at a Figma
 * breakpoint repeats its width. This keeps that copy honest: it must equal the Figma breakpoint
 * it names, and be a point where the generated tokens.css actually switches.
 */
const root = join(__dirname, '..');
const tokens = readFileSync(join(__dirname, 'generated/tokens.css'), 'utf8');
const thresholds = [...tokens.matchAll(/@media \(width < ([\d.]+)em\)/g)].map((m) => Number(m[1]));

/** A breakpoint's Figma width in em at the default 16px font size. */
const figmaWidthEm = (mode: string) => {
  const json = JSON.parse(readFileSync(join(__dirname, `relay-export/Breakpoint.${mode}.tokens.json`), 'utf8'));
  return json.Viewport.Width.$value / 16;
};

describe('breakpoints', () => {
  it('tokens.css switches at every breakpoint width except the narrowest', () => {
    expect(thresholds.length).toBeGreaterThanOrEqual(2);
    for (const mode of ['XL', 'LG', 'MD', 'SM']) expect(thresholds).toContain(figmaWidthEm(mode));
  });

  it('Modal switches to its mobile layout below the MD breakpoint', () => {
    const modal = readFileSync(join(root, 'components/Surfaces/Modal/Modal.css'), 'utf8');
    const queries = [...modal.matchAll(/@media \(width < ([\d.]+)em\)/g)].map((m) => Number(m[1]));
    expect(queries).toEqual([figmaWidthEm('MD')]);
  });
});
