import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
  type FocusEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon } from '../../../icons';
import { Button } from '../../Actions/Button/Button';
import './Toast.css';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastPosition =
  | 'bottom-end'
  | 'bottom-center'
  | 'bottom-start'
  | 'top-end'
  | 'top-center'
  | 'top-start';

export interface ToastAction {
  label:    string;
  onClick?: () => void;
  /** @default 'filled' for first action, 'hollow' for subsequent */
  variant?: 'filled' | 'hollow';
  icon?:    ReactNode;
}

export interface ToastOptions {
  /** Short heading — required. */
  title:             ReactNode;
  /** Supporting text below the title. */
  description?:      ReactNode;
  /**
   * Milliseconds before auto-dismissing. Pass `0` to persist indefinitely.
   * @default 5000
   */
  duration?:         number;
  /** Show the × dismiss button. @default true */
  showCloseButton?:  boolean;
  /** Up to 2 action buttons. Clicking any action also dismisses the toast. */
  actions?:          ToastAction[];
}

interface ToastItem extends ToastOptions {
  id: string;
}

interface ToastContextValue {
  add:        (options: ToastOptions) => string;
  dismiss:    (id: string) => void;
  dismissAll: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_DURATION  = 5000;
const EXIT_MS           = 200;
const EXPAND_DURATION   = 200; // matches CSS transition duration

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

function generateId(): string {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `toast-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

// ─── useToast ─────────────────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

// ─── PeekCard (visual stack depth indicator) ─────────────────────────────────

function PeekCard({ depth }: { depth: 1 | 2 }) {
  return (
    <div
      className={`sds-toast sds-toast--peek sds-toast--peek-${depth}`}
      aria-hidden="true"
    >
      <div className="sds-toast__card" />
    </div>
  );
}

// ─── FrontCard (fully interactive, visible toast) ────────────────────────────

interface FrontCardProps {
  toast:     ToastItem;
  isTop:     boolean;
  onDismiss: () => void;
}

function FrontCard({ toast, isTop, onDismiss }: FrontCardProps) {
  const [visible,  setVisible]  = useState(false);
  const timerRef                 = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const remainingRef             = useRef(toast.duration ?? DEFAULT_DURATION);
  const startTimeRef             = useRef<number | null>(null);
  const isPersist                = toast.duration === 0;

  function startTimer() {
    if (isPersist || remainingRef.current <= 0) return;
    startTimeRef.current = Date.now();
    timerRef.current     = setTimeout(handleDismiss, remainingRef.current);
  }

  function pauseTimer() {
    if (isPersist) return;
    clearTimeout(timerRef.current);
    if (startTimeRef.current !== null) {
      remainingRef.current -= Date.now() - startTimeRef.current;
      startTimeRef.current  = null;
    }
  }

  function handleDismiss() {
    clearTimeout(timerRef.current);
    setVisible(false);
    setTimeout(onDismiss, EXIT_MS);
  }

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    startTimer();
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timerRef.current);
    };
  // startTimer captures refs, safe to omit
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showClose  = toast.showCloseButton !== false;
  const hasActions = Array.isArray(toast.actions) && toast.actions.length > 0;
  const hasDesc    = toast.description !== undefined && toast.description !== null && toast.description !== '';

  return (
    <div
      className={[
        'sds-toast',
        'sds-toast--front',
        isTop ? 'sds-toast--top' : 'sds-toast--bottom',
        visible && 'sds-toast--visible',
      ].filter(Boolean).join(' ')}
      onMouseEnter={pauseTimer}
      onMouseLeave={startTimer}
    >
      <div className="sds-toast__card" role="status" aria-live="polite">
        <div className="sds-toast__header">
          <span className="sds-toast__title sds-text--subtitle-medium">
            {toast.title}
          </span>
          {showClose && (
            <button
              type="button"
              className="sds-toast__close"
              aria-label="Dismiss"
              onClick={handleDismiss}
            >
              <CloseIcon size={16} />
            </button>
          )}
        </div>

        {hasDesc && (
          <p className="sds-toast__description sds-text--body-content-small">
            {toast.description}
          </p>
        )}

        {hasActions && (
          <div className="sds-toast__actions">
            {toast.actions!.slice(0, 2).map((action, i) => {
              const fillStyle = action.variant ?? (i === 0 ? 'filled' : 'hollow');
              return (
                <Button
                  key={i}
                  variant="secondary"
                  fillStyle={fillStyle}
                  size="xsmall"
                  label={action.label}
                  icon={action.icon}
                  onClick={() => {
                    action.onClick?.();
                    handleDismiss();
                  }}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ToastProvider ────────────────────────────────────────────────────────────

export interface ToastProviderProps {
  children:  ReactNode;
  /**
   * Screen corner/edge where toasts appear.
   * @default 'bottom-end'
   */
  position?: ToastPosition;
}

export function ToastProvider({ children, position = 'bottom-end' }: ToastProviderProps) {
  const [toasts,      setToasts]      = useState<ToastItem[]>([]);
  const [isExpanded,  setIsExpanded]  = useState(false);
  const [isCollapsing, setIsCollapsing] = useState(false);
  const collapseTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const add = useCallback((options: ToastOptions): string => {
    const id = generateId();
    setToasts(prev => [...prev, { ...options, id }]);
    return id;
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  // Auto-collapse when the stack shrinks to one toast.
  useEffect(() => {
    if (toasts.length <= 1) {
      clearTimeout(collapseTimer.current);
      setIsExpanded(false);
      setIsCollapsing(false);
    }
  }, [toasts.length]);

  // Clean up on unmount.
  useEffect(() => () => clearTimeout(collapseTimer.current), []);

  const isTop    = position.startsWith('top');
  const reversed = [...toasts].reverse(); // index 0 = most recent (front)

  // Expanded column order: newest nearest the viewport edge.
  // bottom-positioned → newest last in DOM (bottom of column, near edge)
  // top-positioned    → newest first in DOM (top of column, near edge)
  const expandedOrder = isTop ? reversed : toasts;

  function expand() {
    if (reversed.length <= 1) return;
    clearTimeout(collapseTimer.current);
    setIsCollapsing(false);
    setIsExpanded(true);
  }

  function beginCollapse() {
    if (!isExpanded) return;
    // Phase 1: keep expanded DOM, add collapsing class so CSS exit animations play.
    setIsCollapsing(true);
    // Phase 2: after animation completes, switch to collapsed DOM.
    collapseTimer.current = setTimeout(() => {
      setIsExpanded(false);
      setIsCollapsing(false);
    }, EXPAND_DURATION);
  }

  function handleMouseEnter() { expand(); }
  function handleMouseLeave() { beginCollapse(); }
  function handleFocus()      { expand(); }
  function handleBlur(e: FocusEvent<HTMLDivElement>) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) beginCollapse();
  }

  return (
    <ToastContext.Provider value={{ add, dismiss, dismissAll }}>
      {children}
      {createPortal(
        <div
          className={`sds-toast-region sds-toast-region--${position}`}
          aria-label="Notifications"
          aria-live="polite"
          aria-relevant="additions"
          aria-atomic="false"
        >
          {reversed.length > 0 && (
            <div
              className={[
                'sds-toast-stack',
                `sds-toast-stack--${isTop ? 'top' : 'bottom'}`,
                isExpanded  && 'sds-toast-stack--expanded',
                isCollapsing && 'sds-toast-stack--collapsing',
              ].filter(Boolean).join(' ')}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onFocus={handleFocus}
              onBlur={handleBlur}
            >
              {isExpanded ? (
                expandedOrder.map(toast => (
                  <FrontCard
                    key={toast.id}
                    toast={toast}
                    isTop={isTop}
                    onDismiss={() => dismiss(toast.id)}
                  />
                ))
              ) : (
                // Peek cards rendered first so the front card's z-index paints on top.
                <>
                  {reversed.length >= 3 && <PeekCard depth={2} />}
                  {reversed.length >= 2 && <PeekCard depth={1} />}
                  <FrontCard
                    key={reversed[0].id}
                    toast={reversed[0]}
                    isTop={isTop}
                    onDismiss={() => dismiss(reversed[0].id)}
                  />
                </>
              )}
            </div>
          )}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}
