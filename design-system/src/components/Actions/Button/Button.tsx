import { type ReactNode, type MouseEventHandler } from 'react';
import './Button.css';

export type ButtonIntent = 'primary' | 'secondary' | 'media';
export type ButtonVariant = 'filled' | 'hollow';
export type ButtonSize = 'xsmall' | 'small' | 'medium' | 'large';

export interface ButtonProps {
  intent?: ButtonIntent;
  variant?: ButtonVariant;
  size?: ButtonSize;
  label?: string;
  showLabel?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  'aria-label'?: string;
}

export function Button({
  intent = 'primary',
  variant = 'filled',
  size = 'small',
  label,
  showLabel = true,
  icon,
  iconPosition = 'left',
  disabled = false,
  onClick,
  className,
  type = 'button',
  'aria-label': ariaLabel,
}: ButtonProps) {
  const intentClass =
    intent === 'media'
      ? `sds-button--media-${variant}`
      : `sds-button--${intent}-${variant}`;

  const classes = [
    'sds-button',
    `sds-button--${size}`,
    intentClass,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const hasIcon = Boolean(icon);
  const hasLabel = showLabel && Boolean(label);
  const iconOnly = hasIcon && !hasLabel;

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel ?? (iconOnly ? label : undefined)}
      aria-disabled={disabled || undefined}
    >
      {hasIcon && iconPosition === 'left' && (
        <span className="sds-button__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      {hasLabel && <span className="sds-button__label">{label}</span>}
      {hasIcon && iconPosition === 'right' && (
        <span className="sds-button__icon" aria-hidden="true">
          {icon}
        </span>
      )}
    </button>
  );
}
