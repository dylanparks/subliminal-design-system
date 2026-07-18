import type { ReactNode } from 'react';
import './StatusLight.css';

// ─── Types ────────────────────────────────────────────────────────────────────

export type StatusLightVariant =
  | 'default'
  | 'error'
  | 'success'
  | 'warning'
  | 'informative'
  | 'disabled';

export type StatusLightPosition =
  | 'top-start'
  | 'top-end'
  | 'bottom-start'
  | 'bottom-end';

export interface StatusLightProps {
  /** The element the status dot anchors to. */
  children:  ReactNode;
  /** Color of the status dot. @default 'default' */
  variant?:  StatusLightVariant;
  /** Corner at which to anchor the dot. @default 'bottom-end' */
  position?: StatusLightPosition;
  /** Accessible label for the dot (read by screen readers). */
  label?:    string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function StatusLight({
  children,
  variant  = 'default',
  position = 'bottom-end',
  label,
}: StatusLightProps) {
  return (
    <span className="sds-status-light">
      {children}
      <span
        className={[
          'sds-status-light__dot',
          `sds-status-light__dot--${variant}`,
          `sds-status-light__dot--${position}`,
        ].join(' ')}
        aria-label={label}
        role={label ? 'img' : undefined}
        aria-hidden={label ? undefined : true}
      />
    </span>
  );
}
