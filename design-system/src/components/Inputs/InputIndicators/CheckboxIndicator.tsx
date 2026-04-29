import './CheckboxIndicator.css';
import { CheckIcon, RemoveIcon } from '../../../icons';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CheckboxSelection = 'selected' | 'unselected' | 'indeterminate';
export type CheckboxIndicatorSize = 'medium' | 'large';

export interface CheckboxIndicatorProps {
  /**
   * Selection state of the indicator.
   * - `'selected'`      → filled background, checkmark icon
   * - `'unselected'`    → hollow background, no icon
   * - `'indeterminate'` → filled background, minus/dash icon
   * @default 'unselected'
   */
  selection?: CheckboxSelection;
  /** Visual size of the indicator. @default 'large' */
  size?: CheckboxIndicatorSize;
  /**
   * Inverts the color scheme for use on media/image backgrounds.
   * @default false
   */
  onMedia?: boolean;
  /** Renders the disabled visual appearance */
  disabled?: boolean;
  /** Renders the error visual appearance */
  error?: boolean;
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
  selection = 'unselected',
  size = 'large',
  onMedia = false,
  disabled = false,
  error = false,
  className,
}: CheckboxIndicatorProps) {
  const isChecked       = selection === 'selected';
  const isIndeterminate = selection === 'indeterminate';
  const isFilled        = isChecked || isIndeterminate;

  const classes = [
    'sds-checkbox-indicator',
    size === 'medium'  && 'sds-checkbox-indicator--medium',
    isChecked          && 'sds-checkbox-indicator--checked',
    isIndeterminate    && 'sds-checkbox-indicator--indeterminate',
    onMedia            && 'sds-checkbox-indicator--on-media',
    disabled           && 'sds-checkbox-indicator--disabled',
    error              && 'sds-checkbox-indicator--error',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes} aria-hidden="true">
      {isFilled && (
        <span className="sds-checkbox-indicator__icon">
          {isIndeterminate ? <RemoveIcon size={16} /> : <CheckIcon size={16} />}
        </span>
      )}
    </span>
  );
}
