import { ChangeEvent, KeyboardEvent, MouseEvent, useEffect, useId, useRef, useState } from 'react';
import './TextField.css';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TextFieldSize = 'large' | 'medium' | 'small';

type CharCountState = 'under' | 'at' | 'over';

export interface TextFieldProps {
  /** Floating label shown inside the field (huge/large) or above it (medium) */
  label?: string;
  /** Placeholder text shown inside the input on medium size */
  placeholder?: string;
  /** Controlled value */
  value?: string;
  /** Uncontrolled default value */
  defaultValue?: string;
  /** Called on every keystroke with the new string value */
  onChange?: (value: string) => void;
  /** Visual height of the field: huge = 64px · large = 56px · medium = 48px */
  size?: TextFieldSize;
  /** Disables the field */
  disabled?: boolean;
  /** Shows error treatment — takes priority over success */
  error?: boolean;
  /** Shows success treatment */
  success?: boolean;
  /** Helper / validation message shown below the field */
  message?: string;
  /**
   * Maximum character count. When set:
   *   - Enforces the limit on the native input
   *   - Shows the live character counter below the field
   */
  maxLength?: number;
  /** HTML input name attribute */
  name?: string;
  /** HTML input type (text, email, password, search, etc.) */
  type?: string;
  /** Additional className forwarded to the root element */
  className?: string;
  /** Accessible label override (falls back to label prop) */
  'aria-label'?: string;
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

function WarningIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 2L14.5 13.5H1.5L8 2Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <rect x="7.25" y="5.75" width="1.5" height="3.75" rx="0.75" fill="currentColor" />
      <circle cx="8" cy="11.25" r="0.75" fill="currentColor" />
    </svg>
  );
}

function ErrorCircleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
      <rect x="7.25" y="4.5" width="1.5" height="4.5" rx="0.75" fill="currentColor" />
      <circle cx="8" cy="11" r="0.75" fill="currentColor" />
    </svg>
  );
}

// ─── WCAG AA — character-count announcement helpers ───────────────────────────

/**
 * Delay after the user stops typing before a screen-reader announcement fires.
 * WCAG SC 4.1.3: status messages must not disrupt the user's flow.
 * 500 ms strikes the right balance — immediate enough to be useful, late enough
 * not to interrupt every keystroke.
 */
const ANNOUNCE_DELAY_MS = 500;

/**
 * Returns the "remaining characters" values at which to announce, sorted ascending.
 *
 * Milestones (WCAG AA compliant — polite for warnings, assertive for limit):
 *   • ~50% remaining  → floor(max / 2)
 *   • ~25% remaining  → floor(max / 4)
 *   •  10 remaining   → fixed (only when maxLength > 10)
 *   •   0 remaining   → limit reached  (assertive / role="alert")
 *
 * Thresholds that collapse into each other (small maxLength values) are
 * de-duplicated via Set, so no milestone fires twice.
 */
