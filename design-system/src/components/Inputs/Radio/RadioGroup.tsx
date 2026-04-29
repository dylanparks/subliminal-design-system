import { type ReactNode, useId, useState, createContext, useContext } from 'react';
import './RadioGroup.css';
import { ErrorIcon } from '../../../icons';

// ─── Context ──────────────────────────────────────────────────────────────────

export interface RadioGroupContextValue {
  /** Currently selected value in the group */
  value: string;
  /** Called when a radio item is selected */
  onRadioChange: (value: string) => void;
  /** Group-level disabled — cascades to all Radio items */
  groupDisabled: boolean;
  /** Shared name forwarded to all radio inputs for form participation */
  groupName: string | undefined;
  /** Required state forwarded to all radio inputs */
  groupRequired: boolean;
  /** ID of the label slot element, for aria-labelledby on the group root */
  labelId: string | undefined;
}

export const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

export function useRadioGroup(): RadioGroupContextValue | null {
  return useContext(RadioGroupContext);
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type RadioGroupSize = 'medium' | 'large';

export interface RadioGroupProps {
  /**
   * Open label slot. Accepts any content — text, descriptions, hint icons,
   * tooltip triggers, contextual help buttons, or custom inline layouts.
   * The slot receives an `id` and is wired to the group root via `aria-labelledby`.
   */
  label?: ReactNode;
  /** Radio children to render in the group */
  children?: ReactNode;
  /**
   * Controlled selected value — the `value` string of the selected Radio.
   * Omit to use uncontrolled mode with `defaultValue`.
   */
  value?: string;
  /**
   * Initial selected value for uncontrolled mode.
   * @default ''
   */
  defaultValue?: string;
  /** Called with the new value whenever a radio is selected */
  onValueChange?: (value: string) => void;
  /** Disables all Radio items in the group */
  disabled?: boolean;
  /**
   * Shared `name` attribute forwarded to all radio inputs.
   * Required for native HTML form submission. Auto-generated if omitted.
   */
  name?: string;
  /** Marks a selection as required for form validation */
  required?: boolean;
  /** Whether the group is in an error state */
  error?: boolean;
  /** Validation message shown below the group label when `error` is true */
  errorMessage?: string;
  /** Controls vertical gap between items. @default 'large' */
  size?: RadioGroupSize;
  /** Additional className forwarded to the root element */
  className?: string;
}

// ─── RadioGroup ───────────────────────────────────────────────────────────────

/**
 * Layout container and state manager for a set of Radio items.
 *
 * Owns the selected value — each Radio only needs a `value` prop to participate.
 * All radio inputs share the same `name` (provided or auto-generated) for native
 * browser grouping and form submission. Arrow-key navigation between radios is
 * handled automatically by the browser.
 */
export function RadioGroup({
  label,
  children,
  value: controlledValue,
  defaultValue = '',
  onValueChange,
  disabled = false,
  name,
  required = false,
  error = false,
  errorMessage,
  size = 'large',
  className,
}: RadioGroupProps) {
  const labelId   = useId();
  const autoName  = useId();

  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const resolvedValue = isControlled ? controlledValue! : internalValue;

  const onRadioChange = (val: string) => {
    if (!isControlled) setInternalValue(val);
    onValueChange?.(val);
  };

  const rootClasses = [
    'sds-radio-group',
    size === 'medium' && 'sds-radio-group--medium',
    error             && 'sds-radio-group--error',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <RadioGroupContext.Provider value={{
      value:        resolvedValue,
      onRadioChange,
      groupDisabled: disabled,
      groupName:    name ?? autoName,
      groupRequired: required,
      labelId:      label ? labelId : undefined,
    }}>
      <div
        className={rootClasses}
        role="radiogroup"
        aria-labelledby={label ? labelId : undefined}
        aria-required={required || undefined}
        aria-disabled={disabled || undefined}
      >
        {label && (
          <div id={labelId} className="sds-radio-group__label-slot">
            {label}
          </div>
        )}

        {error && errorMessage && (
          <div className="sds-radio-group__error-message" role="alert">
            <span className="sds-radio-group__error-icon" aria-hidden="true">
              <ErrorIcon size={16} />
            </span>
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="sds-radio-group__items">
          {children}
        </div>
      </div>
    </RadioGroupContext.Provider>
  );
}
