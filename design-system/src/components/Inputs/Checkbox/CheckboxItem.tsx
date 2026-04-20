import { type ReactNode, useEffect, useRef, useCallback } from 'react';
import './CheckboxItem.css';
import { CheckboxIndicator } from './CheckboxIndicator';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CheckboxItemSize = 'medium' | 'large';

export interface CheckboxItemProps {
  /**
   * Free content slot rendered next to the indicator.
   * Intended for non-interactive content such as labels, descriptions,
   * icons, or any inline layout.
   */
  children?: ReactNode;
  /** Whether the checkbox is checked */
  checked: boolean;
  /**
   * Indeterminate state — visually shows a dash rather than a checkmark.
   * Takes visual precedence over `checked` when both are true.
   */
  indeterminate?: boolean;
  /** Called when the user toggles the checkbox */
  onChange?: (checked: boolean) => void;
  /** Prevents interaction */
  disabled?: boolean;
  /** Renders error styling on the indicator */
  error?: boolean;
  /** Visual size. @default 'large' */
  size?: CheckboxItemSize;
  /** Forwarded to the underlying `<input>` element */
  id?: string;
  /** Forwarded to the underlying `<input>` element (for form submission) */
  name?: string;
  /** Forwarded to the underlying `<input>` element (for form submission) */
  value?: string;
  /** Additional className forwarded to the root `<label>` element */
  className?: string;
}

// ─── CheckboxItem ─────────────────────────────────────────────────────────────

/**
 * Core checkbox component with an open content slot.
 *
 * The `children` prop is a free slot for any non-interactive content —
 * labels, descriptions, icons, or custom layouts. This mirrors the
 * Uber Base pattern and keeps the component unopinionated about text structure.
 *
 * Renders a native `<input type="checkbox">` (visually hidden) paired with
 * a `CheckboxIndicator`. The native input ensures full keyboard accessibility,
 * form participation, and correct screen-reader announcements.
 */
export function CheckboxItem({
  children,
  checked,
  indeterminate = false,
  onChange,
  disabled = false,
  error = false,
  size = 'large',
  id,
  name,
  value,
  className,
}: CheckboxItemProps) {
  const inputRef  = useRef<HTMLInputElement>(null);
  const labelRef  = useRef<HTMLLabelElement>(null);

  // Chrome applies :focus-visible to checkboxes on mouse click (unlike buttons).
  // Track mouse-initiated interactions so the CSS can suppress the focus ring.
  const handleMouseDown = useCallback(() => {
    const el = labelRef.current;
    if (!el) return;
    el.dataset.mouseFocus = 'true';
    setTimeout(() => { delete el.dataset.mouseFocus; }, 0);
  }, []);

  // `indeterminate` is a DOM property, not an HTML attribute —
  // it must be set imperatively via a ref.
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate && !checked;
    }
  }, [indeterminate, checked]);

  const selection = indeterminate && !checked
    ? 'indeterminate'
    : checked
      ? 'selected'
      : 'unselected';

  const rootClasses = [
    'sds-checkbox-item',
    size === 'medium' && 'sds-checkbox-item--medium',
    disabled          && 'sds-checkbox-item--disabled',
    error             && 'sds-checkbox-item--error',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <label ref={labelRef} className={rootClasses} onMouseDown={handleMouseDown}>
      <input
        ref={inputRef}
        type="checkbox"
        className="sds-checkbox-item__input"
        id={id}
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
      />

      <span className="sds-checkbox-item__indicator-wrap" aria-hidden="true">
        <CheckboxIndicator
          selection={selection}
          size={size}
          disabled={disabled}
          error={error}
        />
      </span>

      {children && (
        <span className="sds-checkbox-item__label-slot">
          {children}
        </span>
      )}
    </label>
  );
}
