import {
  createContext,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  KeyboardEvent,
  ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import './Menu.css';

// ─── Types ────────────────────────────────────────────────────────────────────

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
   * Enables multi-select mode. Items show checkboxes; clicking an item does
   * not auto-close the menu. Use `selected` on each MenuItem to control state.
   */
  multiSelect?: boolean;
  /** Menu content — typically MenuItem and MenuDivider elements */
  children: ReactNode;
  /** Additional className forwarded to the menu list element */
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
}

export interface MenuItemProps {
  /** Label text rendered inside the item */
  children: ReactNode;
  /** Called when the item is clicked or activated via keyboard (Enter / Space) */
  onClick?: () => void;
  /**
   * Marks the item as selected.
   * In multiSelect mode: shows a filled checkbox.
   * In single-select mode: renders the label in semibold.
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
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface MenuContextValue {
  multiSelect: boolean;
  onClose: () => void;
}

const MenuContext = createContext<MenuContextValue>({ multiSelect: false, onClose: () => {} });

// ─── Icon sub-components ──────────────────────────────────────────────────────

function CheckIcon() {
  return (
    <svg width="12" height="9" viewBox="0 0 12 9" fill="none" aria-hidden="true">
      <path
        d="M1.5 4.5L4.5 7.5L10.5 1.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 18L15 12L9 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── CheckboxIndicator ────────────────────────────────────────────────────────

function CheckboxIndicator({ checked }: { checked: boolean }) {
  return (
    <span
      className={[
        'sds-menu-item__checkbox',
        checked && 'sds-menu-item__checkbox--checked',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-hidden="true"
    >
      {checked && <CheckIcon />}
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

// ─── Position helper ──────────────────────────────────────────────────────────

interface MenuCoords {
  top: number;
  left: number;
}

const MENU_GAP   = 4;   // px between anchor and menu
const MENU_EDGE  = 8;   // minimum distance from viewport edge

function computePosition(anchor: DOMRect, menu: DOMRect): MenuCoords {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Vertical: prefer opening below the anchor
  let top = anchor.bottom + MENU_GAP;
  if (top + menu.height > vh - MENU_EDGE) {
    const topAbove = anchor.top - MENU_GAP - menu.height;
    top = topAbove >= MENU_EDGE ? topAbove : Math.max(MENU_EDGE, vh - menu.height - MENU_EDGE);
  }

  // Horizontal: left-aligned by default, shift left if it overflows the right edge
  let left = anchor.left;
  if (left + menu.width > vw - MENU_EDGE) {
    left = Math.max(MENU_EDGE, anchor.right - menu.width);
  }

  return { top, left };
}

// ─── Keyboard focus helpers ───────────────────────────────────────────────────

/** Returns all focusable (non-disabled) menu items within a container. */
function getFocusableItems(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      '[role="menuitem"]:not([aria-disabled="true"]), [role="menuitemcheckbox"]:not([aria-disabled="true"])'
    )
  );
}

// ─── Menu ─────────────────────────────────────────────────────────────────────

