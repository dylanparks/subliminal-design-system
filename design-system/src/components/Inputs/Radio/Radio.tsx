import { type ReactNode, useRef, useCallback, useState } from 'react';
import './Radio.css';
import { RadioIndicator } from '../InputIndicators/RadioIndicator';
import { useRadioGroup } from './RadioGroup';

// ─── Types ────────────────────────────────────────────────────────────────────

export type RadioSize = 'medium' | 'large';

export interface RadioProps {
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
   * Checked state (controlled standalone mode).
   * Omit when inside a RadioGroup — the group manages selection via `value`.
   */
  checked?: boolean;
  /**
   * Initial checked state for standalone uncontrolled mode.
   * Ignored when `checked` is provided or when inside a RadioGroup.
   * @default false
   */
  defaultChecked?: boolean;
  /** Called when this radio is selected */
  onChange?: (checked: boolean) => void;
  /**
   * Prevents interaction. When inside a RadioGroup, the group's `disabled`
   * prop takes precedence unless this is explicitly set to `false`.
   */
  disabled?: boolean;
  /** Renders error styling on the indicator and label */
  error?: boolean;
  /**
   * Marks this radio as required for form validation.
   * Prefer setting `required` on the RadioGroup instead.
   */
  required?: boolean;
  /** Visual size. @default 'large' */
  size?: RadioSize;
  /** Forwarded to the underlying `<input>` element */
  id?: string;
  /**
   * `name` attribute for the underlying input. Shared automatically when inside
   * a RadioGroup — only set this for standalone use.
   */
  name?: string;
  /**
   * Identifies this radio within a RadioGroup's selected value.
   * Required when used inside a RadioGroup.
   */
  value?: string;
  /** Additional className forwarded to the root `<label>` element */
  className?: string;
}

// ─── Radio ────────────────────────────────────────────────────────────────────

/**
 * Core radio button component with an open content slot.
 *
 * Supports standalone controlled/uncontrolled modes and group-managed mode when
 * rendered inside a RadioGroup. In group mode, `value` identifies the item in
 * the group's selected value; arrow-key navigation between radios is handled
 * natively by the browser via the shared `name` attribute.
 */
export function Radio({
  label,
  description,
  children,
  checked,
  defaultChecked = false,
  onChange,
  disabled,
  error = false,
  required,
  size = 'large',
  id,
  name,
  value,
  className,
}: RadioProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const labelRef = useRef<HTMLLabelElement>(null);
  const group    = useRadioGroup();

  // ─── Group integration ───────────────────────────────────────────────────

  const isGroupItem = group !== null && value !== undefined;

  // ─── Disabled ────────────────────────────────────────────────────────────

  const resolvedDisabled  = disabled ?? group?.groupDisabled ?? false;
  const resolvedName      = name ?? group?.groupName;
  const resolvedRequired  = required ?? group?.groupRequired ?? false;

  // ─── Checked state ───────────────────────────────────────────────────────

  const isControlled = checked !== undefined;
  const [internalChecked, setInternalChecked] = useState(defaultChecked);

  let resolvedChecked: boolean;
  if (isGroupItem) {
    resolvedChecked = group!.value === value;
  } else if (isControlled) {
    resolvedChecked = checked!;
  } else {
    resolvedChecked = internalChecked;
  }

  // ─── Handlers ────────────────────────────────────────────────────────────

  // Chrome applies :focus-visible to inputs on mouse click (unlike buttons).
  // Track mouse-initiated interactions so the CSS can suppress the focus ring.
  const handleMouseDown = useCallback(() => {
    const el = labelRef.current;
    if (!el) return;
    el.dataset.mouseFocus = 'true';
    setTimeout(() => { delete el.dataset.mouseFocus; }, 0);
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.checked) return;
    if (isGroupItem) {
      group!.onRadioChange(value!);
    } else if (!isControlled) {
      setInternalChecked(true);
    }
    onChange?.(true);
  }, [isGroupItem, isControlled, value, group, onChange]);

  // ─── Render ──────────────────────────────────────────────────────────────

  const rootClasses = [
    'sds-radio',
    size === 'medium' && 'sds-radio--medium',
    resolvedDisabled  && 'sds-radio--disabled',
    error             && 'sds-radio--error',
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
        type="radio"
        className="sds-radio__input"
        id={id}
        name={resolvedName}
        value={value}
        checked={resolvedChecked}
        disabled={resolvedDisabled}
        required={resolvedRequired}
        onChange={handleChange}
      />

      <span className="sds-radio__indicator-wrap" aria-hidden="true">
        <RadioIndicator
          selected={resolvedChecked}
          size={size}
          disabled={resolvedDisabled}
          error={error}
        />
      </span>

      {(children ?? label) && (
        <span className="sds-radio__label-slot">
          {children ?? (
            <>
              <span className="sds-radio__label">{label}</span>
              {description && (
                <span className="sds-radio__description">{description}</span>
              )}
            </>
          )}
        </span>
      )}
    </label>
  );
}
