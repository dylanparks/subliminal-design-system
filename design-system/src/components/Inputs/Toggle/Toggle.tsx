import { type ReactNode, useRef, useCallback, useState } from 'react';
import './Toggle.css';
import { ToggleIndicator } from '../InputIndicators/ToggleIndicator';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToggleSize = 'medium' | 'large';

export interface ToggleProps {
  /**
   * Primary label text. Renders with default SDS typography and error/disabled
   * styling. Ignored when `children` is provided.
   */
  label?: string;
  /**
   * Optional secondary description below the label.
   * Only rendered when `label` is used (not `children`).
   */
  description?: string;
  /**
   * Free content slot — overrides `label`/`description` when provided.
   * Accepts any non-interactive content: custom layouts, icons, rich text, etc.
   */
  children?: ReactNode;
  /**
   * Controlled on/off state.
   * Omit to use uncontrolled mode with `defaultChecked`.
   */
  checked?: boolean;
  /**
   * Initial on/off state for uncontrolled mode.
   * @default false
   */
  defaultChecked?: boolean;
  /** Called when the toggle is switched on or off */
  onChange?: (checked: boolean) => void;
  /** Prevents interaction */
  disabled?: boolean;
  /** Renders error styling on the indicator and label */
  error?: boolean;
  /**
   * Marks the toggle as required for form validation.
   * Forwarded to the underlying `<input>` element.
   */
  required?: boolean;
  /** Visual size. @default 'large' */
  size?: ToggleSize;
  /** Forwarded to the underlying `<input>` element */
  id?: string;
  /** Forwarded to the underlying `<input>` element (for form submission) */
  name?: string;
  /**
   * Value submitted with the form when the toggle is on.
   * @default 'on'
   */
  value?: string;
  /** Additional className forwarded to the root `<label>` element */
  className?: string;
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

/**
 * Toggle switch component — an on/off control with `role="switch"` semantics.
 *
 * Supports controlled (`checked` + `onChange`) and uncontrolled (`defaultChecked`)
 * modes. Uses a native `<input type="checkbox" role="switch">` for form
 * participation and screen-reader support.
 */
export function Toggle({
  label,
  description,
  children,
  checked,
  defaultChecked = false,
  onChange,
  disabled = false,
  error = false,
  required = false,
  size = 'large',
  id,
  name,
  value = 'on',
  className,
}: ToggleProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const labelRef = useRef<HTMLLabelElement>(null);

  const isControlled = checked !== undefined;
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const resolvedChecked = isControlled ? checked! : internalChecked;

  // Chrome applies :focus-visible to inputs on mouse click (unlike buttons).
  // Track mouse-initiated interactions so the CSS can suppress the focus ring.
  const handleMouseDown = useCallback(() => {
    const el = labelRef.current;
    if (!el) return;
    el.dataset.mouseFocus = 'true';
    setTimeout(() => { delete el.dataset.mouseFocus; }, 0);
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) setInternalChecked(e.target.checked);
    onChange?.(e.target.checked);
  }, [isControlled, onChange]);

  const rootClasses = [
    'sds-toggle',
    size === 'medium' && 'sds-toggle--medium',
    disabled          && 'sds-toggle--disabled',
    error             && 'sds-toggle--error',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <label
      ref={labelRef}
      className={rootClasses}
      onMouseDown={handleMouseDown}
    >
      <input
        ref={inputRef}
        type="checkbox"
        role="switch"
        className="sds-toggle__input"
        id={id}
        name={name}
        value={value}
        checked={resolvedChecked}
        disabled={disabled}
        required={required}
        aria-checked={resolvedChecked}
        onChange={handleChange}
      />

      <span className="sds-toggle__indicator-wrap" aria-hidden="true">
        <ToggleIndicator
          checked={resolvedChecked}
          size={size}
          disabled={disabled}
          error={error}
        />
      </span>

      {(children ?? label) && (
        <span className="sds-toggle__label-slot">
          {children ?? (
            <>
              <span className="sds-toggle__label">{label}</span>
              {description && (
                <span className="sds-toggle__description">{description}</span>
              )}
            </>
          )}
        </span>
      )}
    </label>
  );
}
