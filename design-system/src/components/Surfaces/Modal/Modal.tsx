import { type ReactNode, useEffect, useRef, useId } from 'react';
import { Button } from '../../Actions/Button/Button';
import { CloseIcon } from '../../../icons';
import './Modal.css';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ModalAction {
  label: string;
  onClick: () => void;
}

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  primaryAction?: ModalAction;
  secondaryAction?: ModalAction;
  /**
   * Override slot for the action buttons area. When provided, renders instead of
   * the default primaryAction / secondaryAction buttons — use when you need custom
   * button variants, sizes, counts, or layout.
   */
  actions?: ReactNode;
  /** Image URL — enables the image-header variant. */
  imageSrc?: string;
  imageAlt?: string;
  /** CSS object-position for the header image (e.g. 'center top', '50% 20%'). Defaults to 'center'. */
  imagePosition?: string;
  size?: 'medium' | 'small';
  /** When false the X button, backdrop click, and ESC key are all disabled — use for forced confirmations. */
  dismissable?: boolean;
  className?: string;
  id?: string;
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  primaryAction,
  secondaryAction,
  actions,
  imageSrc,
  imageAlt = '',
  imagePosition = 'center',
  size = 'medium',
  dismissable = true,
  className,
  id,
}: ModalProps) {
  const dialogRef  = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const uid         = useId();
  const titleId     = `${uid}title`;
  const descId      = `${uid}desc`;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      returnFocus.current = document.activeElement as HTMLElement;
      if (!dialog.open) dialog.showModal();
      document.body.style.overflow = 'hidden';
    } else {
      if (dialog.open) dialog.close();
      document.body.style.overflow = '';
      returnFocus.current?.focus();
      returnFocus.current = null;
    }

    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const handleCancel = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (dismissable) onClose();
  };

  const handleDialogClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (dismissable && e.target === dialogRef.current) onClose();
  };

  const hasActions = Boolean(actions || primaryAction || secondaryAction);
  const isImageVariant = Boolean(imageSrc);

  const containerClasses = [
    'sds-modal',
    `sds-modal--${size}`,
    isImageVariant && 'sds-modal--image',
    className,
  ].filter(Boolean).join(' ');

  return (
    <dialog
      ref={dialogRef}
      id={id}
      className="sds-modal-dialog"
      aria-modal="true"
      onCancel={handleCancel}
      onClick={handleDialogClick}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
    >
      <div className={containerClasses}>

        {isImageVariant && imageSrc && (
          <div className="sds-modal__image-wrapper">
            <img src={imageSrc} alt={imageAlt} className="sds-modal__image" style={{ objectPosition: imagePosition }} />
            {dismissable && (
              <button
                type="button"
                className="sds-modal__dismiss sds-modal__dismiss--on-image"
                aria-label="Close modal"
                onClick={onClose}
              >
                <CloseIcon size={20} />
              </button>
            )}
          </div>
        )}

        <div className="sds-modal__inner">
          <div className="sds-modal__header">
            <div className="sds-modal__heading">
              <p id={titleId} className="sds-modal__title sds-text--title-xsmall">{title}</p>
              {description && (
                <p id={descId} className="sds-modal__description sds-text--body-content-medium">
                  {description}
                </p>
              )}
            </div>
            {!isImageVariant && dismissable && (
              <button
                type="button"
                className="sds-modal__dismiss"
                aria-label="Close modal"
                onClick={onClose}
              >
                <CloseIcon size={24} />
              </button>
            )}
          </div>

          {children && <div className="sds-modal__content">{children}</div>}

          {hasActions && (
            <div className="sds-modal__actions">
              {actions ?? (
                <>
                  {primaryAction && (
                    <Button
                      variant="primary"
                      fillStyle="filled"
                      size="medium"
                      label={primaryAction.label}
                      onClick={primaryAction.onClick}
                    />
                  )}
                  {secondaryAction && (
                    <Button
                      variant="secondary"
                      fillStyle="hollow"
                      size="medium"
                      label={secondaryAction.label}
                      onClick={secondaryAction.onClick}
                    />
                  )}
                </>
              )}
            </div>
          )}
        </div>

      </div>
    </dialog>
  );
}
