import { useLayoutEffect, useRef, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from '../../../icons';
import { useDirection } from '../../../utilities/useDirection';
import './Pagination.css';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PaginationVariant = 'default' | 'compact';

export interface PaginationProps {
  /** Total number of pages */
  count: number;
  /**
   * Controlled current page (1-based).
   * When provided, `onChange` must update it externally.
   */
  page?: number;
  /** Starting page for uncontrolled mode. @default 1 */
  defaultPage?: number;
  /** Called when the user navigates to a different page */
  onChange?: (page: number) => void;
  /**
   * 'default' renders numbered page tabs with ellipsis.
   * 'compact' renders "X of Y" text between prev/next buttons.
   * @default 'default'
   */
  variant?: PaginationVariant;
  /**
   * Number of sibling page tabs on each side of the current page.
   * @default 1
   */
  siblingCount?: number;
  /**
   * Number of boundary page tabs at each end.
   * @default 1
   */
  boundaryCount?: number;
  /** Accessible label for the nav landmark. @default 'Pagination' */
  'aria-label'?: string;
  /** Additional className forwarded to the root element */
  className?: string;
}

// ─── Page item type ───────────────────────────────────────────────────────────

type PageItem = number | 'ellipsis-start' | 'ellipsis-end';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

/**
 * Computes the sequence of page items (numbers + ellipsis markers) to render.
 * Algorithm: always show first/last `boundaryCount` pages; show `siblingCount`
 * pages either side of current; bridge small gaps; insert ellipsis for large ones.
 */
function getPageItems(
  count: number,
  page: number,
  siblingCount: number,
  boundaryCount: number,
): PageItem[] {
  const totalSlots = siblingCount * 2 + boundaryCount * 2 + 3;
  if (count <= totalSlots) return range(1, count);

  const startSibling = Math.max(page - siblingCount, boundaryCount + 1);
  const endSibling   = Math.min(page + siblingCount, count - boundaryCount);

  const showStartEllipsis = startSibling > boundaryCount + 2;
  const showEndEllipsis   = endSibling   < count - boundaryCount - 1;

  const startBoundary = range(1, boundaryCount);
  const endBoundary   = range(count - boundaryCount + 1, count);

  if (!showStartEllipsis && showEndEllipsis) {
    const startCount = siblingCount * 2 + boundaryCount + 2;
    return [...range(1, startCount), 'ellipsis-end', ...endBoundary];
  }

  if (showStartEllipsis && !showEndEllipsis) {
    const endCount = siblingCount * 2 + boundaryCount + 2;
    return [...startBoundary, 'ellipsis-start', ...range(count - endCount + 1, count)];
  }

  return [
    ...startBoundary,
    'ellipsis-start',
    ...range(startSibling, endSibling),
    'ellipsis-end',
    ...endBoundary,
  ];
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export function Pagination({
  count,
  page: controlledPage,
  defaultPage = 1,
  onChange,
  variant = 'default',
  siblingCount = 1,
  boundaryCount = 1,
  'aria-label': ariaLabel = 'Pagination',
  className,
}: PaginationProps) {
  const [uncontrolledPage, setUncontrolledPage] = useState(defaultPage);
  const isControlled = controlledPage !== undefined;
  const currentPage  = isControlled ? controlledPage : uncontrolledPage;
  const isRtl = useDirection() === 'rtl';
  const listRef = useRef<HTMLOListElement>(null);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const selected = list.querySelector<HTMLButtonElement>('[aria-current="page"]');
    const label = selected?.querySelector<HTMLSpanElement>('.sds-pagination__page-label') ?? null;
    if (label) {
      list.style.setProperty('--indicator-left', `${label.offsetLeft - 8}px`);
      list.style.setProperty('--indicator-width', `${label.offsetWidth + 16}px`);
    } else {
      list.style.setProperty('--indicator-width', '0px');
    }
  }, [currentPage]);
  const PrevIcon = isRtl ? ChevronRightIcon : ChevronLeftIcon;
  const NextIcon = isRtl ? ChevronLeftIcon  : ChevronRightIcon;

  function navigate(next: number) {
    if (next < 1 || next > count || next === currentPage) return;
    if (!isControlled) setUncontrolledPage(next);
    onChange?.(next);
  }

  const isPrevDisabled = currentPage <= 1;
  const isNextDisabled = currentPage >= count;

  const rootClasses = [
    'sds-pagination',
    variant === 'compact' && 'sds-pagination--compact',
    className,
  ].filter(Boolean).join(' ');

  return (
    <nav aria-label={ariaLabel} className={rootClasses}>
      {/* ── Prev ───────────────────────────────────────────────────── */}
      <button
        className="sds-pagination__nav-btn"
        type="button"
        onClick={() => navigate(currentPage - 1)}
        disabled={isPrevDisabled}
        aria-label="Go to previous page"
      >
        <PrevIcon size={24} aria-hidden="true" />
      </button>

      {/* ── Default: numbered tabs ──────────────────────────────────── */}
      {variant === 'default' && (
        <ol ref={listRef} className="sds-pagination__list" role="list">
          <span className="sds-pagination__indicator" aria-hidden="true" />
          {getPageItems(count, currentPage, siblingCount, boundaryCount).map((item, idx) => {
            if (item === 'ellipsis-start' || item === 'ellipsis-end') {
              return (
                <li key={item} className="sds-pagination__ellipsis" aria-hidden="true">
                  <MoreHorizontalIcon size={20} />
                </li>
              );
            }
            const isSelected = item === currentPage;
            return (
              <li key={`${item}-${idx}`}>
                <button
                  type="button"
                  className={[
                    'sds-pagination__page-btn',
                    'sds-text--body-interactive-small',
                    isSelected && 'sds-pagination__page-btn--selected',
                  ].filter(Boolean).join(' ')}
                  onClick={() => navigate(item)}
                  aria-label={`Page ${item}`}
                  aria-current={isSelected ? 'page' : undefined}
                >
                  <span className="sds-pagination__page-label">{item}</span>
                </button>
              </li>
            );
          })}
        </ol>
      )}

      {/* ── Compact: "X of Y" ──────────────────────────────────────── */}
      {variant === 'compact' && (
        <span className="sds-pagination__compact-label sds-text--body-content-medium" aria-live="polite" aria-atomic="true" dir="ltr">
          {isRtl ? `${count} of ${currentPage}` : `${currentPage} of ${count}`}
        </span>
      )}

      {/* ── Next ───────────────────────────────────────────────────── */}
      <button
        className="sds-pagination__nav-btn"
        type="button"
        onClick={() => navigate(currentPage + 1)}
        disabled={isNextDisabled}
        aria-label="Go to next page"
      >
        <NextIcon size={24} aria-hidden="true" />
      </button>
    </nav>
  );
}
