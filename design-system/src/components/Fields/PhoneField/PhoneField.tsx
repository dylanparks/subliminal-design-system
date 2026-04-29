import {
  ChangeEvent,
  KeyboardEvent,
  MouseEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — react-flagpack ships as ESM with its own type definitions
import Flag from 'react-flagpack';
import 'react-flagpack/dist/style.css';
import type { Flags } from 'flagpack-core';
import { Menu, MenuItem } from '../../Navigation/Menu/Menu';
import { KeyboardArrowDownIcon, CloseIcon, SuccessIcon, ErrorIcon } from '../../../icons';
import {
  COUNTRIES,
  Country,
  detectCountryCodeFromTimezone,
  extractDigits,
  findCountryByCode,
  formatNationalNumber,
  getE164,
  getMaxNationalDigits,
  getFlagCode,
} from './countries';
import './PhoneField.css';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PhoneFieldSize = 'large' | 'medium';

export interface PhoneFieldProps {
  /** Floating label shown inside the phone input section */
  label?: string;
  /** Controlled value — raw digit string (no dial code, no formatting characters) */
  value?: string;
  /** Uncontrolled default value — raw digit string */
  defaultValue?: string;
  /**
   * ISO 3166-1 alpha-2 code for the default country.
   * When omitted, the device timezone is used to detect the country.
   */
  defaultCountry?: string;
  /**
   * Called on every keystroke and on country change.
   * @param digits  Raw digit string (no dial code prefix, no formatting characters)
   * @param country The currently selected Country object
   */
  onChange?: (digits: string, country: Country, e164?: string) => void;
  /** Visual height: large = 64px · medium = 56px */
  size?: PhoneFieldSize;
  /** Disables all interaction */
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
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PhoneField({
  label         = 'Phone number',
  value,
  defaultValue  = '',
  defaultCountry,
  onChange,
  size          = 'large',
  disabled      = false,
  error         = false,
  success       = false,
  message,
  name,
  className,
  'aria-label': ariaLabel,
}: PhoneFieldProps) {

  // ── Country initialisation ─────────────────────────────────────────────────
  function resolveInitialCountry(): Country {
    if (defaultCountry) {
      const found = findCountryByCode(defaultCountry);
      if (found) return found;
    }
    const detected = detectCountryCodeFromTimezone();
    return findCountryByCode(detected) ?? COUNTRIES.find(c => c.code === 'US')!;
  }

  const [selectedCountry, setSelectedCountry] = useState<Country>(resolveInitialCountry);
  const [isMenuOpen, setIsMenuOpen]           = useState(false);

  // ── Value — controlled vs uncontrolled ────────────────────────────────────
  // We store and expose raw digits only. Formatting is display-only.
  const isControlled   = value !== undefined;
  const rawDigits      = isControlled ? extractDigits(value ?? '') : undefined;
  const [internalDigits, setInternalDigits] = useState(() => extractDigits(defaultValue));
  const currentDigits  = isControlled ? (rawDigits ?? '') : internalDigits;
  const isFilled       = currentDigits.length > 0;
  const displayValue   = formatNationalNumber(currentDigits, selectedCountry.code);

  // ── States ─────────────────────────────────────────────────────────────────
  const showError   = error   && !disabled;
  const showSuccess = success && !disabled && !error;
  const showSupport = !disabled && !!message;

  // ── IDs ────────────────────────────────────────────────────────────────────
  const fieldId      = useId();
  const labelId      = `${fieldId}-label`;
  const dialHintId   = `${fieldId}-dial-hint`;
  const supportId    = `${fieldId}-support`;

  // ── Refs ───────────────────────────────────────────────────────────────────
  const wrapperRef    = useRef<HTMLDivElement>(null);
  const countryBtnRef = useRef<HTMLButtonElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const statusRef     = useRef<HTMLSpanElement>(null);

  // ── Keyboard typeahead for country menu ───────────────────────────────────
  // Catches printable characters at document level while the menu is open
  // (the menu is portal-rendered so it won't bubble into our wrapper).
  useEffect(() => {
    if (!isMenuOpen) return;

    let buffer   = '';
    let timerId: ReturnType<typeof setTimeout>;

    function handleDocKeyDown(e: globalThis.KeyboardEvent) {
      // Only handle single printable characters; ignore modifier combos.
      if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;

      buffer += e.key.toLowerCase();
      clearTimeout(timerId);
      timerId = setTimeout(() => { buffer = ''; }, 600);

      // Find the first matching menu item by its label text.
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

  // ── Country selection ──────────────────────────────────────────────────────
  function handleCountrySelect(country: Country) {
    setSelectedCountry(country);
    setIsMenuOpen(false);
    // Return focus to the country button after selection.
    countryBtnRef.current?.focus();

    // Announce the change — WCAG AA SC 4.1.3 (Status Messages).
    if (statusRef.current) {
      statusRef.current.textContent = '';
      requestAnimationFrame(() => {
        if (statusRef.current) {
          statusRef.current.textContent =
            `Country changed to ${country.name}. Dial code ${country.dialCode}.`;
        }
      });
    }

    // Re-notify onChange if there's an existing value (same digits, new country).
    if (currentDigits) onChange?.(currentDigits, country, getE164(currentDigits, country.code));
  }

  function handleMenuClose() {
    setIsMenuOpen(false);
    countryBtnRef.current?.focus();
  }

  // ── Phone input handlers ───────────────────────────────────────────────────
  function handlePhoneChange(e: ChangeEvent<HTMLInputElement>) {
    const digits = extractDigits(e.target.value).slice(0, getMaxNationalDigits(selectedCountry.code));
    if (!isControlled) setInternalDigits(digits);
    onChange?.(digits, selectedCountry, getE164(digits, selectedCountry.code));
  }

  // Escape clears the input when no menu is open.
  function handlePhoneKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape' && currentDigits.length > 0 && !isMenuOpen) {
      e.preventDefault();
      if (!isControlled) setInternalDigits('');
      onChange?.('', selectedCountry, undefined);
    }
  }

  // Clear button: keep focus inside the field.
  function handleClearMouseDown(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
  }

  function handleClearClick() {
    if (!isControlled) setInternalDigits('');
    onChange?.('', selectedCountry, undefined);
    phoneInputRef.current?.focus();
  }

  // ── CSS class composition ──────────────────────────────────────────────────
  const rootClasses = [
    'sds-phone-field',
    `sds-phone-field--${size}`,
    isFilled    && 'sds-phone-field--filled',
    isMenuOpen  && 'sds-phone-field--menu-open',
    disabled    && 'sds-phone-field--disabled',
    showError   && 'sds-phone-field--error',
    showSuccess && 'sds-phone-field--success',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // Flag sizes — react-flagpack: l=32x24px (button/large), m=20x15px (button/medium + menu items).
  const flagSize = size === 'large' ? 'l' : 'm';

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className={rootClasses}
      // WCAG: role="group" associates the two controls under a single label.
      role="group"
      aria-labelledby={labelId}
      aria-disabled={disabled ? true : undefined}
    >
      {/* Visually hidden group label read on focus entry */}
      <span id={labelId} className="sds-sr-only">{ariaLabel ?? label}</span>

      {/* ── Single bordered wrapper ─────────────────────────────────────── */}
      <div ref={wrapperRef} className="sds-phone-field__wrapper">

        {/* ── Country selector button ──────────────────────────────────── */}
        <button
          ref={countryBtnRef}
          type="button"
          className="sds-phone-field__country"
          // WAI-ARIA combobox pattern for a button that opens a menu popup.
          role="combobox"
          aria-expanded={isMenuOpen}
          aria-haspopup="menu"
          aria-controls={isMenuOpen ? `${fieldId}-menu` : undefined}
          aria-label={`Country: ${selectedCountry.name}, dial code ${selectedCountry.dialCode}. Press to change.`}
          // Hints to autofill agents that this control captures a country.
          autoComplete="country"
          disabled={disabled}
          onClick={() => setIsMenuOpen(prev => !prev)}
        >
          <span className="sds-phone-field__country-flag" aria-hidden="true">
            <Flag code={getFlagCode(selectedCountry.code) as Flags} size={flagSize} hasBorderRadius />
          </span>
          <span className="sds-phone-field__country-dial" aria-hidden="true">
            {selectedCountry.dialCode}
          </span>
          <span className="sds-phone-field__country-chevron" aria-hidden="true">
            <KeyboardArrowDownIcon />
          </span>
        </button>

        {/* ── Vertical divider ─────────────────────────────────────────── */}
        <span className="sds-phone-field__divider" aria-hidden="true" />

        {/* ── Phone number input section ───────────────────────────────── */}
        <div className="sds-phone-field__input-section">
          <div className="sds-phone-field__inner">
            {/* Floating label — identical mechanism to TextField large/medium */}
            <label
              htmlFor={`${fieldId}-input`}
              className="sds-phone-field__label"
            >
              {label}
            </label>

            <input
              ref={phoneInputRef}
              id={`${fieldId}-input`}
              name={name}
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              value={displayValue}
              placeholder=""
              disabled={disabled}
              aria-label={ariaLabel}
              aria-invalid={showError ? true : undefined}
              aria-describedby={[supportId, dialHintId].join(' ')}
              className="sds-phone-field__input"
              dir="ltr"
              onChange={handlePhoneChange}
              onKeyDown={handlePhoneKeyDown}
            />
          </div>

          {/* Action button: close-menu when open, clear when filled + focused */}
          {!disabled && (
            <button
              type="button"
              className={[
                'sds-phone-field__action',
                isMenuOpen && 'sds-phone-field__action--close',
                !isMenuOpen && isFilled && 'sds-phone-field__action--clear',
              ]
                .filter(Boolean)
                .join(' ')}
              // Button is hidden via CSS when neither condition is active.
              aria-label={isMenuOpen ? 'Close country selector' : 'Clear phone number'}
              tabIndex={-1}
              onMouseDown={handleClearMouseDown}
              onClick={isMenuOpen ? handleMenuClose : handleClearClick}
            >
              <CloseIcon />
            </button>
          )}
        </div>
      </div>

      {/* ── Country menu ─────────────────────────────────────────────────── */}
      <Menu
        open={isMenuOpen}
        anchorEl={wrapperRef.current}
        onClose={handleMenuClose}
        aria-labelledby={labelId}
        maxHeight={360}
      >
        {COUNTRIES.map(country => (
          <MenuItem
            key={country.code}
            selected={country.code === selectedCountry.code}
            icon={<Flag code={getFlagCode(country.code) as Flags} size="m" hasBorderRadius />}
            suffix={{ type: 'tag', label: country.dialCode }}
            onClick={() => handleCountrySelect(country)}
          >
            {country.name}
          </MenuItem>
        ))}
      </Menu>

      {/* ── Support group — message ──────────────────────────────────────── */}
      {showSupport && (
        <div id={supportId} className="sds-phone-field__support">
          {showError   && <ErrorIcon size={16} />}
          {showSuccess && <SuccessIcon size={16} />}
          <p className="sds-phone-field__message">{message}</p>
        </div>
      )}

      {/* Hidden hint — tells screen readers upfront which country/dial code is active. */}
      <span id={dialHintId} className="sds-sr-only">
        {selectedCountry.name}, dial code {selectedCountry.dialCode}
      </span>

      {/*
        WCAG AA SC 4.1.3 — polite live region for country-change announcements.
        Separate from the dial hint so it announces on *change*, not on focus.
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

export default PhoneField;
