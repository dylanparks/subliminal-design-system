import { ChangeEvent, KeyboardEvent, MouseEvent, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { CloseIcon, WarningIcon, ErrorIcon, SuccessIcon } from '../../../icons';
import './TextArea.css';

// ─── Types ────────────────────────────────────────────────────────────────────

type CharCountState = 'under' | 'at' | 'over';

export interface TextAreaProps {
  /**
   * Floating label shown at medium body-content size in the unfocused empty
   * state; transitions to small text above the content when focused or filled.
   */
  label?: string;
  /** Placeholder text shown inside the textarea when focused and empty */
  placeholder?: string;
  /** Controlled value */
  value?: string;
  /** Uncontrolled default value */
  defaultValue?: string;
  /** Called on every keystroke with the new string value */
  onChange?: (value: string) => void;
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
   *   - Enforces the limit on the native textarea
   *   - Shows the live character counter below the field
   */
  maxLength?: number;
  /** HTML textarea name attribute */
  name?: string;
  /** Additional className forwarded to the root element */
  className?: string;
  /** Accessible label override (falls back to label prop) */
  'aria-label'?: string;
}

// ─── WCAG AA — character-count announcement helpers ───────────────────────────

const ANNOUNCE_DELAY_MS = 500;

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

export function TextArea({
  label       = 'Input label',
  placeholder = 'Placeholder content',
  value,
  defaultValue,
  onChange,
  disabled    = false,
  error       = false,
  success     = false,
  message,
  maxLength,
  name,
  className,
  'aria-label': ariaLabel,
}: TextAreaProps) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? '');
  const [isFocused,     setIsFocused]     = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const textareaId  = useId();

  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;
  const isFilled     = currentValue.length > 0;

  // Error takes priority over success; neither applies when disabled.
  const showError   = error && !disabled;
  const showSuccess = success && !disabled && !error;

  // Support group: shown whenever there is a message or character counter, unless disabled.
  const showSupport = !disabled && !!(message || maxLength !== undefined);

  // ── Character-count visual state ───────────────────────────────────────────
  const charLength = currentValue.length;
  const charCountState: CharCountState =
    maxLength === undefined  ? 'under' :
    charLength > maxLength   ? 'over'  :
    charLength === maxLength ? 'at'    :
                               'under';

  // ── WCAG AA — screen-reader announcements (SC 4.1.3) ──────────────────────
  const politeRef     = useRef<HTMLSpanElement>(null);
  const assertiveRef  = useRef<HTMLSpanElement>(null);
  const announceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const announcedSet  = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (maxLength === undefined) return;

    const remaining  = maxLength - charLength;
    const milestones = getAnnounceMilestones(maxLength);

    for (const m of announcedSet.current) {
      if (remaining > m) announcedSet.current.delete(m);
    }

    if (!milestones.includes(remaining))     return;
    if (announcedSet.current.has(remaining)) return;

    const isAtLimit        = remaining === 0;
    const announcementText = isAtLimit
      ? `Character limit of ${maxLength} reached`
      : `${remaining} character${remaining === 1 ? '' : 's'} remaining`;

    if (announceTimer.current) clearTimeout(announceTimer.current);

    announceTimer.current = setTimeout(() => {
      announcedSet.current.add(remaining);
      const ref = isAtLimit ? assertiveRef : politeRef;
      if (ref.current) {
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

  // ── Auto-resize ────────────────────────────────────────────────────────────
  // When visible (focused or filled): grow/shrink textarea to fit content.
  // When hidden (unfocused + empty): clear inline height so CSS height:0 applies.
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    if (isFilled || isFocused) {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    } else {
      el.style.height = '';
    }
  }, [currentValue, isFilled, isFocused]);

  // ── CSS class computation ──────────────────────────────────────────────────

  const rootClasses = [
    'sds-text-area',
    isFilled    && 'sds-text-area--filled',
    disabled    && 'sds-text-area--disabled',
    showError   && 'sds-text-area--error',
    showSuccess && 'sds-text-area--success',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleChange(e: ChangeEvent<HTMLTextAreaElement>) {
    const next = e.target.value;
    if (!isControlled) setInternalValue(next);
    onChange?.(next);
  }

  // Escape clears — Enter is NOT intercepted (textarea needs it for newlines).
  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Escape' && currentValue.length > 0) {
      e.preventDefault();
      if (!isControlled) setInternalValue('');
      onChange?.('');
    }
  }

  function handleFocus() {
    setIsFocused(true);
  }

  function handleBlur() {
    setIsFocused(false);
  }

  // Prevent textarea blur when the clear button is pressed.
  function handleClearMouseDown(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
  }

  function handleClearClick() {
    if (!isControlled) setInternalValue('');
    onChange?.('');
    textareaRef.current?.focus();
  }

  // ── aria-describedby ───────────────────────────────────────────────────────
  const describedByParts = [
    showSupport             && `${textareaId}-support`,
    maxLength !== undefined && `${textareaId}-limit-hint`,
  ].filter(Boolean) as string[];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className={rootClasses}>

      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div
        className="sds-text-area__wrapper"
        onClick={!disabled ? () => textareaRef.current?.focus() : undefined}
      >
        <div className="sds-text-area__inner">

          {/*
            Label — sits at medium body-content size in the default empty state
            (acting as a visual placeholder). Transitions to small text above
            the content on focus or fill via CSS focus-within / --filled.
          */}
          <label htmlFor={textareaId} className="sds-text-area__label">
            {label}
          </label>

          {/*
            Textarea — hidden (height: 0, opacity: 0) until focused or filled.
            Placeholder prop provides the hint text shown when focused and empty.
            Height is managed by JS auto-resize (useLayoutEffect above).
          */}
          <textarea
            ref={textareaRef}
            id={textareaId}
            name={name}
            rows={1}
            value={isControlled ? value : internalValue}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={maxLength}
            aria-label={ariaLabel}
            aria-describedby={describedByParts.length ? describedByParts.join(' ') : undefined}
            aria-invalid={showError ? true : undefined}
            className="sds-text-area__textarea"
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        </div>

        {/* Clear button — top-right corner; CSS controls visibility per state */}
        {!disabled && (
          <div className="sds-text-area__actions">
            <button
              type="button"
              className="sds-text-area__clear"
              aria-label="Clear input"
              tabIndex={-1}
              onMouseDown={handleClearMouseDown}
              onClick={handleClearClick}
            >
              <CloseIcon />
            </button>
          </div>
        )}
      </div>

      {/* Support group — message + character count */}
      {showSupport && (
        <div
          id={`${textareaId}-support`}
          className="sds-text-area__support"
        >
          {message && (
            <>
              {showError   && <ErrorIcon size={16} />}
              {showSuccess && <SuccessIcon size={16} />}
              <p className="sds-text-area__message">{message}</p>
            </>
          )}

          {maxLength !== undefined && (
            <span
              className={[
                'sds-text-area__char-count',
                charCountState === 'at'   && 'sds-text-area__char-count--at',
                charCountState === 'over' && 'sds-text-area__char-count--over',
              ].filter(Boolean).join(' ')}
              aria-hidden="true"
            >
              {charCountState === 'at'   && <WarningIcon size={16} />}
              {charCountState === 'over' && <ErrorIcon size={16} />}
              <span>{charLength}</span>
              <span>/{maxLength}</span>
            </span>
          )}
        </div>
      )}

      {maxLength !== undefined && (
        <span id={`${textareaId}-limit-hint`} className="sds-sr-only">
          {maxLength} character maximum
        </span>
      )}

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

export default TextArea;
