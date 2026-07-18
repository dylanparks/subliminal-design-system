import { createContext, useContext, useId, useState, type ReactNode } from 'react';
import { KeyboardArrowDownIcon } from '../../../icons';
import './Accordion.css';

// ─── Context ──────────────────────────────────────────────────────────────────

interface AccordionContextValue {
  openValues: string[];
  toggle: (value: string) => void;
  size: 'small' | 'medium';
}

const AccordionContext = createContext<AccordionContextValue | null>(null);

function useAccordionContext() {
  const ctx = useContext(AccordionContext);
  if (!ctx) throw new Error('Accordion sub-components must be inside <Accordion>');
  return ctx;
}

interface AccordionItemContextValue {
  value: string;
  isOpen: boolean;
  isDisabled: boolean;
  triggerId: string;
  panelId: string;
}

const AccordionItemContext = createContext<AccordionItemContextValue | null>(null);

function useAccordionItemContext() {
  const ctx = useContext(AccordionItemContext);
  if (!ctx) throw new Error('<AccordionTrigger> and <AccordionPanel> must be inside <AccordionItem>');
  return ctx;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AccordionProps {
  /** Controlled open item value(s). */
  value?: string | string[];
  /** Initial open item(s) for uncontrolled usage. */
  defaultValue?: string | string[];
  /** Called with the full array of open values whenever any item toggles. */
  onChange?: (value: string[]) => void;
  /** Allow multiple items open simultaneously. @default false */
  multiple?: boolean;
  /** Size variant applied to all items. @default 'small' */
  size?: 'small' | 'medium';
  children: ReactNode;
  className?: string;
}

export interface AccordionItemProps {
  /** Unique identifier for this item. */
  value: string;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
}

export interface AccordionTriggerProps {
  /** Optional leading icon — rendered at 16 px (small) or 20 px (large). */
  icon?: ReactNode;
  /** Title content — any non-interactive ReactNode. */
  children: ReactNode;
  className?: string;
}

export interface AccordionPanelProps {
  children: ReactNode;
  className?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalize(v: string | string[] | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

// ─── Accordion ────────────────────────────────────────────────────────────────

export function Accordion({
  value: controlledValue,
  defaultValue,
  onChange,
  multiple = false,
  size = 'small',
  children,
  className,
}: AccordionProps) {
  const [internalValues, setInternalValues] = useState<string[]>(() => normalize(defaultValue));
  const isControlled = controlledValue !== undefined;
  const openValues = isControlled ? normalize(controlledValue) : internalValues;

  function toggle(value: string) {
    const next = openValues.includes(value)
      ? openValues.filter(v => v !== value)
      : multiple ? [...openValues, value] : [value];
    if (!isControlled) setInternalValues(next);
    onChange?.(next);
  }

  return (
    <AccordionContext.Provider value={{ openValues, toggle, size }}>
      <div
        className={['sds-accordion', className].filter(Boolean).join(' ')}
        data-accordion
      >
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

// ─── AccordionItem ────────────────────────────────────────────────────────────

export function AccordionItem({
  value,
  disabled = false,
  children,
  className,
}: AccordionItemProps) {
  const { openValues, size } = useAccordionContext();
  const uid = useId();
  const isOpen = openValues.includes(value);
  const triggerId = `${uid}trigger`;
  const panelId   = `${uid}panel`;

  return (
    <AccordionItemContext.Provider value={{ value, isOpen, isDisabled: disabled, triggerId, panelId }}>
      <div
        className={[
          'sds-accordion-item',
          `sds-accordion-item--${size}`,
          isOpen     && 'sds-accordion-item--open',
          disabled   && 'sds-accordion-item--disabled',
          className,
        ].filter(Boolean).join(' ')}
      >
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
}

// ─── AccordionTrigger ─────────────────────────────────────────────────────────

export function AccordionTrigger({ icon, children, className }: AccordionTriggerProps) {
  const { toggle, size } = useAccordionContext();
  const { value, isOpen, isDisabled, triggerId, panelId } = useAccordionItemContext();

  const chevronSize = size === 'medium' ? 32 : 24;

  function handleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Home' && e.key !== 'End') return;
    const root = e.currentTarget.closest('[data-accordion]');
    if (!root) return;
    const triggers = Array.from(
      root.querySelectorAll<HTMLButtonElement>('[data-accordion-trigger]:not(:disabled)')
    );
    const idx = triggers.indexOf(e.currentTarget);
    if (idx === -1) return;
    let next = -1;
    if (e.key === 'ArrowDown') next = (idx + 1) % triggers.length;
    else if (e.key === 'ArrowUp') next = (idx - 1 + triggers.length) % triggers.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = triggers.length - 1;
    if (next !== -1) { e.preventDefault(); triggers[next].focus(); }
  }

  const titleClass = size === 'medium'
    ? 'sds-text--subtitle-large'
    : 'sds-text--subtitle-medium';

  return (
    <button
      type="button"
      id={triggerId}
      data-accordion-trigger
      aria-expanded={isOpen}
      aria-controls={panelId}
      disabled={isDisabled}
      className={['sds-accordion-trigger', className].filter(Boolean).join(' ')}
      onClick={() => toggle(value)}
      onKeyDown={handleKeyDown}
    >
      <span className="sds-accordion-trigger__start">
        {icon && (
          <span className="sds-accordion-trigger__icon" aria-hidden="true">
            {icon}
          </span>
        )}
        <span className={`sds-accordion-trigger__title ${titleClass}`}>
          {children}
        </span>
      </span>
      <span
        className="sds-accordion-trigger__chevron"
        aria-hidden="true"
        data-open={isOpen || undefined}
      >
        <KeyboardArrowDownIcon size={chevronSize} />
      </span>
    </button>
  );
}

// ─── AccordionPanel ───────────────────────────────────────────────────────────

export function AccordionPanel({ children, className }: AccordionPanelProps) {
  const { size } = useAccordionContext();
  const { isOpen, panelId, triggerId } = useAccordionItemContext();

  const contentClass = size === 'medium'
    ? 'sds-text--body-content-medium'
    : 'sds-text--body-content-small';

  return (
    <div
      id={panelId}
      role="region"
      aria-labelledby={triggerId}
      className={[
        'sds-accordion-panel',
        isOpen && 'sds-accordion-panel--open',
        className,
      ].filter(Boolean).join(' ')}
    >
      <div className="sds-accordion-panel__inner">
        <div className={`sds-accordion-panel__content ${contentClass}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
