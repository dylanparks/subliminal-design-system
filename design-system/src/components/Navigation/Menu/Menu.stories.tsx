import { useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { userEvent, within, expect, waitFor } from '@storybook/test';
import { Menu, MenuItem, MenuDivider } from './Menu';
import type { MenuSuffix } from './Menu';
import { DiamondIcon, StarIcon, SettingsIcon } from '../../../icons';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<typeof Menu> = {
  component: Menu,
  title: 'Navigation/Menu',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A floating menu anchored to a trigger element. Implements the WAI-ARIA Menu pattern with full keyboard navigation, focus management, and WCAG AA compliance.\n\n- **single-select**: items show a checkmark when selected; menu auto-closes on activation.\n- **multi-select**: items show checkboxes; menu stays open after each selection.\n- **configure**: items have a drag handle for reordering and an optional toggle switch.',
      },
    },
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['single-select', 'multi-select', 'configure'],
      description: 'The interaction model for all items in this menu.',
      table: { defaultValue: { summary: 'single-select' } },
    },
    maxHeight: {
      control: { type: 'number', min: 100, max: 600, step: 20 },
      description: 'Maximum height in px before the list becomes scrollable.',
      table: { defaultValue: { summary: '360' } },
    },
    'aria-label': {
      control: 'text',
      description: 'Accessible name for the menu (use when there is no visible heading).',
    },
    // Internal state — not meaningful as Storybook controls.
    open:              { table: { disable: true } },
    anchorEl:          { table: { disable: true } },
    onClose:           { table: { disable: true } },
    children:          { table: { disable: true } },
    className:         { table: { disable: true } },
    'aria-labelledby': { table: { disable: true } },
  },
  args: {
    type:         'single-select',
    maxHeight:    360,
    'aria-label': 'Options',
  },
};

export default meta;

// ─── Item controls — shared across stories that support them ──────────────────

type ItemControls = {
  /** Show a leading icon on each item */
  showIcons: boolean;
  /** Trailing suffix variant */
  suffixType: 'none' | 'tag' | 'text' | 'icon';
  /** Include a disabled item at the bottom */
  showDisabled: boolean;
};

const itemArgTypes = {
  showIcons: {
    control: 'boolean',
    description: 'Show a leading icon on each menu item.',
    table: { category: 'Item', defaultValue: { summary: 'true' } },
  },
  suffixType: {
    control: 'select',
    options: ['none', 'tag', 'text', 'icon'],
    description: 'Trailing suffix shown on each item.',
    table: { category: 'Item', defaultValue: { summary: 'none' } },
  },
  showDisabled: {
    control: 'boolean',
    description: 'Include a disabled item separated by a divider.',
    table: { category: 'Item', defaultValue: { summary: 'true' } },
  },
} as const;

// ─── Shared item data ─────────────────────────────────────────────────────────

const ITEMS = [
  { id: 'profile',    label: 'Profile',    icon: <DiamondIcon />,  tagLabel: '57', shortcut: '⌘P' },
  { id: 'favourites', label: 'Favourites', icon: <StarIcon />,     tagLabel: '3',  shortcut: '⌘F' },
  { id: 'settings',   label: 'Settings',   icon: <SettingsIcon />, tagLabel: '12', shortcut: '⌘,' },
];

function resolveSuffix(item: typeof ITEMS[0], suffixType: ItemControls['suffixType']): MenuSuffix | undefined {
  if (suffixType === 'tag')  return { type: 'tag',  label: item.tagLabel };
  if (suffixType === 'text') return { type: 'text', label: item.shortcut };
  if (suffixType === 'icon') return { type: 'icon' };
  return undefined;
}

// ─── Default (single-select) ──────────────────────────────────────────────────

type DefaultArgs = React.ComponentProps<typeof Menu> & ItemControls;

export const SingleSelect: StoryObj<DefaultArgs> = {
  name: 'Single select',
  argTypes: itemArgTypes,
  args: {
    showIcons:    true,
    suffixType:   'none',
    showDisabled: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /open menu/i }));
    await waitFor(() =>
      expect(document.querySelector('[role="menu"]')).toBeInTheDocument()
    );
  },
  parameters: { chromatic: { delay: 300 } },
  render: ({ showIcons, suffixType, showDisabled, ...menuArgs }) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [open, setOpen]     = useState(false);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [active, setActive] = useState<string | null>(null);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const anchorRef           = useRef<HTMLButtonElement>(null);

    return (
      <>
        <button
          ref={anchorRef}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen(v => !v)}
          style={{ padding: '8px 16px', cursor: 'pointer' }}
        >
          {ITEMS.find(o => o.id === active)?.label ?? 'Open Menu'}
        </button>

        <Menu
          {...menuArgs}
          open={open}
          anchorEl={anchorRef.current}
          onClose={() => setOpen(false)}
        >
          {ITEMS.map(item => (
            <MenuItem
              key={item.id}
              icon={showIcons ? item.icon : undefined}
              suffix={resolveSuffix(item, suffixType)}
              selected={active === item.id}
              onClick={() => setActive(item.id)}
            >
              {item.label}
            </MenuItem>
          ))}
          {showDisabled && (
            <>
              <MenuDivider />
              <MenuItem disabled>Unavailable option</MenuItem>
            </>
          )}
        </Menu>
      </>
    );
  },
};

