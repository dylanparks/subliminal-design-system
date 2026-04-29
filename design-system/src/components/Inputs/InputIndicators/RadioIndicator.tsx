import './RadioIndicator.css';

// ─── Types ────────────────────────────────────────────────────────────────────

export type RadioIndicatorSize = 'medium' | 'large';

export interface RadioIndicatorProps {
  /** Whether the radio is selected. @default false */
  selected?: boolean;
  /** Visual size of the indicator. @default 'large' */
  size?: RadioIndicatorSize;
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

// ─── RadioIndicator ───────────────────────────────────────────────────────────

/**
 * A purely visual radio indicator — circular outer ring with inner dot when selected.
 * Always rendered `aria-hidden` — the accessible state is communicated by the
 * containing native `<input type="radio">`.
 *
 * Interactive states (hover, focus ring, pressed) are driven by CSS selectors
 * from the parent component (Radio, etc.).
 */
export function RadioIndicator({
  selected = false,
  size = 'large',
  onMedia = false,
  disabled = false,
  error = false,
  className,
}: RadioIndicatorProps) {
  const classes = [
    'sds-radio-indicator',
    size === 'medium' && 'sds-radio-indicator--medium',
    selected          && 'sds-radio-indicator--selected',
    onMedia           && 'sds-radio-indicator--on-media',
    disabled          && 'sds-radio-indicator--disabled',
    error             && 'sds-radio-indicator--error',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <span className={classes} aria-hidden="true" />;
}
