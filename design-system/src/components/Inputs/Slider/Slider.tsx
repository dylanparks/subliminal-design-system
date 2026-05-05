import { useState, useRef, useId, useEffect, useCallback } from 'react';
import './Slider.css';
import { useDirection } from '../../../utilities/useDirection';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SliderBaseProps {
  /** Visible group label shown above the track. */
  label?: string;
  /** Accessible name when no visible `label` is provided. */
  'aria-label'?: string;
  /** Minimum value. @default 0 */
  min?: number;
  /** Maximum value. @default 100 */
  max?: number;
  /** Step increment for arrow-key and snap behaviour. @default 1 */
  step?: number;
  /**
   * Large step for Shift+Arrow and PageUp/PageDown.
   * @default 10 × step, or ~10% of the range — whichever is larger
   */
  largeStep?: number;
  /**
   * Show a numeric input next to the label so the user can type an exact value.
   * When false, a tooltip appears over the active thumb during drag/keyboard
   * interaction and auto-dismisses after 1.5 s.
   * @default true
   */
  showValue?: boolean;
  /**
   * Formatting options passed to `Intl.NumberFormat`.
   * Affects `aria-valuetext` and the tooltip/value display.
   * Examples: `{ style: 'percent' }`, `{ style: 'currency', currency: 'USD' }`,
   * `{ style: 'unit', unit: 'kilogram' }`.
   */
  formatOptions?: Intl.NumberFormatOptions;
  /**
   * Custom value-to-string formatter.
   * Takes precedence over `formatOptions` when both are provided.
   * Drives `aria-valuetext` and the tooltip/value display.
   */
  getValueText?: (value: number) => string;
  disabled?: boolean;
  required?: boolean;
  /** Forwarded to hidden `<input>` elements for form participation. */
  name?: string;
  id?: string;
  className?: string;
}

interface SingleSliderProps extends SliderBaseProps {
  range?: false;
  /** Controlled value. Omit for uncontrolled mode with `defaultValue`. */
  value?: number;
  /** Initial value for uncontrolled mode. @default min */
  defaultValue?: number;
  onChange?: (value: number) => void;
}

interface RangeSliderProps extends SliderBaseProps {
  range: true;
  /** Controlled [start, end] tuple. */
  value?: [number, number];
  /** Initial [start, end] for uncontrolled mode. @default [min, max] */
  defaultValue?: [number, number];
  onChange?: (value: [number, number]) => void;
}

export type SliderProps = SingleSliderProps | RangeSliderProps;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number) {
  return Math.min(Math.max(v, lo), hi);
}

function snap(v: number, min: number, step: number) {
  return Math.round((v - min) / step) * step + min;
}

const TOOLTIP_DISMISS_MS = 1500;

// ─── Slider ───────────────────────────────────────────────────────────────────

/**
 * Slider — a draggable range control with optional numeric input.
 *
 * Each thumb is a `div[role="slider"]` with full ARIA attributes and keyboard
 * support per ARIA APG (Arrow ±step, Shift+Arrow ±largeStep, Home/End,
 * PageUp/PageDown). Horizontal arrows are RTL-aware.
 *
 * Supports controlled (`value` + `onChange`) and uncontrolled (`defaultValue`)
 * modes, and a discriminated union for single vs. range mode (`range` prop).
 */
