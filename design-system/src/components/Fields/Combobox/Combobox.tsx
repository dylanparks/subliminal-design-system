import {
  ChangeEvent,
  KeyboardEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { computePosition, flip, shift, offset, autoUpdate } from '@floating-ui/dom';
import { KeyboardArrowDownIcon, CloseIcon, SuccessIcon, ErrorIcon } from '../../../icons';
import './Combobox.css';
import '../../Navigation/Menu/Menu.css';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ComboboxSize = 'large' | 'medium' | 'small';

export interface ComboboxOption {
  value: string;
  label: string;
}

export interface ComboboxProps {
  /** Floating label shown inside the field (large/medium) or above (small) */
  label?: string;
  /** Controlled selected value */
  value?: string;
  /** Uncontrolled default selected value */
  defaultValue?: string;
  /** Called when an option is committed */
  onChange?: (value: string) => void;
  /** List of options to show in the dropdown */
  options?: ComboboxOption[];
  /** Placeholder text shown in the input when open and empty */
  placeholder?: string;
  /** Visual height: large = 64px · medium = 56px · small = 48px */
  size?: ComboboxSize;
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

export function Combobox({
  label         = 'Select',
  value,
  defaultValue,
  onChange,
  options       = [],
  placeholder   = '',
  size          = 'large',
  disabled      = false,
  error         = false,
  success       = false,
  message,
  name,
  className,
  'aria-label': ariaLabel,
}: ComboboxProps) {

  // ── Value — controlled vs uncontrolled ────────────────────────────────────
  const isControlled   = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue ?? '');
  const currentValue   = isControlled ? (value ?? '') : internalValue;
  const selectedLabel  = options.find(o => o.value === currentValue)?.label ?? '';

  // ── Input / filter state ──────────────────────────────────────────────────
  const [inputText,   setInputText]   = useState(selectedLabel);
  const [isOpen,      setIsOpen]      = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isFocused,   setIsFocused]   = useState(false);

  // Sync inputText when the controlled value changes externally.
  useEffect(() => {
    setInputText(options.find(o => o.value === currentValue)?.label ?? '');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentValue]);

  // ── Filtered options ──────────────────────────────────────────────────────
  // Filter when the user has typed something different from the committed label.
  const isFiltering      = isOpen && inputText !== selectedLabel;
  const filteredOptions  = isFiltering
    ? options.filter(o => o.label.toLowerCase().includes(inputText.toLowerCase()))
    : options;

  // ── Derived state ─────────────────────────────────────────────────────────
  // "Filled" = a value is selected OR the user has typed something — either
  // causes the floating label to stay raised.
  const isFilled    = currentValue.length > 0 || inputText.length > 0;
  const showError   = error   && !disabled;
  const showSuccess = success && !disabled && !error;
  const showSupport = !disabled && !!message;

  // ── IDs ───────────────────────────────────────────────────────────────────
  const fieldId   = useId();
  const inputId   = `${fieldId}-input`;
  const listboxId = `${fieldId}-listbox`;
  const supportId = `${fieldId}-support`;

  // aria-activedescendant — points at the highlighted option element.
  const activeDescendant =
    activeIndex >= 0 && filteredOptions[activeIndex]
      ? `${listboxId}-${filteredOptions[activeIndex].value}`
      : undefined;

  // ── Refs ──────────────────────────────────────────────────────────────────
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);
  const statusRef  = useRef<HTMLSpanElement>(null);

  // ── Listbox positioning ───────────────────────────────────────────────────
  // Computed synchronously in openList() so the portal renders with the correct
  // position on its very first paint — avoids a misplaced-frame flash.
  const [listboxStyle, setListboxStyle] = useState<React.CSSProperties>({});

  // ── Open / close helpers ──────────────────────────────────────────────────
  function openList() {
    if (disabled) return;
    setIsOpen(true);
    setActiveIndex(-1);
  }

  function closeList() {
    setIsOpen(false);
    setActiveIndex(-1);
    // Restore the input to the last committed selection label.
    setInputText(selectedLabel);
  }

  // ── Selection handler ─────────────────────────────────────────────────────
  function handleSelect(option: ComboboxOption) {
    if (!isControlled) setInternalValue(option.value);
    setInputText(option.label);
    onChange?.(option.value);
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();

    // WCAG AA SC 4.1.3 — announce the committed selection.
    if (statusRef.current) {
      statusRef.current.textContent = '';
      requestAnimationFrame(() => {
        if (statusRef.current) {
          statusRef.current.textContent = `${option.label} selected.`;
        }
      });
    }
  }

  // ── Clear handler ─────────────────────────────────────────────────────────
  function handleClear() {
    setInputText('');
    if (!isControlled) setInternalValue('');
    onChange?.('');
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  }

  // ── Input change ──────────────────────────────────────────────────────────
  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    const text = e.target.value;
    setInputText(text);
    setActiveIndex(-1);
    if (!isOpen) setIsOpen(true);

    // Typing into an empty input deselects the current value.
    if (text === '') {
      if (!isControlled) setInternalValue('');
      onChange?.('');
    }
  }

  // ── Keyboard navigation — WAI-ARIA Combobox pattern ───────────────────────
  //
  // SC 4.1.2: combobox keyboard contract:
  //   ArrowDown    — open / move highlight down
  //   ArrowUp      — open / move highlight up (wraps to last)
  //   Enter        — commit highlighted option; or open if closed
  //   Escape       — close (restore value); or clear if already closed
  //   Home / End   — jump to first / last option when open
  //   Tab          — close and accept committed value
  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) { openList(); setActiveIndex(0); }
        else setActiveIndex(i => Math.min(i + 1, filteredOptions.length - 1));
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (!isOpen) { openList(); setActiveIndex(filteredOptions.length - 1); }
        else setActiveIndex(i => (i <= 0 ? filteredOptions.length - 1 : i - 1));
        break;

      case 'Enter':
        e.preventDefault();
        if (isOpen && activeIndex >= 0 && filteredOptions[activeIndex]) {
          handleSelect(filteredOptions[activeIndex]);
        } else if (!isOpen) {
          openList();
        }
        break;

      case 'Escape':
        e.preventDefault();
        if (isOpen) {
          closeList();
        } else {
          // Already closed — clear the committed value.
          setInputText('');
          if (!isControlled) setInternalValue('');
          onChange?.('');
        }
        break;

      case 'Home':
        if (isOpen) { e.preventDefault(); setActiveIndex(0); }
        break;

      case 'End':
        if (isOpen) { e.preventDefault(); setActiveIndex(filteredOptions.length - 1); }
        break;

      case 'Tab':
        if (isOpen) closeList();
        break;
    }
  }

  // ── Click outside to close ────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    function handlePointerDown(e: PointerEvent) {
      if (
        wrapperRef.current?.contains(e.target as Node) ||
        listboxRef.current?.contains(e.target as Node)
      ) return;
      setIsOpen(false);
      setActiveIndex(-1);
      setInputText(selectedLabel);
    }
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen, selectedLabel]);

  // ── Listbox positioning — Floating UI autoUpdate ─────────────────────────
  // Keeps the listbox anchored to the wrapper as the page scrolls or resizes.
  // Width is matched to the wrapper so the listbox aligns flush with the field.
  useEffect(() => {
    if (!isOpen || !wrapperRef.current || !listboxRef.current) return;
    const anchor     = wrapperRef.current;
    const floatingEl = listboxRef.current;

    const cleanup = autoUpdate(anchor, floatingEl, () => {
      computePosition(anchor, floatingEl, {
        placement: 'bottom-start',
        strategy:  'fixed',
        middleware: [offset(4), flip({ padding: 8 }), shift({ padding: 8 })],
      }).then(({ x, y }) => {
        setListboxStyle({ position: 'fixed', top: y, left: x, width: anchor.offsetWidth });
      });
    });

    return cleanup;
  }, [isOpen]);

  // ── Scroll selected option to bottom of list on open ─────────────────────
  // Mirrors the Menu component's behaviour: when reopening with an existing
  // selection, position the selected item at the bottom of the visible area
  // so all preceding options are visible above it.
  useEffect(() => {
    if (!isOpen || !listboxRef.current || !currentValue) return;
    const listEl     = listboxRef.current;
    const selectedEl = listEl.querySelector<HTMLElement>('.sds-menu-item--selected');
    if (!selectedEl) return;
    const listRect = listEl.getBoundingClientRect();
    const itemRect = selectedEl.getBoundingClientRect();
    listEl.scrollTop = listEl.scrollTop + itemRect.bottom - listRect.bottom;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // ── Scroll highlighted option into view ───────────────────────────────────
  useEffect(() => {
    if (activeIndex < 0 || !listboxRef.current) return;
    (listboxRef.current.children[activeIndex] as HTMLElement)?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  // ── CSS class composition ─────────────────────────────────────────────────
  const rootClasses = [
    'sds-combobox',
    `sds-combobox--${size}`,
    isFilled    && 'sds-combobox--filled',
    isOpen      && 'sds-combobox--open',
    disabled    && 'sds-combobox--disabled',
    showError   && 'sds-combobox--error',
    showSuccess && 'sds-combobox--success',
    className,
  ].filter(Boolean).join(' ');

  // ── Shared input props ────────────────────────────────────────────────────
  const inputProps = {
    ref:          inputRef,
    id:           inputId,
    type:         'text' as const,
    className:    'sds-combobox__input',
    // WAI-ARIA Combobox pattern (APG 1.2)
    role:                  'combobox'  as const,
    'aria-expanded':       isOpen,
    'aria-haspopup':       'listbox'   as const,
    'aria-autocomplete':   'list'      as const,
    'aria-controls':       isOpen ? listboxId : undefined,
    'aria-activedescendant': activeDescendant,
    'aria-invalid':        showError ? (true as const) : undefined,
    'aria-describedby':    showSupport ? supportId : undefined,
    value:        inputText,
    // Small: placeholder always visible (external label, input always shown).
    // Large/medium: only shown while focused (floating label covers the space otherwise).
    placeholder:  (size === 'small' || isFocused) ? placeholder : '',
    onFocus:      () => setIsFocused(true),
    onBlur:       () => setIsFocused(false),
    disabled,
    autoComplete: 'off'   as const,
    spellCheck:   false,
    onChange:     handleInputChange,
    onKeyDown:    handleKeyDown,
    // Open list on click; keep focus on this input.
    onClick:      () => openList(),
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={rootClasses}>

      {/* Hidden input for form submission */}
      {name && <input type="hidden" name={name} value={currentValue} />}

      {/* Small size: label sits above the wrapper */}
      {size === 'small' && (
        <label htmlFor={inputId} className="sds-combobox__label-above">
          {label}
        </label>
      )}

      {/* ── Input wrapper (the visible field box) ─────────────────────────── */}
      <div
        ref={wrapperRef}
        className="sds-combobox__wrapper"
        onClick={(e) => {
          // Only act on clicks that land on the wrapper itself (padding areas,
          // label) — let interactive children (input, buttons) handle themselves.
          if ((e.target as HTMLElement).closest('input, button')) return;
          inputRef.current?.focus();
          openList();
        }}
      >

        {/* Large / medium: floating label + input */}
        {size !== 'small' && (
          <div className="sds-combobox__inner">
            {/*
              <label> provides the accessible name when aria-label is absent.
              It does not need aria-hidden — the htmlFor/id association is
              intentional and correct per WCAG SC 1.3.1.
            */}
            <label htmlFor={inputId} className="sds-combobox__label">
              {label}
            </label>
            <input {...inputProps} aria-label={ariaLabel} />
          </div>
        )}

        {/* Small: input only — label is rendered above */}
        {size === 'small' && (
          <input {...inputProps} aria-label={ariaLabel ?? label} />
        )}

        {/* Clear button — shown when filled + focused, or in error/success */}
        {!disabled && (
          <button
            type="button"
            className="sds-combobox__clear"
            tabIndex={-1}
            aria-label="Clear"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleClear}
          >
            <CloseIcon />
          </button>
        )}

        {/* Chevron — decorative toggle button (tabIndex -1, aria-hidden) */}
        <button
          type="button"
          className="sds-combobox__chevron"
          tabIndex={-1}
          aria-hidden="true"
          disabled={disabled}
          // Prevent blur on the input when clicking the chevron.
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            if (isOpen) {
              closeList();
              inputRef.current?.focus();
            } else {
              openList();
              inputRef.current?.focus();
            }
          }}
        >
          <KeyboardArrowDownIcon />
        </button>
      </div>

      {/* ── Listbox dropdown (portal-rendered for z-index isolation) ──────── */}
      {isOpen && createPortal(
        <div
          ref={listboxRef}
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel ?? label}
          className="sds-combobox__listbox"
          style={listboxStyle}
        >
          {filteredOptions.length === 0 ? (
            /*
             * aria-live="polite" ensures screen readers announce when the
             * filter produces no results (WCAG SC 4.1.3).
             */
            <div className="sds-combobox__no-options" aria-live="polite">
              No options found
            </div>
          ) : (
            filteredOptions.map((option, index) => (
              <div
                key={option.value}
                id={`${listboxId}-${option.value}`}
                role="option"
                aria-selected={option.value === currentValue}
                className={[
                  'sds-menu-item',
                  option.value === currentValue && 'sds-menu-item--selected',
                  index === activeIndex         && 'sds-menu-item--active',
                ].filter(Boolean).join(' ')}
                // Prevent the input from losing focus when clicking an option.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(option)}
                onMouseEnter={() => setActiveIndex(index)}
              >
                {/*
                  Checkmark slot — always occupies a 20×20 space so label text
                  stays horizontally aligned regardless of selection state,
                  mirroring the Menu component's checkmark pattern.
                */}
                <span
                  className={[
                    'sds-menu-item__checkmark',
                    option.value === currentValue && 'sds-menu-item__checkmark--selected',
                  ].filter(Boolean).join(' ')}
                  aria-hidden="true"
                >
                  <svg viewBox="0 -960 960 960" width="20" height="20" fill="currentColor">
                    <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z" />
                  </svg>
                </span>
                <span className="sds-menu-item__content">{option.label}</span>
              </div>
            ))
          )}
        </div>,
        document.body,
      )}

      {/* ── Support group — status icon + message ─────────────────────────── */}
      {showSupport && (
        <div id={supportId} className="sds-combobox__support">
          {showError   && <ErrorIcon size={16} />}
          {showSuccess && <SuccessIcon size={16} />}
          <p className="sds-combobox__message">{message}</p>
        </div>
      )}

      {/*
        WCAG AA SC 4.1.3 — polite live region for selection announcements.
        Kept separate from the field label so it fires on change, not on focus.
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

export default Combobox;
