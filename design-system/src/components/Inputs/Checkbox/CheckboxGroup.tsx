import { type ReactNode, useId, useState, createContext, useContext } from 'react';
import './CheckboxGroup.css';
import { ErrorIcon } from '../../../icons';

// ─── Context ──────────────────────────────────────────────────────────────────

export interface CheckboxGroupContextValue {
  /** Current selected values in the group */
  value: string[];
  /** Toggle a single item in/out of the group value */
  onItemChange: (itemValue: string, checked: boolean) => void;
  /** Select or deselect all items (for the parent checkbox) */
  onAllChange: (checked: boolean) => void;
  /** Group-level disabled — cascades to all CheckboxItems */
  groupDisabled: boolean;
  /** All item values — required for parent checkbox auto-wiring */
  allValues: string[];
  /** ID of the label slot element, forwarded as aria-labelledby on the group root */
  labelId: string | undefined;
}

export const CheckboxGroupContext = createContext<CheckboxGroupContextValue | null>(null);

export function useCheckboxGroup(): CheckboxGroupContextValue | null {
  return useContext(CheckboxGroupContext);
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type CheckboxGroupSize = 'medium' | 'large';

export interface CheckboxGroupProps {
  /**
   * Open label slot. Accepts any content — text, descriptions, hint icons,
   * tooltip triggers, contextual help buttons, or custom inline layouts.
   * The slot receives an `id` and is wired to the group root via `aria-labelledby`.
   */
  label?: ReactNode;
  /** CheckboxItem children to render in the group */
  children?: ReactNode;
  /**
   * Controlled selected values — array of CheckboxItem `value` strings.
   * Omit to use uncontrolled mode with `defaultValue`.
   */
  value?: string[];
  /**
   * Initial selected values for uncontrolled mode.
   * @default []
   */
  defaultValue?: string[];
  /** Called with the updated value array whenever any item is toggled */
  onValueChange?: (value: string[]) => void;
  /** Disables all CheckboxItems in the group */
  disabled?: boolean;
  /**
   * All item values in the group. Required to enable parent checkbox auto-wiring:
   * a CheckboxItem with `parent` inside this group will automatically derive its
   * checked and indeterminate states from this list.
   */
  allValues?: string[];
  /** Whether the group is in an error state */
  error?: boolean;
  /** Validation message shown below the group label when `error` is true */
  errorMessage?: string;
  /** Controls vertical gap between items. @default 'large' */
  size?: CheckboxGroupSize;
  /** Additional className forwarded to the root element */
  className?: string;
}

// ─── CheckboxGroup ────────────────────────────────────────────────────────────

/**
 * Layout container and state manager for a set of CheckboxItems.
 *
 * When `value` / `defaultValue` are provided, the group owns the checked state
 * for all items — each CheckboxItem only needs a `value` prop to participate.
 * `allValues` + a `parent` CheckboxItem enables automatic select-all / indeterminate
 * wiring with no extra logic required in the consumer.
 */
export function CheckboxGroup({
  label,
  children,
  value: controlledValue,
  defaultValue = [],
  onValueChange,
  disabled = false,
  allValues = [],
  error = false,
  errorMessage,
  size = 'large',
  className,
}: CheckboxGroupProps) {
  const labelId = useId();

  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState<string[]>(defaultValue);
  const resolvedValue = isControlled ? controlledValue! : internalValue;

  const onItemChange = (itemValue: string, checked: boolean) => {
    const next = checked
      ? [...resolvedValue, itemValue]
      : resolvedValue.filter((v) => v !== itemValue);
    if (!isControlled) setInternalValue(next);
    onValueChange?.(next);
  };

  const onAllChange = (checked: boolean) => {
    const next = checked ? [...allValues] : [];
    if (!isControlled) setInternalValue(next);
    onValueChange?.(next);
  };

  const rootClasses = [
    'sds-checkbox-group',
    size === 'medium' && 'sds-checkbox-group--medium',
    error             && 'sds-checkbox-group--error',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <CheckboxGroupContext.Provider value={{
      value:        resolvedValue,
      onItemChange,
      onAllChange,
      groupDisabled: disabled,
      allValues,
      labelId:      label ? labelId : undefined,
    }}>
      <div
        className={rootClasses}
        role="group"
        aria-labelledby={label ? labelId : undefined}
      >
        {label && (
          <div id={labelId} className="sds-checkbox-group__label-slot">
            {label}
          </div>
        )}

        {error && errorMessage && (
          <div className="sds-checkbox-group__error-message" role="alert">
            <span className="sds-checkbox-group__error-icon" aria-hidden="true">
              <ErrorIcon size={16} />
            </span>
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="sds-checkbox-group__items">
          {children}
        </div>
      </div>
    </CheckboxGroupContext.Provider>
  );
}
