import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { TextArea } from './TextArea';

describe('TextArea', () => {
  // ─── Rendering ───────────────────────────────────────────────────────────────

  it('renders a textarea element', () => {
    render(<TextArea />);
    expect(document.querySelector('textarea')).toBeInTheDocument();
  });

  it('renders the label element', () => {
    render(<TextArea label="Message" />);
    expect(document.querySelector('.sds-text-area__label')).toHaveTextContent('Message');
  });

  it('associates label with textarea via htmlFor/id', () => {
    render(<TextArea label="Message" />);
    const label = document.querySelector('label')!;
    const textarea = document.getElementById(label.getAttribute('for')!);
    expect(textarea).not.toBeNull();
    expect(textarea?.tagName).toBe('TEXTAREA');
  });

  it('uses the placeholder prop as the textarea placeholder attribute', () => {
    render(<TextArea placeholder="Type here…" />);
    expect(document.querySelector('textarea')).toHaveAttribute('placeholder', 'Type here…');
  });

  it('defaults placeholder to "Placeholder content"', () => {
    render(<TextArea />);
    expect(document.querySelector('textarea')).toHaveAttribute('placeholder', 'Placeholder content');
  });

  it('label and placeholder props are independent', () => {
    render(<TextArea label="Your message" placeholder="Write something here" />);
    expect(document.querySelector('.sds-text-area__label')).toHaveTextContent('Your message');
    expect(document.querySelector('textarea')).toHaveAttribute('placeholder', 'Write something here');
  });

  it('renders a message when provided', () => {
    render(<TextArea message="Hint text" />);
    expect(screen.getByText('Hint text')).toBeInTheDocument();
  });

  it('does not render the support group when disabled', () => {
    render(<TextArea message="Should not show" disabled />);
    expect(screen.queryByText('Should not show')).not.toBeInTheDocument();
  });

  it('forwards the name prop to the textarea', () => {
    render(<TextArea name="body" />);
    expect(document.querySelector('textarea')).toHaveAttribute('name', 'body');
  });

  // ─── CSS classes ─────────────────────────────────────────────────────────────

  it('applies the base sds-text-area class', () => {
    const { container } = render(<TextArea />);
    expect(container.firstChild).toHaveClass('sds-text-area');
  });

  it('adds sds-text-area--error when error prop is true', () => {
    const { container } = render(<TextArea error />);
    expect(container.firstChild).toHaveClass('sds-text-area--error');
  });

  it('adds sds-text-area--success when success prop is true', () => {
    const { container } = render(<TextArea success />);
    expect(container.firstChild).toHaveClass('sds-text-area--success');
  });

  it('adds sds-text-area--disabled when disabled prop is true', () => {
    const { container } = render(<TextArea disabled />);
    expect(container.firstChild).toHaveClass('sds-text-area--disabled');
  });

  it('adds sds-text-area--filled when value is provided', () => {
    const { container } = render(<TextArea value="hello" />);
    expect(container.firstChild).toHaveClass('sds-text-area--filled');
  });

  it('does not add sds-text-area--filled when value is empty', () => {
    const { container } = render(<TextArea value="" />);
    expect(container.firstChild).not.toHaveClass('sds-text-area--filled');
  });

  it('error takes priority over success', () => {
    const { container } = render(<TextArea error success />);
    expect(container.firstChild).toHaveClass('sds-text-area--error');
    expect(container.firstChild).not.toHaveClass('sds-text-area--success');
  });

  it('does not add error or success class when disabled', () => {
    const { container } = render(<TextArea error success disabled />);
    expect(container.firstChild).not.toHaveClass('sds-text-area--error');
    expect(container.firstChild).not.toHaveClass('sds-text-area--success');
  });

  it('applies additional className', () => {
    const { container } = render(<TextArea className="my-area" />);
    expect(container.firstChild).toHaveClass('my-area');
  });

  // ─── Disabled state ───────────────────────────────────────────────────────────

  it('disables the textarea when disabled', () => {
    render(<TextArea disabled />);
    expect(document.querySelector('textarea')).toBeDisabled();
  });

  it('does not render the clear button when disabled', () => {
    render(<TextArea disabled />);
    expect(screen.queryByRole('button', { name: 'Clear input' })).not.toBeInTheDocument();
  });

  // ─── Controlled value ─────────────────────────────────────────────────────────

  it('renders a controlled value', () => {
    render(<TextArea value="hello world" onChange={() => {}} />);
    expect(document.querySelector('textarea')).toHaveValue('hello world');
  });

  // ─── onChange ─────────────────────────────────────────────────────────────────

  it('calls onChange when the user types', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<TextArea onChange={handleChange} />);
    await user.click(document.querySelector('textarea')!);
    await user.type(document.querySelector('textarea')!, 'abc');
    expect(handleChange).toHaveBeenCalledTimes(3);
    expect(handleChange).toHaveBeenLastCalledWith('abc');
  });

  it('does not call onChange when disabled', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<TextArea onChange={handleChange} disabled />);
    await user.type(document.querySelector('textarea')!, 'abc');
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('supports multi-line input (Enter creates a newline)', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<TextArea onChange={handleChange} />);
    await user.click(document.querySelector('textarea')!);
    await user.type(document.querySelector('textarea')!, 'line1{Enter}line2');
    expect(handleChange).toHaveBeenLastCalledWith('line1\nline2');
  });

  // ─── Clear button ─────────────────────────────────────────────────────────────

  it('renders the clear button (CSS controls visibility)', () => {
    render(<TextArea />);
    expect(screen.getByRole('button', { name: 'Clear input' })).toBeInTheDocument();
  });

  it('clears the value when clear button is clicked', async () => {
    const user = userEvent.setup();
    render(<TextArea defaultValue="some text" />);
    const textarea = document.querySelector('textarea')!;
    await user.click(textarea);
    await user.click(screen.getByRole('button', { name: 'Clear input' }));
    expect(textarea).toHaveValue('');
  });

  it('calls onChange with empty string when clear is clicked', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<TextArea value="some text" onChange={handleChange} />);
    const textarea = document.querySelector('textarea')!;
    await user.click(textarea);
    await user.click(screen.getByRole('button', { name: 'Clear input' }));
    expect(handleChange).toHaveBeenCalledWith('');
  });

  // ─── Escape key clear ─────────────────────────────────────────────────────────

  it('clears the value on Escape (uncontrolled)', async () => {
    const user = userEvent.setup();
    render(<TextArea defaultValue="some text" />);
    const textarea = document.querySelector('textarea')!;
    await user.click(textarea);
    await user.keyboard('{Escape}');
    expect(textarea).toHaveValue('');
  });

  it('calls onChange with empty string on Escape (controlled)', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<TextArea value="some text" onChange={handleChange} />);
    await user.click(document.querySelector('textarea')!);
    await user.keyboard('{Escape}');
    expect(handleChange).toHaveBeenCalledWith('');
  });

  it('does not call onChange on Escape when the field is already empty', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<TextArea value="" onChange={handleChange} />);
    await user.click(document.querySelector('textarea')!);
    await user.keyboard('{Escape}');
    expect(handleChange).not.toHaveBeenCalled();
  });

  // ─── Character count ──────────────────────────────────────────────────────────

  it('renders the character count when maxLength is set', () => {
    render(<TextArea maxLength={100} />);
    expect(screen.getByText('/100')).toBeInTheDocument();
  });

  it('does not render the character count when maxLength is not set', () => {
    render(<TextArea />);
    expect(document.querySelector('.sds-text-area__char-count')).not.toBeInTheDocument();
  });

  it('updates the character count as the user types', async () => {
    const user = userEvent.setup();
    render(<TextArea maxLength={50} />);
    await user.click(document.querySelector('textarea')!);
    await user.type(document.querySelector('textarea')!, 'hello');
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('shows the current count against the limit', () => {
    render(<TextArea value="hi" onChange={() => {}} maxLength={20} />);
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('/20')).toBeInTheDocument();
  });

  it('applies --over class when value exceeds maxLength', () => {
    render(<TextArea value="toolong" onChange={() => {}} maxLength={3} />);
    expect(document.querySelector('.sds-text-area__char-count--over')).toBeInTheDocument();
  });

  it('does not render the support group when disabled even with maxLength', () => {
    render(<TextArea maxLength={50} disabled />);
    expect(document.querySelector('.sds-text-area__char-count')).not.toBeInTheDocument();
  });

  // ─── Accessibility ────────────────────────────────────────────────────────────

  it('sets aria-invalid when error is true', () => {
    render(<TextArea error />);
    expect(document.querySelector('textarea')).toHaveAttribute('aria-invalid', 'true');
  });

  it('does not set aria-invalid when error is false', () => {
    render(<TextArea />);
    expect(document.querySelector('textarea')).not.toHaveAttribute('aria-invalid');
  });

  it('links textarea to support message via aria-describedby', () => {
    render(<TextArea message="Hint text" />);
    const textarea = document.querySelector('textarea')!;
    const describedBy = textarea.getAttribute('aria-describedby')!;
    expect(describedBy).toBeTruthy();
    const supportEl = document.getElementById(describedBy.split(' ')[0]);
    expect(supportEl).toHaveTextContent('Hint text');
  });

  it('uses aria-label when provided', () => {
    render(<TextArea aria-label="Your message" />);
    expect(document.querySelector('textarea')).toHaveAttribute('aria-label', 'Your message');
  });

  it('renders a visually-hidden character limit hint for screen readers', () => {
    render(<TextArea maxLength={200} />);
    expect(screen.getByText('200 character maximum')).toBeInTheDocument();
  });

  it('renders WCAG live regions when maxLength is set', () => {
    render(<TextArea maxLength={50} />);
    expect(document.querySelector('[aria-live="polite"]')).toBeInTheDocument();
    expect(document.querySelector('[role="alert"]')).toBeInTheDocument();
  });

  it('does not render WCAG live regions when maxLength is not set', () => {
    render(<TextArea />);
    expect(document.querySelector('[aria-live="polite"]')).not.toBeInTheDocument();
    expect(document.querySelector('[role="alert"]')).not.toBeInTheDocument();
  });
});
