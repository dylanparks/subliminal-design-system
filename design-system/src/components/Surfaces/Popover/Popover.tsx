import {
  Children,
  cloneElement,
  useState,
  useRef,
  useEffect,
  useCallback,
  useId,
  type ReactElement,
  type ReactNode,
  type MouseEvent,
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
import { CloseIcon } from '../../../icons';
import { useDirection } from '../../../utilities/useDirection';
import './Popover.css';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PopoverSide = 'top' | 'bottom' | 'start' | 'end';

export interface PopoverProps {
  /** Short header — rendered as subtitle/medium. */
  title?: ReactNode;
  /** Supporting text — rendered as body-content/small. */
  description?: ReactNode;
  /** Custom content slot — overrides title + description layout. */
  content?: ReactNode;
  /** Single interactive element that triggers the popover. Must accept a ref. */
  children: ReactElement;
  /**
   * Preferred side relative to the trigger. Flips when space is insufficient.
   * `start`/`end` are direction-aware (LTR: left/right; RTL: right/left).
   * @default 'top'
   */
  side?: PopoverSide;
  /** Also open on hover / focus, not just click. @default false */
  openOnHover?: boolean;
  /** Controlled open state. */
  open?: boolean;
  /** Initial open state for uncontrolled usage. @default false */
  defaultOpen?: boolean;
  /** Called when the open state changes. */
  onOpenChange?: (open: boolean) => void;
  /** Show the × close button. @default true */
  showCloseButton?: boolean;
  /** Suppress the popover entirely. */
  disabled?: boolean;
  className?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CARET_W           = 12; // caret base width
const CARET_H           = 6;  // caret height
const EXIT_MS           = 150;
const HOVER_CLOSE_DELAY = 100;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseSide(placement: Placement): Side {
  return placement.split('-')[0] as Side;
}

function sideToPlacement(side: PopoverSide, dir: 'ltr' | 'rtl'): Placement {
  if (side === 'start') return dir === 'rtl' ? 'right' : 'left';
  if (side === 'end')   return dir === 'rtl' ? 'left'  : 'right';
  return side as Placement;
}

function caretStyle(side: Side, x?: number, y?: number): React.CSSProperties {
  switch (side) {
    case 'top':    return { position: 'absolute', bottom: -CARET_H, left: x };
    case 'bottom': return { position: 'absolute', top:    -CARET_H, left: x };
    case 'left':   return { position: 'absolute', right:  -CARET_H, top:  y };
    case 'right':  return { position: 'absolute', left:   -CARET_H, top:  y };
  }
}

function caretDims(side: Side): { w: number; h: number } {
  return (side === 'left' || side === 'right')
    ? { w: CARET_H, h: CARET_W }
    : { w: CARET_W, h: CARET_H };
}

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
      fill:   `M-1,0 L-1,${h} L${w},${h / 2} Z`,
      stroke: `M0,0 L${w},${h / 2} L0,${h}`,
    };
    case 'right':  return {
      fill:   `M${w + 1},0 L${w + 1},${h} L0,${h / 2} Z`,
      stroke: `M${w},0 L0,${h / 2} L${w},${h}`,
    };
  }
}

// ─── Popover ──────────────────────────────────────────────────────────────────

