import React, { useRef, useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Menu, MenuItem, MenuDivider } from './Menu';

// ─── Test helpers ─────────────────────────────────────────────────────────────

/**
 * Renders a controlled Menu with a trigger button.
 * The trigger exposes aria-haspopup and aria-expanded as the consumer should.
 */
function renderMenu(props: Partial<Parameters<typeof Menu>[0]> = {}, items?: React.ReactNode) {
  function Wrapper() {
    const [open, setOpen] = useState(false);
    const anchorRef       = useRef<HTMLButtonElement>(null);

    return (
      <>
        <button
          ref={anchorRef}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen(v => !v)}
          data-testid="trigger"
        >
          Open
        </button>
        <Menu
          open={open}
          anchorEl={anchorRef.current}
          onClose={() => setOpen(false)}
          aria-label="Test menu"
          {...props}
        >
          {items ?? (
            <>
              <MenuItem>Alpha</MenuItem>
              <MenuItem>Beta</MenuItem>
              <MenuItem disabled>Gamma (disabled)</MenuItem>
              <MenuDivider />
              <MenuItem>Delta</MenuItem>
            </>
          )}
        </Menu>
      </>
    );
  }
  return render(<Wrapper />);
}

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('Menu — rendering', () => {
  it('does not render the menu list when closed', () => {
    renderMenu();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('renders the menu list when open is true', async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByTestId('trigger'));
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('renders menu items as menuitem roles', async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByTestId('trigger'));
    const items = screen.getAllByRole('menuitem');
    expect(items.length).toBeGreaterThanOrEqual(1);
  });

  it('renders a separator for MenuDivider', async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByTestId('trigger'));
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  it('applies the aria-label to the menu', async () => {
    const user = userEvent.setup();
    renderMenu({ 'aria-label': 'My options' });
    await user.click(screen.getByTestId('trigger'));
    expect(screen.getByRole('menu', { name: 'My options' })).toBeInTheDocument();
  });

  it('applies additional className to the menu list', async () => {
    const user = userEvent.setup();
    renderMenu({ className: 'custom-menu' });
    await user.click(screen.getByTestId('trigger'));
    expect(screen.getByRole('menu')).toHaveClass('custom-menu');
  });
});

// ─── MenuItem rendering ───────────────────────────────────────────────────────