export function Slider(props: SliderProps) {
  const {
    label,
    'aria-label': ariaLabel,
    min = 0,
    max = 100,
    step = 1,
    showValue = true,
    formatOptions,
    getValueText,
    disabled = false,
    required = false,
    name,
    id,
    className,
  } = props;

  const largeStep = props.largeStep ?? Math.max(step, Math.round((max - min) / 10));

  const uid     = useId();
  const labelId = `${uid}-label`;
  const dir     = useDirection();

  // ─── Value state ────────────────────────────────────────────────────────────

  const [internalValue, setInternalValue] = useState<number | [number, number]>(() => {
    if (props.range) return (props as RangeSliderProps).defaultValue ?? [min, max];
    return (props as SingleSliderProps).defaultValue ?? min;
  });

  const resolvedValue = (() => {
    if (props.range) {
      const v = (props as RangeSliderProps).value;
      return v !== undefined ? v : (internalValue as [number, number]);
    }
    const v = (props as SingleSliderProps).value;
    return v !== undefined ? v : (internalValue as number);
  })();

  const isControlled = props.range
    ? (props as RangeSliderProps).value !== undefined
    : (props as SingleSliderProps).value !== undefined;

  const commit = (next: number | [number, number]) => {
    if (disabled) return;
    if (!isControlled) setInternalValue(next);
    if (props.range) {
      (props as RangeSliderProps).onChange?.(next as [number, number]);
    } else {
      (props as SingleSliderProps).onChange?.(next as number);
    }
  };

  // ─── Formatting ─────────────────────────────────────────────────────────────

  const formatValue = useCallback((v: number): string => {
    if (getValueText) return getValueText(v);
    if (formatOptions) return new Intl.NumberFormat(undefined, formatOptions).format(v);
    return String(v);
  }, [getValueText, formatOptions]);

  // ─── Tooltip state ──────────────────────────────────────────────────────────

  const [tooltipThumb, setTooltipThumb] = useState<null | 'single' | 'start' | 'end'>(null);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flashTooltip = (thumb: 'single' | 'start' | 'end') => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    setTooltipThumb(thumb);
    dismissTimer.current = setTimeout(() => setTooltipThumb(null), TOOLTIP_DISMISS_MS);
  };

  useEffect(() => () => { if (dismissTimer.current) clearTimeout(dismissTimer.current); }, []);

  // ─── Value input buffer ─────────────────────────────────────────────────────

  const rSingle = props.range ? 0         : (resolvedValue as number);
  const rStart  = props.range ? (resolvedValue as [number, number])[0] : 0;
  const rEnd    = props.range ? (resolvedValue as [number, number])[1] : 0;

  const [bufStart, setBufStart] = useState(() => String(props.range ? rStart : rSingle));
  const [bufEnd,   setBufEnd]   = useState(() => String(rEnd));

  useEffect(() => { setBufStart(String(props.range ? rStart : rSingle)); }, [rSingle, rStart, props.range]);
  useEffect(() => { setBufEnd(String(rEnd));                              }, [rEnd]);

  const commitBuf = (raw: string, which: 'single' | 'start' | 'end') => {
    const parsed = parseFloat(raw);
    if (isNaN(parsed)) {
      if (which === 'end') setBufEnd(String(rEnd));
      else setBufStart(String(props.range ? rStart : rSingle));
      return;
    }
    applyThumb(which, parsed);
  };

  // ─── Pointer-to-value helpers ────────────────────────────────────────────────

  const trackRef = useRef<HTMLDivElement>(null);

  const pctFromPointer = (clientX: number): number => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    const raw = clamp((clientX - rect.left) / rect.width, 0, 1);
    return dir === 'rtl' ? 1 - raw : raw;
  };

  // CSS left% for a given value (RTL-aware: min→right, max→left in RTL)
  const toLeftPct = (v: number) => {
    const pv = (v - min) / (max - min);
    return (dir === 'rtl' ? 1 - pv : pv) * 100;
  };

  // ─── applyThumb ─────────────────────────────────────────────────────────────

  const applyThumb = (thumb: 'single' | 'start' | 'end', rawValue: number) => {
    if (thumb === 'single') {
      const next = clamp(snap(rawValue, min, step), min, max);
      commit(next);
      setBufStart(String(next));
    } else if (thumb === 'start') {
      const end  = rEnd;
      const next = clamp(snap(rawValue, min, step), min, end - step);
      commit([next, end]);
      setBufStart(String(next));
    } else {
      const start = rStart;
      const next  = clamp(snap(rawValue, min, step), start + step, max);
      commit([start, next]);
      setBufEnd(String(next));
    }
  };

  // ─── Drag ───────────────────────────────────────────────────────────────────

  const startDrag = (thumb: 'single' | 'start' | 'end') =>
    (e: React.MouseEvent | React.TouchEvent) => {
      if (disabled) return;
      e.preventDefault();

      const onMove = (ev: MouseEvent | TouchEvent) => {
        const clientX = 'touches' in ev ? ev.touches[0].clientX : ev.clientX;
        applyThumb(thumb, pctFromPointer(clientX) * (max - min) + min);
        if (!showValue) flashTooltip(thumb);
      };

      const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('touchmove', onMove as EventListener);
        window.removeEventListener('mouseup',   onUp);
        window.removeEventListener('touchend',  onUp);
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('touchmove', onMove as EventListener, { passive: false });
      window.addEventListener('mouseup',   onUp);
      window.addEventListener('touchend',  onUp);
    };

  // ─── Keyboard ───────────────────────────────────────────────────────────────

  const handleKeyDown = (thumb: 'single' | 'start' | 'end') =>
    (e: React.KeyboardEvent) => {
      if (disabled) return;

      const current = thumb === 'single' ? rSingle
        : thumb === 'start'              ? rStart
        :                                  rEnd;

      const inc     = e.shiftKey ? largeStep : step;
      const dirMult = dir === 'rtl' ? -1 : 1;

      let next: number;
      switch (e.key) {
        case 'ArrowRight': next = current + inc * dirMult;  break;
        case 'ArrowLeft':  next = current - inc * dirMult;  break;
        case 'ArrowUp':    next = current + inc;            break;
        case 'ArrowDown':  next = current - inc;            break;
        case 'PageUp':     next = current + largeStep;      break;
        case 'PageDown':   next = current - largeStep;      break;
        case 'Home':       next = min;                      break;
        case 'End':        next = max;                      break;
        default: return;
      }

      e.preventDefault();
      applyThumb(thumb, next);
      if (!showValue) flashTooltip(thumb);
    };

  // ─── Fill style ─────────────────────────────────────────────────────────────

  const fillStyle = (() => {
    if (props.range) {
      const a = toLeftPct(rStart);
      const b = toLeftPct(rEnd);
      return { left: `${Math.min(a, b)}%`, width: `${Math.abs(b - a)}%` };
    }
    const origin = dir === 'rtl' ? 100 : 0;
    const tp     = toLeftPct(rSingle);
    return { left: `${Math.min(origin, tp)}%`, width: `${Math.abs(tp - origin)}%` };
  })();

  // ─── Tooltip value ───────────────────────────────────────────────────────────

  const tooltipValue = tooltipThumb === 'start' ? rStart
    : tooltipThumb === 'end'                     ? rEnd
    : rSingle;

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className={[
        'sds-slider',
        props.range   && 'sds-slider--range',
        disabled      && 'sds-slider--disabled',
        className,
      ].filter(Boolean).join(' ')}
      id={id}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="sds-slider__header">
        {label && (
          <span id={labelId} className="sds-slider__label">{label}</span>
        )}

        {showValue && (
          <div className="sds-slider__inputs">
            <input
              type="text"
              inputMode="numeric"
              className="sds-slider__input"
              value={bufStart}
              size={Math.max(1, bufStart.length)}
              disabled={disabled}
              required={!props.range && required}
              aria-label={
                props.range
                  ? (label ? `${label} minimum` : 'Minimum')
                  : (label || ariaLabel || 'Value')
              }
              onChange={e => setBufStart(e.target.value)}
              onBlur={() => commitBuf(bufStart, props.range ? 'start' : 'single')}
              onKeyDown={e => { if (e.key === 'Enter') commitBuf(bufStart, props.range ? 'start' : 'single'); }}
            />
            {props.range && (
              <>
                <span className="sds-slider__input-sep" aria-hidden="true">–</span>
                <input
                  type="text"
                  inputMode="numeric"
                  className="sds-slider__input"
                  value={bufEnd}
                  size={Math.max(1, bufEnd.length)}
                  disabled={disabled}
                  required={required}
                  aria-label={label ? `${label} maximum` : 'Maximum'}
                  onChange={e => setBufEnd(e.target.value)}
                  onBlur={() => commitBuf(bufEnd, 'end')}
                  onKeyDown={e => { if (e.key === 'Enter') commitBuf(bufEnd, 'end'); }}
                />
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Track ──────────────────────────────────────────────────────────── */}
      <div className="sds-slider__track-area" ref={trackRef}>
        <div className="sds-slider__track">
          <div className="sds-slider__fill" style={fillStyle} />
        </div>

        {/* Single thumb */}
        {!props.range && (
          <div
            className="sds-slider__thumb"
            role="slider"
            tabIndex={disabled ? -1 : 0}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={rSingle}
            aria-valuetext={formatValue(rSingle)}
            aria-label={label ? undefined : ariaLabel}
            aria-labelledby={label ? labelId : undefined}
            aria-disabled={disabled || undefined}
            style={{ left: `${toLeftPct(rSingle)}%` }}
            onMouseDown={startDrag('single')}
            onTouchStart={startDrag('single')}
            onKeyDown={handleKeyDown('single')}
          />
        )}

        {/* Range thumbs */}
        {props.range && (
          <>
            <div
              className="sds-slider__thumb sds-slider__thumb--start"
              role="slider"
              tabIndex={disabled ? -1 : 0}
              aria-valuemin={min}
              aria-valuemax={rEnd - step}
              aria-valuenow={rStart}
              aria-valuetext={formatValue(rStart)}
              aria-label={label ? `${label} minimum` : 'Minimum'}
              aria-disabled={disabled || undefined}
              style={{ left: `${toLeftPct(rStart)}%` }}
              onMouseDown={startDrag('start')}
              onTouchStart={startDrag('start')}
              onKeyDown={handleKeyDown('start')}
            />
            <div
              className="sds-slider__thumb sds-slider__thumb--end"
              role="slider"
              tabIndex={disabled ? -1 : 0}
              aria-valuemin={rStart + step}
              aria-valuemax={max}
              aria-valuenow={rEnd}
              aria-valuetext={formatValue(rEnd)}
              aria-label={label ? `${label} maximum` : 'Maximum'}
              aria-disabled={disabled || undefined}
              style={{ left: `${toLeftPct(rEnd)}%` }}
              onMouseDown={startDrag('end')}
              onTouchStart={startDrag('end')}
              onKeyDown={handleKeyDown('end')}
            />
          </>
        )}

        {/* Tooltip (showValue=false only) */}
        {!showValue && tooltipThumb !== null && (
          <div
            className="sds-slider__tooltip"
            role="tooltip"
            style={{ left: `${toLeftPct(tooltipValue)}%` }}
          >
            {formatValue(tooltipValue)}
          </div>
        )}
      </div>

      {/* Hidden inputs for form participation */}
      {name && !props.range && (
        <input type="hidden" name={name} value={rSingle} />
      )}
      {name && props.range && (
        <>
          <input type="hidden" name={`${name}[0]`} value={rStart} />
          <input type="hidden" name={`${name}[1]`} value={rEnd}   />
        </>
      )}
    </div>
  );
}
