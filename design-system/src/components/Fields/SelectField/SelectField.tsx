import { KeyboardEvent, useEffect, useId, useRef, useState } from 'react';
import { Menu, MenuItem } from '../../Navigation/Menu/Menu';
import { KeyboardArrowDownIcon, SuccessIcon, ErrorIcon } from '../../../icons';
import './SelectField.css';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SelectFieldSize = 'large' | 'medium';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectFieldProps {
  /** Floating label shown inside the field */
  label?: string;
  /** Controlled selected value */
  value?: string;
  /** Uncontrolled default selected value */
  defaultValue?: string;
  /** Called when an option is selected */
  onChange?: (value: string) => void;
  /** List of options to display in the dropdown */
  options?: SelectOption[];
  /** Visual height: large = 64px · medium = 56px */
  size?: SelectFieldSize;
  /** Disables all interaction */
  disabled?: boolean;
  /** Shows error treatment — takes priority over success */
  error?: boolean;
  /** Shows success treatment */
  success?: boolean;
  /** Helper / validation message shown below the field */
  message?: string;
  /** HTML hidden input name attribute (for form submission) */
  name?: string;
  /** Additional className forwarded to the root element */
  className?: string;
  /** Accessible label override (falls back to label prop) */
  'aria-label'?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SelectField({
  label         = 'Select',
  value,
  defaultValue,
  onChange,
  options       = [],
  size          = 'large',
  disabled      = false,
  error         = false,
  success       = false,
  message,
  name,
  className,
  'aria-label': ariaLabel,
}: SelectFieldProps) {

  // ── Value — controlled vs uncontrolled ────────────────────────────────────
  const isControlled    = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue ?? '');
  const currentValue    = isControlled ? (value ?? '') : internalValue;
  const isFilled        = currentValue.length > 0;
  const selectedOption  = options.find(o => o.value === currentValue);

  // ── Menu state ─────────────────────────────────────────────────────────────
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // ── States ─────────────────────────────────────────────────────────────────
  const showError   = error   && !disabled;
  const showSuccess = success && !disabled && !error;
  const showSupport = !disabled && !!message;

  // ── IDs ────────────────────────────────────────────────────────────────────
  const fieldId   = useId();
  const supportId = `${fieldId}-support`;

  // ── Refs ───────────────────────────────────────────────────────────────────
  const triggerRef = useRef<HTMLButtonElement>(null);
  const statusRef  = useRef<HTMLSpanElement>(null);

  // ── Selection handler ──────────────────────────────────────────────────────
  function handleSelect(option: SelectOption) {
    if (!isControlled) setInternalValue(option.value);
    onChange?.(option.value);
    setIsMenuOpen(false);
    triggerRef.current?.focus();

    // WCAG AA SC 4.1.3 — announce the selection via a polite live region.
    if (statusRef.current) {
      statusRef.current.textContent = '';
      requestAnimationFrame(() => {
        if (statusRef.current) {
          statusRef.current.textContent = `${option.label} selected.`;
        }
      });
    }
  }

  function handleMenuClose() {
    setIsMenuOpen(false);
    triggerRef.current?.focus();
  }

  // ── Keyboard typeahead ─────────────────────────────────────────────────────
  // The menu is portal-rendered so keypresses won't bubble into our wrapper.
  // Listen at document level while open; buffer chars for 600ms then reset.
  useEffect(() => {
    if (!isMenuOpen) return;

    let buffer  = '';
    let timerId: ReturnType<typeof setTimeout>;

    function handleDocKeyDown(e: globalThis.KeyboardEvent) {
      if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;

      buffer += e.key.toLowerCase();
      clearTimeout(timerId);
      timerId = setTimeout(() => { buffer = ''; }, 600);

      const items = document.querySelectorAll<HTMLElement>(
        '[role="menuitem"]:not([aria-disabled="true"]), [role="menuitemradio"]:not([aria-disabled="true"]), [role="menuitemcheckbox"]:not([aria-disabled="true"])'
      );
      const match = Array.from(items).find(el => {
        const text = el.querySelector('.sds-menu-item__content')?.textContent ?? '';
        return text.trim().toLowerCase().startsWith(buffer);
      });
      match?.focus();
    }

    document.addEventListener('keydown', handleDocKeyDown);
    return () => {
      document.removeEventListener('keydown', handleDocKeyDown);
      clearTimeout(timerId);
    };
  }, [isMenuOpen]);

  // ── Keyboard ───────────────────────────────────────────────────────────────
  // Open on Space / Enter / ArrowDown / ArrowUp; Escape closes.
  function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (!isMenuOpen && ['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
      e.preventDefault();
      setIsMenuOpen(true);
    }
    if (isMenuOpen && e.key === 'Escape') {
      e.preventDefault();
      setIsMenuOpen(false);
      triggerRef.current?.focus();
    }
  }

  // ── CSS class composition ──────────────────────────────────────────────────
  const rootClasses = [
    'sds-select-field',
    `sds-select-field--${size}`,
    isFilled    && 'sds-select-field--filled',
    isMenuOpen  && 'sds-select-field--open',
    disabled    && 'sds-select-field--disabled',
    showError   && 'sds-select-field--error',
    showSuccess && 'sds-select-field--success',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className={rootClasses}>

      {/* Hidden input for form submission */}
      {name && <input type="hidden" name={name} value={currentValue} />}

      {/* ── Trigger button — the visible select field ─────────────────────── */}
      <button
        ref={triggerRef}
        type="button"
        className="sds-select-field__trigger"
        // WAI-ARIA combobox pattern for a button that opens a menu popup.
        role="combobox"
        aria-expanded={isMenuOpen}
        aria-haspopup="menu"
        aria-label={ariaLabel ?? label}
        aria-invalid={showError ? true : undefined}
        aria-describedby={showSupport ? supportId : undefined}
        disabled={disabled}
        onClick={() => setIsMenuOpen(prev => !prev)}
        onKeyDown={handleKeyDown}
      >
        {/* Inner column — floating label + selected value text */}
        <div className="sds-select-field__inner">
          {/* Visual floating label — aria-hidden because accessible name comes
              from aria-label on the button */}
          <span className="sds-select-field__label" aria-hidden="true">
            {label}
          </span>

          {/* Selected value — hidden (max-height: 0) until --filled */}
          <span className="sds-select-field__value" aria-hidden="true">
            {selectedOption?.label ?? ''}
          </span>
        </div>

        {/* Chevron */}
        <span className="sds-select-field__chevron" aria-hidden="true">
          <KeyboardArrowDownIcon />
        </span>
      </button>

      {/* ── Dropdown menu ─────────────────────────────────────────────────── */}
      <Menu
        open={isMenuOpen}
        anchorEl={triggerRef.current}
        onClose={handleMenuClose}
        maxHeight={360}
        width={triggerRef.current?.offsetWidth}
      >
        {options.map(option => (
          <MenuItem
            key={option.value}
            selected={option.value === currentValue}
            onClick={() => handleSelect(option)}
          >
            {option.label}
          </MenuItem>
        ))}
      </Menu>

      {/* ── Support group — message ───────────────────────────────────────── */}
      {showSupport && (
        <div id={supportId} className="sds-select-field__support">
          {showError   && <ErrorIcon size={16} />}
          {showSuccess && <SuccessIcon size={16} />}
          <p className="sds-select-field__message">{message}</p>
        </div>
      )}

      {/*
        WCAG AA SC 4.1.3 — polite live region for selection-change announcements.
        Separate from the trigger's accessible name so it fires on *change*,
        not on every focus.
      */}
      <span
        ref={statusRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sds-sr-only"
      />
    </div>
  );
}

export default SelectField;