function getAnnounceMilestones(maxLength: number): number[] {
  const raw = [
    0,
    10,
    Math.floor(maxLength / 4),
    Math.floor(maxLength / 2),
  ].filter(m => m >= 0 && m < maxLength);
  return [...new Set(raw)].sort((a, b) => a - b);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TextField({
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
  maxLength,
  name,
  type        = 'text',
  className,
  'aria-label': ariaLabel,
}: TextFieldProps) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? '');
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId  = useId();

  const isControlled    = value !== undefined;
  const currentValue    = isControlled ? value : internalValue;
  const isFilled        = currentValue.length > 0;
  const isExternalLabel = size === 'small';

  // Error takes priority over success; neither applies when disabled.
  const showError   = error && !disabled;
  const showSuccess = success && !disabled && !error;

  // Support group: shown whenever there is a message or character counter, unless disabled.
  const showSupport = !disabled && !!(message || maxLength !== undefined);

  // ── Character-count visual state ───────────────────────────────────────────
  // Always driven by actual value length — never by the field's error/success prop.
  // This matches industry standard (Uber Base, Material) and WCAG intent.
  const charLength = currentValue.length;
  const charCountState: CharCountState =
    maxLength === undefined   ? 'under' :
    charLength > maxLength    ? 'over'  :
    charLength === maxLength  ? 'at'    :
                                'under';

  // ── WCAG AA — screen-reader announcements (SC 4.1.3 Status Messages) ───────
  const politeRef     = useRef<HTMLSpanElement>(null);
  const assertiveRef  = useRef<HTMLSpanElement>(null);
  const announceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /**
   * Milestones already announced this editing session.
   * Entries are removed when the user deletes back above them so they
   * can re-fire the next time the threshold is crossed.
   */
  const announcedSet = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (maxLength === undefined) return;

    const remaining  = maxLength - charLength;
    const milestones = getAnnounceMilestones(maxLength);

    // Un-track milestones the user has typed back above (allow re-announcement).
    for (const m of announcedSet.current) {
      if (remaining > m) announcedSet.current.delete(m);
    }

    if (!milestones.includes(remaining))       return;
    if (announcedSet.current.has(remaining))   return;

    const isAtLimit        = remaining === 0;
    const announcementText = isAtLimit
      ? `Character limit of ${maxLength} reached`
      : `${remaining} character${remaining === 1 ? '' : 's'} remaining`;

    // Debounce: reset the timer on every keystroke so we only announce
    // after the user pauses for at least ANNOUNCE_DELAY_MS.
    if (announceTimer.current) clearTimeout(announceTimer.current);

    announceTimer.current = setTimeout(() => {
      announcedSet.current.add(remaining);
      const ref = isAtLimit ? assertiveRef : politeRef;
      if (ref.current) {
        // Clear then set on the next frame — forces screen readers to
        // re-announce even when the text content hasn't changed.
        ref.current.textContent = '';
        requestAnimationFrame(() => {
          if (ref.current) ref.current.textContent = announcementText;
        });
      }
    }, ANNOUNCE_DELAY_MS);

    return () => {
      if (announceTimer.current) clearTimeout(announceTimer.current);
    };
  }, [charLength, maxLength]);

  // ── CSS class computation ──────────────────────────────────────────────────

  const rootClasses = [
    'sds-text-field',
    `sds-text-field--${size}`,
    isFilled    && 'sds-text-field--filled',
    disabled    && 'sds-text-field--disabled',
    showError   && 'sds-text-field--error',
    showSuccess && 'sds-text-field--success',
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

  // Prevent the input from blurring when the clear button is pressed.
  function handleClearMouseDown(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
  }

  function handleClearClick() {
    if (!isControlled) setInternalValue('');
    onChange?.('');
    inputRef.current?.focus();
  }

  // ── aria-describedby ───────────────────────────────────────────────────────
  // Points to both the support group (message text) and — when maxLength is
  // defined — a hidden span that announces the character limit on first focus.
  const describedByParts = [
    showSupport             && `${inputId}-support`,
    maxLength !== undefined && `${inputId}-limit-hint`,
  ].filter(Boolean) as string[];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className={rootClasses}>

      {/* External label — medium size only */}
      {isExternalLabel && (
        <label htmlFor={inputId} className="sds-text-field__label sds-text-field__label--external">
          {label}
        </label>
      )}

      {/* Visible box — onClick focuses the input when clicking the empty area of the
          wrapper (i.e. not directly on the label or the input itself). This is the
          safety net for the max-height:0 hidden-input state used on huge/large. */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div
        className="sds-text-field__wrapper"
        onClick={!disabled ? () => inputRef.current?.focus() : undefined}
      >

        <div className="sds-text-field__inner">
          {!isExternalLabel && (
            <label htmlFor={inputId} className="sds-text-field__label">
              {label}
            </label>
          )}

          <input
            ref={inputRef}
            id={inputId}
            name={name}
            type={type}
            value={isControlled ? value : internalValue}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={maxLength}
            aria-label={ariaLabel}
            aria-describedby={describedByParts.length ? describedByParts.join(' ') : undefined}
            aria-invalid={showError ? true : undefined}
            className="sds-text-field__input"
            onChange={handleChange}
            onKeyDown={handleKeyDown}
          />
        </div>

        {/* Clear / × button — CSS controls visibility per state; not rendered when disabled */}
        {!disabled && (
          <button
            type="button"
            className="sds-text-field__clear"
            aria-label="Clear input"
            tabIndex={-1}
            onMouseDown={handleClearMouseDown}
            onClick={handleClearClick}
          >
            <ClearIcon />
          </button>
        )}
      </div>

      {/* Support group — message + character count */}
      {showSupport && (
        <div
          id={`${inputId}-support`}
          className="sds-text-field__support"
        >
          {message && (
            <p className="sds-text-field__message">{message}</p>
          )}

          {maxLength !== undefined && (
            <span
              className={[
                'sds-text-field__char-count',
                charCountState === 'at'   && 'sds-text-field__char-count--at',
                charCountState === 'over' && 'sds-text-field__char-count--over',
              ].filter(Boolean).join(' ')}
              aria-hidden="true"
            >
              {charCountState === 'at'   && <WarningIcon />}
              {charCountState === 'over' && <ErrorCircleIcon />}
              <span>{charLength}</span>
              <span>/{maxLength}</span>
            </span>
          )}
        </div>
      )}

      {/* Hidden hint read on first focus — tells screen readers the character limit upfront. */}
      {maxLength !== undefined && (
        <span id={`${inputId}-limit-hint`} className="sds-sr-only">
          {maxLength} character maximum
        </span>
      )}

      {/*
        WCAG AA SC 4.1.3 — visually-hidden live regions for character-count announcements.
        Two regions are required because urgency differs:
          • politeRef    → milestone warnings (50 %, 25 %, 10 remaining) — polite, non-interrupting
          • assertiveRef → limit reached — role="alert" interrupts the screen reader immediately
        Only rendered when maxLength is defined.
      */}
      {maxLength !== undefined && (
        <>
          <span
            ref={politeRef}
            aria-live="polite"
            aria-atomic="true"
            className="sds-sr-only"
          />
          <span
            ref={assertiveRef}
            role="alert"
            className="sds-sr-only"
          />
        </>
      )}
    </div>
  );
}

export default TextField;