export function Menu({
  open,
  anchorEl,
  onClose,
  multiSelect = false,
  children,
  className,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  maxHeight = 360,
}: MenuProps) {
  const menuRef         = useRef<HTMLUListElement>(null);
  const menuId          = useId();
  const [coords, setCoords] = useState<MenuCoords>({ top: 0, left: 0 });
  const [ready, setReady]   = useState(false);

  // ── Focus management ───────────────────────────────────────────────────────
  // Save the element that had focus before the menu opened so we can restore
  // it when the menu closes (WCAG 2.1 SC 3.2.2 / WAI-ARIA menu pattern).
  useEffect(() => {
    if (!open) return;
    const prevFocus = document.activeElement as HTMLElement | null;
    return () => {
      prevFocus?.focus();
    };
  }, [open]);

  // Focus the first focusable item once the menu is positioned and visible.
  useEffect(() => {
    if (!ready || !menuRef.current) return;
    getFocusableItems(menuRef.current)[0]?.focus();
  }, [ready]);

  // ── Positioning ────────────────────────────────────────────────────────────
  // Runs synchronously after every paint while the menu is open so that the
  // position is always correct before the browser shows the frame to the user.
  useLayoutEffect(() => {
    if (!open || !anchorEl || !menuRef.current) {
      setReady(false);
      return;
    }
    const anchorRect = anchorEl.getBoundingClientRect();
    const menuRect   = menuRef.current.getBoundingClientRect();
    setCoords(computePosition(anchorRect, menuRect));
    setReady(true);
  }, [open, anchorEl]);

  // ── Close on scroll / resize ───────────────────────────────────────────────
  // We close (rather than reposition) on scroll/resize so that the menu never
  // ends up detached from its anchor in unexpected ways.
  useEffect(() => {
    if (!open) return;
    function handleScroll(e: Event) {
      // Scrolling inside the menu list itself (e.g. the scrollable item list or
      // dragging its scrollbar) must not close the menu.
      if (menuRef.current?.contains(e.target as Node)) return;
      onClose();
    }
    window.addEventListener('scroll',  handleScroll, { passive: true, capture: true });
    window.addEventListener('resize',  onClose,      { passive: true });
    return () => {
      window.removeEventListener('scroll',  handleScroll, true);
      window.removeEventListener('resize',  onClose);
    };
  }, [open, onClose]);

  // ── Keyboard navigation ────────────────────────────────────────────────────
  // Implements the WAI-ARIA Menu keyboard pattern:
  //   ArrowDown / ArrowUp  → move focus through items (wraps)
  //   Home / End           → jump to first / last item
  //   Escape               → close menu, return focus to trigger
  //   Tab                  → close menu, allow natural tab order to continue
  function handleKeyDown(e: KeyboardEvent<HTMLUListElement>) {
    if (!menuRef.current) return;
    const items   = getFocusableItems(menuRef.current);
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
        // Do not prevent default — let focus move naturally, but close the menu.
        onClose();
        break;
      }
    }
  }

  if (!open) return null;

  return createPortal(
    <MenuContext.Provider value={{ multiSelect, onClose }}>
      {/*
        Transparent full-viewport backdrop captures outside clicks and touches
        on all devices (mouse and touch) without needing pointer-event listeners
        on the document. aria-hidden keeps it invisible to assistive technology.
      */}
      <div
        className="sds-menu-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      <ul
        ref={menuRef}
        id={menuId}
        role="menu"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        className={[
          'sds-menu',
          ready && 'sds-menu--ready',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        style={{
          top:       coords.top,
          left:      coords.left,
          maxHeight: maxHeight,
        }}
        onKeyDown={handleKeyDown}
        // The list itself is not tabbable — focus is managed programmatically.
        tabIndex={-1}
      >
        {children}
      </ul>
    </MenuContext.Provider>,
    document.body
  );
}

// ─── MenuItem ─────────────────────────────────────────────────────────────────

export function MenuItem({
  children,
  onClick,
  selected  = false,
  disabled  = false,
  icon,
  suffix,
  className,
}: MenuItemProps) {
  const { multiSelect, onClose } = useContext(MenuContext);

  // WAI-ARIA: checkbox role when the menu supports multi-selection so that
  // screen readers announce the checked/unchecked state on each item.
  const role = multiSelect ? 'menuitemcheckbox' : 'menuitem';

  const rootClasses = [
    'sds-menu-item',
    selected  && 'sds-menu-item--selected',
    disabled  && 'sds-menu-item--disabled',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  function handleClick() {
    if (disabled) return;
    onClick?.();
    // Single-select: close the menu after activation — WCAG AA compliant, matches
    // the WAI-ARIA Menu Button pattern (focus returns to trigger on selection).
    // Multi-select: stay open so the user can make additional selections.
    if (!multiSelect) onClose();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLLIElement>) {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
      if (!multiSelect) onClose();
    }
  }

  return (
    <li
      role={role}
      aria-checked={multiSelect ? selected : undefined}
      aria-disabled={disabled ? true : undefined}
      // Disabled items are removed from the focus sequence entirely.
      // Non-disabled items use tabIndex={-1} so only the JS focus management
      // (arrow keys) can move focus within the menu — not Tab.
      tabIndex={disabled ? undefined : -1}
      className={rootClasses}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {multiSelect && <CheckboxIndicator checked={selected} />}

      {icon && (
        <span className="sds-menu-item__icon" aria-hidden="true">
          {icon}
        </span>
      )}

      <span className="sds-menu-item__content">{children}</span>

      {suffix && <MenuItemSuffixView suffix={suffix} />}
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