// ─── Multi-select ─────────────────────────────────────────────────────────────

type MultiSelectArgs = React.ComponentProps<typeof Menu> & ItemControls;

export const MultiSelect: StoryObj<MultiSelectArgs> = {
  args: {
    type:         'multi-select',
    showIcons:    true,
    suffixType:   'none',
    showDisabled: true,
  },
  argTypes: itemArgTypes,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /filter/i }));
    await waitFor(() =>
      expect(document.querySelector('[role="menu"]')).toBeInTheDocument()
    );
  },
  parameters: { chromatic: { delay: 300 } },
  render: ({ showIcons, suffixType, showDisabled, ...menuArgs }) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [open, setOpen]         = useState(false);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [selected, setSelected] = useState<Set<string>>(new Set(['favourites']));
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const anchorRef               = useRef<HTMLButtonElement>(null);

    function toggle(id: string) {
      setSelected(prev => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      });
    }

    return (
      <>
        <button
          ref={anchorRef}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen(v => !v)}
          style={{ padding: '8px 16px', cursor: 'pointer' }}
        >
          Filter ({selected.size})
        </button>

        <Menu {...menuArgs} open={open} anchorEl={anchorRef.current} onClose={() => setOpen(false)}>
          {ITEMS.map(item => (
            <MenuItem
              key={item.id}
              icon={showIcons ? item.icon : undefined}
              suffix={resolveSuffix(item, suffixType)}
              selected={selected.has(item.id)}
              onClick={() => toggle(item.id)}
            >
              {item.label}
            </MenuItem>
          ))}
          {showDisabled && (
            <>
              <MenuDivider />
              <MenuItem disabled>Unavailable option</MenuItem>
            </>
          )}
        </Menu>
      </>
    );
  },
};

// ─── Configure ────────────────────────────────────────────────────────────────

type ConfigureArgs = React.ComponentProps<typeof Menu> & ItemControls & { showToggles: boolean };

export const Configure: StoryObj<ConfigureArgs> = {
  args: {
    type:         'configure',
    showIcons:    true,
    suffixType:   'none',
    showDisabled: false,
    showToggles:  true,
  },
  argTypes: {
    ...itemArgTypes,
    showToggles: {
      control: 'boolean',
      description: 'Show the toggle switch on each item.',
      table: { category: 'Item', defaultValue: { summary: 'true' } },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /configure columns/i }));
    await waitFor(() =>
      expect(document.querySelector('[role="menu"]')).toBeInTheDocument()
    );
  },
  parameters: { chromatic: { delay: 300 } },
  render: ({ showIcons, suffixType, showDisabled, showToggles, ...menuArgs }) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [open, setOpen] = useState(false);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const anchorRef       = useRef<HTMLButtonElement>(null);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [items, setItems] = useState([
      { id: 'diamonds',   label: 'Diamonds',   icon: <DiamondIcon />,  enabled: true  },
      { id: 'favourites', label: 'Favourites', icon: <StarIcon />,     enabled: true  },
      { id: 'settings',   label: 'Settings',   icon: <SettingsIcon />, enabled: false },
      { id: 'messages',   label: 'Messages',   icon: <DiamondIcon />,  enabled: true  },
    ]);

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const dragId = useRef<string | null>(null);

    function toggleItem(id: string) {
      setItems(prev => prev.map(item => item.id === id ? { ...item, enabled: !item.enabled } : item));
    }

    function handleDragStart(id: string, e: React.DragEvent) {
      dragId.current = id;
      e.dataTransfer.effectAllowed = 'move';
    }

    function handleDrop(targetId: string, e: React.DragEvent<HTMLLIElement>) {
      e.preventDefault();
      if (!dragId.current || dragId.current === targetId) return;
      const position = (e.currentTarget as HTMLElement).dataset.dropPosition ?? 'before';
      const fromIdx  = items.findIndex(i => i.id === dragId.current);
      const next     = [...items];
      const [moved]  = next.splice(fromIdx, 1);
      // Find target in the already-modified array, then insert before or after it
      const newToIdx = next.findIndex(i => i.id === targetId);
      next.splice(position === 'after' ? newToIdx + 1 : newToIdx, 0, moved);
      setItems(next);
      dragId.current = null;
    }

    return (
      <>
        <button
          ref={anchorRef}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen(v => !v)}
          style={{ padding: '8px 16px', cursor: 'pointer' }}
        >
          Configure columns
        </button>

        <Menu {...menuArgs} open={open} anchorEl={anchorRef.current} onClose={() => setOpen(false)}>
          {items.map((item, i) => (
            <MenuItem
              key={item.id}
              icon={showIcons ? item.icon : undefined}
              suffix={resolveSuffix(ITEMS[i % ITEMS.length], suffixType)}
              selected={item.enabled}
              toggleable={showToggles}
              onClick={() => toggleItem(item.id)}
              onDragStart={(e) => handleDragStart(item.id, e)}
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
              onDrop={(e) => handleDrop(item.id, e)}
            >
              {item.label}
            </MenuItem>
          ))}
          {showDisabled && (
            <>
              <MenuDivider />
              <MenuItem disabled>Unavailable option</MenuItem>
            </>
          )}
        </Menu>
      </>
    );
  },
};

