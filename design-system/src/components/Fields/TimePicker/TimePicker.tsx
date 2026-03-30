import React, {
  type RefObject,
  KeyboardEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { computePosition, flip, shift, offset, autoUpdate } from '@floating-ui/dom';
import { createPortal } from 'react-dom';
import { ClockIcon, CloseIcon, CheckIcon, SuccessIcon, ErrorIcon } from '../../../icons';
import './TimePicker.css';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface TimeValue {
  /** 0–23 */
  hour: number;
  /** 0–59 */
  minute: number;
  /** 0–59 (only populated when showSeconds is true) */
  second?: number;
}

export type TimePickerFormat   = '12h' | '24h';
export type TimePickerSize     = 'large' | 'medium';
export type MinuteInterval     = 1 | 5 | 10 | 15 | 30;
export type HourStep           = 1 | 2 | 3 | 4 | 6 | 8 | 12;

export interface DisabledTime {
  disabledHours?:   number[];  // 24-hour values (0–23)
  disabledMinutes?: number[];  // 0–59
  disabledSeconds?: number[];  // 0–59
}

export interface TimePickerProps {
  /** Floating label shown inside the field */
  label?: string;
  /** Controlled value — hour is 0–23, minute is 0–59, second is 0–59 */
  value?: TimeValue | null;
  /** Uncontrolled default value */
  defaultValue?: TimeValue | null;
  /** Called whenever the user changes hour, minute, second, or period; receives null when cleared */
  onChange?: (value: TimeValue | null) => void;
  /** '12h' shows Hour / Minute / AM·PM columns · '24h' shows Hour / Minute */
  format?: TimePickerFormat;
  /** Hour column step — must evenly divide 12 and 24 */
  hourStep?: HourStep;
  /** Minute column step */
  minuteStep?: MinuteInterval;
  /** Second column step — defaults to minuteStep when not provided */
  secondStep?: MinuteInterval;
  /** Returns sets of disabled hours/minutes/seconds given the current value */
  disabledTime?: (value: TimeValue | null) => DisabledTime;
  /** Show a clear button when the field has a value */
  allowClear?: boolean;
  /** Called when the popover opens or closes */
  onOpenChange?: (open: boolean) => void;
  /** Visual height: large = 64px · medium = 56px */
  size?: TimePickerSize;
  /** Show column header labels (Hour / Minute / Second / AM·PM) — default true */
  showLabels?: boolean;
  /** Show the minute column — default true */
  showMinutes?: boolean;
  /** Show the seconds column — default false */
  showSeconds?: boolean;
  /** Disables all interaction */
  disabled?: boolean;
  /** Error treatment — takes priority over success */
  error?: boolean;
  /** Success treatment */
  success?: boolean;
  /** Helper / validation message shown below the field */
  message?: string;
  /** Additional className forwarded to the root element */
  className?: string;
  /** Hidden input name for form submission (value is HH:MM or HH:MM:SS in 24 h) */
  name?: string;
  /** Accessible label override (falls back to label prop) */
  'aria-label'?: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function to12h(hour: number): { hour12: number; period: 'AM' | 'PM' } {
  return {
    period: hour >= 12 ? 'PM' : 'AM',
    hour12: hour === 0 ? 12 : hour > 12 ? hour - 12 : hour,
  };
}

function from12h(hour12: number, period: 'AM' | 'PM'): number {
  if (period === 'AM') return hour12 === 12 ? 0 : hour12;
  return hour12 === 12 ? 12 : hour12 + 12;
}

function formatTime(
  value: TimeValue | null | undefined,
  format: TimePickerFormat,
  showSeconds = false,
): string {
  if (!value) return '';
  const { hour, minute, second = 0 } = value;
  const mm = String(minute).padStart(2, '0');
  const ss = String(second).padStart(2, '0');
  if (format === '24h') {
    const hh = String(hour).padStart(2, '0');
    return showSeconds ? `${hh}:${mm}:${ss}` : `${hh}:${mm}`;
  }
  const { hour12, period } = to12h(hour);
  return showSeconds ? `${hour12}:${mm}:${ss} ${period}` : `${hour12}:${mm} ${period}`;
}

function buildHours(format: TimePickerFormat, step: HourStep): number[] {
  if (format === '24h') {
    return Array.from({ length: Math.ceil(24 / step) }, (_, i) => i * step);
  }
  // 12h: 1, 1+step, …, up to 11, then 12 at the end (natural clock order)
  const result: number[] = [];
  for (let h = step; h <= 11; h += step) result.push(h);
  result.push(12);
  return result;
}

function snapToList(value: number, list: number[]): number {
  if (list.length === 0) return value;
  return list.reduce((best, item) =>
    Math.abs(item - value) < Math.abs(best - value) ? item : best,
  );
}

function buildMinutes(interval: MinuteInterval): number[] {
  const result: number[] = [];
  for (let m = 0; m < 60; m += interval) result.push(m);
  return result;
}

function snapToInterval(minute: number, interval: MinuteInterval): number {
  return Math.round(minute / interval) * interval % 60;
}

// ─── Custom scrollbar hook ─────────────────────────────────────────────────

interface ScrollbarState { visible: boolean; height: number; top: number }

function useColumnScrollbar(listRef: RefObject<HTMLDivElement | null>) {
  const [sb, setSb] = useState<ScrollbarState>({ visible: false, height: 0, top: 0 });

  function updateScrollbar() {
    const el = listRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    if (scrollHeight <= clientHeight) {
      setSb(s => s.visible ? { visible: false, height: 0, top: 0 } : s);
      return;
    }
    const ratio           = clientHeight / scrollHeight;
    const indicatorHeight = Math.max(ratio * clientHeight, 24);
    const indicatorRange  = (clientHeight - 8) - indicatorHeight;
    const scrollRange     = scrollHeight - clientHeight;
    const indicatorTop    = 4 + (scrollTop / scrollRange) * indicatorRange;
    setSb({ visible: true, height: indicatorHeight, top: indicatorTop });
  }

  function handleIndicatorPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    const el = listRef.current;
    if (!el) return;
    const startY         = e.clientY;
    const startScrollTop = el.scrollTop;
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    function onPointerMove(ev: PointerEvent) {
      const { scrollHeight, clientHeight } = el!;
      const indicatorHeight = Math.max((clientHeight / scrollHeight) * clientHeight, 24);
      const indicatorRange  = (clientHeight - 8) - indicatorHeight;
      const scrollRange     = scrollHeight - clientHeight;
      if (indicatorRange <= 0) return;
      el!.scrollTop = startScrollTop + (ev.clientY - startY) * (scrollRange / indicatorRange);
    }
    function onPointerUp(ev: PointerEvent) {
      (e.currentTarget as HTMLDivElement)?.releasePointerCapture(ev.pointerId);
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup',   onPointerUp);
    }
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup',   onPointerUp);
  }

  function handleTrackPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).classList.contains('sds-timepicker__scrollbar-indicator')) return;
    const el = listRef.current;
    if (!el) return;
    const rect       = e.currentTarget.getBoundingClientRect();
    const clickRatio = (e.clientY - rect.top) / rect.height;
    el.scrollTo({ top: clickRatio * (el.scrollHeight - el.clientHeight), behavior: 'smooth' });
  }

  return { sb, updateScrollbar, handleIndicatorPointerDown, handleTrackPointerDown };
}

