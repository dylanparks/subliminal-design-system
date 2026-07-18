import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { Modal } from './Modal';

// JSDOM does not implement HTMLDialogElement.showModal / close.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute('open');
  });
});

const noop = () => {};

describe('Modal', () => {
  // ─── Visibility ──────────────────────────────────────────────────────────────

  it('calls showModal when open becomes true', () => {
    render(<Modal open title="Test" onClose={noop} />);
    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
  });

  it('calls close when open becomes false', () => {
    const { rerender } = render(<Modal open title="Test" onClose={noop} />);
    rerender(<Modal open={false} title="Test" onClose={noop} />);
    expect(HTMLDialogElement.prototype.close).toHaveBeenCalled();
  });

  // ─── Content ─────────────────────────────────────────────────────────────────

  it('renders the title', () => {
    render(<Modal open title="Confirm deletion" onClose={noop} />);
    expect(screen.getByText('Confirm deletion')).toBeInTheDocument();
  });

  it('renders the description when provided', () => {
    render(<Modal open title="Title" description="This cannot be undone." onClose={noop} />);
    expect(screen.getByText('This cannot be undone.')).toBeInTheDocument();
  });

  it('does not render a description element when omitted', () => {
    render(<Modal open title="Title" onClose={noop} />);
    expect(screen.queryByText('This cannot be undone.')).not.toBeInTheDocument();
  });

  it('renders children', () => {
    render(
      <Modal open title="Title" onClose={noop}>
        <span>Slot content</span>
      </Modal>
    );
    expect(screen.getByText('Slot content')).toBeInTheDocument();
  });

  // ─── Actions ─────────────────────────────────────────────────────────────────

  it('renders the primary action button', () => {
    render(
      <Modal open title="Title" onClose={noop}
        primaryAction={{ label: 'Confirm', onClick: noop }}
      />
    );
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
  });

  it('renders both action buttons', () => {
    render(
      <Modal open title="Title" onClose={noop}
        primaryAction={{ label: 'Save',   onClick: noop }}
        secondaryAction={{ label: 'Discard', onClick: noop }}
      />
    );
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Discard' })).toBeInTheDocument();
  });

  it('calls primaryAction.onClick when clicked', async () => {
    const onClick = vi.fn();
    render(
      <Modal open title="Title" onClose={noop}
        primaryAction={{ label: 'Submit', onClick }}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('renders no action buttons when none provided', () => {
    render(<Modal open title="Title" onClose={noop} />);
    expect(screen.queryByRole('button', { name: /confirm|save|submit/i })).not.toBeInTheDocument();
  });

  // ─── Dismiss ─────────────────────────────────────────────────────────────────

  it('renders a dismiss button when dismissable', () => {
    render(<Modal open title="Title" onClose={noop} dismissable />);
    expect(screen.getByRole('button', { name: 'Close modal' })).toBeInTheDocument();
  });

  it('does not render a dismiss button when not dismissable', () => {
    render(<Modal open title="Title" onClose={noop} dismissable={false} />);
    expect(screen.queryByRole('button', { name: 'Close modal' })).not.toBeInTheDocument();
  });

  it('calls onClose when the dismiss button is clicked', async () => {
    const onClose = vi.fn();
    render(<Modal open title="Title" onClose={onClose} dismissable />);
    await userEvent.click(screen.getByRole('button', { name: 'Close modal' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  // ─── Image variant ────────────────────────────────────────────────────────────

  it('renders an image when imageSrc is provided', () => {
    render(
      <Modal open title="Title" onClose={noop}
        imageSrc="https://example.com/img.jpg"
        imageAlt="A scenic photo"
      />
    );
    expect(screen.getByAltText('A scenic photo')).toBeInTheDocument();
  });

  it('renders the round dismiss button over the image in image variant', () => {
    render(
      <Modal open title="Title" onClose={noop} dismissable
        imageSrc="https://example.com/img.jpg"
      />
    );
    expect(screen.getByRole('button', { name: 'Close modal' })).toBeInTheDocument();
  });

  // ─── ARIA ─────────────────────────────────────────────────────────────────────

  it('links aria-labelledby to the title element', () => {
    render(<Modal open title="My dialog" onClose={noop} />);
    const dialog = screen.getByRole('dialog', { hidden: true });
    const titleId = dialog.getAttribute('aria-labelledby')!;
    expect(document.getElementById(titleId)?.textContent).toBe('My dialog');
  });

  it('links aria-describedby to the description element when provided', () => {
    render(<Modal open title="Title" description="Helpful context." onClose={noop} />);
    const dialog = screen.getByRole('dialog', { hidden: true });
    const descId = dialog.getAttribute('aria-describedby')!;
    expect(document.getElementById(descId)?.textContent).toBe('Helpful context.');
  });

  it('does not set aria-describedby when no description', () => {
    render(<Modal open title="Title" onClose={noop} />);
    const dialog = screen.getByRole('dialog', { hidden: true });
    expect(dialog.getAttribute('aria-describedby')).toBeNull();
  });

  // ─── CSS classes ──────────────────────────────────────────────────────────────

  it('applies the size modifier class', () => {
    render(<Modal open title="Title" onClose={noop} size="small" />);
    expect(document.querySelector('.sds-modal--small')).toBeInTheDocument();
  });

  it('applies the image modifier class when imageSrc is provided', () => {
    render(
      <Modal open title="Title" onClose={noop}
        imageSrc="https://example.com/img.jpg"
      />
    );
    expect(document.querySelector('.sds-modal--image')).toBeInTheDocument();
  });

  it('applies a custom className to the card', () => {
    render(<Modal open title="Title" onClose={noop} className="my-modal" />);
    expect(document.querySelector('.my-modal')).toBeInTheDocument();
  });
});
