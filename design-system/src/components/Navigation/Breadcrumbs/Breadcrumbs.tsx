import { useRef, useState } from 'react';
import './Breadcrumbs.css';
import { ChevronRightIcon, MoreVerticalIcon } from '../../../icons';
import { Menu, MenuItem } from '../Menu/Menu';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BreadcrumbItem {
  /** Visible label */
  label: string;
  /** Navigation URL. Renders as an `<a>` when provided, otherwise a `<button>`. */
  href?: string;
  /** Called when the item is activated (click or menu selection) */
  onClick?: () => void;
}

export interface BreadcrumbsProps {
  /** Ordered list of crumbs — the last entry is always the current page (non-interactive). */
  items: BreadcrumbItem[];
  /**
   * Maximum number of items to display before collapsing the middle items into an overflow button.
   * When `items.length > maxItems`, all items except the last three
   * (two links + current page) are hidden inside the overflow dropdown.
   * Omit to always show all items.
   */
  maxItems?: number;
  /**
   * Static variant — for use on dark or gradient backgrounds.
   * Switches the color palette to white-based tokens.
   */
  propStatic?: boolean;
  className?: string;
  /** Accessible name for the breadcrumb navigation landmark. @default 'Breadcrumb' */
  'aria-label'?: string;
}

// ─── Breadcrumbs ──────────────────────────────────────────────────────────────

export function Breadcrumbs({
  items,
  maxItems,
  propStatic = false,
  className,
  'aria-label': ariaLabel = 'Breadcrumb',
}: BreadcrumbsProps) {
  const overflowRef = useRef<HTMLButtonElement>(null);
  const [overflowOpen, setOverflowOpen] = useState(false);

  const shouldCollapse = maxItems !== undefined && items.length > maxItems;
  // Always keep last 3 items visible: second-to-last link, last link, current page
  const visibleItems  = shouldCollapse ? items.slice(-3) : items;
  const collapsedItems = shouldCollapse ? items.slice(0, -3) : [];

  return (
    <nav
      aria-label={ariaLabel}
      className={[
        'sds-breadcrumbs',
        propStatic && 'sds-breadcrumbs--static',
        className,
      ].filter(Boolean).join(' ')}
    >
      <ol className="sds-breadcrumbs__list">

        {/* ── Overflow button ────────────────────────────────────────────── */}
        {shouldCollapse && (
          <>
            <li className="sds-breadcrumbs__item">
              <button
                ref={overflowRef}
                type="button"
                className="sds-breadcrumbs__overflow"
                aria-label="Show hidden breadcrumbs"
                aria-expanded={overflowOpen}
                aria-haspopup="menu"
                onClick={() => setOverflowOpen(true)}
              >
                <MoreVerticalIcon size={20} />
              </button>
              <Menu
                open={overflowOpen}
                anchorEl={overflowRef.current}
                onClose={() => setOverflowOpen(false)}
                type="action"
                aria-label="Hidden breadcrumbs"
              >
                {collapsedItems.map((item) => (
                  <MenuItem
                    key={item.label}
                    onClick={() => {
                      setOverflowOpen(false);
                      item.onClick?.();
                    }}
                  >
                    {item.label}
                  </MenuItem>
                ))}
              </Menu>
            </li>
            <li className="sds-breadcrumbs__separator" aria-hidden="true">
              <ChevronRightIcon size={24} />
            </li>
          </>
        )}

        {/* ── Visible items ──────────────────────────────────────────────── */}
        {visibleItems.map((item, index) => {
          const isCurrent = index === visibleItems.length - 1;
          return (
            <CrumbItem
              key={`${item.label}-${index}`}
              item={item}
              isCurrent={isCurrent}
              isLast={isCurrent}
            />
          );
        })}
      </ol>
    </nav>
  );
}

// ─── CrumbItem ────────────────────────────────────────────────────────────────

interface CrumbItemProps {
  item: BreadcrumbItem;
  isCurrent: boolean;
  isLast: boolean;
}

function CrumbItem({ item, isCurrent, isLast }: CrumbItemProps) {
  return (
    <>
      <li className="sds-breadcrumbs__item">
        {isCurrent ? (
          <span className="sds-breadcrumbs__current" aria-current="page">
            {item.label}
          </span>
        ) : item.href ? (
          <a
            href={item.href}
            className="sds-breadcrumbs__link"
            onClick={item.onClick}
          >
            {item.label}
          </a>
        ) : (
          <button
            type="button"
            className="sds-breadcrumbs__link"
            onClick={item.onClick}
          >
            {item.label}
          </button>
        )}
      </li>
      {!isLast && (
        <li className="sds-breadcrumbs__separator" aria-hidden="true">
          <ChevronRightIcon size={24} />
        </li>
      )}
    </>
  );
}
