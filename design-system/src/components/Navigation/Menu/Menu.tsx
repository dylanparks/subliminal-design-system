import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  KeyboardEvent,
  ReactNode,
  DragEvent,
} from 'react';
import { computePosition, flip, shift, offset, autoUpdate } from '@floating-ui/dom';
import { createPortal } from 'react-dom';
import './Menu.css';
import {
  CheckIcon,
  ChevronRightIcon,
  DragHandleIcon,
} from '../../../icons';
import { CheckboxIndicator } from '../../Inputs/InputIndicators/CheckboxIndicator';
import { ToggleIndicator } from '../../Inputs/InputIndicators/ToggleIndicator';

// ─── Types ────────────────────────────────────────────────────────────────────

export type MenuType = 'single-select' | 'multi-select' | 'configure';

export type MenuSuffixType = 'tag' | 'text' | 'icon';

export type MenuSuffix =
  | { type: 'tag'; label: string }
  | { type: 'text'; label: string }
  | { type: 'icon'; icon?: ReactNode };

export interface MenuProps {
  /** Whether the menu is open */
  open: boolean;
  /** The element the menu is anchored to */
  anchorEl: HTMLElement | null;
  /** Called when the menu should close (outside click, Escape, backdrop tap) */
  onClose: () => void;
  /**
   * The interaction model for all items in this menu.
   * - 'single-select': items show a checkmark when selected (radio-style); auto-closes on selection.
   * - 'multi-select':  items show checkboxes; menu stays open after each selection.
   * - 'configure':     items have a drag handle for reordering and an optional toggle switch.
   * @default 'single-select'
   */
  type?: MenuType;
  /** Menu content — typically MenuItem and MenuDivider elements */
  children: ReactNode;
  /** Additional className forwarded to the menu container element */
  className?: string;
  /** Accessible name for the menu (use when there is no visible heading) */
  'aria-label'?: string;
  /** ID of a visible element that names this menu */
  'aria-labelledby'?: string;
  /**
   * Maximum height in px before the list becomes scrollable.
   * @default 360
   */
  maxHeight?: number;
  /**
   * Explicit width in px for the menu container.
   * Useful when the menu should match the width of its anchor (e.g. SelectField).
   */
  width?: number;
}

