import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Media queries can't read CSS variables, so a component that switches layout at a Figma
 * breakpoint repeats its width. This keeps that copy honest: it must equal the breakpoint the
 * generated tokens.css switches at.
 */
const root = join(__dirname, '..');
const tokens = readFileSync(join(__dirname, 'generated/tokens.css'), 'utf8');

/** The `@media (width < Xem)` thresholds in tokens.css, widest first: [MD, XS]. */
const breakpointThresholds = [...tokens.matchAll(/@media \(width < ([\d.]+)em\)/g)].map((m) => m[1]);

describe('breakpoints', () => {
  it('tokens.css has one threshold per narrower breakpoint', () => {
    expect(breakpointThresholds.length).toBeGreaterThanOrEqual(2);
  });

  it('Modal switches to its mobile layout at the XS breakpoint', () => {
    const xs = breakpointThresholds[breakpointThresholds.length - 1];
    const modal = readFileSync(join(root, 'components/Surfaces/Modal/Modal.css'), 'utf8');
    const queries = [...modal.matchAll(/@media \(width < ([\d.]+)em\)/g)].map((m) => m[1]);
    expect(queries).toEqual([xs]);
  });
});