// ─── Component ─────────────────────────────────────────────────────────────

export function TimePicker({
  label          = 'Time',
  value,
  defaultValue,
  onChange,
  format         = '12h',
  hourStep       = 1,
  minuteStep     = 5,
  secondStep,
  disabledTime,
  allowClear     = true,
  onOpenChange,
  size           = 'large',
  showLabels     = true,
  showMinutes    = true,
  showSeconds    = false,
  disabled       = false,
  error          = false,
  success        = false,
  message,
  className,
  name,
  'aria-label': ariaLabel,
}: TimePickerProps) {
  // Resolve the effective second step — falls back to minuteStep
  const resolvedSecondInterval = secondStep ?? minuteStep;

  // ── Value — controlled vs uncontrolled ────────────────────────────────────
  const isControlled   = value !== undefined;
  const [internalValue, setInternalValue] = useState<TimeValue | null>(defaultValue ?? null);
  const currentValue   = isControlled ? (value ?? null) : internalValue;
  const isFilled       = !!currentValue;

  // ── Popover state ─────────────────────────────────────────────────────────
  const [isOpen,       setIsOpen]       = useState(false);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});
  const [ready,        setReady]        = useState(false);

  // ── Derived states ────────────────────────────────────────────────────────
  const showError   = error   && !disabled;
  const showSuccess = success && !disabled && !error;
  const showSupport = !disabled && !!message;

  // ── IDs ───────────────────────────────────────────────────────────────────
  const fieldId   = useId();
  const supportId = `${fieldId}-support`;

  // ── Refs ──────────────────────────────────────────────────────────────────
  const wrapperRef   = useRef<HTMLDivElement>(null);
  const popoverRef   = useRef<HTMLDivElement>(null);
  const triggerRef   = useRef<HTMLButtonElement>(null);
  const statusRef    = useRef<HTMLSpanElement>(null);
  const hourColRef   = useRef<HTMLDivElement>(null);
  const minuteColRef = useRef<HTMLDivElement>(null);
  const secondColRef = useRef<HTMLDivElement>(null);
  const periodColRef = useRef<HTMLDivElement>(null);

  // Scrollable list refs (for scroll tracking — separate from column refs which
  // are used for option focus/scroll-into-view queries)
  const hourListRef   = useRef<HTMLDivElement>(null);
  const minuteListRef = useRef<HTMLDivElement>(null);
  const secondListRef = useRef<HTMLDivElement>(null);
  const periodListRef = useRef<HTMLDivElement>(null);

  // Per-column custom scrollbar
  const hourSb   = useColumnScrollbar(hourListRef);
  const minuteSb = useColumnScrollbar(minuteListRef);
  const secondSb = useColumnScrollbar(secondListRef);
  const periodSb = useColumnScrollbar(periodListRef);

  // ── Column data ───────────────────────────────────────────────────────────
  const hours    = buildHours(format, hourStep);
  const minutes  = buildMinutes(minuteStep);
  const seconds  = buildMinutes(resolvedSecondInterval);

  // ── Column selection — falls back to defaults when no value ───────────────
  // A default "display selection" is shown even when currentValue is null so
  // the popover always opens with exactly one item per column highlighted.
  const fallbackHour   = format === '12h' ? 12 : 0;
  const fallbackMinute = 0;

  let selectedHour:   number;
  let selectedMinute: number;
  let selectedSecond: number;
  let selectedPeriod: 'AM' | 'PM';

  if (currentValue) {
    selectedMinute = snapToInterval(currentValue.minute, minuteStep);
    selectedSecond = snapToInterval(currentValue.second ?? 0, resolvedSecondInterval);
    if (format === '12h') {
      const { hour12, period } = to12h(currentValue.hour);
      selectedHour   = snapToList(hour12, hours);
      selectedPeriod = period;
    } else {
      selectedHour   = snapToList(currentValue.hour, hours);
      selectedPeriod = 'AM';
    }
  } else {
    selectedHour   = fallbackHour;
    selectedMinute = fallbackMinute;
    selectedSecond = 0;
    selectedPeriod = 'AM';
  }

  // ── Disabled config ───────────────────────────────────────────────────────
  const disabledConfig     = disabledTime?.(currentValue) ?? {};
  const disabledHours24    = new Set(disabledConfig.disabledHours   ?? []);
  const disabledMinutesSet = new Set(disabledConfig.disabledMinutes ?? []);
  const disabledSecondsSet = new Set(disabledConfig.disabledSeconds ?? []);
  // For 12h mode, convert disabled 24h hours to the display values shown in the column
  const disabledHoursDisplay: Set<number> = format === '12h'
    ? new Set(hours.filter(h12 => disabledHours24.has(from12h(h12, selectedPeriod))))
    : disabledHours24;

  // ── Open / close ──────────────────────────────────────────────────────────
  function openPopover() {
    if (disabled) return;
    setReady(false);
    setIsOpen(true);
    onOpenChange?.(true);
  }

  function closePopover() {
    setIsOpen(false);
    setReady(false);
    onOpenChange?.(false);
  }

  // ── Positioning — Floating UI autoUpdate ─────────────────────────────────
  useEffect(() => {
    if (!isOpen || !wrapperRef.current || !popoverRef.current) return;
    const anchor     = wrapperRef.current;
    const floatingEl = popoverRef.current;

    const cleanup = autoUpdate(anchor, floatingEl, () => {
      computePosition(anchor, floatingEl, {
        placement:  'bottom-start',
        strategy:   'fixed',
        middleware: [offset(4), flip({ padding: 8 }), shift({ padding: 8 })],
      }).then(({ x, y }) => {
        setPopoverStyle({ position: 'fixed', top: y, left: x });
        setReady(true);
      });
    });

    return () => { cleanup(); setReady(false); };
  }, [isOpen]);

  // ── Auto-focus selected item in hour column on open ───────────────────────
  useEffect(() => {
    if (!ready || !hourColRef.current) return;
    hourColRef.current
      .querySelector<HTMLElement>('[aria-selected="true"]')
      ?.focus();
  }, [ready]);

  // ── Initialise scrollbar states once the popover is positioned ────────────
  useEffect(() => {
    if (!ready) return;
    hourSb.updateScrollbar();
    if (showMinutes) minuteSb.updateScrollbar();
    if (showSeconds) secondSb.updateScrollbar();
    if (format === '12h') periodSb.updateScrollbar();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // ── Scroll selected items into view on open ───────────────────────────────
  useEffect(() => {
    if (!ready) return;
    requestAnimationFrame(() => {
      const refs = [
        hourColRef,
        showMinutes      ? minuteColRef  : null,
        showSeconds      ? secondColRef  : null,
        format === '12h' ? periodColRef  : null,
      ].filter(Boolean) as RefObject<HTMLDivElement>[];
      refs.forEach(ref => {
        ref.current
          ?.querySelector<HTMLElement>('[aria-selected="true"]')
          ?.scrollIntoView({ block: 'nearest' });
      });
    });
  }, [ready, format, showMinutes, showSeconds]);

  // ── Close on outside pointerdown ─────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    function onPointerDown(e: PointerEvent) {
      if (
        popoverRef.current?.contains(e.target as Node) ||
        wrapperRef.current?.contains(e.target as Node)
      ) return;
      closePopover();
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // ── Save + restore focus on close ─────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    return () => { triggerRef.current?.focus(); };
  }, [isOpen]);

  // ── Announcement helper ───────────────────────────────────────────────────
  function announce(text: string) {
    if (!statusRef.current) return;
    statusRef.current.textContent = '';
    requestAnimationFrame(() => {
      if (statusRef.current) statusRef.current.textContent = text;
    });
  }

  // ── Clear handler ─────────────────────────────────────────────────────────
  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    if (!isControlled) setInternalValue(null);
    onChange?.(null);
    closePopover();
    triggerRef.current?.focus();
  }

  // ── Commit helper — builds a full TimeValue from the current state ────────
  function commit(patch: Partial<{ hour: number; minute: number; second: number; period: 'AM' | 'PM' }>) {
    // Start from current committed value or sensible defaults
    const baseHour   = currentValue ? currentValue.hour           : from12h(fallbackHour, 'AM');
    const baseMinute = currentValue ? selectedMinute               : fallbackMinute;
    const baseSecond = currentValue ? (currentValue.second ?? 0)  : 0;
    const basePeriod = currentValue ? selectedPeriod               : 'AM';

    const newHour: number = (() => {
      if (patch.hour !== undefined) {
        return format === '12h'
          ? from12h(patch.hour, patch.period ?? basePeriod)
          : patch.hour;
      }
      if (patch.period !== undefined) {
        const h12 = format === '12h' ? to12h(baseHour).hour12 : baseHour;
        return from12h(h12, patch.period);
      }
      return baseHour;
    })();

    const newMinute = patch.minute ?? baseMinute;
    const newValue: TimeValue = { hour: newHour, minute: newMinute };
    if (showSeconds) newValue.second = patch.second ?? baseSecond;

    if (!isControlled) setInternalValue(newValue);
    onChange?.(newValue);
    announce(`${formatTime(newValue, format, showSeconds)} selected.`);
  }

  // ── Column keyboard handler factory ──────────────────────────────────────
  function makeColumnKeyDown<T>(
    items:       readonly T[],
    selectedIdx: number,
    onSelect:    (item: T, idx: number) => void,
    isDisabled?: (item: T) => boolean,
  ) {
    return (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closePopover();
        return;
      }

      let direction: 1 | -1 | null = null;
      if      (e.key === 'ArrowDown') { e.preventDefault(); direction =  1; }
      else if (e.key === 'ArrowUp')   { e.preventDefault(); direction = -1; }
      else return;

      // Walk in `direction`, skipping disabled items; bail if we wrap all the way around
      let newIdx = selectedIdx;
      for (let i = 0; i < items.length; i++) {
        newIdx = (newIdx + direction + items.length) % items.length;
        if (!isDisabled?.(items[newIdx])) break;
      }

      // Don't commit if the resolved item is still disabled
      if (isDisabled?.(items[newIdx])) return;

      onSelect(items[newIdx], newIdx);

      // After state update, DOM will have a new [aria-selected="true"] button —
      // index directly into the options NodeList to avoid a stale query.
      const listbox = e.currentTarget;
      requestAnimationFrame(() => {
        const opts = listbox.querySelectorAll<HTMLElement>('[role="option"]');
        opts[newIdx]?.focus();
        opts[newIdx]?.scrollIntoView({ block: 'nearest' });
      });
    };
  }

  // ── Trigger keyboard ──────────────────────────────────────────────────────
  function handleTriggerKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (!isOpen && ['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
      e.preventDefault();
      openPopover();
    }
    if (isOpen && e.key === 'Escape') { e.preventDefault(); closePopover(); }
  }

  // ── Column selection handlers ─────────────────────────────────────────────
  const hourIdx   = hours.indexOf(selectedHour);
  const minuteIdx = minutes.indexOf(selectedMinute);
  const secondIdx = seconds.indexOf(selectedSecond);
  const periodIdx = (['AM', 'PM'] as const).indexOf(selectedPeriod);

  const hourKeyDown = makeColumnKeyDown(
    hours,
    hourIdx < 0 ? 0 : hourIdx,
    (h) => commit({ hour: h }),
    (h) => disabledHoursDisplay.has(h),
  );

  const minuteKeyDown = makeColumnKeyDown(
    minutes,
    minuteIdx < 0 ? 0 : minuteIdx,
    (m) => commit({ minute: m }),
    (m) => disabledMinutesSet.has(m),
  );

  const secondKeyDown = makeColumnKeyDown(
    seconds,
    secondIdx < 0 ? 0 : secondIdx,
    (s) => commit({ second: s }),
    (s) => disabledSecondsSet.has(s),
  );

  const periodKeyDown = makeColumnKeyDown(
    ['AM', 'PM'] as const,
    periodIdx < 0 ? 0 : periodIdx,
    (p) => commit({ period: p }),
  );

  // ── Root classes ──────────────────────────────────────────────────────────
  const rootClasses = [
    'sds-timepicker',
    `sds-timepicker--${size}`,
    isFilled                  && 'sds-timepicker--filled',
    isOpen                    && 'sds-timepicker--open',
    disabled                  && 'sds-timepicker--disabled',
    showError                 && 'sds-timepicker--error',
    showSuccess               && 'sds-timepicker--success',
    allowClear && !disabled   && 'sds-timepicker--clearable',
    className,
  ].filter(Boolean).join(' ');

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={rootClasses}>

      {/* Hidden input for form submission — value in HH:MM 24 h format */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={currentValue
            ? [
                String(currentValue.hour).padStart(2, '0'),
                String(currentValue.minute).padStart(2, '0'),
                ...(showSeconds ? [String(currentValue.second ?? 0).padStart(2, '0')] : []),
              ].join(':')
            : ''}
        />
      )}

      {/* ── Wrapper + trigger ──────────────────────────────────────────────── */}
      <div ref={wrapperRef} className="sds-timepicker__wrapper">
        <button
          ref={triggerRef}
          type="button"
          className="sds-timepicker__trigger"
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-label={
            isFilled
              ? `${ariaLabel ?? label}: ${formatTime(currentValue, format, showSeconds)}`
              : (ariaLabel ?? label)
          }
          aria-invalid={showError ? true : undefined}
          aria-describedby={showSupport ? supportId : undefined}
          onKeyDown={handleTriggerKeyDown}
          onClick={() => isOpen ? closePopover() : openPopover()}
        >
          <div className="sds-timepicker__inner">
            {/* Floating label — aria-hidden because the accessible name is on
                the button itself */}
            <span className="sds-timepicker__label" aria-hidden="true">{label}</span>
            {/* Value text — hidden (max-height:0) until --filled */}
            <span className="sds-timepicker__value" aria-hidden="true">
              {formatTime(currentValue, format, showSeconds)}
            </span>
          </div>
        </button>
        {!disabled && allowClear && (
          <button
            type="button"
            className="sds-timepicker__clear"
            aria-label="Clear time"
            tabIndex={-1}
            onClick={handleClear}
          >
            <CloseIcon />
          </button>
        )}
        <span
          className="sds-timepicker__icon"
          aria-hidden="true"
          onClick={() => { if (!disabled) isOpen ? closePopover() : openPopover(); }}
        >
          <ClockIcon size={20} />
        </span>
      </div>

      {/* ── Popover (portal-rendered) ─────────────────────────────────────── */}
      {isOpen && createPortal(
        <>
          {/* Transparent backdrop — captures all outside taps/clicks */}
          <div
            className="sds-timepicker__backdrop"
            onClick={closePopover}
            aria-hidden="true"
          />

          <div
            ref={popoverRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Select ${ariaLabel ?? label}`}
            tabIndex={-1}
            className={[
              'sds-timepicker__popover',
              ready && 'sds-timepicker__popover--ready',
            ].filter(Boolean).join(' ')}
            style={popoverStyle}
            onKeyDown={e => { if (e.key === 'Escape') { e.preventDefault(); closePopover(); } }}
            // Close when focus leaves the dialog (e.g. Tab past the last item)
            onBlur={e => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                closePopover();
              }
            }}
          >
            {/* ── Hour column ─────────────────────────────────── */}
            <div className="sds-timepicker__column" ref={hourColRef}>
              {showLabels && (
                <div
                  className="sds-timepicker__column-label"
                  id={`${fieldId}-hour-label`}
                  aria-hidden="true"
                >
                  Hour
                </div>
              )}
              <div className="sds-timepicker__column-body">
                <div
                  ref={hourListRef}
                  className="sds-timepicker__column-list"
                  role="listbox"
                  aria-label="Hour"
                  aria-labelledby={showLabels ? `${fieldId}-hour-label` : undefined}
                  aria-orientation="vertical"
                  onScroll={hourSb.updateScrollbar}
                  onKeyDown={hourKeyDown}
                >
                  {hours.map((h, idx) => {
                    const isSelected   = h === selectedHour;
                    const isHourDisabled = disabledHoursDisplay.has(h);
                    return (
                      <button
                        key={h}
                        type="button"
                        role="option"
                        tabIndex={isSelected ? 0 : -1}
                        aria-selected={isSelected}
                        disabled={isHourDisabled}
                        className={[
                          'sds-timepicker__item sds-menu-item',
                          isSelected     && 'sds-menu-item--selected',
                          isHourDisabled && 'sds-timepicker__item--disabled',
                        ].filter(Boolean).join(' ')}
                        onClick={() => {
                          if (isHourDisabled) return;
                          commit({ hour: h });
                          requestAnimationFrame(() => {
                            hourColRef.current
                              ?.querySelectorAll<HTMLElement>('[role="option"]')[idx]
                              ?.focus();
                          });
                        }}
                      >
                        <span className={['sds-menu-item__checkmark', isSelected && 'sds-menu-item__checkmark--selected'].filter(Boolean).join(' ')} aria-hidden="true">
                          <CheckIcon size={20} />
                        </span>
                        <span className="sds-menu-item__content">
                          {format === '24h' ? String(h).padStart(2, '0') : h}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {hourSb.sb.visible && (
                  <div
                    className="sds-timepicker__scrollbar"
                    aria-hidden="true"
                    onPointerDown={hourSb.handleTrackPointerDown}
                  >
                    <div
                      className="sds-timepicker__scrollbar-indicator"
                      style={{ height: hourSb.sb.height, top: hourSb.sb.top }}
                      onPointerDown={hourSb.handleIndicatorPointerDown}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* ── Minute column ───────────────────────────────── */}
            {showMinutes && (
              <>
                <div className="sds-timepicker__col-divider" aria-hidden="true" />
                <div className="sds-timepicker__column" ref={minuteColRef}>
                  {showLabels && (
                    <div
                      className="sds-timepicker__column-label"
                      id={`${fieldId}-minute-label`}
                      aria-hidden="true"
                    >
                      Minute
                    </div>
                  )}
                  <div className="sds-timepicker__column-body">
                    <div
                      ref={minuteListRef}
                      className="sds-timepicker__column-list"
                      role="listbox"
                      aria-label="Minute"
                      aria-labelledby={showLabels ? `${fieldId}-minute-label` : undefined}
                      aria-orientation="vertical"
                      onScroll={minuteSb.updateScrollbar}
                      onKeyDown={minuteKeyDown}
                    >
                      {minutes.map((m, idx) => {
                        const isSelected      = m === selectedMinute;
                        const isMinuteDisabled = disabledMinutesSet.has(m);
                        return (
                          <button
                            key={m}
                            type="button"
                            role="option"
                            tabIndex={isSelected ? 0 : -1}
                            aria-selected={isSelected}
                            disabled={isMinuteDisabled}
                            className={[
                              'sds-timepicker__item sds-menu-item',
                              isSelected       && 'sds-menu-item--selected',
                              isMinuteDisabled && 'sds-timepicker__item--disabled',
                            ].filter(Boolean).join(' ')}
                            onClick={() => {
                              if (isMinuteDisabled) return;
                              commit({ minute: m });
                              requestAnimationFrame(() => {
                                minuteColRef.current
                                  ?.querySelectorAll<HTMLElement>('[role="option"]')[idx]
                                  ?.focus();
                              });
                            }}
                          >
                            <span className={['sds-menu-item__checkmark', isSelected && 'sds-menu-item__checkmark--selected'].filter(Boolean).join(' ')} aria-hidden="true">
                              <CheckIcon size={20} />
                            </span>
                            <span className="sds-menu-item__content">
                              {String(m).padStart(2, '0')}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {minuteSb.sb.visible && (
                      <div
                        className="sds-timepicker__scrollbar"
                        aria-hidden="true"
                        onPointerDown={minuteSb.handleTrackPointerDown}
                      >
                        <div
                          className="sds-timepicker__scrollbar-indicator"
                          style={{ height: minuteSb.sb.height, top: minuteSb.sb.top }}
                          onPointerDown={minuteSb.handleIndicatorPointerDown}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* ── Second column ────────────────────────────────── */}
            {showSeconds && (
              <>
                <div className="sds-timepicker__col-divider" aria-hidden="true" />
                <div className="sds-timepicker__column" ref={secondColRef}>
                  {showLabels && (
                    <div
                      className="sds-timepicker__column-label"
                      id={`${fieldId}-second-label`}
                      aria-hidden="true"
                    >
                      Second
                    </div>
                  )}
                  <div className="sds-timepicker__column-body">
                    <div
                      ref={secondListRef}
                      className="sds-timepicker__column-list"
                      role="listbox"
                      aria-label="Second"
                      aria-labelledby={showLabels ? `${fieldId}-second-label` : undefined}
                      aria-orientation="vertical"
                      onScroll={secondSb.updateScrollbar}
                      onKeyDown={secondKeyDown}
                    >
                      {seconds.map((s, idx) => {
                        const isSelected      = s === selectedSecond;
                        const isSecondDisabled = disabledSecondsSet.has(s);
                        return (
                          <button
                            key={s}
                            type="button"
                            role="option"
                            tabIndex={isSelected ? 0 : -1}
                            aria-selected={isSelected}
                            disabled={isSecondDisabled}
                            className={[
                              'sds-timepicker__item sds-menu-item',
                              isSelected       && 'sds-menu-item--selected',
                              isSecondDisabled && 'sds-timepicker__item--disabled',
                            ].filter(Boolean).join(' ')}
                            onClick={() => {
                              if (isSecondDisabled) return;
                              commit({ second: s });
                              requestAnimationFrame(() => {
                                secondColRef.current
                                  ?.querySelectorAll<HTMLElement>('[role="option"]')[idx]
                                  ?.focus();
                              });
                            }}
                          >
                            <span className={['sds-menu-item__checkmark', isSelected && 'sds-menu-item__checkmark--selected'].filter(Boolean).join(' ')} aria-hidden="true">
                              <CheckIcon size={20} />
                            </span>
                            <span className="sds-menu-item__content">
                              {String(s).padStart(2, '0')}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {secondSb.sb.visible && (
                      <div
                        className="sds-timepicker__scrollbar"
                        aria-hidden="true"
                        onPointerDown={secondSb.handleTrackPointerDown}
                      >
                        <div
                          className="sds-timepicker__scrollbar-indicator"
                          style={{ height: secondSb.sb.height, top: secondSb.sb.top }}
                          onPointerDown={secondSb.handleIndicatorPointerDown}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* ── AM/PM column (12 h only) ─────────────────────── */}
            {format === '12h' && (
              <>
                <div className="sds-timepicker__col-divider" aria-hidden="true" />
                <div
                  className="sds-timepicker__column sds-timepicker__column--period"
                  ref={periodColRef}
                >
                  {showLabels && (
                    <div
                      className="sds-timepicker__column-label"
                      id={`${fieldId}-period-label`}
                      aria-hidden="true"
                    >
                      AM/PM
                    </div>
                  )}
                  <div className="sds-timepicker__column-body">
                    <div
                      ref={periodListRef}
                      className="sds-timepicker__column-list"
                      role="listbox"
                      aria-label="AM/PM"
                      aria-labelledby={showLabels ? `${fieldId}-period-label` : undefined}
                      aria-orientation="vertical"
                      onScroll={periodSb.updateScrollbar}
                      onKeyDown={periodKeyDown}
                    >
                      {(['AM', 'PM'] as const).map((p, idx) => {
                        const isSelected = p === selectedPeriod;
                        return (
                          <button
                            key={p}
                            type="button"
                            role="option"
                            tabIndex={isSelected ? 0 : -1}
                            aria-selected={isSelected}
                            className={[
                              'sds-timepicker__item sds-menu-item',
                              isSelected && 'sds-menu-item--selected',
                            ].filter(Boolean).join(' ')}
                            onClick={() => {
                              commit({ period: p });
                              requestAnimationFrame(() => {
                                periodColRef.current
                                  ?.querySelectorAll<HTMLElement>('[role="option"]')[idx]
                                  ?.focus();
                              });
                            }}
                          >
                            <span className={['sds-menu-item__checkmark', isSelected && 'sds-menu-item__checkmark--selected'].filter(Boolean).join(' ')} aria-hidden="true">
                              <CheckIcon size={20} />
                            </span>
                            <span className="sds-menu-item__content">{p}</span>
                          </button>
                        );
                      })}
                    </div>
                    {periodSb.sb.visible && (
                      <div
                        className="sds-timepicker__scrollbar"
                        aria-hidden="true"
                        onPointerDown={periodSb.handleTrackPointerDown}
                      >
                        <div
                          className="sds-timepicker__scrollbar-indicator"
                          style={{ height: periodSb.sb.height, top: periodSb.sb.top }}
                          onPointerDown={periodSb.handleIndicatorPointerDown}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </>,
        document.body,
      )}

      {/* ── Support group — message ───────────────────────────────────────── */}
      {showSupport && (
        <div id={supportId} className="sds-timepicker__support">
          {showError   && <ErrorIcon size={16} />}
          {showSuccess && <SuccessIcon size={16} />}
          <p className="sds-timepicker__message">{message}</p>
        </div>
      )}

      {/*
        WCAG AA SC 4.1.3 — polite live region for time-change announcements.
        Kept separate from the trigger's accessible name so it fires on change,
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

export default TimePicker;