export interface MenuItemProps {
  /** Label text rendered inside the item */
  children: ReactNode;
  /**
   * Called when the item is activated.
   * - single-select / multi-select: item was clicked or activated via keyboard.
   * - configure: the toggle switch was clicked or activated via keyboard.
   */
  onClick?: () => void;
  /**
   * Marks the item as selected / active.
   * - single-select: shows the checkmark and renders the label in semibold.
   * - multi-select:  shows a filled checkbox and renders the label in semibold.
   * - configure:     shows the toggle in the on state and renders the label in semibold.
   */
  selected?: boolean;
  /** Prevents interaction and removes the item from the keyboard focus sequence */
  disabled?: boolean;
  /** Optional leading icon (16–24 px ReactNode, e.g. an inline SVG) */
  icon?: ReactNode;
  /** Optional trailing suffix (tag count, keyboard shortcut, or submenu chevron) */
  suffix?: MenuSuffix;
  /** Additional className forwarded to the list item element */
  className?: string;
  /**
   * Whether to show the toggle switch (configure mode only).
   * @default true
   */
  toggleable?: boolean;
  /** Drag event handlers — wire these up to implement reordering (configure mode only) */
  onDragStart?: (e: DragEvent<HTMLLIElement>) => void;
  onDragEnd?: (e: DragEvent<HTMLLIElement>) => void;
  onDragOver?: (e: DragEvent<HTMLLIElement>) => void;
  onDragLeave?: (e: DragEvent<HTMLLIElement>) => void;
  onDrop?: (e: DragEvent<HTMLLIElement>) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface MenuContextValue {
  menuType: MenuType;
  onClose: () => void;
}

const MenuContext = createContext<MenuContextValue>({ menuType: 'single-select', onClose: () => {} });

// ─── SingleSelectCheckmark ────────────────────────────────────────────────────

function SingleSelectCheckmark({ selected }: { selected: boolean }) {
  return (
    <span
      className={[
        'sds-menu-item__checkmark',
        selected && 'sds-menu-item__checkmark--selected',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-hidden="true"
    >
      <CheckIcon size={16} />
    </span>
  );
}

// ─── MenuItemSuffixView ───────────────────────────────────────────────────────

function MenuItemSuffixView({ suffix }: { suffix: MenuSuffix }) {
  if (suffix.type === 'tag') {
    return (
      <span className="sds-menu-item__suffix sds-menu-item__suffix--tag" aria-hidden="true">
        {suffix.label}
      </span>
    );
  }
  if (suffix.type === 'text') {
    return (
      <span className="sds-menu-item__suffix sds-menu-item__suffix--text" aria-hidden="true">
        {suffix.label}
      </span>
    );
  }
  // type === 'icon'
  return (
    <span className="sds-menu-item__suffix sds-menu-item__suffix--icon" aria-hidden="true">
      {suffix.icon ?? <ChevronRightIcon />}
    </span>
  );
}

// ─── Position coords ──────────────────────────────────────────────────────────

interface MenuCoords {
  top: number;
  left: number;
}

// ─── Keyboard focus helpers ───────────────────────────────────────────────────

/** Returns all focusable (non-disabled) menu items within a container. */
function getFocusableItems(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      '[role="menuitem"]:not([aria-disabled="true"]), [role="menuitemcheckbox"]:not([aria-disabled="true"]), [role="menuitemradio"]:not([aria-disabled="true"])'
    )
  );
}

// ─── Scrollbar state ──────────────────────────────────────────────────────────

interface ScrollbarState {
  visible:  boolean;
  height:   number;
  top:      number;
}

// ─── Menu ─────────────────────────────────────────────────────────────────────

export function Menu({
  open,
  anchorEl,
  onClose,
  type = 'single-select',
  children,
  className,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  maxHeight = 360,
  width,
}: MenuProps) {
  // menuRef → outer container (used for positioning measurements)
  // listRef → inner <ul> (used for scroll tracking and focus queries)
  const menuRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const menuId  = useId();

  const [coords,    setCoords]    = useState<MenuCoords>({ top: 0, left: 0 });
  const [ready,     setReady]     = useState(false);
  const [scrollbar, setScrollbar] = useState<ScrollbarState>({ visible: false, height: 0, top: 0 });

  // ── Custom scrollbar ────────────────────────────────────────────────────────
  function updateScrollbar() {
    const el = listRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    if (scrollHeight <= clientHeight) {
      setScrollbar(s => s.visible ? { visible: false, height: 0, top: 0 } : s);
      return;
    }
    const ratio           = clientHeight / scrollHeight;
    const indicatorHeight = Math.max(ratio * clientHeight, 24);
    const trackPadding    = 8;
    const trackHeight     = clientHeight - trackPadding;
    const indicatorRange  = trackHeight - indicatorHeight;
    const scrollRange     = scrollHeight - clientHeight;
    const indicatorTop    = 4 + (scrollTop / scrollRange) * indicatorRange;
    setScrollbar({ visible: true, height: indicatorHeight, top: indicatorTop });
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
    if ((e.target as HTMLElement).classList.contains('sds-menu__scrollbar-indicator')) return;
    const el = listRef.current;
    if (!el) return;
    const rect       = e.currentTarget.getBoundingClientRect();
    const clickRatio = (e.clientY - rect.top) / rect.height;
    el.scrollTo({ top: clickRatio * (el.scrollHeight - el.clientHeight), behavior: 'smooth' });
  }

  // ── Focus management ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const prevFocus = document.activeElement as HTMLElement | null;
    return () => {
      prevFocus?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!ready || !listRef.current) return;
    const listEl = listRef.current;

    // Single-select: scroll the selected item to the bottom of the visible list
    // and place focus on it when the menu reopens.
    const selectedEl =
      type === 'single-select'
        ? listEl.querySelector<HTMLElement>('[role="menuitemradio"][aria-checked="true"]')
        : null;

    if (selectedEl) {
      // Align the item's bottom edge with the list's bottom edge so it appears
      // at the bottom of the list with all preceding items visible above it.
      const listRect = listEl.getBoundingClientRect();
      const itemRect = selectedEl.getBoundingClientRect();
      listEl.scrollTop = listEl.scrollTop + itemRect.bottom - listRect.bottom;
      selectedEl.focus();
    } else {
      getFocusableItems(listEl)[0]?.focus();
    }

    updateScrollbar();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // ── Positioning — Floating UI autoUpdate ────────────────────────────────────
  // autoUpdate re-runs computePosition on every ancestor scroll and resize,
  // keeping the menu anchored to its trigger as the page scrolls.
  useEffect(() => {
    if (!open || !anchorEl || !menuRef.current) return;
    const floatingEl = menuRef.current;

    const cleanup = autoUpdate(anchorEl, floatingEl, () => {
      computePosition(anchorEl, floatingEl, {
        placement: 'bottom-start',
        strategy:  'fixed',
        middleware: [offset(4), flip({ padding: 8 }), shift({ padding: 8 })],
      }).then(({ x, y }) => {
        setCoords({ top: y, left: x });
        setReady(true);
      });
    });

    return () => {
      cleanup();
      setReady(false);
    };
  }, [open, anchorEl]);

  // ── Close on outside pointerdown ────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;

    function handlePointerDown(e: PointerEvent) {
      if (menuRef.current?.contains(e.target as Node)) return;
      // Let the anchor's own click handler toggle the menu — don't double-close.
      if (anchorEl?.contains(e.target as Node)) return;
      onClose();
    }

    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [open, anchorEl, onClose]);

