import './Tag.css';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TagType      = 'primary' | 'neutral' | 'informational' | 'success' | 'warning' | 'error';
export type TagSize      = 'large' | 'small';
export type TagFillStyle = 'solid' | 'outline';

export interface TagProps {
  label: string;
  /** @default 'large' */
  size?: TagSize;
  /** @default 'solid' */
  fillStyle?: TagFillStyle;
  /** @default 'primary' */
  type?: TagType;
  /** Decorative icon — rendered at `iconPosition` side of the label */
  icon?: React.ReactNode;
  /** @default 'start' */
  iconPosition?: 'start' | 'end';
  /** On-media variant — white-on-translucent for use on dark backgrounds */
  isStatic?: boolean;
  role?: React.AriaRole;
  'aria-label'?: string;
  className?: string;
}

// ─── Tag ──────────────────────────────────────────────────────────────────────

export function Tag({
  label,
  size         = 'large',
  fillStyle    = 'solid',
  type         = 'primary',
  icon,
  iconPosition = 'start',
  isStatic     = false,
  role,
  'aria-label': ariaLabel,
  className,
}: TagProps) {
  const rootClasses = [
    'sds-tag',
    `sds-tag--${size}`,
    `sds-tag--${fillStyle}`,
    `sds-tag--${type}`,
    isStatic          && 'sds-tag--static',
    icon && iconPosition === 'start' && 'sds-tag--icon-start',
    icon && iconPosition === 'end'   && 'sds-tag--icon-end',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const iconNode = icon ? (
    <span className="sds-tag__icon" aria-hidden="true">{icon}</span>
  ) : null;

  return (
    <span className={rootClasses} role={role} aria-label={ariaLabel}>
      {icon && iconPosition === 'start' && iconNode}
      <span className="sds-tag__label">{label}</span>
      {icon && iconPosition === 'end' && iconNode}
    </span>
  );
}
