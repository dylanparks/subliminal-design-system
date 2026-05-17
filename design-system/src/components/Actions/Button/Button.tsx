import { type ReactNode, type MouseEventHandler } from 'react';
import { Tooltip } from '../../Enhancers/Tooltip/Tooltip';
import './Button.css';

export type ButtonVariant = 'primary' | 'secondary' | 'static' | 'negative';
export type ButtonFillStyle = 'filled' | 'hollow' | 'ghost';
export type ButtonSize = 'xsmall' | 'small' | 'medium' | 'large';

export interface ButtonProps {
  variant?: ButtonVariant;
  fillStyle?: ButtonFillStyle;
  size?: ButtonSize;
  label?: string;
  showLabel?: boolean;
  icon?: ReactNode;
  iconPosition?: 'start' | 'end';
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  'aria-label'?: string;
  /**
   * Opt out of the automatic tooltip shown on icon-only buttons.
   * The tooltip uses `label` as its content. Has no effect when `showLabel` is true.
   */
  disableTooltip?: boolean;
}

export function Button({
  variant = 'primary',
  fillStyle = 'filled',
  size = 'small',
  label,
  showLabel = true,
  icon,
  iconPosition = 'start',
  disabled = false,
  onClick,
  className,
  type = 'button',
  'aria-label': ariaLabel,
  disableTooltip = false,
}: ButtonProps) {
  const hasIcon  = Boolean(icon);
  const hasLabel = showLabel && Boolean(label);
  const iconOnly = hasIcon && !hasLabel;

  const sizeTypographyClass: Record<ButtonSize, string> = {
    xsmall: 'sds-text--body-interactive-small',
    small:  'sds-text--body-interactive-medium',
    medium: 'sds-text--body-interactive-large',
    large:  'sds-text--body-interactive-huge',
  };

  const classes = [
    'sds-button',
    `sds-button--${size}`,
    `sds-button--${variant}-${fillStyle}`,
    sizeTypographyClass[size],
    iconOnly && 'sds-button--icon-only',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const btn = (
    <button
      type={type}
      className={classes}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel ?? (iconOnly ? label : undefined)}
      aria-disabled={disabled || undefined}
    >
      {hasIcon && iconPosition !== 'end' && (
        <span className="sds-button__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      {hasLabel && <span className="sds-button__label">{label}</span>}
      {hasIcon && iconPosition === 'end' && (
        <span className="sds-button__icon" aria-hidden="true">
          {icon}
        </span>
      )}
    </button>
  );

  if (iconOnly && label && !disableTooltip) {
    return <Tooltip content={label} disabled={disabled}>{btn}</Tooltip>;
  }

  return btn;
}