  // ── Keyboard navigation ──────────────────────────────────────────────────────
  function handleKeyDown(e: KeyboardEvent<HTMLUListElement>) {
    if (!listRef.current) return;
    const items   = getFocusableItems(listRef.current);
    const current = items.indexOf(document.activeElement as HTMLElement);

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        items[(current + 1) % items.length]?.focus();
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        items[(current - 1 + items.length) % items.length]?.focus();
        break;
      }
      case 'Home': {
        e.preventDefault();
        items[0]?.focus();
        break;
      }
      case 'End': {
        e.preventDefault();
        items[items.length - 1]?.focus();
        break;
      }
      case 'Escape': {
        e.preventDefault();
        onClose();
        break;
      }
      case 'Tab': {
        onClose();
        break;
      }
    }
  }

  if (!open) return null;

  return createPortal(
    <MenuContext.Provider value={{ menuType: type, onClose }}>
      <div
        ref={menuRef}
        className={[
          'sds-menu',
          ready && 'sds-menu--ready',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        style={{
          top:  coords.top,
          left: coords.left,
          ...(width !== undefined && { width }),
        }}
      >
        <ul
          ref={listRef}
          id={menuId}
          role="menu"
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          className="sds-menu__list"
          style={{ maxHeight }}
          onKeyDown={handleKeyDown}
          onScroll={updateScrollbar}
          tabIndex={0}
        >
          {children}
        </ul>

        {scrollbar.visible && (
          <div
            className="sds-menu__scrollbar"
            aria-hidden="true"
            onPointerDown={handleTrackPointerDown}
          >
            <div
              className="sds-menu__scrollbar-indicator"
              style={{ height: scrollbar.height, top: scrollbar.top }}
              onPointerDown={handleIndicatorPointerDown}
            />
          </div>
        )}
      </div>
    </MenuContext.Provider>,
    document.body
  );
}

// ─── MenuItem ─────────────────────────────────────────────────────────────────

export function MenuItem({
  children,
  onClick,
  selected   = false,
  disabled   = false,
  icon,
  suffix,
  className,
  toggleable = true,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
}: MenuItemProps) {
  const { menuType, onClose } = useContext(MenuContext);
  const labelId = useId();

  const isSingleSelect = menuType === 'single-select';
  const isMultiSelect  = menuType === 'multi-select';
  const isConfigure    = menuType === 'configure';

  // WAI-ARIA role:
  //   menuitemradio   — single-select (mutually exclusive, aria-checked indicates state)
  //   menuitemcheckbox — multi-select (independent, aria-checked indicates state)
  //   menuitem        — configure (drag + toggle; selection not communicated via role)
  const role = isSingleSelect ? 'menuitemradio' : isMultiSelect ? 'menuitemcheckbox' : 'menuitem';

  const rootClasses = [
    'sds-menu-item',
    isConfigure                     && 'sds-menu-item--configure',
    selected && !(isConfigure && !toggleable) && 'sds-menu-item--selected',
    disabled                        && 'sds-menu-item--disabled',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  function handleClick() {
    if (disabled) return;
    onClick?.();
    // single-select: auto-close (WAI-ARIA Menu Button pattern)
    // multi-select and configure: stay open
    if (isSingleSelect) onClose();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLLIElement>) {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      // In configure mode, Space/Enter activates the toggle (drag is pointer-only)
      onClick?.();
      if (isSingleSelect) onClose();
    }
  }

  // ── Internal drag handlers — manage the drop-indicator line ──────────────────
  // These compute before/after position and set data-drop-position on the <li>,
  // which CSS uses to show the colored indicator line. Consumer handlers are
  // called through so they can still implement the actual reorder logic.

  function handleDragOverInternal(e: DragEvent<HTMLLIElement>) {
    e.preventDefault(); // Required to allow drop
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.dataset.dropPosition = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
    onDragOver?.(e);
  }

  function handleDragLeaveInternal(e: DragEvent<HTMLLIElement>) {
    // Only clear when leaving to outside the item (not to a child element)
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      delete e.currentTarget.dataset.dropPosition;
    }
    onDragLeave?.(e);
  }

  function handleDropInternal(e: DragEvent<HTMLLIElement>) {
    // Call consumer first so they can read data-drop-position before it's cleared
    onDrop?.(e);
    delete e.currentTarget.dataset.dropPosition;
  }

  function handleDragEndInternal(e: DragEvent<HTMLLIElement>) {
    // Clear any lingering indicator — handles cancelled drags where dragLeave never fired
    document.querySelectorAll<HTMLElement>('[data-drop-position]').forEach(el => {
      delete el.dataset.dropPosition;
    });
    onDragEnd?.(e);
  }

  return (
    <li
      role={role}
      // aria-checked communicates selection to screen readers for radio/checkbox roles
      aria-checked={!isConfigure ? selected : undefined}
      aria-disabled={disabled ? true : undefined}
      tabIndex={disabled ? undefined : -1}
      className={rootClasses}
      // Configure: click is handled exclusively by the toggle button
      onClick={!isConfigure ? handleClick : undefined}
      onKeyDown={handleKeyDown}
      draggable={isConfigure}
      onDragStart={isConfigure ? onDragStart : undefined}
      onDragEnd={isConfigure ? handleDragEndInternal : undefined}
      onDragOver={isConfigure ? handleDragOverInternal : undefined}
      onDragLeave={isConfigure ? handleDragLeaveInternal : undefined}
      onDrop={isConfigure ? handleDropInternal : undefined}
    >
      {/* ── Leading indicator ─────────────────────────────────────────────── */}
      {isSingleSelect && <SingleSelectCheckmark selected={selected} />}
      {isMultiSelect  && (
        <CheckboxIndicator
          selection={selected ? 'selected' : 'unselected'}
          size="medium"
          disabled={disabled}
        />
      )}
      {isConfigure    && (
        <span className="sds-menu-item__drag-handle" aria-hidden="true">
          <DragHandleIcon size={20} />
        </span>
      )}

      {/* ── Leading icon ──────────────────────────────────────────────────── */}
      {icon && (
        <span className="sds-menu-item__icon" aria-hidden="true">
          {icon}
        </span>
      )}

      {/* ── Label ─────────────────────────────────────────────────────────── */}
      <span id={labelId} className="sds-menu-item__content">{children}</span>

      {/* ── Suffix ────────────────────────────────────────────────────────── */}
      {suffix && <MenuItemSuffixView suffix={suffix} />}

      {/* ── Configure toggle ──────────────────────────────────────────────── */}
      {isConfigure && toggleable && (
        <button
          type="button"
          role="switch"
          aria-checked={selected}
          aria-labelledby={labelId}
          className="sds-menu-item__toggle-zone"
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled) handleClick();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          tabIndex={-1}
        >
          <ToggleIndicator checked={selected} size="medium" disabled={disabled} />
        </button>
      )}
    </li>
  );
}

// ─── MenuDivider ──────────────────────────────────────────────────────────────

/**
 * A thin horizontal rule used to separate groups of menu items.
 * Rendered as `<li role="separator">` per the WAI-ARIA menu pattern.
 */
export function MenuDivider({ className }: { className?: string }) {
  return (
    <li
      role="separator"
      className={['sds-menu-divider', className].filter(Boolean).join(' ')}
    />
  );
}
