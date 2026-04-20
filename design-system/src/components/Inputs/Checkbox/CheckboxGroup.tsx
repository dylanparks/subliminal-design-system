import { type ReactNode } from 'react';
import './CheckboxGroup.css';
import { ErrorIcon } from '../../../icons';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CheckboxGroupSize = 'medium' | 'large';

export interface CheckboxGroupProps {
  /**
   * Open label slot. Accepts any non-interactive content — text, support labels,
   * contextual help, or custom inline layouts.
   */
  label?: ReactNode;
  /**
   * CheckboxItem children to render in the group.
   */
  children?: ReactNode;
  /** Whether the group is in an error state */
  error?: boolean;
  /** Validation message shown below the group when `error` is true */
  errorMessage?: string;
  /** Controls vertical gap between items. @default 'large' */
  size?: CheckboxGroupSize;
  /** Additional className forwarded to the root element */
  className?: string;
}

// ─── CheckboxGroup ────────────────────────────────────────────────────────────

/**
 * Layout container for multiple CheckboxItems.
 *
 * Provides an open label slot for group-level content (headings, descriptions,
 * contextual help, etc.) and optional error validation messaging. Size controls
 * the vertical gap between items.
 */
export function CheckboxGroup({
  label,
  children,
  error = false,
  errorMessage,
  size = 'large',
  className,
}: CheckboxGroupProps) {
  const rootClasses = [
    'sds-checkbox-group',
    size === 'medium' && 'sds-checkbox-group--medium',
    error             && 'sds-checkbox-group--error',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClasses} role="group">
      {label && (
        <div className="sds-checkbox-group__label-slot">
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
  );
}
