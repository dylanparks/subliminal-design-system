import { useEffect, useRef } from 'react';
import './Checkbox.css';
import { CheckboxIndicator } from '../CheckboxIndicator/CheckboxIndicator';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CheckboxSize = 'medium' | 'large';

export interface CheckboxProps {
  /** Label text displayed next to the indicator */
  label: string;
  /** Optional description rendered below the label */
  description?: string;
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
  /** Visual size. @default 'large' */
  size?: CheckboxSize;
  /** Forwarded to the underlying `<input>` element */
  id?: string;
  /** Forwarded to the underlying `<input>` element (for form submission) */
  name?: string;
  /** Forwarded to the underlying `<input>` element (for form submission) */
  value?: string;
  /** Additional className forwarded to the root `<label>` element */
  className?: string;
}

// ─── Checkbox ─────────────────────────────────────────────────────────────────

/**
 * A labelled checkbox input.
 *
 * Renders a native `<input type="checkbox">` (visually hidden) paired with
 * a `<CheckboxIndicator>` and text content. The native input ensures full
 * keyboard accessibility, form participation, and correct screen-reader
 * announcements without any ARIA boilerplate.
 */
export function Checkbox({
  label,
  description,
  checked,
  indeterminate = false,
  onChange,
  disabled = false,
  size = 'large',
  id,
  name,
  value,
  className,
}: CheckboxProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // `indeterminate` is a DOM property, not an HTML attribute —
  // it must be set imperatively via a ref.
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate && !checked;
    }
  }, [indeterminate, checked]);

  const rootClasses = [
    'sds-checkbox',
    size === 'medium'   && 'sds-checkbox--medium',
    disabled            && 'sds-checkbox--disabled',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <label className={rootClasses}>
      <input
        ref={inputRef}
        type="checkbox"
        className="sds-checkbox__input"
        id={id}
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
      />

      {/* Indicator is vertically padded to align with the label text baseline */}
      <span className="sds-checkbox__indicator-wrap" aria-hidden="true">
        <CheckboxIndicator
          checked={checked}
          indeterminate={indeterminate}
          size={size}
          disabled={disabled}
        />
      </span>

      <span className="sds-checkbox__label-frame">
        <span className="sds-checkbox__label">{label}</span>
        {description && (
          <span className="sds-checkbox__description">{description}</span>
        )}
      </span>
    </label>
  );
}
