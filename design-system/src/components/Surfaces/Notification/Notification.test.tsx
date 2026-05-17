import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Notification } from './Notification';

describe('Notification', () => {
  // ─── ARIA roles ─────────────────────────────────────────────────────────────

  it('uses role="alert" for error status', () => {
    render(<Notification title="Error" status="error" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('uses role="alert" for warning status', () => {
    render(<Notification title="Warning" status="warning" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('uses role="status" for informational status', () => {
    render(<Notification title="Info" status="informational" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('uses role="status" for success status', () => {
    render(<Notification title="Success" status="success" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  // ─── Content ─────────────────────────────────────────────────────────────────

  it('renders the title', () => {
    render(<Notification title="System update scheduled" />);
    expect(screen.getByText('System update scheduled')).toBeInTheDocument();
  });

  it('renders the description when provided', () => {
    render(<Notification title="Title" description="More details here." />);
    expect(screen.getByText('More details here.')).toBeInTheDocument();
  });

  it('does not render a description element when omitted', () => {
    render(<Notification title="Title" />);
    expect(screen.queryByText('More details here.')).not.toBeInTheDocument();
  });

  // ─── Dismiss ─────────────────────────────────────────────────────────────────

  it('renders a dismiss button when dismissable', () => {
    render(<Notification title="Title" dismissable />);
    expect(screen.getByRole('button', { name: 'Dismiss notification' })).toBeInTheDocument();
  });

  it('does not render a dismiss button when not dismissable', () => {
    render(<Notification title="Title" />);
    expect(screen.queryByRole('button', { name: 'Dismiss notification' })).not.toBeInTheDocument();
  });

  it('calls onDismiss when the dismiss button is clicked', async () => {
    const onDismiss = vi.fn();
    render(<Notification title="Title" dismissable onDismiss={onDismiss} />);
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  // ─── Actions ─────────────────────────────────────────────────────────────────

  it('renders the primary action button', () => {
    const onClick = vi.fn();
    render(<Notification title="Title" actions={[{ label: 'Confirm', onClick }]} />);
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
  });

  it('renders both action buttons when two are provided', () => {
    render(
      <Notification
        title="Title"
        actions={[
          { label: 'Primary', onClick: vi.fn() },
          { label: 'Secondary', onClick: vi.fn() },
        ]}
      />
    );
    expect(screen.getByRole('button', { name: 'Primary' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Secondary' })).toBeInTheDocument();
  });

  it('calls the action onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<Notification title="Title" actions={[{ label: 'Retry', onClick }]} />);
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  // ─── CSS classes ─────────────────────────────────────────────────────────────

  it('applies the status modifier class', () => {
    render(<Notification title="Title" status="warning" />);
    expect(screen.getByRole('alert')).toHaveClass('sds-notification--warning');
  });

  it('applies the layout modifier class', () => {
    render(<Notification title="Title" layout="inline" />);
    expect(screen.getByRole('status')).toHaveClass('sds-notification--inline');
  });

  it('applies a custom className', () => {
    render(<Notification title="Title" className="my-notification" />);
    expect(screen.getByRole('status')).toHaveClass('my-notification');
  });
});
