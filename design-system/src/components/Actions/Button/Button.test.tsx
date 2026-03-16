import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  // ─── Rendering ──────────────────────────────────────────────────────────────

  it('renders with default props', () => {
    render(<Button label="Click me" />);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('renders label text', () => {
    render(<Button label="Submit" />);
    expect(screen.getByText('Submit')).toBeInTheDocument();
  });

  it('renders as a <button> element', () => {
    render(<Button label="Test" />);
    expect(screen.getByRole('button')).toBeInstanceOf(HTMLButtonElement);
  });

  it('defaults to type="button"', () => {
    render(<Button label="Test" />);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('renders with type="submit" when specified', () => {
    render(<Button label="Submit" type="submit" />);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  // ─── CSS Classes ─────────────────────────────────────────────────────────────

  it('applies the base sds-button class', () => {
    render(<Button label="Test" />);
    expect(screen.getByRole('button')).toHaveClass('sds-button');
  });

  it('defaults to primary filled classes', () => {
    render(<Button label="Test" />);
    const btn = screen.getByRole('button');
    expect(btn).toHaveClass('sds-button--primary-filled');
    expect(btn).toHaveClass('sds-button--small');
  });

  it.each([
    ['primary', 'filled', 'sds-button--primary-filled'],
    ['primary', 'hollow', 'sds-button--primary-hollow'],
    ['secondary', 'filled', 'sds-button--secondary-filled'],
    ['secondary', 'hollow', 'sds-button--secondary-hollow'],
    ['media', 'filled', 'sds-button--media-filled'],
    ['media', 'hollow', 'sds-button--media-hollow'],
  ] as const)(
    'applies %s %s class correctly',
    (intent, variant, expectedClass) => {
      render(<Button label="Test" intent={intent} variant={variant} />);
      expect(screen.getByRole('button')).toHaveClass(expectedClass);
    }
  );

  it.each([
    ['xsmall', 'sds-button--xsmall'],
    ['small', 'sds-button--small'],
    ['medium', 'sds-button--medium'],
    ['large', 'sds-button--large'],
  ] as const)('applies %s size class', (size, expectedClass) => {
    render(<Button label="Test" size={size} />);
    expect(screen.getByRole('button')).toHaveClass(expectedClass);
  });

  it('applies additional className', () => {
    render(<Button label="Test" className="custom-class" />);
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });

  // ─── Disabled State ───────────────────────────────────────────────────────────

  it('is disabled when disabled prop is true', () => {
    render(<Button label="Test" disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('sets aria-disabled when disabled', () => {
    render(<Button label="Test" disabled />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true');
  });

  it('is not disabled by default', () => {
    render(<Button label="Test" />);
    expect(screen.getByRole('button')).not.toBeDisabled();
  });

  // ─── Click Handling ───────────────────────────────────────────────────────────

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Button label="Click me" onClick={handleClick} />);
    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Button label="Click me" onClick={handleClick} disabled />);
    await user.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  // ─── Icon Support ─────────────────────────────────────────────────────────────

  it('renders an icon when provided', () => {
    render(<Button label="Test" icon={<svg data-testid="icon" />} />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('renders icon before label by default (left)', () => {
    render(<Button label="Test" icon={<svg data-testid="icon" />} />);
    const btn = screen.getByRole('button');
    const children = btn.querySelectorAll('.sds-button__icon, .sds-button__label');
    expect(children[0]).toHaveClass('sds-button__icon');
    expect(children[1]).toHaveClass('sds-button__label');
  });

  it('renders icon after label when iconPosition is right', () => {
    render(
      <Button label="Test" icon={<svg data-testid="icon" />} iconPosition="right" />
    );
    const btn = screen.getByRole('button');
    const children = btn.querySelectorAll('.sds-button__icon, .sds-button__label');
    expect(children[0]).toHaveClass('sds-button__label');
    expect(children[1]).toHaveClass('sds-button__icon');
  });

  it('hides label when showLabel is false', () => {
    render(<Button label="Hidden" showLabel={false} />);
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
  });

  it('uses label as aria-label for icon-only buttons', () => {
    render(
      <Button
        label="Close"
        showLabel={false}
        icon={<svg data-testid="icon" />}
      />
    );
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('uses explicit aria-label when provided', () => {
    render(<Button label="Test" aria-label="Custom label" />);
    expect(screen.getByRole('button', { name: 'Custom label' })).toBeInTheDocument();
  });

  // ─── Accessibility ────────────────────────────────────────────────────────────

  it('is keyboard accessible via Enter key', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Button label="Submit" onClick={handleClick} />);
    screen.getByRole('button').focus();
    await user.keyboard('{Enter}');
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is keyboard accessible via Space key', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Button label="Submit" onClick={handleClick} />);
    screen.getByRole('button').focus();
    await user.keyboard(' ');
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