describe('MenuItem — rendering', () => {
  it('renders children as the label', async () => {
    const user = userEvent.setup();
    renderMenu({}, <MenuItem>My option</MenuItem>);
    await user.click(screen.getByTestId('trigger'));
    expect(screen.getByText('My option')).toBeInTheDocument();
  });

  it('marks disabled items with aria-disabled', async () => {
    const user = userEvent.setup();
    renderMenu({}, <MenuItem disabled>Disabled</MenuItem>);
    await user.click(screen.getByTestId('trigger'));
    expect(screen.getByRole('menuitem', { name: 'Disabled' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('does not set aria-disabled on enabled items', async () => {
    const user = userEvent.setup();
    renderMenu({}, <MenuItem>Enabled</MenuItem>);
    await user.click(screen.getByTestId('trigger'));
    expect(screen.getByRole('menuitem', { name: 'Enabled' })).not.toHaveAttribute('aria-disabled');
  });

  it('applies sds-menu-item class', async () => {
    const user = userEvent.setup();
    renderMenu({}, <MenuItem>Item</MenuItem>);
    await user.click(screen.getByTestId('trigger'));
    expect(screen.getByRole('menuitem')).toHaveClass('sds-menu-item');
  });

  it('applies sds-menu-item--selected when selected is true', async () => {
    const user = userEvent.setup();
    renderMenu({}, <MenuItem selected>Selected item</MenuItem>);
    await user.click(screen.getByTestId('trigger'));
    expect(screen.getByRole('menuitem')).toHaveClass('sds-menu-item--selected');
  });

  it('applies sds-menu-item--disabled when disabled is true', async () => {
    const user = userEvent.setup();
    renderMenu({}, <MenuItem disabled>Disabled item</MenuItem>);
    await user.click(screen.getByTestId('trigger'));
    expect(screen.getByRole('menuitem')).toHaveClass('sds-menu-item--disabled');
  });

  it('applies additional className to the item', async () => {
    const user = userEvent.setup();
    renderMenu({}, <MenuItem className="my-item">Item</MenuItem>);
    await user.click(screen.getByTestId('trigger'));
    expect(screen.getByRole('menuitem')).toHaveClass('my-item');
  });
});

// ─── MultiSelect mode ─────────────────────────────────────────────────────────

describe('MenuItem — multiSelect mode', () => {
  it('uses menuitemcheckbox role in multiSelect mode', async () => {
    const user = userEvent.setup();
    renderMenu({ multiSelect: true }, <MenuItem>Option</MenuItem>);
    await user.click(screen.getByTestId('trigger'));
    expect(screen.getByRole('menuitemcheckbox', { name: 'Option' })).toBeInTheDocument();
  });

  it('sets aria-checked=true when selected in multiSelect mode', async () => {
    const user = userEvent.setup();
    renderMenu({ multiSelect: true }, <MenuItem selected>Option</MenuItem>);
    await user.click(screen.getByTestId('trigger'));
    expect(screen.getByRole('menuitemcheckbox')).toHaveAttribute('aria-checked', 'true');
  });

  it('sets aria-checked=false when not selected in multiSelect mode', async () => {
    const user = userEvent.setup();
    renderMenu({ multiSelect: true }, <MenuItem>Option</MenuItem>);
    await user.click(screen.getByTestId('trigger'));
    expect(screen.getByRole('menuitemcheckbox')).toHaveAttribute('aria-checked', 'false');
  });

  it('does not set aria-checked in single-select mode', async () => {
    const user = userEvent.setup();
    renderMenu({}, <MenuItem selected>Option</MenuItem>);
    await user.click(screen.getByTestId('trigger'));
    expect(screen.getByRole('menuitem')).not.toHaveAttribute('aria-checked');
  });
});

// ─── Suffix rendering ─────────────────────────────────────────────────────────

describe('MenuItem — suffix', () => {
  it('renders a tag suffix', async () => {
    const user = userEvent.setup();
    renderMenu({}, <MenuItem suffix={{ type: 'tag', label: '42' }}>Messages</MenuItem>);
    await user.click(screen.getByTestId('trigger'));
    expect(screen.getByText('42')).toBeInTheDocument();
    const item = screen.getByRole('menuitem');
    expect(within(item).getByText('42').closest('.sds-menu-item__suffix--tag')).toBeInTheDocument();
  });

  it('renders a text suffix', async () => {
    const user = userEvent.setup();
    renderMenu({}, <MenuItem suffix={{ type: 'text', label: '⌘K' }}>Search</MenuItem>);
    await user.click(screen.getByTestId('trigger'));
    expect(screen.getByText('⌘K')).toBeInTheDocument();
    const item = screen.getByRole('menuitem');
    expect(within(item).getByText('⌘K').closest('.sds-menu-item__suffix--text')).toBeInTheDocument();
  });

  it('renders an icon suffix', async () => {
    const user = userEvent.setup();
    renderMenu({}, <MenuItem suffix={{ type: 'icon' }}>Submenu</MenuItem>);
    await user.click(screen.getByTestId('trigger'));
    const item = screen.getByRole('menuitem');
    expect(item.querySelector('.sds-menu-item__suffix--icon')).toBeInTheDocument();
  });

  it('does not render a suffix when not provided', async () => {
    const user = userEvent.setup();
    renderMenu({}, <MenuItem>Plain item</MenuItem>);
    await user.click(screen.getByTestId('trigger'));
    expect(document.querySelector('.sds-menu-item__suffix')).not.toBeInTheDocument();
  });
});

// ─── Click / selection ────────────────────────────────────────────────────────

describe('MenuItem — click interaction', () => {
  it('calls onClick when an enabled item is clicked', async () => {
    const user    = userEvent.setup();
    const onClick = vi.fn();
    renderMenu({}, <MenuItem onClick={onClick}>Item</MenuItem>);
    await user.click(screen.getByTestId('trigger'));
    await user.click(screen.getByRole('menuitem', { name: 'Item' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when a disabled item is clicked', async () => {
    const user    = userEvent.setup();
    const onClick = vi.fn();
    renderMenu({}, <MenuItem onClick={onClick} disabled>Item</MenuItem>);
    await user.click(screen.getByTestId('trigger'));
    const item = screen.getByRole('menuitem');
    item.click(); // direct DOM click bypasses pointer-events:none
    expect(onClick).not.toHaveBeenCalled();
  });

  it('auto-closes the menu after a single-select item is clicked', async () => {
    const user = userEvent.setup();
    renderMenu({}, <MenuItem>Item</MenuItem>);
    await user.click(screen.getByTestId('trigger'));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await user.click(screen.getByRole('menuitem', { name: 'Item' }));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('does not auto-close the menu after a multiSelect item is clicked', async () => {
    const user = userEvent.setup();
    renderMenu({ multiSelect: true }, <MenuItem>Item</MenuItem>);
    await user.click(screen.getByTestId('trigger'));
    await user.click(screen.getByRole('menuitemcheckbox', { name: 'Item' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });
});

// ─── Keyboard navigation ──────────────────────────────────────────────────────

describe('Menu — keyboard navigation', () => {
  beforeEach(() => {
    // jsdom does not implement getBoundingClientRect, so stub it.
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      top: 100, bottom: 132, left: 50, right: 150,
      width: 100, height: 32, x: 50, y: 100, toJSON: () => ({}),
    });
  });

  it('focuses the first item when the menu opens', async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByTestId('trigger'));
    const items = screen.getAllByRole('menuitem');
    // First non-disabled item should receive focus
    expect(items[0]).toHaveFocus();
  });

  it('moves focus to the next item on ArrowDown', async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByTestId('trigger'));
    const items = screen.getAllByRole('menuitem');
    items[0].focus();
    await user.keyboard('{ArrowDown}');
    expect(items[1]).toHaveFocus();
  });

  it('moves focus to the previous item on ArrowUp', async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByTestId('trigger'));
    const items = screen.getAllByRole('menuitem');
    items[1].focus();
    await user.keyboard('{ArrowUp}');
    expect(items[0]).toHaveFocus();
  });

  it('wraps focus from the last item to the first on ArrowDown', async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByTestId('trigger'));
    const items = screen.getAllByRole('menuitem');
    items[items.length - 1].focus();
    await user.keyboard('{ArrowDown}');
    expect(items[0]).toHaveFocus();
  });

  it('wraps focus from the first item to the last on ArrowUp', async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByTestId('trigger'));
    const items = screen.getAllByRole('menuitem');
    items[0].focus();
    await user.keyboard('{ArrowUp}');
    expect(items[items.length - 1]).toHaveFocus();
  });

  it('focuses the first item on Home', async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByTestId('trigger'));
    const items = screen.getAllByRole('menuitem');
    items[items.length - 1].focus();
    await user.keyboard('{Home}');
    expect(items[0]).toHaveFocus();
  });

  it('focuses the last item on End', async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByTestId('trigger'));
    const items = screen.getAllByRole('menuitem');
    items[0].focus();
    await user.keyboard('{End}');
    expect(items[items.length - 1]).toHaveFocus();
  });

  it('closes the menu on Escape', async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByTestId('trigger'));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('activates the focused item on Enter and auto-closes', async () => {
    const user    = userEvent.setup();
    const onClick = vi.fn();
    renderMenu({}, <MenuItem onClick={onClick}>Item</MenuItem>);
    await user.click(screen.getByTestId('trigger'));
    await user.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('activates the focused item on Space and auto-closes', async () => {
    const user    = userEvent.setup();
    const onClick = vi.fn();
    renderMenu({}, <MenuItem onClick={onClick}>Item</MenuItem>);
    await user.click(screen.getByTestId('trigger'));
    await user.keyboard(' ');
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('skips disabled items during arrow-key navigation', async () => {
    const user = userEvent.setup();
    renderMenu(
      {},
      <>
        <MenuItem>Alpha</MenuItem>
        <MenuItem disabled>Beta (disabled)</MenuItem>
        <MenuItem>Gamma</MenuItem>
      </>
    );
    await user.click(screen.getByTestId('trigger'));
    const items = screen.getAllByRole('menuitem');
    // "Alpha" is focused first; disabled items are not in the focusable query
    items[0].focus();
    await user.keyboard('{ArrowDown}');
    // Should skip "Beta (disabled)" and focus "Gamma"
    expect(items[2]).toHaveFocus();
  });
});

// ─── Focus management ─────────────────────────────────────────────────────────

describe('Menu — focus management', () => {
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      top: 100, bottom: 132, left: 50, right: 150,
      width: 100, height: 32, x: 50, y: 100, toJSON: () => ({}),
    });
  });

  it('returns focus to the trigger after Escape', async () => {
    const user = userEvent.setup();
    renderMenu();
    const trigger = screen.getByTestId('trigger');
    await user.click(trigger);
    await user.keyboard('{Escape}');
    expect(trigger).toHaveFocus();
  });
});

