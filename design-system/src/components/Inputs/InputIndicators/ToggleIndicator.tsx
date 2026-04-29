import './ToggleIndicator.css';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToggleIndicatorSize = 'medium' | 'large';

export interface ToggleIndicatorProps {
  /** Whether the toggle is on. @default false */
  checked?: boolean;
  /** Visual size. @default 'large' */
  size?: ToggleIndicatorSize;
  /**
   * Inverts the color scheme for use on media/image backgrounds.
   * @default false
   */
  onMedia?: boolean;
  /** Renders the disabled visual appearance */
  disabled?: boolean;
  /** Renders the error visual appearance */
  error?: boolean;
  /** Additional className forwarded to the track element */
  className?: string;
}

// ─── ToggleIndicator ──────────────────────────────────────────────────────────

/**
 * Purely visual toggle track and thumb.
 * Always rendered `aria-hidden` — accessible state is communicated by the
 * parent's native `<input type="checkbox" role="switch">`.
 *
 * Interactive states (hover, pressed, focus ring) are driven by CSS selectors
 * from the parent Toggle component's stylesheet.
 */
export function ToggleIndicator({
  checked = false,
  size = 'large',
  onMedia = false,
  disabled = false,
  error = false,
  className,
}: ToggleIndicatorProps) {
  const classes = [
    'sds-toggle-indicator',
    size === 'medium' && 'sds-toggle-indicator--medium',
    checked           && 'sds-toggle-indicator--checked',
    onMedia           && 'sds-toggle-indicator--on-media',
    disabled          && 'sds-toggle-indicator--disabled',
    error             && 'sds-toggle-indicator--error',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes} aria-hidden="true">
      <span className="sds-toggle-indicator__thumb" />
    </span>
  );
}
