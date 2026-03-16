import { type KeyboardEvent, type ReactNode, useRef, useState } from 'react';
import './ButtonGroup.css';

export type ButtonGroupMode = 'single' | 'multi';
export type ButtonGroupSize = 'xsmall' | 'small' | 'medium' | 'large';

export interface ButtonGroupItem {
  value: string;
  label?: string;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
}

export interface ButtonGroupProps {
  items: ButtonGroupItem[];
  mode?: ButtonGroupMode;
  size?: ButtonGroupSize;
  value?: string[];
  defaultValue?: string[];
  onChange?: (value: string[]) => void;
  className?: string;
  'aria-label'?: string;
}

export function ButtonGroup({
  items,
  mode = 'single',
  size = 'small',
  value: controlledValue,
  defaultValue = [],
  onChange,
  className,
  'aria-label': ariaLabel,
}: ButtonGroupProps) {
  const [internalValue, setInternalValue] = useState<string[]>(defaultValue);
  const selected = controlledValue ?? internalValue;

  // Refs array for roving tabindex keyboard navigation (single mode only).
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function handleSelect(itemValue: string) {
    let next: string[];
    if (mode === 'single') {
      next = [itemValue];
    } else {
      next = selected.includes(itemValue)
        ? selected.filter((v) => v !== itemValue)
        : [...selected, itemValue];
    }
    if (controlledValue === undefined) setInternalValue(next);
    onChange?.(next);
  }

  /**
   * WAI-ARIA radiogroup keyboard pattern (single mode only).
   * Arrow Right/Down → next enabled item; Arrow Left/Up → previous enabled item.
   * Focus wraps at both ends. Tab moves focus out of the group (native behaviour).
   */
  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (mode !== 'single') return;
    if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(e.key)) return;
    e.preventDefault();

    const currentIdx = itemRefs.current.indexOf(document.activeElement as HTMLButtonElement);
    if (currentIdx === -1) return;

    const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1;
    let next = currentIdx;
    do {
      next = (next + dir + items.length) % items.length;
    } while (items[next]?.disabled && next !== currentIdx);

    itemRefs.current[next]?.focus();
  }

  /**
   * Roving tabindex for single mode (WAI-ARIA radiogroup pattern):
   *   • The selected item has tabIndex=0; all others have tabIndex=-1.
   *   • If nothing is selected, the first non-disabled item gets tabIndex=0.
   * Multi mode: all items are individually tab-focusable (tabIndex=0).
   */
  function getTabIndex(item: ButtonGroupItem, index: number): number {
    if (item.disabled) return -1;
    if (mode === 'multi') return 0;
    const isActive = selected.includes(item.value);
    if (isActive) return 0;
    if (selected.length === 0 && items.findIndex((i) => !i.disabled) === index) return 0;
    return -1;
  }

  return (
    <div
      role={mode === 'single' ? 'radiogroup' : 'group'}
      aria-label={ariaLabel}
      className={['sds-button-group', `sds-button-group--${size}`, className]
        .filter(Boolean)
        .join(' ')}
      onKeyDown={handleKeyDown}
    >
      {items.map((item, index) => {
        const isActive = selected.includes(item.value);
        const hasLabel = Boolean(item.label);
        const hasIcon = Boolean(item.icon);

        return (
          <button
            key={item.value}
            ref={(el) => { itemRefs.current[index] = el; }}
            type="button"
            role={mode === 'single' ? 'radio' : 'checkbox'}
            aria-checked={isActive}
            aria-label={!hasLabel && hasIcon ? item.value : undefined}
            disabled={item.disabled}
            aria-disabled={item.disabled || undefined}
            tabIndex={getTabIndex(item, index)}
            className={[
              'sds-button-group__item',
              isActive && 'sds-button-group__item--active',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => handleSelect(item.value)}
          >
            {hasIcon && item.iconPosition !== 'right' && (
              <span className="sds-button-group__icon" aria-hidden="true">
                {item.icon}
              </span>
            )}
            {hasLabel && (
              <span className="sds-button-group__label">{item.label}</span>
            )}
            {hasIcon && item.iconPosition === 'right' && (
              <span className="sds-button-group__icon" aria-hidden="true">
                {item.icon}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