// ─── Backdrop / outside click ─────────────────────────────────────────────────

describe('Menu — backdrop', () => {
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      top: 100, bottom: 132, left: 50, right: 150,
      width: 100, height: 32, x: 50, y: 100, toJSON: () => ({}),
    });
  });

  it('renders a backdrop overlay when open', async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByTestId('trigger'));
    expect(document.querySelector('.sds-menu-backdrop')).toBeInTheDocument();
  });

  it('closes the menu when the backdrop is clicked', async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByTestId('trigger'));
    const backdrop = document.querySelector<HTMLElement>('.sds-menu-backdrop')!;
    await user.click(backdrop);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});

// ─── Accessibility ────────────────────────────────────────────────────────────

describe('Menu — accessibility', () => {
  it('has role="menu" on the list', async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByTestId('trigger'));
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('has role="menuitem" on items in single-select mode', async () => {
    const user = userEvent.setup();
    renderMenu({}, <MenuItem>Item</MenuItem>);
    await user.click(screen.getByTestId('trigger'));
    expect(screen.getByRole('menuitem')).toBeInTheDocument();
  });

  it('has role="menuitemcheckbox" on items in multiSelect mode', async () => {
    const user = userEvent.setup();
    renderMenu({ multiSelect: true }, <MenuItem>Item</MenuItem>);
    await user.click(screen.getByTestId('trigger'));
    expect(screen.getByRole('menuitemcheckbox')).toBeInTheDocument();
  });

  it('keeps items out of the tab order (tabIndex=-1)', async () => {
    const user = userEvent.setup();
    renderMenu({}, <MenuItem>Item</MenuItem>);
    await user.click(screen.getByTestId('trigger'));
    expect(screen.getByRole('menuitem')).toHaveAttribute('tabindex', '-1');
  });

  it('hides the backdrop from assistive technology', async () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      top: 100, bottom: 132, left: 50, right: 150,
      width: 100, height: 32, x: 50, y: 100, toJSON: () => ({}),
    });
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByTestId('trigger'));
    const backdrop = document.querySelector('.sds-menu-backdrop')!;
    expect(backdrop).toHaveAttribute('aria-hidden', 'true');
  });
});
