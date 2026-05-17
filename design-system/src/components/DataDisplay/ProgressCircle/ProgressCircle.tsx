import './ProgressCircle.css';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProgressCircleSize = 'xsmall' | 'small' | 'medium' | 'large';

export interface ProgressCircleProps {
  /**
   * Current progress value. Pass `null` or omit for indeterminate (animated spinner).
   * Accepts values between `min` and `max`.
   */
  value?: number | null;
  /** @default 0 */
  min?: number;
  /** @default 100 */
  max?: number;
  /** @default 'small' */
  size?: ProgressCircleSize;
  /** White-palette variant for dark or gradient backgrounds */
  propStatic?: boolean;
  /** Accessible label — required for screen readers. Defaults to "Loading" when indeterminate. */
  'aria-label'?: string;
  /** Additional className forwarded to the root element */
  className?: string;
}

// ─── Size config ──────────────────────────────────────────────────────────────

const SIZE_CONFIG: Record<ProgressCircleSize, { dim: number; stroke: number }> = {
  xsmall: { dim: 16, stroke: 2 },
  small:  { dim: 24, stroke: 3 },
  medium: { dim: 40, stroke: 4 },
  large:  { dim: 64, stroke: 5 },
};

// ─── ProgressCircle ───────────────────────────────────────────────────────────

export function ProgressCircle({
  value,
  min = 0,
  max = 100,
  size = 'small',
  propStatic = false,
  'aria-label': ariaLabel,
  className,
}: ProgressCircleProps) {
  const isIndeterminate = value == null;
  const clamped         = isIndeterminate ? 0 : Math.min(Math.max(value, min), max);
  const percent         = isIndeterminate ? 0 : ((clamped - min) / (max - min)) * 100;

  const { dim, stroke } = SIZE_CONFIG[size];
  const center          = dim / 2;
  const r               = center - stroke / 2;

  const rootClasses = [
    'sds-progress-circle',
    `sds-progress-circle--${size}`,
    isIndeterminate && 'sds-progress-circle--indeterminate',
    propStatic      && 'sds-progress-circle--static',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={rootClasses}
      role="progressbar"
      aria-valuemin={isIndeterminate ? undefined : min}
      aria-valuemax={isIndeterminate ? undefined : max}
      aria-valuenow={isIndeterminate ? undefined : clamped}
      aria-valuetext={isIndeterminate ? 'Loading…' : `${Math.round(percent)}%`}
      aria-label={ariaLabel ?? (isIndeterminate ? 'Loading' : undefined)}
    >
      <svg
        className="sds-progress-circle__svg"
        width={dim}
        height={dim}
        viewBox={`0 0 ${dim} ${dim}`}
        aria-hidden="true"
        focusable="false"
      >
        <circle
          className="sds-progress-circle__track"
          cx={center}
          cy={center}
          r={r}
          fill="none"
          strokeWidth={stroke}
        />
        <circle
          className="sds-progress-circle__indicator"
          cx={center}
          cy={center}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={isIndeterminate ? undefined : `${percent} 100`}
        />
      </svg>
    </div>
  );
}
