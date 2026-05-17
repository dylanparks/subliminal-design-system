import {
  Children,
  cloneElement,
  useState,
  useRef,
  useEffect,
  useCallback,
  useId,
  type ReactElement,
  type MouseEvent,
  type FocusEvent,
  type KeyboardEvent,
} from 'react';
import {
  computePosition,
  flip,
  shift,
  offset,
  arrow,
  autoUpdate,
  type Placement,
  type Side,
} from '@floating-ui/dom';
import { createPortal } from 'react-dom';
import './Tooltip.css';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TooltipSide = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps {
  /** Brief text label — one short phrase. Never use for critical information. */
  content: string;
  /** Single interactive element that triggers the tooltip. Must accept a ref. */
  children: ReactElement;
  /**
   * Preferred side relative to the trigger. Flips automatically when there is
   * insufficient space on the preferred side.
   * @default 'top'
   */
  side?: TooltipSide;
  /**
   * Milliseconds to wait before opening on hover.
   * Focus always opens immediately.
   * @default 600
   */
  delay?: number;
  /** Suppress the tooltip entirely. */
  disabled?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CARET_W = 12; // triangle base width
const CARET_H = 6;  // triangle height
const EXIT_MS = 120;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseSide(placement: Placement): Side {
  return placement.split('-')[0] as Side;
}

// Position the SVG arrow element adjacent to the popup on the correct side.
function caretStyle(
  side: Side,
  x?: number,
  y?: number,
): React.CSSProperties {
  switch (side) {
    case 'top':    return { position: 'absolute', bottom: -CARET_H, left: x };
    case 'bottom': return { position: 'absolute', top:    -CARET_H, left: x };
    case 'left':   return { position: 'absolute', right:  -CARET_H, top:  y };
    case 'right':  return { position: 'absolute', left:   -CARET_H, top:  y };
  }
}

// SVG width/height — horizontal sides (top/bottom) are wider than tall; vertical sides swap.
function caretDims(side: Side): { w: number; h: number } {
  return (side === 'left' || side === 'right')
    ? { w: CARET_H, h: CARET_W }
    : { w: CARET_W, h: CARET_H };
}

// Fill path closes the full triangle background, extended 1px into the popup to
// cover the popup's outline at the junction. Stroke path covers only the two
// outer sides — not the base — matching Base UI's ArrowOuterStroke pattern.
function caretPaths(side: Side, w: number, h: number): { fill: string; stroke: string } {
  switch (side) {
    case 'top':    return {
      fill:   `M0,-1 L${w},-1 L${w / 2},${h} Z`,
      stroke: `M0,0 L${w / 2},${h} L${w},0`,
    };
    case 'bottom': return {
      fill:   `M0,${h + 1} L${w},${h + 1} L${w / 2},0 Z`,
      stroke: `M0,${h} L${w / 2},0 L${w},${h}`,
    };
    case 'left':   return {
      fill:   `M${w + 1},0 L${w + 1},${h} L0,${h / 2} Z`,
      stroke: `M${w},0 L0,${h / 2} L${w},${h}`,
    };
    case 'right':  return {
      fill:   `M-1,0 L-1,${h} L${w},${h / 2} Z`,
      stroke: `M0,0 L${w},${h / 2} L0,${h}`,
    };
  }
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

export function Tooltip({
  content,
  children,
  side = 'top',
  delay = 600,
  disabled = false,
}: TooltipProps) {
  const id         = useId();
  const triggerRef = useRef<HTMLElement>(null);
  const popupRef   = useRef<HTMLDivElement>(null);
  const caretRef   = useRef<SVGSVGElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const openTimer  = useRef<ReturnType<typeof setTimeout>>();
  const closeTimer = useRef<ReturnType<typeof setTimeout>>();

  const [mounted,     setMounted]     = useState(false);
  const [visible,     setVisible]     = useState(false);
  const [activeSide,  setActiveSide]  = useState<Side>(side as Side);
  const [caretOffset, setCaretOffset] = useState<{ x?: number; y?: number }>({});

  const reposition = useCallback(() => {
    const trigger = triggerRef.current;
    const popup   = popupRef.current;
    const caretEl = caretRef.current;
    if (!trigger || !popup || !caretEl) return;

    computePosition(trigger, popup, {
      placement: side as Placement,
      strategy:  'fixed',
      middleware: [
        offset(8),
        flip({ padding: 8 }),
        shift({ padding: 8 }),
        arrow({ element: caretEl, padding: 6 }),
      ],
    }).then(({ x, y, placement, middlewareData }) => {
      if (!popup) return;
      popup.style.left = `${x}px`;
      popup.style.top  = `${y}px`;
      setActiveSide(parseSide(placement));
      const a = middlewareData.arrow;
      setCaretOffset({ x: a?.x, y: a?.y });
    });
  }, [side]);

  useEffect(() => {
    if (!mounted) return;
    const trigger = triggerRef.current;
    const popup   = popupRef.current;
    if (!trigger || !popup) return;

    const rafId   = requestAnimationFrame(() => setVisible(true));
    const cleanup = autoUpdate(trigger, popup, reposition);
    cleanupRef.current = cleanup;

    return () => {
      cancelAnimationFrame(rafId);
      cleanup();
      cleanupRef.current = null;
    };
  }, [mounted, reposition]);

  useEffect(() => () => {
    clearTimeout(openTimer.current);
    clearTimeout(closeTimer.current);
    cleanupRef.current?.();
  }, []);

  function openTooltip() {
    clearTimeout(closeTimer.current);
    setMounted(true);
  }

  function closeTooltip() {
    clearTimeout(openTimer.current);
    setVisible(false);
    closeTimer.current = setTimeout(() => setMounted(false), EXIT_MS);
  }

  function handleMouseEnter() {
    if (disabled) return;
    clearTimeout(closeTimer.current);
    if (popupRef.current) setVisible(true);
    openTimer.current = setTimeout(openTooltip, delay);
  }

  function handleMouseLeave() {
    clearTimeout(openTimer.current);
    closeTooltip();
  }

  function handlePopupMouseEnter() {
    clearTimeout(closeTimer.current);
    setVisible(true);
  }

  function handlePopupMouseLeave() {
    closeTooltip();
  }

  function handleFocus() {
    if (disabled) return;
    clearTimeout(closeTimer.current);
    openTooltip();
  }

  function handleBlur()  { closeTooltip(); }

  function handleKeyDown(e: KeyboardEvent<HTMLElement>) {
    if (e.key === 'Escape') closeTooltip();
  }

  // ── Clone child to inject ref + aria + events ───────────────────────────────

  const child         = Children.only(children);
  const existingProps = child.props as Record<string, unknown>;

  function compose<E>(handler: (e: E) => void, existing: unknown): (e: E) => void {
    return (e: E) => {
      handler(e);
      (existing as ((e: E) => void) | undefined)?.(e);
    };
  }

  const trigger = cloneElement(child as ReactElement<Record<string, unknown>>, {
    ref:                triggerRef,
    'aria-describedby': mounted ? id : (existingProps['aria-describedby'] ?? undefined),
    onMouseEnter: compose<MouseEvent<HTMLElement>>(handleMouseEnter, existingProps.onMouseEnter),
    onMouseLeave: compose<MouseEvent<HTMLElement>>(handleMouseLeave, existingProps.onMouseLeave),
    onFocus:      compose<FocusEvent<HTMLElement>>(handleFocus,      existingProps.onFocus),
    onBlur:       compose<FocusEvent<HTMLElement>>(handleBlur,       existingProps.onBlur),
    onKeyDown:    compose<KeyboardEvent<HTMLElement>>(handleKeyDown, existingProps.onKeyDown),
  });

  const { w, h }        = caretDims(activeSide);
  const { fill, stroke } = caretPaths(activeSide, w, h);

  return (
    <>
      {trigger}
      {mounted && createPortal(
        <div
          ref={popupRef}
          id={id}
          role="tooltip"
          className={[
            'sds-tooltip',
            `sds-tooltip--${activeSide}`,
            visible && 'sds-tooltip--visible',
          ].filter(Boolean).join(' ')}
          style={{ position: 'fixed' }}
        >
          <div
            className="sds-tooltip__popup"
            onMouseEnter={handlePopupMouseEnter}
            onMouseLeave={handlePopupMouseLeave}
          >
            <span className="sds-tooltip__text sds-text--body-content-small">{content}</span>
          </div>
          <svg
            ref={caretRef}
            className="sds-tooltip__caret"
            width={w}
            height={h}
            viewBox={`0 0 ${w} ${h}`}
            aria-hidden="true"
            style={caretStyle(activeSide, caretOffset.x, caretOffset.y)}
          >
            <path className="sds-tooltip__caret-fill"   d={fill}   />
            <path className="sds-tooltip__caret-stroke" d={stroke} />
          </svg>
        </div>,
        document.body,
      )}
    </>
  );
}
