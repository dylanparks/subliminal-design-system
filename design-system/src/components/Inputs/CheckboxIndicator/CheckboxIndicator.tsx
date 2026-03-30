import './CheckboxIndicator.css';
import { CheckIcon, RemoveIcon } from '../../../icons';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CheckboxIndicatorSize = 'medium' | 'large';

export interface CheckboxIndicatorProps {
  /** Whether the indicator is in the checked (selected) state */
  checked?: boolean;
  /**
   * Whether the indicator is in the indeterminate state.
   * Takes visual precedence over `checked` when both are true.
   */
  indeterminate?: boolean;
  /** Visual size of the indicator. @default 'large' */
  size?: CheckboxIndicatorSize;
  /**
   * Inverts the color scheme for use on media/image backgrounds.
   * @default false
   */
  onMedia?: boolean;
  /** Renders the disabled visual appearance */
  disabled?: boolean;
  /** Additional className forwarded to the indicator element */
  className?: string;
}

// ─── CheckboxIndicator ────────────────────────────────────────────────────────

/**
 * A purely visual checkbox tick-box indicator.
 * Always rendered `aria-hidden` — the accessible state is communicated
 * by the containing interactive element (native `<input>` or `aria-checked`).
 *
 * Interactive states (hover, focus ring, pressed) are driven by CSS selectors
 * from the parent component (Checkbox, MenuItem, etc.).
 */
export function CheckboxIndicator({
  checked = false,
  indeterminate = false,
  size = 'large',
  onMedia = false,
  disabled = false,
  className,
}: CheckboxIndicatorProps) {
  const isFilled = checked || indeterminate;

  const classes = [
    'sds-checkbox-indicator',
    size === 'medium'    && 'sds-checkbox-indicator--medium',
    checked              && 'sds-checkbox-indicator--checked',
    indeterminate        && 'sds-checkbox-indicator--indeterminate',
    onMedia              && 'sds-checkbox-indicator--on-media',
    disabled             && 'sds-checkbox-indicator--disabled',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes} aria-hidden="true">
      {isFilled && (
        <span className="sds-checkbox-indicator__icon">
          {indeterminate ? <RemoveIcon size={16} /> : <CheckIcon size={16} />}
        </span>
      )}
    </span>
  );
}
