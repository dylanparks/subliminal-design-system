import { type ReactNode, useEffect, useRef, useCallback, useState } from 'react';
import './Checkbox.css';
import { CheckboxIndicator } from '../InputIndicators/CheckboxIndicator';
import { useCheckboxGroup } from './CheckboxGroup';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CheckboxSize = 'medium' | 'large';

export interface CheckboxProps {
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
   * Checked state (controlled mode).
   * Omit to use uncontrolled mode with `defaultChecked`, or let a parent
   * CheckboxGroup manage checked state via `value`.
   */
  checked?: boolean;
  /**
   * Initial checked state for uncontrolled mode.
   * Ignored when `checked` is provided or when inside a CheckboxGroup.
   * @default false
   */
  defaultChecked?: boolean;
  /**
   * Indeterminate state — visually shows a dash rather than a checkmark.
   * Takes visual precedence over `checked` when both are true.
   * Automatically computed when `parent` is used inside a CheckboxGroup with `allValues`.
   */
  indeterminate?: boolean;
  /** Called when the user toggles the checkbox */
  onChange?: (checked: boolean) => void;
  /**
   * Prevents interaction. When inside a CheckboxGroup, the group's `disabled`
   * prop takes precedence unless this is explicitly set to `false`.
   */
  disabled?: boolean;
  /** Renders error styling on the indicator and label */
  error?: boolean;
  /**
   * Marks this checkbox as required for form validation.
   * Forwarded to the underlying `<input>` element.
   */
  required?: boolean;
  /**
   * Designates this checkbox as a parent controller for a group.
   * Inside a CheckboxGroup with `allValues`, automatically derives checked and
   * indeterminate states and toggles all items on change.
   */
  parent?: boolean;
  /** Visual size. @default 'large' */
  size?: CheckboxSize;
  /** Forwarded to the underlying `<input>` element */
  id?: string;
  /** Forwarded to the underlying `<input>` element (for form submission) */
  name?: string;
  /**
   * Value submitted with the form when checked.
   * Inside a CheckboxGroup, identifies this item in the group's value array.
   */
  value?: string;
  /** Additional className forwarded to the root `<label>` element */
  className?: string;
}

// ─── Checkbox ─────────────────────────────────────────────────────────────────

/**
 * Core checkbox component with an open content slot.
 *
 * Supports standalone controlled/uncontrolled modes and group-managed mode when
 * rendered inside a CheckboxGroup. In group mode, `value` identifies the item
 * in the group's selected array; `parent` enables automatic select-all wiring.
 */
export function Checkbox({
  label,
  description,
  children,
  checked,
  defaultChecked = false,
  indeterminate = false,
  onChange,
  disabled,
  error = false,
  required = false,
  parent = false,
  size = 'large',
  id,
  name,
  value,
  className,
}: CheckboxProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const labelRef = useRef<HTMLLabelElement>(null);
  const group    = useCheckboxGroup();

  // ─── Group integration ───────────────────────────────────────────────────

  // Regular item managed by group value array
  const isGroupItem   = group !== null && value !== undefined && !parent;
  // Parent checkbox with auto-wiring from group's allValues
  const isGroupParent = group !== null && parent && group.allValues.length > 0;

  // ─── Disabled ────────────────────────────────────────────────────────────
  // Explicit prop wins; falls back to group-level disabled; then false.
  const resolvedDisabled = disabled ?? group?.groupDisabled ?? false;

  // ─── Checked state ───────────────────────────────────────────────────────

  const isControlled = checked !== undefined;
  const [internalChecked, setInternalChecked] = useState(defaultChecked);

  let resolvedChecked: boolean;
  if (isGroupParent) {
    resolvedChecked = group!.allValues.every((v) => group!.value.includes(v));
  } else if (isGroupItem) {
    resolvedChecked = group!.value.includes(value!);
  } else if (isControlled) {
    resolvedChecked = checked!;
  } else {
    resolvedChecked = internalChecked;
  }

  // ─── Indeterminate ───────────────────────────────────────────────────────

  const resolvedIndeterminate = isGroupParent
    ? !resolvedChecked && group!.allValues.some((v) => group!.value.includes(v))
    : indeterminate;

  // ─── Handlers ────────────────────────────────────────────────────────────

  // Chrome applies :focus-visible to checkboxes on mouse click (unlike buttons).
  // Track mouse-initiated interactions so the CSS can suppress the focus ring.
  const handleMouseDown = useCallback(() => {
    const el = labelRef.current;
    if (!el) return;
    el.dataset.mouseFocus = 'true';
    setTimeout(() => { delete el.dataset.mouseFocus; }, 0);
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (isGroupParent) {
      group!.onAllChange(e.target.checked);
    } else if (isGroupItem) {
      group!.onItemChange(value!, e.target.checked);
    } else {
      if (!isControlled) setInternalChecked(e.target.checked);
    }
    onChange?.(e.target.checked);
  }, [isGroupParent, isGroupItem, isControlled, value, group, onChange]);

  // `indeterminate` is a DOM property, not an HTML attribute —
  // it must be set imperatively via a ref.
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = resolvedIndeterminate && !resolvedChecked;
    }
  }, [resolvedIndeterminate, resolvedChecked]);

  // ─── Render ──────────────────────────────────────────────────────────────

  const selection = resolvedIndeterminate && !resolvedChecked
    ? 'indeterminate'
    : resolvedChecked
      ? 'selected'
      : 'unselected';

  const rootClasses = [
    'sds-checkbox',
    size === 'medium' && 'sds-checkbox--medium',
    resolvedDisabled  && 'sds-checkbox--disabled',
    error             && 'sds-checkbox--error',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <label
      ref={labelRef}
      className={rootClasses}
      onMouseDown={handleMouseDown}
      data-parent={parent || undefined}
    >
      <input
        ref={inputRef}
        type="checkbox"
        className="sds-checkbox__input"
        id={id}
        name={name}
        value={value}
        checked={resolvedChecked}
        disabled={resolvedDisabled}
        required={required}
        onChange={handleChange}
      />

      <span className="sds-checkbox__indicator-wrap" aria-hidden="true">
        <CheckboxIndicator
          selection={selection}
          size={size}
          disabled={resolvedDisabled}
          error={error}
        />
      </span>

      {(children ?? label) && (
        <span className="sds-checkbox__label-slot">
          {children ?? (
            <>
              <span className="sds-checkbox__label">{label}</span>
              {description && (
                <span className="sds-checkbox__description">{description}</span>
              )}
            </>
          )}
        </span>
      )}
    </label>
  );
}
