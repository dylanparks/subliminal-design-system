import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Popover } from './Popover';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function BasicPopover({
  open,
  defaultOpen,
  onOpenChange,
  showCloseButton = true,
  disabled = false,
}: {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (v: boolean) => void;
  showCloseButton?: boolean;
  disabled?: boolean;
}) {
  return (
    <Popover
      title="Popover title"
      description="Popover description"
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      showCloseButton={showCloseButton}
      disabled={disabled}
    >
      <button type="button">Trigger</button>
    </Popover>
  );
}

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('Popover — rendering', () => {
  it('does not render popup initially', () => {
    render(<BasicPopover />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders popup when defaultOpen=true', () => {
    render(<BasicPopover defaultOpen />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('renders title and description inside popup', () => {
    render(<BasicPopover defaultOpen />);
    expect(screen.getByText('Popover title')).toBeInTheDocument();
    expect(screen.getByText('Popover description')).toBeInTheDocument();
  });

  it('renders close button when showCloseButton=true', () => {
    render(<BasicPopover defaultOpen />);
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('does not render close button when showCloseButton=false', () => {
    render(<BasicPopover defaultOpen showCloseButton={false} />);
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
  });
});

// ─── Toggle ───────────────────────────────────────────────────────────────────

describe('Popover — toggle', () => {
  it('opens on trigger click', async () => {
    const user = userEvent.setup();
    render(<BasicPopover />);
    await user.click(screen.getByRole('button', { name: 'Trigger' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('closes on second trigger click', async () => {
    const user = userEvent.setup();
    render(<BasicPopover />);
    const trigger = screen.getByRole('button', { name: 'Trigger' });
    await user.click(trigger);
    await user.click(trigger);
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('closes via close button', async () => {
    const user = userEvent.setup();
    render(<BasicPopover />);
    await user.click(screen.getByRole('button', { name: 'Trigger' }));
    await user.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('closes on Escape key', async () => {
    const user = userEvent.setup();
    render(<BasicPopover />);
    await user.click(screen.getByRole('button', { name: 'Trigger' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('closes on outside click', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <BasicPopover />
        <button type="button">Outside</button>
      </div>
    );
    await user.click(screen.getByRole('button', { name: 'Trigger' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Outside' }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('does not open when disabled=true', async () => {
    const user = userEvent.setup();
    render(<BasicPopover disabled />);
    await user.click(screen.getByRole('button', { name: 'Trigger' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

// ─── Controlled ───────────────────────────────────────────────────────────────

describe('Popover — controlled', () => {
  it('reflects controlled open=true', () => {
    render(<BasicPopover open />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('reflects controlled open=false', () => {
    render(<BasicPopover open={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('calls onOpenChange(true) on trigger click when closed', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<BasicPopover open={false} onOpenChange={onOpenChange} />);
    await user.click(screen.getByRole('button', { name: 'Trigger' }));
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it('calls onOpenChange(false) on close button click', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<BasicPopover open onOpenChange={onOpenChange} />);
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('does not self-close without external update', async () => {
    const user = userEvent.setup();
    render(<BasicPopover open onOpenChange={() => {}} />);
    await user.keyboard('{Escape}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

// ─── Accessibility ────────────────────────────────────────────────────────────

describe('Popover — accessibility', () => {
  it('popup has role=dialog', () => {
    render(<BasicPopover defaultOpen />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('popup is labelled by title', () => {
    render(<BasicPopover defaultOpen />);
    const dialog = screen.getByRole('dialog');
    const labelId = dialog.getAttribute('aria-labelledby')!;
    expect(document.getElementById(labelId)).toHaveTextContent('Popover title');
  });

  it('popup is described by description', () => {
    render(<BasicPopover defaultOpen />);
    const dialog = screen.getByRole('dialog');
    const descId = dialog.getAttribute('aria-describedby')!;
    expect(document.getElementById(descId)).toHaveTextContent('Popover description');
  });

  it('trigger has aria-expanded=false when closed', () => {
    render(<BasicPopover />);
    expect(screen.getByRole('button', { name: 'Trigger' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('trigger has aria-expanded=true when open', async () => {
    const user = userEvent.setup();
    render(<BasicPopover />);
    await user.click(screen.getByRole('button', { name: 'Trigger' }));
    expect(screen.getByRole('button', { name: 'Trigger' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('trigger has aria-controls pointing to popup', async () => {
    const user = userEvent.setup();
    render(<BasicPopover />);
    await user.click(screen.getByRole('button', { name: 'Trigger' }));
    const trigger = screen.getByRole('button', { name: 'Trigger' });
    const controlsId = trigger.getAttribute('aria-controls')!;
    expect(document.getElementById(controlsId)).toBe(screen.getByRole('dialog'));
  });

  it('trigger has aria-haspopup=dialog', () => {
    render(<BasicPopover />);
    expect(screen.getByRole('button', { name: 'Trigger' })).toHaveAttribute('aria-haspopup', 'dialog');
  });
});
