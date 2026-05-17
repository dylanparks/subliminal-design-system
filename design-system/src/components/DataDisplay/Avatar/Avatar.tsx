import { useEffect, useState } from 'react';
import './Avatar.css';
import { PersonIcon } from '../../../icons';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AvatarSize = 'small' | 'medium' | 'large';

export interface AvatarProps {
  /** Image source URL */
  src?: string;
  /** Full name — derives initials (first + last initial) and is the accessible label */
  name?: string;
  /** Explicit initials override — at most 2 characters are rendered */
  initials?: string;
  /**
   * Size variant.
   * - `small`  — 32 px
   * - `medium` — 48 px (default, matches Figma spec)
   * - `large`  — 64 px
   * @default 'medium'
   */
  size?: AvatarSize;
  /** Additional className forwarded to the root element */
  className?: string;
  /**
   * Accessible label for the avatar.
   * Defaults to `name`, then `'Avatar'` if neither is provided.
   * Pass `aria-hidden` instead when the avatar is purely decorative
   * inside a component that already provides a visible label.
   */
  'aria-label'?: string;
  /** Hides the avatar from assistive technology when purely decorative */
  'aria-hidden'?: true;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function deriveInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  if (words.length === 1) return words[0][0].toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

const ICON_SIZE: Record<AvatarSize, number> = { small: 16, medium: 24, large: 32 };

// ─── Avatar ───────────────────────────────────────────────────────────────────

export function Avatar({
  src,
  name,
  initials: initialsOverride,
  size = 'medium',
  className,
  'aria-label': ariaLabel,
  'aria-hidden': ariaHidden,
}: AvatarProps) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>(
    src ? 'loading' : 'error'
  );

  // Reset load state whenever src changes
  useEffect(() => {
    setStatus(src ? 'loading' : 'error');
  }, [src]);

  const resolvedInitials = (initialsOverride ?? (name ? deriveInitials(name) : '')).slice(0, 2);
  const hasInitials = resolvedInitials.length > 0;

  const rootClasses = [
    'sds-avatar',
    `sds-avatar--${size}`,
    hasInitials ? 'sds-avatar--gradient' : 'sds-avatar--neutral',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span
      className={rootClasses}
      role="img"
      aria-label={ariaLabel ?? name ?? 'Avatar'}
      aria-hidden={ariaHidden}
    >
      {/* Fallback — always rendered beneath the image */}
      <span className="sds-avatar__fallback" aria-hidden="true">
        {hasInitials ? (
          <span className={[
            'sds-avatar__initials',
            size === 'medium' && 'sds-text--body-interactive-small',
            size === 'large'  && 'sds-text--body-interactive-medium',
          ].filter(Boolean).join(' ')}>{resolvedInitials}</span>
        ) : (
          <PersonIcon size={ICON_SIZE[size]} className="sds-avatar__icon" />
        )}
      </span>

      {/* Photo — fades in when loaded, covers the fallback */}
      {src && (
        <img
          src={src}
          alt=""
          className={[
            'sds-avatar__image',
            status === 'loaded' && 'sds-avatar__image--visible',
          ]
            .filter(Boolean)
            .join(' ')}
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
        />
      )}
    </span>
  );
}
