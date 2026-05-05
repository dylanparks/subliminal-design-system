import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Breadcrumbs } from './Breadcrumbs';
import type { BreadcrumbItem } from './Breadcrumbs';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const threeItems: BreadcrumbItem[] = [
  { label: 'Home',     href: '/' },
  { label: 'Products', href: '/products' },
  { label: 'Current Page' },
];

const manyItems: BreadcrumbItem[] = [
  { label: 'Home',        href: '/' },
  { label: 'Shop',        href: '/shop' },
  { label: 'Electronics', href: '/shop/electronics' },
  { label: 'Phones',      href: '/shop/electronics/phones' },
  { label: 'Smartphones', href: '/shop/electronics/phones/smartphones' },
  { label: 'Current Page' },
];

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('Breadcrumbs — rendering', () => {
  it('renders a nav landmark with the default accessible name', () => {
    render(<Breadcrumbs items={threeItems} />);
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
  });

  it('accepts a custom aria-label', () => {
    render(<Breadcrumbs items={threeItems} aria-label="Site path" />);
    expect(screen.getByRole('navigation', { name: 'Site path' })).toBeInTheDocument();
  });

  it('renders ancestor links as <a> elements', () => {
    render(<Breadcrumbs items={threeItems} />);
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Products' })).toHaveAttribute('href', '/products');
  });

  it('marks the last item as current page with aria-current', () => {
    render(<Breadcrumbs items={threeItems} />);
    const current = screen.getByText('Current Page');
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current.tagName).toBe('SPAN');
  });

  it('renders onClick-only items as buttons', () => {
    const items: BreadcrumbItem[] = [
      { label: 'Home', onClick: vi.fn() },
      { label: 'Current Page' },
    ];
    render(<Breadcrumbs items={items} />);
    expect(screen.getByRole('button', { name: 'Home' })).toBeInTheDocument();
  });
});

// ─── Overflow ─────────────────────────────────────────────────────────────────

describe('Breadcrumbs — overflow', () => {
  it('does not show the overflow button when items ≤ maxItems', () => {
    render(<Breadcrumbs items={threeItems} maxItems={4} />);
    expect(screen.queryByRole('button', { name: 'Show hidden breadcrumbs' })).not.toBeInTheDocument();
  });

  it('shows the overflow button when items > maxItems', () => {
    render(<Breadcrumbs items={manyItems} maxItems={4} />);
    expect(screen.getByRole('button', { name: 'Show hidden breadcrumbs' })).toBeInTheDocument();
  });

  it('hides collapsed item labels from the page until overflow is opened', () => {
    render(<Breadcrumbs items={manyItems} maxItems={4} />);
    expect(screen.queryByText('Home')).not.toBeInTheDocument();
    expect(screen.queryByText('Shop')).not.toBeInTheDocument();
  });

  it('always shows the last two links and current page when collapsed', () => {
    render(<Breadcrumbs items={manyItems} maxItems={4} />);
    expect(screen.getByRole('link', { name: 'Phones' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Smartphones' })).toBeInTheDocument();
    expect(screen.getByText('Current Page')).toHaveAttribute('aria-current', 'page');
  });

  it('opens the overflow dropdown on button click', async () => {
    render(<Breadcrumbs items={manyItems} maxItems={4} />);
    await userEvent.click(screen.getByRole('button', { name: 'Show hidden breadcrumbs' }));
    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: 'Home' })).toBeVisible();
      expect(screen.getByRole('menuitem', { name: 'Shop' })).toBeVisible();
      expect(screen.getByRole('menuitem', { name: 'Electronics' })).toBeVisible();
    });
  });

  it('calls onClick for a collapsed item selected from the overflow menu', async () => {
    const onHomeClick = vi.fn();
    const items: BreadcrumbItem[] = [
      { label: 'Home',     href: '/',     onClick: onHomeClick },
      { label: 'Shop',     href: '/shop' },
      { label: 'Category', href: '/c' },
      { label: 'Sub',      href: '/c/s' },
      { label: 'Current Page' },
    ];
    render(<Breadcrumbs items={items} maxItems={3} />);
    await userEvent.click(screen.getByRole('button', { name: 'Show hidden breadcrumbs' }));
    await waitFor(() => screen.getByRole('menuitem', { name: 'Home' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Home' }));
    expect(onHomeClick).toHaveBeenCalledOnce();
  });
});
