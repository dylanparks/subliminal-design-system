import {
  ChangeEvent,
  KeyboardEvent,
  MouseEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import './SearchField.css';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SearchFieldSize = 'large' | 'medium';
export type SearchFieldType = 'standard' | 'autocomplete';

export interface SearchFieldProps {
  /** Floating label shown inside the field */
  label?: string;
  /** Placeholder text shown when focused and field is empty */
  placeholder?: string;
  /** Controlled value */
  value?: string;
  /** Uncontrolled default value */
  defaultValue?: string;
  /** Called on every keystroke with the new string value */
  onChange?: (value: string) => void;
  /** Called when the user submits the search (Enter key) */
  onSearch?: (value: string) => void;
  /** Visual height: large = 64px · medium = 56px */
  size?: SearchFieldSize;
  /**
   * standard    — plain type="search" input (default)
   * autocomplete — combobox with a suggestion listbox; uses type="text" +
   *                role="combobox" because type="search" has an implied
   *                role of "searchbox" that cannot be overridden per the
   *                HTML-ARIA spec.
   */
  type?: SearchFieldType;
  /**
   * Suggestions to display in autocomplete mode.
   * Consumer is responsible for filtering — pass the items you want shown.
   */
  suggestions?: string[];
  /** Called when the user selects a suggestion */
  onSuggestionSelect?: (value: string) => void;
  /** Show the leading search icon (default: true) */
  showIcon?: boolean;
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
}

// ─── Icon sub-components ──────────────────────────────────────────────────────
// Inline SVG — will be replaced by the icon library import later.

function SearchIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M16 16L21 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

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

// ─── Component ────────────────────────────────────────────────────────────────

export function SearchField({
  label            = 'Search',
  placeholder      = 'Search…',
  value,
  defaultValue,
  onChange,
  onSearch,
  size             = 'large',
  type             = 'standard',
  suggestions      = [],
  onSuggestionSelect,
  showIcon         = true,
  disabled         = false,
  error            = false,
  success          = false,
  message,
  name,
  className,
  'aria-label': ariaLabel,
}: SearchFieldProps) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? '');
  const [isOpen, setIsOpen]               = useState(false);
  const [activeIndex, setActiveIndex]     = useState(-1);
  const [liveText, setLiveText]           = useState('');

  const inputRef     = useRef<HTMLInputElement>(null);
  const listboxRef   = useRef<HTMLUListElement>(null);
  // Prevents the list from reopening immediately after the user dismisses it
  // via Escape or selects a suggestion (both re-focus the input).
  const suppressRef  = useRef(false);
  const liveTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const inputId   = useId();
  const listboxId = useId();
  const messageId = useId();

  const isAutocomplete = type === 'autocomplete';
  const isControlled   = value !== undefined;
  const currentValue   = isControlled ? value : internalValue;
  const isFilled       = currentValue.length > 0;

  // Derived: the listbox is visible only when isOpen AND there are suggestions.
  // Using a derived boolean means aria-expanded always reflects actual popup state.
  const isListOpen = isAutocomplete && isOpen && suggestions.length > 0;

  const showError   = error   && !disabled;
  const showSuccess = success && !disabled && !error;
  const showMessage = !disabled && !!message;

  // ── CSS class computation ──────────────────────────────────────────────────

  const rootClasses = [
    'sds-search-field',
    `sds-search-field--${size}`,
    isFilled    && 'sds-search-field--filled',
    disabled    && 'sds-search-field--disabled',
    showError   && 'sds-search-field--error',
    showSuccess && 'sds-search-field--success',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // ── Active option ID (for aria-activedescendant) ───────────────────────────

  const activeOptionId =
    isListOpen && activeIndex >= 0
      ? `${listboxId}-option-${activeIndex}`
      : undefined;

  // ── Clear activeIndex when the list closes ─────────────────────────────────

  useEffect(() => {
    if (!isListOpen) setActiveIndex(-1);
  }, [isListOpen]);

  // ── Scroll the active option into view ────────────────────────────────────
  // aria-activedescendant does not trigger the browser's native scroll-into-view
  // (only real DOM focus does), so we manage it manually.

  useEffect(() => {
    if (activeIndex < 0 || !listboxRef.current) return;
    const el = listboxRef.current.children[activeIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  // ── Live region — polite, debounced ~1400 ms ───────────────────────────────
  // Announces the result count after the user pauses typing.
  // 1400 ms matches the GOV.UK accessible-autocomplete debounce, which was
  // chosen to avoid mid-keystroke interruptions on slow typers.

  useEffect(() => {
    if (!isAutocomplete) return;
    clearTimeout(liveTimerRef.current);

    if (!isListOpen) {
      setLiveText('');
      return;
    }

    liveTimerRef.current = setTimeout(() => {
      const count = suggestions.length;
      setLiveText(
        count > 0
          ? `${count} result${count === 1 ? '' : 's'} available.`
          : 'No results available.',
      );
    }, 1400);

    return () => clearTimeout(liveTimerRef.current);
  }, [isListOpen, suggestions.length, isAutocomplete]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const next = e.target.value;
    if (!isControlled) setInternalValue(next);
    onChange?.(next);

    if (isAutocomplete && !suppressRef.current) {
      setIsOpen(true);
      setActiveIndex(-1);
    }
  }

  function handleFocus() {
    if (!isAutocomplete) return;
    if (suppressRef.current) {
      suppressRef.current = false;
      return;
    }
    if (suggestions.length > 0) setIsOpen(true);
  }

  function handleBlur() {
    // Delay closing so a mousedown on an option fires before the list disappears.
    setTimeout(() => setIsOpen(false), 150);
  }

  function selectSuggestion(suggestion: string) {
    if (!isControlled) setInternalValue(suggestion);
    onChange?.(suggestion);
    onSuggestionSelect?.(suggestion);
    setIsOpen(false);
    suppressRef.current = true;
    inputRef.current?.focus();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (isAutocomplete) {
      const len = suggestions.length;

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          suppressRef.current = false;
          if (!isOpen && len > 0) {
            setIsOpen(true);
            setActiveIndex(0);
          } else if (isOpen && len > 0) {
            setActiveIndex(prev => (prev + 1) % len);
          }
          return;
        }
        case 'ArrowUp': {
          e.preventDefault();
          suppressRef.current = false;
          if (!isOpen && len > 0) {
            setIsOpen(true);
            setActiveIndex(len - 1);
          } else if (isOpen && len > 0) {
            setActiveIndex(prev => (prev <= 0 ? len - 1 : prev - 1));
          }
          return;
        }
        case 'Enter': {
          if (isListOpen && activeIndex >= 0 && suggestions[activeIndex]) {
            e.preventDefault();
            selectSuggestion(suggestions[activeIndex]);
            return;
          }
          // No active suggestion — treat as a plain search submit.
          if (currentValue.trim()) onSearch?.(currentValue);
          return;
        }
        case 'Escape': {
          if (isOpen) {
            e.preventDefault();
            setIsOpen(false);
            setActiveIndex(-1);
            suppressRef.current = true;
          } else if (currentValue.length > 0) {
            e.preventDefault();
            if (!isControlled) setInternalValue('');
            onChange?.('');
          }
          return;
        }
        case 'Tab': {
          // Let focus move naturally but close the list.
          setIsOpen(false);
          return;
        }
      }
      return;
    }

    // Standard mode keyboard handlers
    if (e.key === 'Enter' && currentValue.trim()) {
      onSearch?.(currentValue);
    }
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
    if (isAutocomplete) {
      setIsOpen(false);
      suppressRef.current = true;
    }
    inputRef.current?.focus();
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className={rootClasses}>

      {/*
        Anchor provides the CSS positioning context for the suggestion listbox
        so it can be absolutely placed directly below the wrapper without
        affecting the outer flex layout.
      */}
      <div className="sds-search-field__anchor">

        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
        <div
          className="sds-search-field__wrapper"
          onClick={!disabled ? () => inputRef.current?.focus() : undefined}
        >

          {showIcon && (
            <span className="sds-search-field__icon">
              <SearchIcon />
            </span>
          )}

          <div className="sds-search-field__inner">
            <label htmlFor={inputId} className="sds-search-field__label">
              {label}
            </label>

            {isAutocomplete ? (
              /*
                Autocomplete — WAI-ARIA Combobox pattern (ARIA 1.2).
                type="search" has an implied role of "searchbox" per the
                HTML-ARIA spec that cannot be overridden, so we use
                type="text" + role="combobox" and suppress browser-native
                autocomplete with autoComplete="off".
              */
              <input
                ref={inputRef}
                id={inputId}
                name={name}
                type="text"
                role="combobox"
                aria-expanded={isListOpen}
                aria-controls={listboxId}
                aria-autocomplete="list"
                aria-activedescendant={activeOptionId}
                aria-label={ariaLabel}
                aria-describedby={showMessage ? messageId : undefined}
                aria-invalid={showError ? true : undefined}
                autoComplete="off"
                value={isControlled ? value : internalValue}
                placeholder={placeholder}
                disabled={disabled}
                className="sds-search-field__input"
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            ) : (
              /*
                Standard — type="search" has an implied role of "searchbox"
                per the HTML-ARIA spec. No explicit role override needed.
              */
              <input
                ref={inputRef}
                id={inputId}
                name={name}
                type="search"
                value={isControlled ? value : internalValue}
                placeholder={placeholder}
                disabled={disabled}
                aria-label={ariaLabel}
                aria-describedby={showMessage ? messageId : undefined}
                aria-invalid={showError ? true : undefined}
                className="sds-search-field__input"
                onChange={handleChange}
                onKeyDown={handleKeyDown}
              />
            )}
          </div>

          {!disabled && (
            <button
              type="button"
              className="sds-search-field__clear"
              aria-label="Clear search"
              tabIndex={-1}
              onMouseDown={handleClearMouseDown}
              onClick={handleClearClick}
            >
              <ClearIcon />
            </button>
          )}
        </div>

        {/*
          Suggestion listbox — always rendered in the DOM while in autocomplete
          mode so aria-controls always references a real element. The HTML
          hidden attribute hides it from both layout and assistive technology
          when there are no suggestions or the field is not open.
        */}
        {isAutocomplete && (
          <ul
            ref={listboxRef}
            id={listboxId}
            role="listbox"
            aria-label={ariaLabel ?? label}
            className="sds-search-field__listbox"
            hidden={!isListOpen}
          >
            {isListOpen && suggestions.map((suggestion, index) => (
              <li
                key={suggestion}
                id={`${listboxId}-option-${index}`}
                role="option"
                aria-selected={activeIndex === index}
                className={[
                  'sds-search-field__option',
                  activeIndex === index && 'sds-search-field__option--active',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectSuggestion(suggestion)}
              >
                {suggestion}
              </li>
            ))}
          </ul>
        )}

      </div>

      {/*
        Polite live region — announces the result count after the user pauses
        typing. Screen readers that handle aria-activedescendant inconsistently
        (notably VoiceOver on iOS) rely on this to confirm that suggestions exist
        before the user begins navigating.
      */}
      {isAutocomplete && (
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sds-search-field__live"
        >
          {liveText}
        </div>
      )}

      {showMessage && (
        <p id={messageId} className="sds-search-field__message">
          {message}
        </p>
      )}

    </div>
  );
}

export default SearchField;
