import { render, screen, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Tooltip } from './Tooltip';

vi.mock('@floating-ui/dom', () => ({
  computePosition: vi.fn(() =>
    Promise.resolve({ x: 0, y: 0, placement: 'top', middlewareData: { arrow: { x: 10 } } }),
  ),
  autoUpdate: vi.fn((_a, _b, update) => { update(); return () => {}; }),
  offset: vi.fn(),
  flip:   vi.fn(),
  shift:  vi.fn(),
  arrow:  vi.fn(),
}));

// Include rAF in fake timers so the visibility animation step fires
beforeEach(() =>
  vi.useFakeTimers({
    toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame'],
  }),
);
afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

function trigger() {
  return screen.getByRole('button');
}

describe('Tooltip', () => {
  // ─── Not shown by default ──────────────────────────────────────────────────

  it('does not render tooltip on initial mount', () => {
    render(
      <Tooltip content="Save document" delay={0}>
        <button type="button">Save</button>
      </Tooltip>
    );
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  // ─── Hover ────────────────────────────────────────────────────────────────

  it('shows tooltip after hover delay', async () => {
    render(
      <Tooltip content="Save document" delay={600}>
        <button type="button">Save</button>
      </Tooltip>
    );
    fireEvent.mouseEnter(trigger());
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(600));
    await act(async () => {}); // flush rAF + promise
    expect(screen.getByRole('tooltip')).toHaveTextContent('Save document');
  });

  it('does not open before delay elapses', () => {
    render(
      <Tooltip content="Save document" delay={600}>
        <button type="button">Save</button>
      </Tooltip>
    );
    fireEvent.mouseEnter(trigger());
    act(() => vi.advanceTimersByTime(300));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('cancels open when mouse leaves before delay', () => {
    render(
      <Tooltip content="Save document" delay={600}>
        <button type="button">Save</button>
      </Tooltip>
    );
    fireEvent.mouseEnter(trigger());
    act(() => vi.advanceTimersByTime(300));
    fireEvent.mouseLeave(trigger());
    act(() => vi.advanceTimersByTime(400));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('hides tooltip on mouse leave', async () => {
    render(
      <Tooltip content="Save document" delay={0}>
        <button type="button">Save</button>
      </Tooltip>
    );
    fireEvent.mouseEnter(trigger());
    act(() => vi.advanceTimersByTime(0));
    await act(async () => {});
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    fireEvent.mouseLeave(trigger());
    act(() => vi.advanceTimersByTime(120)); // exit duration
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  // ─── Focus ────────────────────────────────────────────────────────────────

  it('shows tooltip immediately on focus (no delay)', async () => {
    render(
      <Tooltip content="Save document" delay={600}>
        <button type="button">Save</button>
      </Tooltip>
    );
    fireEvent.focus(trigger());
    await act(async () => {});
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('hides tooltip on blur', async () => {
    render(
      <Tooltip content="Save document" delay={0}>
        <button type="button">Save</button>
      </Tooltip>
    );
    fireEvent.focus(trigger());
    await act(async () => {});
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    fireEvent.blur(trigger());
    act(() => vi.advanceTimersByTime(120));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  // ─── Escape ───────────────────────────────────────────────────────────────

  it('closes on Escape key', async () => {
    render(
      <Tooltip content="Save document" delay={0}>
        <button type="button">Save</button>
      </Tooltip>
    );
    fireEvent.focus(trigger());
    await act(async () => {});
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    fireEvent.keyDown(trigger(), { key: 'Escape' });
    act(() => vi.advanceTimersByTime(120));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  // ─── Disabled ─────────────────────────────────────────────────────────────

  it('never opens when disabled — hover', () => {
    render(
      <Tooltip content="Save document" delay={0} disabled>
        <button type="button">Save</button>
      </Tooltip>
    );
    fireEvent.mouseEnter(trigger());
    act(() => vi.advanceTimersByTime(600));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('never opens when disabled — focus', () => {
    render(
      <Tooltip content="Save document" delay={0} disabled>
        <button type="button">Save</button>
      </Tooltip>
    );
    fireEvent.focus(trigger());
    act(() => vi.advanceTimersByTime(0));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  // ─── aria-describedby ─────────────────────────────────────────────────────

  it('links trigger to tooltip via aria-describedby when open', async () => {
    render(
      <Tooltip content="Save document" delay={0}>
        <button type="button">Save</button>
      </Tooltip>
    );
    fireEvent.focus(trigger());
    await act(async () => {});
    const tooltip = screen.getByRole('tooltip');
    expect(trigger().getAttribute('aria-describedby')).toBe(tooltip.id);
  });

  it('removes aria-describedby after close', async () => {
    render(
      <Tooltip content="Save document" delay={0}>
        <button type="button">Save</button>
      </Tooltip>
    );
    fireEvent.focus(trigger());
    await act(async () => {});
    expect(trigger()).toHaveAttribute('aria-describedby');

    fireEvent.blur(trigger());
    act(() => vi.advanceTimersByTime(120));
    expect(trigger()).not.toHaveAttribute('aria-describedby');
  });

  // ─── Handler composition ──────────────────────────────────────────────────

  it('calls existing onFocus handler alongside tooltip logic', async () => {
    const onFocus = vi.fn();
    render(
      <Tooltip content="Save document" delay={0}>
        <button type="button" onFocus={onFocus}>Save</button>
      </Tooltip>
    );
    fireEvent.focus(trigger());
    await act(async () => {});
    expect(onFocus).toHaveBeenCalledOnce();
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('calls existing onMouseLeave handler alongside tooltip logic', async () => {
    const onMouseLeave = vi.fn();
    render(
      <Tooltip content="Save document" delay={0}>
        <button type="button" onMouseLeave={onMouseLeave}>Save</button>
      </Tooltip>
    );
    fireEvent.mouseEnter(trigger());
    act(() => vi.advanceTimersByTime(0));
    await act(async () => {});
    fireEvent.mouseLeave(trigger());
    expect(onMouseLeave).toHaveBeenCalledOnce();
  });
});
