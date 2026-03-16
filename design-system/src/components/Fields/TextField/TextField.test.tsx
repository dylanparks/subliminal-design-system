import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { TextField } from './TextField';

describe('TextField', () => {
  // ─── Rendering ──────────────────────────────────────────────────────────────

  it('renders with default props', () => {
    render(<TextField />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders the label', () => {
    render(<TextField label="Email address" />);
    expect(screen.getByText('Email address')).toBeInTheDocument();
  });

  it('associates label with input via htmlFor/id', () => {
    render(<TextField label="Email" />);
    const input = screen.getByRole('textbox');
    const label = screen.getByText('Email');
    expect(label).toHaveAttribute('for', input.id);
  });

  it('renders a message when provided', () => {
    render(<TextField message="Helper text" />);
    expect(screen.getByText('Helper text')).toBeInTheDocument();
  });

  it('does not render the support group when disabled', () => {
    render(<TextField message="Should not show" disabled />);
    expect(screen.queryByText('Should not show')).not.toBeInTheDocument();
  });

  // ─── CSS classes ─────────────────────────────────────────────────────────────

  it('applies the base sds-text-field class', () => {
    const { container } = render(<TextField />);
    expect(container.firstChild).toHaveClass('sds-text-field');
  });

  it('defaults to the large size class', () => {
    const { container } = render(<TextField />);
    expect(container.firstChild).toHaveClass('sds-text-field--large');
  });

  it.each([
    ['large',  'sds-text-field--large'],
    ['medium', 'sds-text-field--medium'],
    ['small',  'sds-text-field--small'],
  ] as const)('applies %s size class', (size, expectedClass) => {
    const { container } = render(<TextField size={size} />);
    expect(container.firstChild).toHaveClass(expectedClass);
  });

  it('adds sds-text-field--error when error prop is true', () => {
    const { container } = render(<TextField error />);
    expect(container.firstChild).toHaveClass('sds-text-field--error');
  });

  it('adds sds-text-field--success when success prop is true', () => {
    const { container } = render(<TextField success />);
    expect(container.firstChild).toHaveClass('sds-text-field--success');
  });

  it('adds sds-text-field--disabled when disabled prop is true', () => {
    const { container } = render(<TextField disabled />);
    expect(container.firstChild).toHaveClass('sds-text-field--disabled');
  });

  it('adds sds-text-field--filled when value is provided', () => {
    const { container } = render(<TextField value="hello" />);
    expect(container.firstChild).toHaveClass('sds-text-field--filled');
  });

  it('does not add sds-text-field--filled when value is empty', () => {
    const { container } = render(<TextField value="" />);
    expect(container.firstChild).not.toHaveClass('sds-text-field--filled');
  });

  it('applies additional className', () => {
    const { container } = render(<TextField className="my-field" />);
    expect(container.firstChild).toHaveClass('my-field');
  });

  // ─── Error takes priority over success ────────────────────────────────────

  it('does not add success class when both error and success are true', () => {
    const { container } = render(<TextField error success />);
    expect(container.firstChild).toHaveClass('sds-text-field--error');
    expect(container.firstChild).not.toHaveClass('sds-text-field--success');
  });

  it('does not add error or success class when disabled', () => {
    const { container } = render(<TextField error success disabled />);
    expect(container.firstChild).not.toHaveClass('sds-text-field--error');
    expect(container.firstChild).not.toHaveClass('sds-text-field--success');
    expect(container.firstChild).toHaveClass('sds-text-field--disabled');
  });

  // ─── Disabled state ──────────────────────────────────────────────────────────

  it('disables the native input when disabled', () => {
    render(<TextField disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('is not disabled by default', () => {
    render(<TextField />);
    expect(screen.getByRole('textbox')).not.toBeDisabled();
  });

  // ─── Controlled value ────────────────────────────────────────────────────────

  it('renders a controlled value', () => {
    render(<TextField value="hello world" onChange={() => {}} />);
    expect(screen.getByRole('textbox')).toHaveValue('hello world');
  });

  // ─── Uncontrolled / onChange ─────────────────────────────────────────────────

  it('calls onChange when the user types', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<TextField onChange={handleChange} />);
    await user.type(screen.getByRole('textbox'), 'abc');
    expect(handleChange).toHaveBeenCalledTimes(3);
    expect(handleChange).toHaveBeenLastCalledWith('abc');
  });

  it('does not call onChange when disabled', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<TextField onChange={handleChange} disabled />);
    await user.type(screen.getByRole('textbox'), 'abc');
    expect(handleChange).not.toHaveBeenCalled();
  });

  // ─── Clear button ────────────────────────────────────────────────────────────

  it('renders the clear button (hidden via CSS when not focused)', () => {
    render(<TextField />);
    expect(screen.getByRole('button', { name: 'Clear input' })).toBeInTheDocument();
  });

  it('does not render the clear button when disabled', () => {
    render(<TextField disabled />);
    expect(screen.queryByRole('button', { name: 'Clear input' })).not.toBeInTheDocument();
  });

  it('clears the value when clear button is clicked', async () => {
    const user = userEvent.setup();
    render(<TextField defaultValue="some text" />);
    const input = screen.getByRole('textbox');

    // Focus to show clear button, then click it
    await user.click(input);
    await user.click(screen.getByRole('button', { name: 'Clear input' }));
    expect(input).toHaveValue('');
  });

  it('calls onChange with empty string when clear is clicked', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<TextField value="existing" onChange={handleChange} />);
    const input = screen.getByRole('textbox');
    await user.click(input);
    await user.click(screen.getByRole('button', { name: 'Clear input' }));
    expect(handleChange).toHaveBeenCalledWith('');
  });

  // ─── Character count ─────────────────────────────────────────────────────────

  it('shows character count when maxLength is set', () => {
    render(<TextField value="hello" maxLength={20} />);
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('/20')).toBeInTheDocument();
  });

  it('adds char-count--at class when value equals maxLength', () => {
    const { container } = render(<TextField value="hello" maxLength={5} />);
    expect(container.querySelector('.sds-text-field__char-count')).toHaveClass(
      'sds-text-field__char-count--at'
    );
  });

  it('adds char-count--over class when value exceeds maxLength', () => {
    const { container } = render(<TextField value="toolongvalue" maxLength={5} />);
    expect(container.querySelector('.sds-text-field__char-count')).toHaveClass(
      'sds-text-field__char-count--over'
    );
  });

  it('does not add char-count--at or --over when under the limit', () => {
    const { container } = render(<TextField value="hi" maxLength={10} />);
    const el = container.querySelector('.sds-text-field__char-count');
    expect(el).not.toHaveClass('sds-text-field__char-count--at');
    expect(el).not.toHaveClass('sds-text-field__char-count--over');
  });

  it('char-count state is driven by actual length, not the error prop', () => {
    // error=true with a value well under the limit — counter must stay neutral
    const { container } = render(<TextField value="hi" maxLength={20} error />);
    const el = container.querySelector('.sds-text-field__char-count');
    expect(el).not.toHaveClass('sds-text-field__char-count--at');
    expect(el).not.toHaveClass('sds-text-field__char-count--over');
  });

  it('does not show character count when disabled', () => {
    const { container } = render(<TextField value="hello" maxLength={20} disabled />);
    expect(container.querySelector('.sds-text-field__char-count')).not.toBeInTheDocument();
  });

  // ─── WCAG AA live regions ────────────────────────────────────────────────────

  it('renders polite and assertive live regions when maxLength is set', () => {
    const { container } = render(<TextField maxLength={50} />);
    expect(container.querySelector('[aria-live="polite"]')).toBeInTheDocument();
    expect(container.querySelector('[role="alert"]')).toBeInTheDocument();
  });

  it('does not render live regions when maxLength is not set', () => {
    const { container } = render(<TextField />);
    expect(container.querySelector('[aria-live="polite"]')).not.toBeInTheDocument();
    expect(container.querySelector('[role="alert"]')).not.toBeInTheDocument();
  });

  it('announces character limit on first focus via aria-describedby hint', () => {
    render(<TextField maxLength={50} />);
    const input = screen.getByRole('textbox');
    const describedBy = input.getAttribute('aria-describedby') ?? '';
    const ids = describedBy.split(' ');
    const hintEl = document.getElementById(ids.find(id => id.endsWith('-limit-hint'))!);
    expect(hintEl).toHaveTextContent('50 character maximum');
  });

  // ─── Accessibility ────────────────────────────────────────────────────────────

  it('sets aria-invalid when error is true', () => {
    render(<TextField error />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('does not set aria-invalid when error is false', () => {
    render(<TextField />);
    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-invalid');
  });

  it('uses aria-label when provided', () => {
    render(<TextField aria-label="Custom accessible label" />);
    expect(screen.getByRole('textbox', { name: 'Custom accessible label' })).toBeInTheDocument();
  });

  it('links input to support group via aria-describedby', () => {
    render(<TextField message="Helper text" />);
    const input = screen.getByRole('textbox');
    const supportId = input.getAttribute('aria-describedby');
    expect(supportId).toBeTruthy();
    expect(document.getElementById(supportId!)).toHaveTextContent('Helper text');
  });

  // ─── Prop forwarding ─────────────────────────────────────────────────────────

  it('forwards the name prop to the input', () => {
    render(<TextField name="email" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('name', 'email');
  });

  it('forwards the type prop to the input', () => {
    render(<TextField type="email" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');
  });

  it('defaults to type="text"', () => {
    render(<TextField />);
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'text');
  });

  // ─── Small size (external label) ─────────────────────────────────────────────

  it('renders label above the wrapper for small size', () => {
    render(<TextField label="Email" size="small" />);
    const label = screen.getByText('Email');
    expect(label).toHaveClass('sds-text-field__label--external');
  });

  it('shows placeholder text for small size', () => {
    render(<TextField placeholder="Enter email" size="small" />);
    expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
  });

  it('shows placeholder text for large size', () => {
    render(<TextField placeholder="Enter email" size="large" />);
    expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
  });

  it('shows placeholder text for medium size', () => {
    render(<TextField placeholder="Enter email" size="medium" />);
    expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
  });

  // ─── Escape key clear ─────────────────────────────────────────────────────────

  it('clears the value when Escape is pressed (uncontrolled)', async () => {
    const user = userEvent.setup();
    render(<TextField defaultValue="some text" />);
    const input = screen.getByRole('textbox');
    await user.click(input);
    await user.keyboard('{Escape}');
    expect(input).toHaveValue('');
  });

  it('calls onChange with empty string when Escape is pressed (controlled)', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<TextField value="existing" onChange={handleChange} />);
    await user.click(screen.getByRole('textbox'));
    await user.keyboard('{Escape}');
    expect(handleChange).toHaveBeenCalledWith('');
  });

  it('does not call onChange on Escape when the field is already empty', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<TextField value="" onChange={handleChange} />);
    await user.click(screen.getByRole('textbox'));
    await user.keyboard('{Escape}');
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('is keyboard accessible', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<TextField onChange={handleChange} />);
    screen.getByRole('textbox').focus();
    await user.keyboard('hello');
    expect(handleChange).toHaveBeenLastCalledWith('hello');
  });
});
