import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatusLight } from './StatusLight';

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('StatusLight — rendering', () => {
  it('renders children', () => {
    render(<StatusLight><div data-testid="child" /></StatusLight>);
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('renders the dot element', () => {
    const { container } = render(<StatusLight><div /></StatusLight>);
    expect(container.querySelector('.sds-status-light__dot')).toBeInTheDocument();
  });

  it('dot is aria-hidden when no label is provided', () => {
    const { container } = render(<StatusLight><div /></StatusLight>);
    const dot = container.querySelector('.sds-status-light__dot');
    expect(dot).toHaveAttribute('aria-hidden', 'true');
    expect(dot).not.toHaveAttribute('role');
  });

  it('dot has role="img" and aria-label when label is provided', () => {
    render(<StatusLight label="Online"><div /></StatusLight>);
    const dot = screen.getByRole('img', { name: 'Online' });
    expect(dot).toBeInTheDocument();
    expect(dot).not.toHaveAttribute('aria-hidden');
  });
});

// ─── Variants ─────────────────────────────────────────────────────────────────

describe('StatusLight — variants', () => {
  const variants = ['default', 'error', 'success', 'warning', 'informative', 'disabled'] as const;

  variants.forEach(variant => {
    it(`applies variant class for "${variant}"`, () => {
      const { container } = render(<StatusLight variant={variant}><div /></StatusLight>);
      const dot = container.querySelector('.sds-status-light__dot');
      expect(dot).toHaveClass(`sds-status-light__dot--${variant}`);
    });
  });

  it('defaults to "default" variant', () => {
    const { container } = render(<StatusLight><div /></StatusLight>);
    const dot = container.querySelector('.sds-status-light__dot');
    expect(dot).toHaveClass('sds-status-light__dot--default');
  });
});

// ─── Positions ────────────────────────────────────────────────────────────────

describe('StatusLight — positions', () => {
  const positions = ['top-start', 'top-end', 'bottom-start', 'bottom-end'] as const;

  positions.forEach(position => {
    it(`applies position class for "${position}"`, () => {
      const { container } = render(<StatusLight position={position}><div /></StatusLight>);
      const dot = container.querySelector('.sds-status-light__dot');
      expect(dot).toHaveClass(`sds-status-light__dot--${position}`);
    });
  });

  it('defaults to "bottom-end" position', () => {
    const { container } = render(<StatusLight><div /></StatusLight>);
    const dot = container.querySelector('.sds-status-light__dot');
    expect(dot).toHaveClass('sds-status-light__dot--bottom-end');
  });
});
