import { type ReactNode } from 'react';
import { Button } from '../../Actions/Button/Button';
import { CloseIcon, InfoIcon, SuccessIcon, WarningIcon, ErrorIcon } from '../../../icons';
import './Notification.css';

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationStatus = 'informational' | 'success' | 'warning' | 'error';
export type NotificationLayout = 'stacked' | 'inline';

export interface NotificationAction {
  label: string;
  onClick: () => void;
}

export interface NotificationProps {
  title: string;
  description?: string;
  status?: NotificationStatus;
  layout?: NotificationLayout;
  dismissable?: boolean;
  onDismiss?: () => void;
  /** Up to 2 actions — first renders filled, second renders hollow. */
  actions?: [NotificationAction] | [NotificationAction, NotificationAction];
  className?: string;
  /** Forwarded to the root element. */
  id?: string;
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_ICON: Record<NotificationStatus, ReactNode> = {
  informational: <InfoIcon size={20} />,
  success:       <SuccessIcon size={20} />,
  warning:       <WarningIcon size={20} />,
  error:         <ErrorIcon size={20} />,
};

// ─── Notification ─────────────────────────────────────────────────────────────

export function Notification({
  title,
  description,
  status      = 'informational',
  layout      = 'stacked',
  dismissable = false,
  onDismiss,
  actions,
  className,
  id,
}: NotificationProps) {
  const ariaRole = status === 'error' || status === 'warning' ? 'alert' : 'status';

  const classes = [
    'sds-notification',
    `sds-notification--${status}`,
    `sds-notification--${layout}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const actionButtons = actions && actions.length > 0 ? (
    <div className="sds-notification__actions">
      <Button
        variant="secondary"
        fillStyle="filled"
        size="small"
        label={actions[0].label}
        onClick={actions[0].onClick}
      />
      {actions[1] && (
        <Button
          variant="secondary"
          fillStyle="hollow"
          size="small"
          label={actions[1].label}
          onClick={actions[1].onClick}
        />
      )}
    </div>
  ) : null;

  return (
    <div id={id} role={ariaRole} aria-live={ariaRole === 'alert' ? 'assertive' : 'polite'} aria-atomic="true" className={classes}>
      <span className="sds-notification__icon" aria-hidden="true">
        {STATUS_ICON[status]}
      </span>

      <div className="sds-notification__body">
        <span className="sds-notification__title sds-text--subtitle-medium">{title}</span>
        {description && (
          <span className="sds-notification__description sds-text--body-content-medium">{description}</span>
        )}
        {layout === 'stacked' && actionButtons}
      </div>

      {layout === 'inline' && actionButtons}

      {dismissable && (
        <button
          type="button"
          className="sds-notification__dismiss"
          aria-label="Dismiss notification"
          onClick={onDismiss}
        >
          <CloseIcon size={20} />
        </button>
      )}
    </div>
  );
}
