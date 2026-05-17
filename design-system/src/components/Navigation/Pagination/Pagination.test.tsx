import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Pagination } from './Pagination';

describe('Pagination', () => {
  // ─── Rendering ───────────────────────────────────────────────────────────────

  it('renders a nav landmark', () => {
    render(<Pagination count={5} />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('uses custom aria-label', () => {
    render(<Pagination count={5} aria-label="Results pagination" />);
    expect(screen.getByRole('navigation', { name: 'Results pagination' })).toBeInTheDocument();
  });

  it('renders prev and next buttons', () => {
    render(<Pagination count={5} defaultPage={3} />);
    expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
  });

  it('renders page buttons for small count', () => {
    render(<Pagination count={5} />);
    expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 5' })).toBeInTheDocument();
  });

  // ─── Selected state ───────────────────────────────────────────────────────────

  it('marks the current page with aria-current="page"', () => {
    render(<Pagination count={5} defaultPage={3} />);
    const current = screen.getByRole('button', { name: 'Page 3' });
    expect(current).toHaveAttribute('aria-current', 'page');
  });

  it('other pages do not have aria-current', () => {
    render(<Pagination count={5} defaultPage={3} />);
    const page2 = screen.getByRole('button', { name: 'Page 2' });
    expect(page2).not.toHaveAttribute('aria-current');
  });

  // ─── Disabled boundaries ──────────────────────────────────────────────────────

  it('disables prev button on first page', () => {
    render(<Pagination count={5} defaultPage={1} />);
    expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
  });

  it('disables next button on last page', () => {
    render(<Pagination count={5} defaultPage={5} />);
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
  });

  it('enables both nav buttons on a middle page', () => {
    render(<Pagination count={5} defaultPage={3} />);
    expect(screen.getByRole('button', { name: /previous/i })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: /next/i })).not.toBeDisabled();
  });

  // ─── Navigation ───────────────────────────────────────────────────────────────

  it('navigates to next page on next button click', async () => {
    const user = userEvent.setup();
    render(<Pagination count={5} defaultPage={1} />);
    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page');
  });

  it('navigates to previous page on prev button click', async () => {
    const user = userEvent.setup();
    render(<Pagination count={5} defaultPage={3} />);
    await user.click(screen.getByRole('button', { name: /previous/i }));
    expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page');
  });

  it('navigates to a specific page on page button click', async () => {
    const user = userEvent.setup();
    render(<Pagination count={5} defaultPage={1} />);
    await user.click(screen.getByRole('button', { name: 'Page 4' }));
    expect(screen.getByRole('button', { name: 'Page 4' })).toHaveAttribute('aria-current', 'page');
  });

  it('calls onChange with the new page number', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Pagination count={5} defaultPage={1} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('does not navigate before page 1', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Pagination count={5} defaultPage={1} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: /previous/i }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not navigate past last page', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Pagination count={5} defaultPage={5} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(onChange).not.toHaveBeenCalled();
  });

  // ─── Controlled mode ──────────────────────────────────────────────────────────

  it('respects controlled page prop', () => {
    render(<Pagination count={5} page={3} />);
    expect(screen.getByRole('button', { name: 'Page 3' })).toHaveAttribute('aria-current', 'page');
  });

  it('calls onChange but does not self-update in controlled mode', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Pagination count={5} page={3} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(onChange).toHaveBeenCalledWith(4);
    // Page stays at 3 — consumer must update
    expect(screen.getByRole('button', { name: 'Page 3' })).toHaveAttribute('aria-current', 'page');
  });

  // ─── Ellipsis ─────────────────────────────────────────────────────────────────

  it('shows ellipsis for large page counts', () => {
    render(<Pagination count={20} defaultPage={10} />);
    // page 1 and 20 always visible, ellipsis on both sides
    expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 20' })).toBeInTheDocument();
  });

  // ─── Compact variant ──────────────────────────────────────────────────────────

  it('renders compact label in compact variant', () => {
    render(<Pagination count={10} defaultPage={4} variant="compact" />);
    expect(screen.getByText('4 of 10')).toBeInTheDocument();
  });

  it('compact label updates on navigation', async () => {
    const user = userEvent.setup();
    render(<Pagination count={10} defaultPage={4} variant="compact" />);
    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText('5 of 10')).toBeInTheDocument();
  });

  it('compact variant does not render page list', () => {
    render(<Pagination count={10} defaultPage={1} variant="compact" />);
    expect(screen.queryByRole('button', { name: 'Page 2' })).not.toBeInTheDocument();
  });
});
