import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ButtonGroup } from './ButtonGroup';

const items = [
  { value: 'day',   label: 'Day'   },
  { value: 'week',  label: 'Week'  },
  { value: 'month', label: 'Month' },
];

describe('ButtonGroup', () => {
  // ─── Rendering ───────────────────────────────────────────────────────────────

  it('renders all items', () => {
    render(<ButtonGroup items={items} aria-label="View" />);
    expect(screen.getByText('Day')).toBeInTheDocument();
    expect(screen.getByText('Week')).toBeInTheDocument();
    expect(screen.getByText('Month')).toBeInTheDocument();
  });

  it('renders as a radiogroup in single mode', () => {
    render(<ButtonGroup items={items} mode="single" aria-label="View" />);
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
  });

  it('renders as a group in multi mode', () => {
    render(<ButtonGroup items={items} mode="multi" aria-label="Format" />);
    expect(screen.getByRole('group')).toBeInTheDocument();
  });

  it('applies aria-label to the container', () => {
    render(<ButtonGroup items={items} aria-label="Time range" />);
    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-label', 'Time range');
  });

  // ─── CSS classes ─────────────────────────────────────────────────────────────

  it('applies the base sds-button-group class', () => {
    const { container } = render(<ButtonGroup items={items} aria-label="View" />);
    expect(container.firstChild).toHaveClass('sds-button-group');
  });

  it('defaults to small size class', () => {
    const { container } = render(<ButtonGroup items={items} aria-label="View" />);
    expect(container.firstChild).toHaveClass('sds-button-group--small');
  });

  it.each([
    ['xsmall', 'sds-button-group--xsmall'],
    ['small',  'sds-button-group--small'],
    ['medium', 'sds-button-group--medium'],
    ['large',  'sds-button-group--large'],
  ] as const)('applies %s size class', (size, expectedClass) => {
    const { container } = render(<ButtonGroup items={items} size={size} aria-label="View" />);
    expect(container.firstChild).toHaveClass(expectedClass);
  });

  it('applies additional className', () => {
    const { container } = render(<ButtonGroup items={items} className="my-group" aria-label="View" />);
    expect(container.firstChild).toHaveClass('my-group');
  });

  // ─── Roles and ARIA ──────────────────────────────────────────────────────────

  it('items have role="radio" in single mode', () => {
    render(<ButtonGroup items={items} mode="single" aria-label="View" />);
    expect(screen.getAllByRole('radio')).toHaveLength(3);
  });

  it('items have role="checkbox" in multi mode', () => {
    render(<ButtonGroup items={items} mode="multi" aria-label="Format" />);
    expect(screen.getAllByRole('checkbox')).toHaveLength(3);
  });

  it('uses item.value as aria-label for icon-only items', () => {
    const iconItems = [{ value: 'bold', icon: <svg data-testid="icon" /> }];
    render(<ButtonGroup items={iconItems} mode="single" aria-label="Format" />);
    expect(screen.getByRole('radio', { name: 'bold' })).toBeInTheDocument();
  });

  it('does not set aria-disabled when item is not disabled', () => {
    render(<ButtonGroup items={items} aria-label="View" />);
    expect(screen.getByRole('radio', { name: 'Day' })).not.toHaveAttribute('aria-disabled');
  });

  it('sets aria-disabled when item is disabled', () => {
    const disabledItems = [{ value: 'day', label: 'Day', disabled: true }];
    render(<ButtonGroup items={disabledItems} mode="single" aria-label="View" />);
    expect(screen.getByRole('radio', { name: 'Day' })).toHaveAttribute('aria-disabled', 'true');
  });

  // ─── Selection — uncontrolled ─────────────────────────────────────────────

  it('marks the defaultValue item as checked', () => {
    render(<ButtonGroup items={items} mode="single" defaultValue={['week']} aria-label="View" />);
    expect(screen.getByRole('radio', { name: 'Week'  })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'Day'   })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('radio', { name: 'Month' })).toHaveAttribute('aria-checked', 'false');
  });

  it('selects an item on click (single mode)', async () => {
    const user = userEvent.setup();
    render(<ButtonGroup items={items} mode="single" aria-label="View" />);
    await user.click(screen.getByRole('radio', { name: 'Week' }));
    expect(screen.getByRole('radio', { name: 'Week' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'Day'  })).toHaveAttribute('aria-checked', 'false');
  });

  it('replaces selection when a different item is clicked (single mode)', async () => {
    const user = userEvent.setup();
    render(<ButtonGroup items={items} mode="single" defaultValue={['day']} aria-label="View" />);
    await user.click(screen.getByRole('radio', { name: 'Week' }));
    expect(screen.getByRole('radio', { name: 'Week' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'Day'  })).toHaveAttribute('aria-checked', 'false');
  });

  it('adds multiple selections on click (multi mode)', async () => {
    const user = userEvent.setup();
    render(<ButtonGroup items={items} mode="multi" aria-label="Format" />);
    await user.click(screen.getByRole('checkbox', { name: 'Day'  }));
    await user.click(screen.getByRole('checkbox', { name: 'Week' }));
    expect(screen.getByRole('checkbox', { name: 'Day'   })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('checkbox', { name: 'Week'  })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('checkbox', { name: 'Month' })).toHaveAttribute('aria-checked', 'false');
  });

  it('deselects an active item on click (multi mode)', async () => {
    const user = userEvent.setup();
    render(<ButtonGroup items={items} mode="multi" defaultValue={['day']} aria-label="Format" />);
    await user.click(screen.getByRole('checkbox', { name: 'Day' }));
    expect(screen.getByRole('checkbox', { name: 'Day' })).toHaveAttribute('aria-checked', 'false');
  });

  // ─── Selection — controlled ───────────────────────────────────────────────

  it('respects controlled value', () => {
    render(<ButtonGroup items={items} mode="single" value={['month']} aria-label="View" />);
    expect(screen.getByRole('radio', { name: 'Month' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'Day'   })).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onChange when an item is clicked', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<ButtonGroup items={items} mode="single" onChange={handleChange} aria-label="View" />);
    await user.click(screen.getByRole('radio', { name: 'Day' }));
    expect(handleChange).toHaveBeenCalledWith(['day']);
  });

  it('calls onChange with updated array in multi mode', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <ButtonGroup
        items={items}
        mode="multi"
        defaultValue={['day']}
        onChange={handleChange}
        aria-label="Format"
      />
    );
    await user.click(screen.getByRole('checkbox', { name: 'Week' }));
    expect(handleChange).toHaveBeenCalledWith(['day', 'week']);
  });

  it('calls onChange with removed item in multi mode', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <ButtonGroup
        items={items}
        mode="multi"
        defaultValue={['day', 'week']}
        onChange={handleChange}
        aria-label="Format"
      />
    );
    await user.click(screen.getByRole('checkbox', { name: 'Day' }));
    expect(handleChange).toHaveBeenCalledWith(['week']);
  });

  // ─── Disabled items ───────────────────────────────────────────────────────

  it('disables items with the disabled prop', () => {
    const disabledItems = [
      { value: 'day',   label: 'Day'  },
      { value: 'week',  label: 'Week', disabled: true },
      { value: 'month', label: 'Month' },
    ];
    render(<ButtonGroup items={disabledItems} mode="single" aria-label="View" />);
    expect(screen.getByRole('radio', { name: 'Week' })).toBeDisabled();
    expect(screen.getByRole('radio', { name: 'Day'  })).not.toBeDisabled();
  });

  it('does not call onChange when a disabled item is clicked', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    const disabledItems = [{ value: 'day', label: 'Day', disabled: true }];
    render(<ButtonGroup items={disabledItems} mode="single" onChange={handleChange} aria-label="View" />);
    await user.click(screen.getByRole('radio', { name: 'Day' }));
    expect(handleChange).not.toHaveBeenCalled();
  });

  // ─── Active CSS class ─────────────────────────────────────────────────────

  it('adds sds-button-group__item--active to selected items', async () => {
    const user = userEvent.setup();
    render(<ButtonGroup items={items} mode="single" aria-label="View" />);
    await user.click(screen.getByRole('radio', { name: 'Week' }));
    expect(screen.getByRole('radio', { name: 'Week' })).toHaveClass('sds-button-group__item--active');
  });

  it('removes sds-button-group__item--active from deselected items', async () => {
    const user = userEvent.setup();
    render(<ButtonGroup items={items} mode="single" defaultValue={['day']} aria-label="View" />);
    await user.click(screen.getByRole('radio', { name: 'Week' }));
    expect(screen.getByRole('radio', { name: 'Day'  })).not.toHaveClass('sds-button-group__item--active');
    expect(screen.getByRole('radio', { name: 'Week' })).toHaveClass('sds-button-group__item--active');
  });

  // ─── Roving tabindex (single mode) ───────────────────────────────────────

  it('first non-disabled item has tabIndex=0 when nothing selected', () => {
    render(<ButtonGroup items={items} mode="single" aria-label="View" />);
    const radios = screen.getAllByRole('radio');
    expect(radios[0]).toHaveAttribute('tabindex', '0');
    expect(radios[1]).toHaveAttribute('tabindex', '-1');
    expect(radios[2]).toHaveAttribute('tabindex', '-1');
  });

  it('selected item has tabIndex=0 in single mode', () => {
    render(<ButtonGroup items={items} mode="single" defaultValue={['week']} aria-label="View" />);
    const radios = screen.getAllByRole('radio');
    expect(radios[0]).toHaveAttribute('tabindex', '-1');
    expect(radios[1]).toHaveAttribute('tabindex', '0');
    expect(radios[2]).toHaveAttribute('tabindex', '-1');
  });

  it('all items have tabIndex=0 in multi mode', () => {
    render(<ButtonGroup items={items} mode="multi" aria-label="Format" />);
    screen.getAllByRole('checkbox').forEach((cb) => {
      expect(cb).toHaveAttribute('tabindex', '0');
    });
  });

  // ─── Keyboard navigation (single mode radiogroup) ─────────────────────────

  it('moves focus to the next item on ArrowRight', async () => {
    const user = userEvent.setup();
    render(<ButtonGroup items={items} mode="single" aria-label="View" />);
    const radios = screen.getAllByRole('radio');
    radios[0].focus();
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(radios[1]);
  });

  it('moves focus to the next item on ArrowDown', async () => {
    const user = userEvent.setup();
    render(<ButtonGroup items={items} mode="single" aria-label="View" />);
    const radios = screen.getAllByRole('radio');
    radios[0].focus();
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(radios[1]);
  });

  it('wraps focus from last to first on ArrowRight', async () => {
    const user = userEvent.setup();
    render(<ButtonGroup items={items} mode="single" aria-label="View" />);
    const radios = screen.getAllByRole('radio');
    radios[radios.length - 1].focus();
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(radios[0]);
  });

  it('moves focus to the previous item on ArrowLeft', async () => {
    const user = userEvent.setup();
    render(<ButtonGroup items={items} mode="single" aria-label="View" />);
    const radios = screen.getAllByRole('radio');
    radios[1].focus();
    await user.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(radios[0]);
  });

  it('moves focus to the previous item on ArrowUp', async () => {
    const user = userEvent.setup();
    render(<ButtonGroup items={items} mode="single" aria-label="View" />);
    const radios = screen.getAllByRole('radio');
    radios[1].focus();
    await user.keyboard('{ArrowUp}');
    expect(document.activeElement).toBe(radios[0]);
  });

  it('wraps focus from first to last on ArrowLeft', async () => {
    const user = userEvent.setup();
    render(<ButtonGroup items={items} mode="single" aria-label="View" />);
    const radios = screen.getAllByRole('radio');
    radios[0].focus();
    await user.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(radios[radios.length - 1]);
  });

  it('skips disabled items during keyboard navigation', async () => {
    const user = userEvent.setup();
    const mixedItems = [
      { value: 'day',   label: 'Day'   },
      { value: 'week',  label: 'Week',  disabled: true },
      { value: 'month', label: 'Month' },
    ];
    render(<ButtonGroup items={mixedItems} mode="single" aria-label="View" />);
    const radios = screen.getAllByRole('radio');
    radios[0].focus();
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(radios[2]);
  });

  it('does not use arrow key navigation in multi mode', async () => {
    const user = userEvent.setup();
    render(<ButtonGroup items={items} mode="multi" aria-label="Format" />);
    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes[0].focus();
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(checkboxes[0]);
  });

  // ─── Icon support ─────────────────────────────────────────────────────────

  it('renders icon alongside label', () => {
    const iconItems = [{ value: 'x', label: 'Bold', icon: <svg data-testid="icon" /> }];
    render(<ButtonGroup items={iconItems} aria-label="Format" />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByText('Bold')).toBeInTheDocument();
  });

  it('renders icon before label by default', () => {
    const iconItems = [{ value: 'x', label: 'Bold', icon: <svg data-testid="icon" /> }];
    render(<ButtonGroup items={iconItems} aria-label="Format" />);
    const btn = screen.getByRole('radio');
    const children = btn.querySelectorAll('.sds-button-group__icon, .sds-button-group__label');
    expect(children[0]).toHaveClass('sds-button-group__icon');
    expect(children[1]).toHaveClass('sds-button-group__label');
  });

  it('renders icon after label when iconPosition is right', () => {
    const iconItems = [{ value: 'x', label: 'Bold', icon: <svg data-testid="icon" />, iconPosition: 'right' as const }];
    render(<ButtonGroup items={iconItems} aria-label="Format" />);
    const btn = screen.getByRole('radio');
    const children = btn.querySelectorAll('.sds-button-group__icon, .sds-button-group__label');
    expect(children[0]).toHaveClass('sds-button-group__label');
    expect(children[1]).toHaveClass('sds-button-group__icon');
  });
});
