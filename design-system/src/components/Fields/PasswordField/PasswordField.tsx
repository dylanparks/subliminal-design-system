import { ChangeEvent, KeyboardEvent, MouseEvent, useId, useLayoutEffect, useRef, useState } from 'react';
import './PasswordField.css';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PasswordFieldSize = 'large' | 'medium' | 'small';

export interface PasswordFieldProps {
  /** Floating label shown inside the field (large/medium) or above it (small) */
  label?: string;
  /** Placeholder text shown inside the input on small size */
  placeholder?: string;
  /** Controlled value */
  value?: string;
  /** Uncontrolled default value */
  defaultValue?: string;
  /** Called on every keystroke with the new string value */
  onChange?: (value: string) => void;
  /** Visual height of the field: large = 64px · medium = 56px · small = 48px */
  size?: PasswordFieldSize;
  /** Disables the field */
  disabled?: boolean;
  /** Shows error treatment — takes priority over success */
  error?: boolean;
  /** Shows success treatment */
  success?: boolean;
  /** Helper / validation message shown below the field */
  message?: string;
  /** HTML input name attribute */
  name?: string;
  /** Additional className forwarded to the root element */
  className?: string;
  /** Accessible label override (falls back to label prop) */
  'aria-label'?: string;
  /**
   * HTML autocomplete value. Defaults to "current-password" so Chrome/Safari
   * password managers recognise the field even when type switches to "text".
   * Use "new-password" on registration / change-password forms.
   */
  autoComplete?: string;
  /** Controlled visibility — true = password is visible as plain text */
  visible?: boolean;
  /** Uncontrolled initial visibility */
  defaultVisible?: boolean;
  /** Called when the user toggles password visibility */
  onVisibleChange?: (visible: boolean) => void;
}

// ─── Icon sub-components ──────────────────────────────────────────────────────

function ClearIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6.5 6.5L17.5 17.5M17.5 6.5L6.5 17.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M2 10C2 10 5.5 4 10 4C14.5 4 18 10 18 10C18 10 14.5 16 10 16C5.5 16 2 10 2 10Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M3 3L17 17"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M7.5 5.3C8.3 5 9.1 4.8 10 4.8C14.5 4.8 17.5 10 17.5 10C17 10.9 16.2 12 15.1 12.9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M11.5 13.9C11 14.1 10.5 14.3 10 14.3C5.5 14.3 2.5 10 2.5 10C3.1 8.9 4.1 7.5 5.5 6.4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M8 8.2C8.5 7.5 9.2 7 10 7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PasswordField({
  label       = 'Input label',
  placeholder = 'Placeholder content',
  value,
  defaultValue,
  onChange,
  size        = 'large',
  disabled    = false,
  error       = false,
  success     = false,
  message,
  name,
  autoComplete   = 'current-password',
  className,
  'aria-label': ariaLabel,
  visible,
  defaultVisible = false,
  onVisibleChange,
}: PasswordFieldProps) {
  const [internalValue,   setInternalValue]   = useState(defaultValue ?? '');
  const [internalVisible, setInternalVisible] = useState(defaultVisible);
  const inputRef       = useRef<HTMLInputElement>(null);
  const inputId        = useId();
  // Saved cursor position from just before the input type flips password→text.
  // text inputs expose selectionStart; password inputs do not, so we save it
  // while we still can (on hide) and restore it after re-render (on show).
  const savedCursorPos = useRef<number | null>(null);

  const isControlled        = value !== undefined;
  const isVisibleControlled = visible !== undefined;
  const currentValue        = isControlled ? value : internalValue;
  const showPassword        = isVisibleControlled ? visible : internalVisible;

  const isFilled        = currentValue.length > 0;
  const isExternalLabel = size === 'small';

  // Error takes priority over success; neither applies when disabled.
  const showError   = error && !disabled;
  const showSuccess = success && !disabled && !error;

  // Support group shown whenever there is a message and the field is not disabled.
  const showSupport = !disabled && !!message;

  // ── CSS class computation ──────────────────────────────────────────────────

  const rootClasses = [
    'sds-password-field',
    `sds-password-field--${size}`,
    isFilled    && 'sds-password-field--filled',
    disabled    && 'sds-password-field--disabled',
    showError   && 'sds-password-field--error',
    showSuccess && 'sds-password-field--success',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const next = e.target.value;
    if (!isControlled) setInternalValue(next);
    onChange?.(next);
  }

  // Escape key clears the field — keyboard-accessible alternative to the clear button.
  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape' && currentValue.length > 0) {
      e.preventDefault();
      if (!isControlled) setInternalValue('');
      onChange?.('');
    }
  }

  // Prevent input blur when the clear button is pressed.
  function handleClearMouseDown(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
  }

  function handleClearClick() {
    if (!isControlled) setInternalValue('');
    onChange?.('');
    inputRef.current?.focus();
  }

  // Prevent input blur when the toggle button is pressed.
  function handleToggleMouseDown(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
  }

  function handleToggleClick() {
    if (showPassword && inputRef.current) {
      // Hiding (text → password): save cursor while the text input still exposes it.
      savedCursorPos.current = inputRef.current.selectionStart;
    }
    const next = !showPassword;
    if (!isVisibleControlled) setInternalVisible(next);
    onVisibleChange?.(next);
    inputRef.current?.focus();
  }

  // After the DOM has updated and the input type has changed, restore the saved
  // cursor position. Falls back to end-of-value when no position was saved
  // (e.g. the very first reveal from a password input).
  useLayoutEffect(() => {
    if (!showPassword || !inputRef.current) return;
    const pos = savedCursorPos.current ?? inputRef.current.value.length;
    inputRef.current.setSelectionRange(pos, pos);
    savedCursorPos.current = null;
  }, [showPassword]);

  // ── aria-describedby ───────────────────────────────────────────────────────
  const describedBy = showSupport ? `${inputId}-support` : undefined;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className={rootClasses}>

      {/* External label — small size only */}
      {isExternalLabel && (
        <label htmlFor={inputId} className="sds-password-field__label sds-password-field__label--external">
          {label}
        </label>
      )}

      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div
        className="sds-password-field__wrapper"
        onClick={!disabled ? () => inputRef.current?.focus() : undefined}
      >
        <div className="sds-password-field__inner">
          {!isExternalLabel && (
            <label htmlFor={inputId} className="sds-password-field__label">
              {label}
            </label>
          )}

          <input
            ref={inputRef}
            id={inputId}
            name={name}
            type={showPassword ? 'text' : 'password'}
            autoComplete={autoComplete}
            value={isControlled ? value : internalValue}
            placeholder={placeholder}
            disabled={disabled}
            aria-label={ariaLabel}
            aria-describedby={describedBy}
            aria-invalid={showError ? true : undefined}
            className="sds-password-field__input"
            onChange={handleChange}
            onKeyDown={handleKeyDown}
          />
        </div>

        {/* Right-side actions: clear (conditional) + visibility toggle (always) */}
        <div className="sds-password-field__actions">
          {/* Clear button — CSS controls visibility (filled+focused, error, success) */}
          {!disabled && (
            <button
              type="button"
              className="sds-password-field__clear"
              aria-label="Clear input"
              tabIndex={-1}
              onMouseDown={handleClearMouseDown}
              onClick={handleClearClick}
            >
              <ClearIcon />
            </button>
          )}

          {/* Visibility toggle — always rendered; disabled attr mirrors field disabled state */}
          <button
            type="button"
            className="sds-password-field__toggle"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            disabled={disabled}
            onMouseDown={handleToggleMouseDown}
            onClick={handleToggleClick}
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
      </div>

      {/* Support group — message only */}
      {showSupport && (
        <div id={`${inputId}-support`} className="sds-password-field__support">
          <p className="sds-password-field__message">{message}</p>
        </div>
      )}
    </div>
  );
}

export default PasswordField;
