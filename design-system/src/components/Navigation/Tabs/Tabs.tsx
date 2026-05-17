import { createContext, useContext, useId, useRef, useState } from 'react';
import './Tabs.css';

// ─── Context ──────────────────────────────────────────────────────────────────

interface TabsContextValue {
  activeValue: string;
  setActiveValue: (value: string) => void;
  propStatic: boolean;
  instanceId: string;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('<Tab> and <TabPanel> must be inside <Tabs>');
  return ctx;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TabsProps {
  /** Controlled active tab value */
  value?: string;
  /** Initial active tab value for uncontrolled usage */
  defaultValue?: string;
  /** Called when the active tab changes */
  onChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
  /**
   * Static variant — for use on dark or gradient backgrounds.
   * Switches the color palette to white-based interactive tokens.
   */
  propStatic?: boolean;
}

export interface TabListProps {
  children: React.ReactNode;
  className?: string;
  /** Accessible name for the tab list */
  'aria-label'?: string;
  /** Alternative to `aria-label` — ID of an element that labels the tab list */
  'aria-labelledby'?: string;
}

export interface TabProps {
  /** Unique value that identifies this tab and its associated panel */
  value: string;
  /** Tab label text */
  children?: React.ReactNode;
  /** Optional leading icon (above the label when both are present) */
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export interface TabPanelProps {
  /** Must match the `value` of the corresponding `<Tab>` */
  value: string;
  children: React.ReactNode;
  className?: string;
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

export function Tabs({
  value: controlledValue,
  defaultValue = '',
  onChange,
  children,
  className,
  propStatic = false,
}: TabsProps) {
  const instanceId = useId();
  const [internalValue, setInternalValue] = useState(defaultValue);
  const isControlled = controlledValue !== undefined;
  const activeValue = isControlled ? controlledValue : internalValue;

  function setActiveValue(next: string) {
    if (!isControlled) setInternalValue(next);
    onChange?.(next);
  }

  return (
    <TabsContext.Provider value={{ activeValue, setActiveValue, propStatic, instanceId }}>
      <div className={['sds-tabs', className].filter(Boolean).join(' ')}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

// ─── TabList ──────────────────────────────────────────────────────────────────

export function TabList({
  children,
  className,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
}: TabListProps) {
  const { propStatic } = useTabsContext();
  const ref = useRef<HTMLDivElement>(null);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!ref.current) return;
    const tabs = Array.from(
      ref.current.querySelectorAll<HTMLButtonElement>('[role="tab"]:not([disabled])')
    );
    const idx = tabs.indexOf(document.activeElement as HTMLButtonElement);
    if (idx === -1) return;

    let next = -1;
    if (e.key === 'ArrowRight') next = (idx + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') next = (idx - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;

    if (next !== -1) {
      e.preventDefault();
      tabs[next].focus();
      tabs[next].click();
    }
  }

  return (
    <div
      ref={ref}
      role="tablist"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby}
      className={[
        'sds-tab-list',
        propStatic && 'sds-tab-list--static',
        className,
      ].filter(Boolean).join(' ')}
      onKeyDown={handleKeyDown}
    >
      {children}
    </div>
  );
}

// ─── Tab ─────────────────────────────────────────────────────────────────────

export function Tab({ value, children, icon, disabled, className }: TabProps) {
  const { activeValue, setActiveValue, propStatic, instanceId } = useTabsContext();
  const isSelected = activeValue === value;
  const hasLabel = children != null;
  const hasIcon = icon != null;
  const iconOnly = hasIcon && !hasLabel;
  const withIcon = hasIcon && hasLabel;

  const tabId = `${instanceId}tab-${value}`;
  const panelId = `${instanceId}panel-${value}`;

  return (
    <button
      type="button"
      role="tab"
      id={tabId}
      aria-selected={isSelected}
      aria-controls={panelId}
      tabIndex={isSelected ? 0 : -1}
      disabled={disabled}
      className={[
        'sds-tab',
        isSelected && 'sds-tab--active',
        iconOnly && 'sds-tab--icon-only',
        withIcon && 'sds-tab--with-icon',
        propStatic && 'sds-tab--static',
        disabled && 'sds-tab--disabled',
        className,
      ].filter(Boolean).join(' ')}
      onClick={() => setActiveValue(value)}
    >
      <span className="sds-tab__content">
        {hasIcon && (
          <span className="sds-tab__icon" aria-hidden="true">{icon}</span>
        )}
        {hasLabel && (
          <span className="sds-tab__label sds-text--body-interactive-small">{children}</span>
        )}
      </span>
      <span className="sds-tab__indicator" aria-hidden="true" />
    </button>
  );
}

// ─── TabPanel ─────────────────────────────────────────────────────────────────

export function TabPanel({ value, children, className }: TabPanelProps) {
  const { activeValue, instanceId } = useTabsContext();
  const isActive = activeValue === value;

  return (
    <div
      role="tabpanel"
      id={`${instanceId}panel-${value}`}
      aria-labelledby={`${instanceId}tab-${value}`}
      tabIndex={0}
      hidden={!isActive}
      className={['sds-tab-panel', className].filter(Boolean).join(' ')}
    >
      {children}
    </div>
  );
}