// ─── Configure (no toggles) ───────────────────────────────────────────────────

export const ConfigureNoToggles: StoryObj<typeof Menu> = {
  name: 'Configure (no toggles)',
  args: {
    type: 'configure',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /reorder items/i }));
    await waitFor(() =>
      expect(document.querySelector('[role="menu"]')).toBeInTheDocument()
    );
  },
  parameters: { chromatic: { delay: 300 } },
  render: (args) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [open, setOpen] = useState(false);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const anchorRef       = useRef<HTMLButtonElement>(null);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [items, setItems] = useState(['First column', 'Second column', 'Third column']);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const dragLabel = useRef<string | null>(null);

    function handleDrop(targetLabel: string, e: React.DragEvent<HTMLLIElement>) {
      e.preventDefault();
      if (!dragLabel.current || dragLabel.current === targetLabel) return;
      const position = (e.currentTarget as HTMLElement).dataset.dropPosition ?? 'before';
      const fromIdx  = items.indexOf(dragLabel.current);
      const next     = [...items];
      const [moved]  = next.splice(fromIdx, 1);
      const newToIdx = next.indexOf(targetLabel);
      next.splice(position === 'after' ? newToIdx + 1 : newToIdx, 0, moved);
      setItems(next);
      dragLabel.current = null;
    }

    return (
      <>
        <button
          ref={anchorRef}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen(v => !v)}
          style={{ padding: '8px 16px', cursor: 'pointer' }}
        >
          Reorder items
        </button>

        <Menu {...args} open={open} anchorEl={anchorRef.current} onClose={() => setOpen(false)}>
          {items.map(label => (
            <MenuItem
              key={label}
              toggleable={false}
              onDragStart={(e) => { dragLabel.current = label; e.dataTransfer.effectAllowed = 'move'; }}
              onDragOver={(e) => { e.dataTransfer.dropEffect = 'move'; }}
              onDrop={(e) => handleDrop(label, e)}
            >
              {label}
            </MenuItem>
          ))}
        </Menu>
      </>
    );
  },
};

// ─── Long list (scrollable) ───────────────────────────────────────────────────

export const LongList: StoryObj<typeof Menu> = {
  args: {
    maxHeight: 320,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /open long menu/i }));
    await waitFor(() =>
      expect(document.querySelector('[role="menu"]')).toBeInTheDocument()
    );
  },
  parameters: { chromatic: { delay: 300 } },
  render: (args) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [open, setOpen]     = useState(false);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [active, setActive] = useState<string | null>(null);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const anchorRef           = useRef<HTMLButtonElement>(null);

    const items = Array.from({ length: 16 }, (_, i) => `Option ${i + 1}`);

    return (
      <>
        <button
          ref={anchorRef}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen(v => !v)}
          style={{ padding: '8px 16px', cursor: 'pointer' }}
        >
          {active ?? 'Open long menu'}
        </button>

        <Menu {...args} open={open} anchorEl={anchorRef.current} onClose={() => setOpen(false)}>
          {items.map(label => (
            <MenuItem key={label} selected={active === label} onClick={() => setActive(label)}>
              {label}
            </MenuItem>
          ))}
        </Menu>
      </>
    );
  },
};
