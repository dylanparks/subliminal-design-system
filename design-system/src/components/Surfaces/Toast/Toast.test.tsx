import { render, screen, act, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ToastProvider, useToast } from './Toast';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Trigger({
  title       = 'Toast title',
  description,
  actions,
  duration,
  showCloseButton,
}: {
  title?:           string;
  description?:     string;
  actions?:         { label: string; onClick?: () => void }[];
  duration?:        number;
  showCloseButton?: boolean;
}) {
  const { add } = useToast();
  return (
    <button type="button" onClick={() => add({ title, description, actions, duration, showCloseButton })}>
      Show
    </button>
  );
}

function DismissAllTrigger() {
  const { dismissAll } = useToast();
  return <button type="button" onClick={dismissAll}>Dismiss all</button>;
}

function renderWithProvider(ui: React.ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('Toast — rendering', () => {
  it('renders no toasts initially', () => {
    renderWithProvider(<Trigger />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('renders a toast on trigger click', async () => {
    const user = userEvent.setup();
    renderWithProvider(<Trigger />);
    await user.click(screen.getByRole('button', { name: 'Show' }));
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Toast title')).toBeInTheDocument();
  });

  it('renders description when provided', async () => {
    const user = userEvent.setup();
    renderWithProvider(<Trigger description="Some details" />);
    await user.click(screen.getByRole('button', { name: 'Show' }));
    expect(screen.getByText('Some details')).toBeInTheDocument();
  });

  it('renders action buttons when provided', async () => {
    const user = userEvent.setup();
    renderWithProvider(<Trigger actions={[{ label: 'Undo' }, { label: 'View' }]} />);
    await user.click(screen.getByRole('button', { name: 'Show' }));
    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View' })).toBeInTheDocument();
  });

  it('renders close button by default', async () => {
    const user = userEvent.setup();
    renderWithProvider(<Trigger />);
    await user.click(screen.getByRole('button', { name: 'Show' }));
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument();
  });

  it('hides close button when showCloseButton=false', async () => {
    const user = userEvent.setup();
    renderWithProvider(<Trigger showCloseButton={false} />);
    await user.click(screen.getByRole('button', { name: 'Show' }));
    expect(screen.queryByRole('button', { name: 'Dismiss' })).not.toBeInTheDocument();
  });

  it('stacks multiple toasts — only the front card is interactive', async () => {
    const user = userEvent.setup();
    renderWithProvider(<Trigger duration={0} />);
    await user.click(screen.getByRole('button', { name: 'Show' }));
    await user.click(screen.getByRole('button', { name: 'Show' }));
    await user.click(screen.getByRole('button', { name: 'Show' }));
    // Peek cards are aria-hidden; only the front card has role="status"
    expect(screen.getAllByRole('status')).toHaveLength(1);
    // Use fireEvent to dismiss without triggering hover→expand
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    await waitFor(() => expect(screen.getAllByRole('status')).toHaveLength(1), { timeout: 500 });
  });
});

// ─── Auto-dismiss (fake timers) ───────────────────────────────────────────────
// fireEvent (synchronous) avoids the userEvent + fake-timer RAF deadlock.

describe('Toast — auto-dismiss', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('auto-dismisses after default duration (5000ms)', () => {
    renderWithProvider(<Trigger />);
    fireEvent.click(screen.getByRole('button', { name: 'Show' }));
    expect(screen.getByRole('status')).toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(5000 + 200); });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('auto-dismisses after custom duration', () => {
    renderWithProvider(<Trigger duration={1000} />);
    fireEvent.click(screen.getByRole('button', { name: 'Show' }));
    act(() => { vi.advanceTimersByTime(1000 + 200); });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('does NOT auto-dismiss when duration=0', () => {
    renderWithProvider(<Trigger duration={0} />);
    fireEvent.click(screen.getByRole('button', { name: 'Show' }));
    act(() => { vi.advanceTimersByTime(30_000); });
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});

// ─── Manual dismiss (real timers) ─────────────────────────────────────────────

describe('Toast — manual dismiss', () => {
  it('dismisses on close button click', async () => {
    const user = userEvent.setup();
    renderWithProvider(<Trigger duration={0} />);
    await user.click(screen.getByRole('button', { name: 'Show' }));
    await user.click(screen.getByRole('button', { name: 'Dismiss' }));
    await waitFor(
      () => expect(screen.queryByRole('status')).not.toBeInTheDocument(),
      { timeout: 500 },
    );
  });

  it('dismisses when an action button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProvider(<Trigger duration={0} actions={[{ label: 'Undo' }]} />);
    await user.click(screen.getByRole('button', { name: 'Show' }));
    await user.click(screen.getByRole('button', { name: 'Undo' }));
    await waitFor(
      () => expect(screen.queryByRole('status')).not.toBeInTheDocument(),
      { timeout: 500 },
    );
  });

  it('calls action onClick when action button is clicked', async () => {
    const handler = vi.fn();
    const user = userEvent.setup();
    renderWithProvider(<Trigger duration={0} actions={[{ label: 'Undo', onClick: handler }]} />);
    await user.click(screen.getByRole('button', { name: 'Show' }));
    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(handler).toHaveBeenCalledOnce();
  });

  it('dismissAll removes all toasts', async () => {
    const user = userEvent.setup();
    renderWithProvider(
      <>
        <Trigger duration={0} />
        <DismissAllTrigger />
      </>,
    );
    await user.click(screen.getByRole('button', { name: 'Show' }));
    await user.click(screen.getByRole('button', { name: 'Show' }));
    // Only the front card has role="status"
    expect(screen.getAllByRole('status')).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: 'Dismiss all' }));
    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
  });
});

// ─── Provider guard ───────────────────────────────────────────────────────────

describe('Toast — useToast guard', () => {
  it('throws when used outside ToastProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    function Bare() { useToast(); return null; }
    expect(() => render(<Bare />)).toThrow('useToast must be used inside <ToastProvider>');
    consoleError.mockRestore();
  });
});
