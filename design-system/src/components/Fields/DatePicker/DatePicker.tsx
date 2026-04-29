import React, {
  KeyboardEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { computePosition, flip, shift, offset, autoUpdate } from '@floating-ui/dom';
import { createPortal } from 'react-dom';
import {
  CalendarIcon,
  CloseIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowForwardIcon,
  SuccessIcon,
  ErrorIcon,
} from '../../../icons';
import { Button } from '../../Actions/Button/Button';
import './DatePicker.css';

// ─── Types ─────────────────────────────────────────────────────────────────

export type DatePickerMode = 'date' | 'range' | 'month' | 'year';
export type DatePickerSize = 'large' | 'medium';

/** A plain date with no timezone — year/month(1-12)/day */
export interface CalendarDate {
  year: number;
  month: number; // 1–12
  day: number;
}

export interface DatePickerProps {
  /** Display mode */
  mode?: DatePickerMode;
  /** Floating label */
  label?: string;
  /** Controlled single value (date / month / year modes) */
  value?: CalendarDate | null;
  /** Uncontrolled default (date / month / year modes) */
  defaultValue?: CalendarDate | null;
  /** Controlled range start (range mode) */
  startValue?: CalendarDate | null;
  /** Controlled range end (range mode) */
  endValue?: CalendarDate | null;
  /** Uncontrolled range start default */
  defaultStartValue?: CalendarDate | null;
  /** Uncontrolled range end default */
  defaultEndValue?: CalendarDate | null;
  /** Called when value changes (date / month / year); receives null when cleared */
  onChange?: (value: CalendarDate | null) => void;
  /** Called when range changes */
  onRangeChange?: (start: CalendarDate | null, end: CalendarDate | null) => void;
  /** Visual height */
  size?: DatePickerSize;
  /** Disables all interaction */
  disabled?: boolean;
  /** Error treatment */
  error?: boolean;
  /** Success treatment */
  success?: boolean;
  /** Helper / validation message */
  message?: string;
  /** Show a clear button when the field has a value */
  allowClear?: boolean;
  /** Additional className for the root */
  className?: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function today(): CalendarDate {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
}

function sameDate(a: CalendarDate | null | undefined, b: CalendarDate | null | undefined) {
  if (!a || !b) return false;
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

function dateToMs(d: CalendarDate) {
  return new Date(d.year, d.month - 1, d.day).getTime();
}

function isBetween(d: CalendarDate, start: CalendarDate | null, end: CalendarDate | null) {
  if (!start || !end) return false;
  const t = dateToMs(d), s = dateToMs(start), e = dateToMs(end);
  return t > Math.min(s, e) && t < Math.max(s, e);
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function buildDayGrid(year: number, month: number): CalendarDate[] {
  const firstDow = new Date(year, month - 1, 1).getDay();
  const days     = daysInMonth(year, month);
  const cells: CalendarDate[] = [];

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear  = month === 1 ? year - 1 : year;
  const prevDays  = daysInMonth(prevYear, prevMonth);
  for (let i = firstDow - 1; i >= 0; i--) cells.push({ year: prevYear, month: prevMonth, day: prevDays - i });

  for (let d = 1; d <= days; d++) cells.push({ year, month, day: d });

  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear  = month === 12 ? year + 1 : year;
  let nd = 1;
  while (cells.length < 42) cells.push({ year: nextYear, month: nextMonth, day: nd++ });

  return cells;
}

function formatDate(d: CalendarDate | null | undefined): string {
  if (!d) return '';
  return `${MONTH_NAMES[d.month - 1].slice(0, 3)} ${d.day}, ${d.year}`;
}

function formatMonth(d: CalendarDate | null | undefined): string {
  if (!d) return '';
  return `${MONTH_NAMES[d.month - 1]} ${d.year}`;
}

function formatYear(d: CalendarDate | null | undefined): string {
  return d ? String(d.year) : '';
}

// ─── makeGridKeyDown ───────────────────────────────────────────────────────
// Base Web-inspired adapter pattern: expresses grid navigation as a config
// object so the single switch block is shared across all three grid modes.

interface GridNav {
  right:  () => void;
  left:   () => void;
  down:   () => void;
  up:     () => void;
  select: () => void;
  close:  () => void;
}

function makeGridKeyDown(nav: GridNav) {
  return (e: KeyboardEvent<HTMLDivElement>) => {
    switch (e.key) {
      case 'ArrowRight': e.preventDefault(); nav.right();  break;
      case 'ArrowLeft':  e.preventDefault(); nav.left();   break;
      case 'ArrowDown':  e.preventDefault(); nav.down();   break;
      case 'ArrowUp':    e.preventDefault(); nav.up();     break;
      case 'Enter':
      case ' ':          e.preventDefault(); nav.select(); break;
      case 'Tab':        nav.close();        break;
    }
  };
}

// ─── CalendarHeader ────────────────────────────────────────────────────────
// Shared prev-title-next header used by all three panel types.

interface CalendarHeaderProps {
  title:     React.ReactNode;
  prevLabel: string;
  nextLabel: string;
  onPrev:    () => void;
  onNext:    () => void;
}

function CalendarHeader({ title, prevLabel, nextLabel, onPrev, onNext }: CalendarHeaderProps) {
  return (
    <div className="sds-datepicker__header">
      <Button
        variant="secondary"
        fillStyle="ghost"
        size="xsmall"
        showLabel={false}
        icon={<ChevronLeftIcon size={20} />}
        aria-label={prevLabel}
        onClick={onPrev}
      />
      <span className="sds-datepicker__header-title">{title}</span>
      <Button
        variant="secondary"
        fillStyle="ghost"
        size="xsmall"
        showLabel={false}
        icon={<ChevronRightIcon size={20} />}
        aria-label={nextLabel}
        onClick={onNext}
      />
    </div>
  );
}

// ─── DayGridPanel ──────────────────────────────────────────────────────────

interface DayGridProps {
  viewYear: number;
  viewMonth: number;
  selected?: CalendarDate | null;
  rangeStart?: CalendarDate | null;
  rangeEnd?: CalendarDate | null;
  hoverDate?: CalendarDate | null;
  isRange?: boolean;
  onSelect: (d: CalendarDate) => void;
  onHover?: (d: CalendarDate | null) => void;
  focusedDate?: CalendarDate | null;
  onFocusDate?: (d: CalendarDate) => void;
  onGridKeyDown?: (e: KeyboardEvent<HTMLDivElement>) => void;
  panelLabel: string;
}

function DayGridPanel({
  viewYear, viewMonth,
  selected, rangeStart, rangeEnd, hoverDate, isRange,
  onSelect, onHover,
  focusedDate, onFocusDate,
  onGridKeyDown,
  panelLabel,
}: DayGridProps) {
  const cells       = useMemo(() => buildDayGrid(viewYear, viewMonth), [viewYear, viewMonth]);
  const t           = today();
  const effectiveEnd = isRange && rangeStart && !rangeEnd ? hoverDate : rangeEnd;

  const rows: CalendarDate[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

  return (
    <table
      className="sds-datepicker__days"
      role="grid"
      aria-label={panelLabel}
      onKeyDown={onGridKeyDown}
    >
      <thead>
        <tr className="sds-datepicker__weekdays">
          {WEEKDAYS.map(d => (
            <th key={d} scope="col" className="sds-datepicker__weekday" abbr={d}>{d}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIdx) => (
          <tr key={rowIdx}>
            {row.map((cell, cellIdx) => {
              const isOutside    = cell.month !== viewMonth;
              const isTodayCell  = sameDate(cell, t);
              const isSelected   = isRange ? sameDate(cell, rangeStart) || sameDate(cell, rangeEnd) : sameDate(cell, selected);
              const isRangeStart = isRange && sameDate(cell, rangeStart);
              const isRangeEnd   = isRange && sameDate(cell, rangeEnd ?? effectiveEnd);
              const inRange      = isRange && isBetween(cell, rangeStart ?? null, effectiveEnd ?? null);
              const isFocused    = sameDate(cell, focusedDate);

              return (
                <td
                  key={cellIdx}
                  aria-selected={(isSelected || isRangeStart || isRangeEnd) ? true : undefined}
                  className={[
                    'sds-datepicker__day-cell',
                    inRange                       && 'sds-datepicker__day-cell--in-range',
                    isRangeStart && !isRangeEnd   && 'sds-datepicker__day-cell--range-start',
                    isRangeEnd   && !isRangeStart && 'sds-datepicker__day-cell--range-end',
                  ].filter(Boolean).join(' ')}
                >
                  <button
                    type="button"
                    tabIndex={isFocused ? 0 : -1}
                    className={[
                      'sds-datepicker__day-btn',
                      isOutside                      && 'sds-datepicker__day-btn--outside',
                      isTodayCell                    && 'sds-datepicker__day-btn--today',
                      isSelected && !isTodayCell     && 'sds-datepicker__day-btn--active',
                      isRangeStart                   && 'sds-datepicker__day-btn--range-start',
                      isRangeEnd                     && 'sds-datepicker__day-btn--range-end',
                    ].filter(Boolean).join(' ')}
                    aria-label={`${cell.day} ${MONTH_NAMES[cell.month - 1]} ${cell.year}`}
                    onMouseEnter={() => onHover?.(cell)}
                    onMouseLeave={() => onHover?.(null)}
                    onClick={() => onSelect(cell)}
                    onFocus={() => onFocusDate?.(cell)}
                  >
                    {cell.day}
                  </button>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────

export function DatePicker({
  mode         = 'date',
  label        = 'Date',
  value,
  defaultValue,
  startValue,
  endValue,
  defaultStartValue,
  defaultEndValue,
  onChange,
  onRangeChange,
  size         = 'large',
  allowClear   = true,
  disabled     = false,
  error        = false,
  success      = false,
  message,
  className,
}: DatePickerProps) {

  // ── Value state ───────────────────────────────────────────────────────────
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<CalendarDate | null>(defaultValue ?? null);
  const currentValue = isControlled ? (value ?? null) : internalValue;

  const isRangeControlled = startValue !== undefined || endValue !== undefined;
  const [internalStart, setInternalStart] = useState<CalendarDate | null>(defaultStartValue ?? null);
  const [internalEnd,   setInternalEnd]   = useState<CalendarDate | null>(defaultEndValue   ?? null);
  const currentStart = isRangeControlled ? (startValue ?? null) : internalStart;
  const currentEnd   = isRangeControlled ? (endValue   ?? null) : internalEnd;

  // ── Popover + calendar view state ─────────────────────────────────────────
  const [isOpen, setIsOpen] = useState(false);
  const t = today();

  const initialView = currentValue ?? currentStart ?? t;
  const [viewYear,       setViewYear]       = useState(initialView.year);
  const [viewMonth,      setViewMonth]      = useState(initialView.month);
  const [yearBlockStart, setYearBlockStart] = useState(Math.floor(initialView.year / 12) * 12);
  const [hoverDate,      setHoverDate]      = useState<CalendarDate | null>(null);
  const [rangePickingStart, setRangePickingStart] = useState<CalendarDate | null>(null);
  const [focusedDate,    setFocusedDate]    = useState<CalendarDate | null>(null);
  const [popoverStyle,   setPopoverStyle]   = useState<React.CSSProperties>({});
  const [ready,          setReady]          = useState(false);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const wrapperRef      = useRef<HTMLDivElement>(null);
  const popoverRef      = useRef<HTMLDivElement>(null);
  const triggerRef      = useRef<HTMLButtonElement>(null);
  const statusRef       = useRef<HTMLSpanElement>(null);
  const shouldFocusGrid = useRef(false);
  const fieldId         = useId();
  const supportId       = `${fieldId}-support`;

  // ── Derived ───────────────────────────────────────────────────────────────
  const isFilled    = mode === 'range' ? !!(currentStart || currentEnd) : !!currentValue;
  const showError   = error   && !disabled;
  const showSuccess = success && !disabled && !error;
  const showSupport = !disabled && !!message;

  // ── Open / close ──────────────────────────────────────────────────────────
  function openPopover() {
    if (disabled) return;
    const initFocus = mode === 'range' ? (currentStart ?? t) : (currentValue ?? t);
    setFocusedDate(initFocus);
    setViewYear(initFocus.year);
    setViewMonth(initFocus.month);
    setReady(false);
    setIsOpen(true);
  }

  function closePopover() {
    setIsOpen(false);
    setReady(false);
    setRangePickingStart(null);
    setHoverDate(null);
  }

  // ── Save + restore focus ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.activeElement as HTMLElement | null;
    return () => { prev?.focus(); };
  }, [isOpen]);

  // ── Positioning — Floating UI autoUpdate ─────────────────────────────────
  useEffect(() => {
    if (!isOpen || !wrapperRef.current || !popoverRef.current) return;
    const anchor     = wrapperRef.current;
    const floatingEl = popoverRef.current;

    const cleanup = autoUpdate(anchor, floatingEl, () => {
      computePosition(anchor, floatingEl, {
        placement: 'bottom-start',
        strategy:  'fixed',
        middleware: [offset(4), flip({ padding: 8 }), shift({ padding: 8 })],
      }).then(({ x, y }) => {
        setPopoverStyle({ position: 'fixed', top: y, left: x });
        setReady(true);
      });
    });

    return () => {
      cleanup();
      setReady(false);
    };
  }, [isOpen]);

  // ── Auto-focus first nav button on open ───────────────────────────────────
  // Tab order: prev-nav → next-nav → focused grid cell (roving tabindex)
  useEffect(() => {
    if (!ready || !popoverRef.current) return;
    popoverRef.current.querySelector<HTMLElement>('.sds-datepicker__header button')?.focus();
  }, [ready]);

  // ── Move DOM focus after arrow-key navigation ─────────────────────────────
  useEffect(() => {
    if (!isOpen || !shouldFocusGrid.current || !popoverRef.current) return;
    shouldFocusGrid.current = false;
    popoverRef.current.querySelector<HTMLElement>(
      '.sds-datepicker__day-btn[tabindex="0"], .sds-datepicker__grid-btn[tabindex="0"]'
    )?.focus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedDate, isOpen]);

  // ── Close on outside pointerdown / resize ────────────────────────────────
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
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // ── Selection handlers ────────────────────────────────────────────────────
  function handleDateSelect(d: CalendarDate) {
    if (!isControlled) setInternalValue(d);
    onChange?.(d);
    announce(`${formatDate(d)} selected.`);
    closePopover();
  }

  function handleRangeSelect(d: CalendarDate) {
    if (!rangePickingStart) {
      setRangePickingStart(d);
      if (!isRangeControlled) { setInternalStart(d); setInternalEnd(null); }
      onRangeChange?.(d, null);
    } else {
      const [s, e] = dateToMs(d) >= dateToMs(rangePickingStart)
        ? [rangePickingStart, d] : [d, rangePickingStart];
      if (!isRangeControlled) { setInternalStart(s); setInternalEnd(e); }
      onRangeChange?.(s, e);
      announce(`${formatDate(s)} to ${formatDate(e)} selected.`);
      setRangePickingStart(null);
      closePopover();
    }
  }

  function handleMonthSelect(month: number) {
    const d: CalendarDate = { year: viewYear, month, day: 1 };
    if (!isControlled) setInternalValue(d);
    onChange?.(d);
    announce(`${MONTH_NAMES[month - 1]} ${viewYear} selected.`);
    closePopover();
  }

  function handleYearSelect(year: number) {
    const d: CalendarDate = { year, month: 1, day: 1 };
    if (!isControlled) setInternalValue(d);
    onChange?.(d);
    announce(`${year} selected.`);
    closePopover();
  }

  function announce(text: string) {
    if (!statusRef.current) return;
    statusRef.current.textContent = '';
    requestAnimationFrame(() => { if (statusRef.current) statusRef.current.textContent = text; });
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    if (mode === 'range') {
      if (!isRangeControlled) { setInternalStart(null); setInternalEnd(null); }
      onRangeChange?.(null, null);
    } else {
      if (!isControlled) setInternalValue(null);
      onChange?.(null);
    }
    closePopover();
    triggerRef.current?.focus();
  }

  // ── View navigation ───────────────────────────────────────────────────────
  function prevMonth() {
    if (viewMonth === 1) { setViewMonth(12); setViewYear(y => y - 1); } else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 12) { setViewMonth(1); setViewYear(y => y + 1); } else setViewMonth(m => m + 1);
  }
  const prevYear      = () => setViewYear(y => y - 1);
  const nextYear      = () => setViewYear(y => y + 1);
  const prevYearBlock = () => setYearBlockStart(s => s - 12);
  const nextYearBlock = () => setYearBlockStart(s => s + 12);

  // ── Keyboard: focused-cell shift helpers ─────────────────────────────────
  function shiftFocusedDay(delta: number) {
    if (!focusedDate) return;
    const d = new Date(focusedDate.year, focusedDate.month - 1, focusedDate.day + delta);
    const next: CalendarDate = { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
    shouldFocusGrid.current = true;
    setFocusedDate(next);
    if (next.month !== viewMonth || next.year !== viewYear) {
      setViewMonth(next.month);
      setViewYear(next.year);
    }
  }

  function shiftFocusedMonth(delta: number) {
    if (!focusedDate) return;
    const total      = (focusedDate.month - 1) + delta;
    const nextMonth  = ((total % 12) + 12) % 12 + 1;
    const nextYear   = focusedDate.year + Math.floor(total / 12);
    shouldFocusGrid.current = true;
    setFocusedDate({ year: nextYear, month: nextMonth, day: 1 });
    if (nextYear !== viewYear) setViewYear(nextYear);
  }

  function shiftFocusedYear(delta: number) {
    if (!focusedDate) return;
    const nextYear = focusedDate.year + delta;
    shouldFocusGrid.current = true;
    setFocusedDate({ year: nextYear, month: 1, day: 1 });
    if (nextYear < yearBlockStart)           setYearBlockStart(s => s - 12);
    else if (nextYear >= yearBlockStart + 12) setYearBlockStart(s => s + 12);
  }

  // ── Grid key handlers (one switch block shared via makeGridKeyDown) ───────
  const dateGridKeyDown  = makeGridKeyDown({
    right:  () => shiftFocusedDay(1),
    left:   () => shiftFocusedDay(-1),
    down:   () => shiftFocusedDay(7),
    up:     () => shiftFocusedDay(-7),
    select: () => focusedDate && (mode === 'range' ? handleRangeSelect(focusedDate) : handleDateSelect(focusedDate)),
    close:  closePopover,
  });

  const monthGridKeyDown = makeGridKeyDown({
    right:  () => shiftFocusedMonth(1),
    left:   () => shiftFocusedMonth(-1),
    down:   () => shiftFocusedMonth(3),
    up:     () => shiftFocusedMonth(-3),
    select: () => focusedDate && handleMonthSelect(focusedDate.month),
    close:  closePopover,
  });

  const yearGridKeyDown  = makeGridKeyDown({
    right:  () => shiftFocusedYear(1),
    left:   () => shiftFocusedYear(-1),
    down:   () => shiftFocusedYear(3),
    up:     () => shiftFocusedYear(-3),
    select: () => focusedDate && handleYearSelect(focusedDate.year),
    close:  closePopover,
  });

  // ── Trigger keyboard ──────────────────────────────────────────────────────
  function handleTriggerKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (!isOpen && ['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
      e.preventDefault();
      openPopover();
    }
    if (isOpen && e.key === 'Escape') { e.preventDefault(); closePopover(); }
  }

  // ── Trigger label ─────────────────────────────────────────────────────────
  function triggerLabel(): string {
    if (mode === 'date')  return formatDate(currentValue);
    if (mode === 'month') return formatMonth(currentValue);
    if (mode === 'year')  return formatYear(currentValue);
    if (!currentStart && !currentEnd) return '';
    return `${formatDate(currentStart)} – ${formatDate(currentEnd)}`;
  }

  // ── Root classes ──────────────────────────────────────────────────────────
  const rootClasses = [
    'sds-datepicker',
    `sds-datepicker--${size}`,
    isFilled               && 'sds-datepicker--filled',
    isOpen                 && 'sds-datepicker--open',
    disabled               && 'sds-datepicker--disabled',
    allowClear && !disabled && 'sds-datepicker--clearable',
    showError              && 'sds-datepicker--error',
    showSuccess            && 'sds-datepicker--success',
    className,
  ].filter(Boolean).join(' ');

  // ── Popover content ───────────────────────────────────────────────────────
  function renderCalendarPanel() {
    const isRange = mode === 'range';

    if (mode === 'date' || isRange) {
      const nextM = viewMonth === 12 ? 1 : viewMonth + 1;
      const nextY = viewMonth === 12 ? viewYear + 1 : viewYear;

      function datePanel(year: number, month: number) {
        return (
          <div className="sds-datepicker__panel" key={`${year}-${month}`}>
            <CalendarHeader
              title={`${MONTH_NAMES[month - 1]} ${year}`}
              prevLabel="Previous month"
              nextLabel="Next month"
              onPrev={prevMonth}
              onNext={nextMonth}
            />
            <DayGridPanel
              viewYear={year}
              viewMonth={month}
              selected={!isRange ? currentValue : undefined}
              rangeStart={isRange ? (rangePickingStart ?? currentStart) : undefined}
              rangeEnd={isRange ? currentEnd : undefined}
              hoverDate={hoverDate}
              isRange={isRange}
              onSelect={isRange ? handleRangeSelect : handleDateSelect}
              onHover={setHoverDate}
              focusedDate={focusedDate}
              onFocusDate={setFocusedDate}
              onGridKeyDown={dateGridKeyDown}
              panelLabel={`${MONTH_NAMES[month - 1]} ${year}`}
            />
          </div>
        );
      }

      if (!isRange) return datePanel(viewYear, viewMonth);
      return (
        <>
          {datePanel(viewYear, viewMonth)}
          <div className="sds-datepicker__divider" aria-hidden="true" />
          {datePanel(nextY, nextM)}
        </>
      );
    }

    if (mode === 'month') {
      const monthRows = [0, 4, 8].map(start => MONTH_SHORT.slice(start, start + 4));
      return (
        <div className="sds-datepicker__panel">
          <CalendarHeader
            title={viewYear}
            prevLabel="Previous year"
            nextLabel="Next year"
            onPrev={prevYear}
            onNext={nextYear}
          />
          <table
            className="sds-datepicker__grid"
            role="grid"
            aria-label={`Months of ${viewYear}`}
            onKeyDown={monthGridKeyDown}
          >
            <tbody>
              {monthRows.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  {row.map((name, colIdx) => {
                    const month      = rowIdx * 4 + colIdx + 1;
                    const isSelected = currentValue?.year === viewYear && currentValue?.month === month;
                    const isCurrent  = t.year === viewYear && t.month === month;
                    const isFocused  = focusedDate?.year === viewYear && focusedDate?.month === month;
                    return (
                      <td key={month} aria-selected={isSelected ? true : undefined} className="sds-datepicker__grid-cell">
                        <button
                          type="button"
                          tabIndex={isFocused ? 0 : -1}
                          className={['sds-datepicker__grid-btn', isCurrent && 'sds-datepicker__grid-btn--current'].filter(Boolean).join(' ')}
                          aria-label={`${MONTH_NAMES[month - 1]} ${viewYear}`}
                          onClick={() => handleMonthSelect(month)}
                        >
                          {name}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // year mode
    const years = Array.from({ length: 12 }, (_, i) => yearBlockStart + i);
    const yearRows = [0, 4, 8].map(start => years.slice(start, start + 4));
    return (
      <div className="sds-datepicker__panel">
        <CalendarHeader
          title={`${yearBlockStart}–${yearBlockStart + 11}`}
          prevLabel="Previous years"
          nextLabel="Next years"
          onPrev={prevYearBlock}
          onNext={nextYearBlock}
        />
        <table
          className="sds-datepicker__grid"
          role="grid"
          aria-label={`Years ${yearBlockStart} to ${yearBlockStart + 11}`}
          onKeyDown={yearGridKeyDown}
        >
          <tbody>
            {yearRows.map((row, rowIdx) => (
              <tr key={rowIdx}>
                {row.map(year => {
                  const isSelected = currentValue?.year === year;
                  const isCurrent  = t.year === year;
                  const isFocused  = focusedDate?.year === year;
                  return (
                    <td key={year} aria-selected={isSelected ? true : undefined} className="sds-datepicker__grid-cell">
                      <button
                        type="button"
                        tabIndex={isFocused ? 0 : -1}
                        className={['sds-datepicker__grid-btn', isCurrent && 'sds-datepicker__grid-btn--current'].filter(Boolean).join(' ')}
                        aria-label={String(year)}
                        onClick={() => handleYearSelect(year)}
                      >
                        {year}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={rootClasses}>

      <div ref={wrapperRef} className="sds-datepicker__wrapper">
        <button
          ref={triggerRef}
          type="button"
          className="sds-datepicker__trigger"
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-label={isFilled ? `${label}: ${triggerLabel()}` : label}
          aria-describedby={showSupport ? supportId : undefined}
          onKeyDown={handleTriggerKeyDown}
          onClick={() => isOpen ? closePopover() : openPopover()}
        >
          <div className="sds-datepicker__inner">
            <span className="sds-datepicker__label" aria-hidden="true">{label}</span>
            {/* Value — always in DOM, visibility via CSS on --filled */}
            {mode === 'range' ? (
              <div className="sds-datepicker__value sds-datepicker__value--range" aria-hidden="true">
                <span className="sds-datepicker__range-date">{formatDate(currentStart)}</span>
                <span className="sds-datepicker__range-sep" aria-hidden="true"><ArrowForwardIcon size={14} /></span>
                <span className="sds-datepicker__range-date">{formatDate(currentEnd)}</span>
              </div>
            ) : (
              <span className="sds-datepicker__value" aria-hidden="true">{triggerLabel()}</span>
            )}
          </div>
        </button>
        {!disabled && allowClear && (
          <button
            type="button"
            className="sds-datepicker__clear"
            aria-label="Clear date"
            tabIndex={-1}
            onClick={handleClear}
          >
            <CloseIcon />
          </button>
        )}
        <span
          className="sds-datepicker__icon"
          aria-hidden="true"
          onClick={() => { if (!disabled) isOpen ? closePopover() : openPopover(); }}
        >
          <CalendarIcon size={20} />
        </span>
      </div>

      {isOpen && createPortal(
        <>
          <div className="sds-datepicker__backdrop" onClick={closePopover} aria-hidden="true" />
          <div
            ref={popoverRef}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            tabIndex={-1}
            className={[
              'sds-datepicker__popover',
              ready               && 'sds-datepicker__popover--ready',
              mode === 'range'    && 'sds-datepicker__popover--range',
            ].filter(Boolean).join(' ')}
            style={popoverStyle}
            onKeyDown={e => { if (e.key === 'Escape') { e.preventDefault(); closePopover(); } }}
          >
            {renderCalendarPanel()}
          </div>
        </>,
        document.body,
      )}

      {showSupport && (
        <div id={supportId} className="sds-datepicker__support">
          {showError   && <ErrorIcon size={16} />}
          {showSuccess && <SuccessIcon size={16} />}
          <p className="sds-datepicker__message">{message}</p>
        </div>
      )}

      <span ref={statusRef} role="status" aria-live="polite" aria-atomic="true" className="sds-sr-only" />
    </div>
  );
}

export default DatePicker;