export function Popover({
  title,
  description,
  content,
  children,
  side = 'top',
  openOnHover = false,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  showCloseButton = true,
  disabled = false,
  className,
}: PopoverProps) {
  const popupId = useId();
  const titleId = useId();
  const descId  = useId();

  const triggerRef = useRef<HTMLElement>(null);
  const popupRef   = useRef<HTMLDivElement>(null);
  const arrowRef   = useRef<SVGSVGElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const isOpen       = isControlled ? controlledOpen : internalOpen;

  const [mounted,    setMounted]    = useState(isOpen);
  const [visible,    setVisible]    = useState(false);
  const [activeSide, setActiveSide] = useState<Side>(() =>
    side === 'start' || side === 'end' ? 'left' : side as Side
  );
  const [arrowPos, setArrowPos] = useState<{ x?: number; y?: number }>({});

  const dir       = useDirection();
  const placement = sideToPlacement(side, dir);

  // ── Open/close state ────────────────────────────────────────────────────────

  function changeOpen(next: boolean) {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  }

  // Mount/visible two-phase: mount immediately, fade in; fade out then unmount.
  useEffect(() => {
    if (isOpen) {
      setMounted(true);
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), EXIT_MS);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // ── Floating UI positioning ─────────────────────────────────────────────────

  const reposition = useCallback(() => {
    const trigger = triggerRef.current;
    const popup   = popupRef.current;
    const arrowEl = arrowRef.current;
    if (!trigger || !popup || !arrowEl) return;

    computePosition(trigger, popup, {
      placement: placement as Placement,
      strategy:  'fixed',
      middleware: [
        offset(CARET_H + 4),
        flip({ padding: 8 }),
        shift({ padding: 8 }),
        arrow({ element: arrowEl, padding: 6 }),
      ],
    }).then(({ x, y, placement: resolved, middlewareData }) => {
      if (!popup) return;
      popup.style.left = `${x}px`;
      popup.style.top  = `${y}px`;
      const side = parseSide(resolved);
      setActiveSide(side);
      const a = middlewareData.arrow;
      setArrowPos({ x: a?.x, y: a?.y });
    });
  }, [placement]);

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

  // ── Focus: move to close button (or popup itself) on open ──────────────────

  useEffect(() => {
    if (!visible) return;
    const popup = popupRef.current;
    if (!popup) return;
    const firstFocusable = popup.querySelector<HTMLElement>('button, [tabindex="0"]');
    (firstFocusable ?? popup).focus();
  }, [visible]);

  // ── Dismiss: outside mousedown + Escape ────────────────────────────────────

  useEffect(() => {
    if (!mounted) return;

    function onMouseDown(e: globalThis.MouseEvent) {
      if (
        popupRef.current?.contains(e.target as Node) ||
        triggerRef.current?.contains(e.target as Node)
      ) return;
      changeOpen(false);
    }

    function onKeyDown(e: globalThis.KeyboardEvent) {
      if (e.key === 'Escape') {
        changeOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown',   onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown',   onKeyDown);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  // Cleanup autoUpdate on unmount
  useEffect(() => () => {
    clearTimeout(hoverTimer.current);
    cleanupRef.current?.();
  }, []);

  // ── Hover handlers ──────────────────────────────────────────────────────────

  function handleTriggerMouseEnter() {
    if (!openOnHover || disabled) return;
    clearTimeout(hoverTimer.current);
    changeOpen(true);
  }

  function handleTriggerMouseLeave(e: MouseEvent<HTMLElement>) {
    if (!openOnHover) return;
    if (popupRef.current?.contains(e.relatedTarget as Node)) return;
    hoverTimer.current = setTimeout(() => changeOpen(false), HOVER_CLOSE_DELAY);
  }

  function handlePopupMouseEnter() {
    if (!openOnHover) return;
    clearTimeout(hoverTimer.current);
  }

  function handlePopupMouseLeave(e: MouseEvent<HTMLDivElement>) {
    if (!openOnHover) return;
    if (triggerRef.current?.contains(e.relatedTarget as Node)) return;
    hoverTimer.current = setTimeout(() => changeOpen(false), HOVER_CLOSE_DELAY);
  }

  // ── Trigger injection ───────────────────────────────────────────────────────

  const child         = Children.only(children);
  const existingProps = child.props as Record<string, unknown>;

  function compose<E>(handler: (e: E) => void, existing: unknown): (e: E) => void {
    return (e: E) => {
      handler(e);
      (existing as ((e: E) => void) | undefined)?.(e);
    };
  }

  const trigger = cloneElement(child as ReactElement<Record<string, unknown>>, {
    ref:             triggerRef,
    'aria-expanded': isOpen,
    'aria-controls': mounted ? popupId : undefined,
    'aria-haspopup': 'dialog',
    onClick:       compose<MouseEvent<HTMLElement>>(
      () => { if (!disabled) changeOpen(!isOpen); },
      existingProps.onClick,
    ),
    onMouseEnter: compose<MouseEvent<HTMLElement>>(handleTriggerMouseEnter, existingProps.onMouseEnter),
    onMouseLeave: compose<MouseEvent<HTMLElement>>(handleTriggerMouseLeave, existingProps.onMouseLeave),
  });

  // ── Render ──────────────────────────────────────────────────────────────────

  const hasTitle = Boolean(title);
  const hasDesc  = Boolean(description);
  const { w, h }         = caretDims(activeSide);
  const { fill, stroke } = caretPaths(activeSide, w, h);

  return (
    <>
      {trigger}
      {mounted && createPortal(
        <div
          ref={popupRef}
          id={popupId}
          role="dialog"
          aria-labelledby={hasTitle ? titleId : undefined}
          aria-describedby={hasDesc ? descId : undefined}
          tabIndex={-1}
          className={[
            'sds-popover',
            `sds-popover--${activeSide}`,
            visible && 'sds-popover--visible',
            className,
          ].filter(Boolean).join(' ')}
          style={{ position: 'fixed' }}
          onMouseEnter={handlePopupMouseEnter}
          onMouseLeave={handlePopupMouseLeave}
        >
          <div className="sds-popover__popup">
            {showCloseButton && (
              <button
                type="button"
                className="sds-popover__close"
                aria-label="Close"
                onClick={() => {
                  changeOpen(false);
                  triggerRef.current?.focus();
                }}
              >
                <CloseIcon size={16} />
              </button>
            )}

            {content ?? (
              <div className="sds-popover__body">
                {hasTitle && (
                  <span id={titleId} className="sds-popover__title sds-text--subtitle-medium">
                    {title}
                  </span>
                )}
                {hasDesc && (
                  <span id={descId} className="sds-popover__description sds-text--body-content-small">
                    {description}
                  </span>
                )}
              </div>
            )}
          </div>

          <svg
            ref={arrowRef}
            className="sds-popover__caret"
            width={w}
            height={h}
            viewBox={`0 0 ${w} ${h}`}
            aria-hidden="true"
            style={caretStyle(activeSide, arrowPos.x, arrowPos.y)}
          >
            <path className="sds-popover__caret-fill"   d={fill}   />
            <path className="sds-popover__caret-stroke" d={stroke} />
          </svg>
        </div>,
        document.body,
      )}
    </>
  );
}
