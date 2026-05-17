import './Divider.css';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DividerOrientation = 'horizontal' | 'vertical';

export interface DividerProps {
  /** @default 'horizontal' */
  orientation?: DividerOrientation;
  /** White-palette variant for dark or gradient backgrounds */
  propStatic?: boolean;
  /** Additional className forwarded to the root element */
  className?: string;
}

// ─── Divider ──────────────────────────────────────────────────────────────────

export function Divider({
  orientation = 'horizontal',
  propStatic = false,
  className,
}: DividerProps) {
  const classes = [
    'sds-divider',
    orientation === 'vertical' && 'sds-divider--vertical',
    propStatic && 'sds-divider--static',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={classes}
    />
  );
}
