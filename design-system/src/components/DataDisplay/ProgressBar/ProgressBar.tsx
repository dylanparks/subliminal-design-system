import './ProgressBar.css';
import { ErrorIcon, SuccessIcon } from '../../../icons';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProgressBarProps {
  /**
   * Current progress value. Pass `null` for indeterminate state (animated sweep).
   */
  value: number | null;
  /** @default 0 */
  min?: number;
  /** @default 100 */
  max?: number;
  /** Visible label above the bar */
  label?: string;
  /** Shows the numeric percentage to the right of the label */
  showValue?: boolean;
  /** Error state — red fill */
  error?: boolean;
  /** Success state — green fill */
  success?: boolean;
  /** Validation message shown below the bar (only visible when error or success) */
  validationMessage?: string;
  /** Accessible name for the progressbar — does not render visually */
  'aria-label'?: string;
  /** Additional className forwarded to the root element */
  className?: string;
}

// ─── ProgressBar ──────────────────────────────────────────────────────────────

export function ProgressBar({
  value,
  min = 0,
  max = 100,
  label,
  showValue = false,
  error = false,
  success = false,
  validationMessage,
  'aria-label': ariaLabel,
  className,
}: ProgressBarProps) {
  const isIndeterminate = value === null;
  const clamped         = isIndeterminate ? 0 : Math.min(Math.max(value, min), max);
  const percent         = isIndeterminate ? 0 : Math.round(((clamped - min) / (max - min)) * 100);

  const rootClasses = [
    'sds-progress-bar',
    error           && 'sds-progress-bar--error',
    success         && 'sds-progress-bar--success',
    isIndeterminate && 'sds-progress-bar--indeterminate',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const showValidation = (error || success) && !!validationMessage;

  return (
    <div
      className={rootClasses}
      role="progressbar"
      aria-valuemin={isIndeterminate ? undefined : min}
      aria-valuemax={isIndeterminate ? undefined : max}
      aria-valuenow={isIndeterminate ? undefined : clamped}
      aria-valuetext={isIndeterminate ? 'Loading…' : `${percent}%`}
      aria-label={ariaLabel ?? label}
    >
      {(label || showValue) && (
        <div className="sds-progress-bar__header">
          {label     && <span className="sds-progress-bar__label">{label}</span>}
          {showValue && !isIndeterminate && (
            <span className="sds-progress-bar__value">{percent}%</span>
          )}
          {showValue && isIndeterminate && (
            <span className="sds-progress-bar__value">Processing…</span>
          )}
        </div>
      )}

      <div className="sds-progress-bar__track">
        <div
          className="sds-progress-bar__fill"
          style={isIndeterminate ? undefined : { width: `${percent}%` }}
        />
      </div>

      {showValidation && (
        <div className="sds-progress-bar__message">
          {error   && <ErrorIcon   size={16} />}
          {success && <SuccessIcon size={16} />}
          <p className="sds-progress-bar__message-text">{validationMessage}</p>
        </div>
      )}
    </div>
  );
}
