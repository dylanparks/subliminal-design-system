import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { PasswordField } from './PasswordField';

describe('PasswordField', () => {
  // ─── Rendering ───────────────────────────────────────────────────────────────

  it('renders a password input by default', () => {
    render(<PasswordField />);
    expect(screen.getByLabelText(/input label/i, { selector: 'input' })).toHaveAttribute('type', 'password');
  });

  it('renders the label', () => {
    render(<PasswordField label="Password" />);
    expect(screen.getByText('Password')).toBeInTheDocument();
  });

  it('associates label with input via htmlFor/id', () => {
    render(<PasswordField label="Password" />);
    const label = screen.getByText('Password');
    const input = document.getElementById(label.getAttribute('for')!);
    expect(input).not.toBeNull();
    expect(input?.tagName).toBe('INPUT');
  });

  it('renders a message when provided', () => {
    render(<PasswordField message="At least 8 characters." />);
    expect(screen.getByText('At least 8 characters.')).toBeInTheDocument();
  });

  it('does not render the support group when disabled', () => {
    render(<PasswordField message="Should not show" disabled />);
    expect(screen.queryByText('Should not show')).not.toBeInTheDocument();
  });

  it('forwards the name prop to the input', () => {
    render(<PasswordField name="user-password" />);
    expect(document.querySelector('input')).toHaveAttribute('name', 'user-password');
  });

  // ─── CSS classes ─────────────────────────────────────────────────────────────

  it('applies the base sds-password-field class', () => {
    const { container } = render(<PasswordField />);
    expect(container.firstChild).toHaveClass('sds-password-field');
  });

  it('defaults to the large size class', () => {
    const { container } = render(<PasswordField />);
    expect(container.firstChild).toHaveClass('sds-password-field--large');
  });

  it.each([
    ['large',  'sds-password-field--large'],
    ['medium', 'sds-password-field--medium'],
    ['small',  'sds-password-field--small'],
  ] as const)('applies %s size class', (size, expectedClass) => {
    const { container } = render(<PasswordField size={size} />);
    expect(container.firstChild).toHaveClass(expectedClass);
  });

  it('adds sds-password-field--error when error prop is true', () => {
    const { container } = render(<PasswordField error />);
    expect(container.firstChild).toHaveClass('sds-password-field--error');
  });

  it('adds sds-password-field--success when success prop is true', () => {
    const { container } = render(<PasswordField success />);
    expect(container.firstChild).toHaveClass('sds-password-field--success');
  });

  it('adds sds-password-field--disabled when disabled prop is true', () => {
    const { container } = render(<PasswordField disabled />);
    expect(container.firstChild).toHaveClass('sds-password-field--disabled');
  });

  it('adds sds-password-field--filled when value is provided', () => {
    const { container } = render(<PasswordField value="secret" />);
    expect(container.firstChild).toHaveClass('sds-password-field--filled');
  });

  it('does not add sds-password-field--filled when value is empty', () => {
    const { container } = render(<PasswordField value="" />);
    expect(container.firstChild).not.toHaveClass('sds-password-field--filled');
  });

  it('error takes priority over success', () => {
    const { container } = render(<PasswordField error success />);
    expect(container.firstChild).toHaveClass('sds-password-field--error');
    expect(container.firstChild).not.toHaveClass('sds-password-field--success');
  });

  it('does not add error or success class when disabled', () => {
    const { container } = render(<PasswordField error success disabled />);
    expect(container.firstChild).not.toHaveClass('sds-password-field--error');
    expect(container.firstChild).not.toHaveClass('sds-password-field--success');
  });

  it('applies additional className', () => {
    const { container } = render(<PasswordField className="my-field" />);
    expect(container.firstChild).toHaveClass('my-field');
  });

  // ─── Disabled state ───────────────────────────────────────────────────────────

  it('disables the input when disabled', () => {
    render(<PasswordField disabled />);
    expect(document.querySelector('input')).toBeDisabled();
  });

  // ─── Controlled value ─────────────────────────────────────────────────────────

  it('renders a controlled value', () => {
    render(<PasswordField value="secret123" onChange={() => {}} />);
    expect(document.querySelector('input')).toHaveValue('secret123');
  });

  // ─── onChange ─────────────────────────────────────────────────────────────────

  it('calls onChange when the user types', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<PasswordField onChange={handleChange} />);
    await user.type(document.querySelector('input')!, 'abc');
    expect(handleChange).toHaveBeenCalledTimes(3);
    expect(handleChange).toHaveBeenLastCalledWith('abc');
  });

  it('does not call onChange when disabled', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<PasswordField onChange={handleChange} disabled />);
    await user.type(document.querySelector('input')!, 'abc');
    expect(handleChange).not.toHaveBeenCalled();
  });

  // ─── Visibility toggle ────────────────────────────────────────────────────────

  it('renders the show password button', () => {
    render(<PasswordField />);
    expect(screen.getByRole('button', { name: 'Show password' })).toBeInTheDocument();
  });

  it('shows "Hide password" button label when visible', () => {
    render(<PasswordField visible />);
    expect(screen.getByRole('button', { name: 'Hide password' })).toBeInTheDocument();
  });

  it('input type is password by default', () => {
    render(<PasswordField />);
    expect(document.querySelector('input')).toHaveAttribute('type', 'password');
  });

  it('input type changes to text when toggle is clicked', async () => {
    const user = userEvent.setup();
    render(<PasswordField />);
    await user.click(screen.getByRole('button', { name: 'Show password' }));
    expect(document.querySelector('input')).toHaveAttribute('type', 'text');
  });

  it('input type goes back to password when toggled twice', async () => {
    const user = userEvent.setup();
    render(<PasswordField />);
    const toggle = screen.getByRole('button', { name: 'Show password' });
    await user.click(toggle);
    await user.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(document.querySelector('input')).toHaveAttribute('type', 'password');
  });

  it('calls onVisibleChange when toggle is clicked', async () => {
    const user = userEvent.setup();
    const handleVisibleChange = vi.fn();
    render(<PasswordField onVisibleChange={handleVisibleChange} />);
    await user.click(screen.getByRole('button', { name: 'Show password' }));
    expect(handleVisibleChange).toHaveBeenCalledWith(true);
  });

  it('respects controlled visible prop', () => {
    render(<PasswordField visible={true} />);
    expect(document.querySelector('input')).toHaveAttribute('type', 'text');
  });

  it('toggle button is disabled when field is disabled', () => {
    render(<PasswordField disabled />);
    expect(screen.getByRole('button', { name: 'Show password' })).toBeDisabled();
  });

  // ─── Clear button ─────────────────────────────────────────────────────────────

  it('does not render the clear button when disabled', () => {
    render(<PasswordField disabled />);
    expect(screen.queryByRole('button', { name: 'Clear input' })).not.toBeInTheDocument();
  });

  it('renders the clear button (hidden via CSS until filled+focused)', () => {
    render(<PasswordField />);
    expect(screen.getByRole('button', { name: 'Clear input' })).toBeInTheDocument();
  });

  it('clears the value when clear button is clicked', async () => {
    const user = userEvent.setup();
    render(<PasswordField defaultValue="secret" />);
    const input = document.querySelector('input')!;
    await user.click(input);
    await user.click(screen.getByRole('button', { name: 'Clear input' }));
    expect(input).toHaveValue('');
  });

  it('calls onChange with empty string when clear is clicked', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<PasswordField value="secret" onChange={handleChange} />);
    const input = document.querySelector('input')!;
    await user.click(input);
    await user.click(screen.getByRole('button', { name: 'Clear input' }));
    expect(handleChange).toHaveBeenCalledWith('');
  });

  // ─── Escape key clear ─────────────────────────────────────────────────────────

  it('clears the value on Escape (uncontrolled)', async () => {
    const user = userEvent.setup();
    render(<PasswordField defaultValue="secret" />);
    const input = document.querySelector('input')!;
    await user.click(input);
    await user.keyboard('{Escape}');
    expect(input).toHaveValue('');
  });

  it('calls onChange with empty string on Escape (controlled)', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<PasswordField value="secret" onChange={handleChange} />);
    await user.click(document.querySelector('input')!);
    await user.keyboard('{Escape}');
    expect(handleChange).toHaveBeenCalledWith('');
  });

  it('does not call onChange on Escape when the field is already empty', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<PasswordField value="" onChange={handleChange} />);
    await user.click(document.querySelector('input')!);
    await user.keyboard('{Escape}');
    expect(handleChange).not.toHaveBeenCalled();
  });

  // ─── External label (small size) ─────────────────────────────────────────────

  it('renders label above the wrapper for small size', () => {
    render(<PasswordField label="Password" size="small" />);
    expect(screen.getByText('Password')).toHaveClass('sds-password-field__label--external');
  });

  it('shows placeholder text for small size', () => {
    render(<PasswordField placeholder="Enter password" size="small" />);
    expect(screen.getByPlaceholderText('Enter password')).toBeInTheDocument();
  });

  it('shows placeholder text for large size', () => {
    render(<PasswordField placeholder="Enter password" size="large" />);
    expect(screen.getByPlaceholderText('Enter password')).toBeInTheDocument();
  });

  it('shows placeholder text for medium size', () => {
    render(<PasswordField placeholder="Enter password" size="medium" />);
    expect(screen.getByPlaceholderText('Enter password')).toBeInTheDocument();
  });

  // ─── Accessibility ────────────────────────────────────────────────────────────

  it('sets aria-invalid when error is true', () => {
    render(<PasswordField error />);
    expect(document.querySelector('input')).toHaveAttribute('aria-invalid', 'true');
  });

  it('does not set aria-invalid when error is false', () => {
    render(<PasswordField />);
    expect(document.querySelector('input')).not.toHaveAttribute('aria-invalid');
  });

  it('links input to support message via aria-describedby', () => {
    render(<PasswordField message="Hint text" />);
    const input = document.querySelector('input')!;
    const supportId = input.getAttribute('aria-describedby');
    expect(supportId).toBeTruthy();
    expect(document.getElementById(supportId!)).toHaveTextContent('Hint text');
  });

  it('uses aria-label when provided', () => {
    render(<PasswordField aria-label="Account password" />);
    expect(document.querySelector('input')).toHaveAttribute('aria-label', 'Account password');
  });
});
