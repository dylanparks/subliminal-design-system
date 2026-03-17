import { useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Menu, MenuItem, MenuDivider } from './Menu';

// ─── Story helpers ────────────────────────────────────────────────────────────

// Placeholder icons — will be replaced by the icon library.
function DiamondIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 2L17.5 10L10 18L2.5 10L10 2Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 2.5L12.1 7.76L17.5 8.3L13.5 12L14.8 17.5L10 14.7L5.2 17.5L6.5 12L2.5 8.3L7.9 7.76L10 2.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.1 4.1l1.4 1.4M14.5 14.5l1.4 1.4M4.1 15.9l1.4-1.4M14.5 5.5l1.4-1.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<typeof Menu> = {
  component: Menu,
  title: 'Navigation/Menu',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A floating menu anchored to a trigger element. Implements the WAI-ARIA Menu pattern with full keyboard navigation, focus management, and WCAG AA compliance. Single-select items auto-close the menu on activation; multi-select items stay open.',
      },
    },
  },
  argTypes: {
    multiSelect: {
      control: 'boolean',
      description: 'Enables multi-select mode — items show checkboxes and the menu stays open after each selection.',
      table: { defaultValue: { summary: 'false' } },
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
    open:            { table: { disable: true } },
    anchorEl:        { table: { disable: true } },
    onClose:         { table: { disable: true } },
    children:        { table: { disable: true } },
    className:       { table: { disable: true } },
    'aria-labelledby': { table: { disable: true } },
  },
  args: {
    multiSelect: false,
    maxHeight:   360,
    'aria-label': 'Options',
  },
};

export default meta;
type Story = StoryObj<typeof Menu>;

// ─── Default ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  render: (args) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [open, setOpen]         = useState(false);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [selected, setSelected] = useState<Set<string>>(new Set());
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const anchorRef               = useRef<HTMLButtonElement>(null);

    function toggle(id: string) {
      setSelected(prev => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      });
    }

    const items = [
      { id: 'profile',       label: 'Profile',          icon: <DiamondIcon /> },
      { id: 'favourites',    label: 'Favourites',        icon: <StarIcon /> },
      { id: 'settings',      label: 'Settings',          icon: <SettingsIcon /> },
    ];

    return (
      <>
        <button
          ref={anchorRef}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen(v => !v)}
          style={{ padding: '8px 16px', cursor: 'pointer' }}
        >
          Open Menu
        </button>

        <Menu
          {...args}
          open={open}
          anchorEl={anchorRef.current}
          onClose={() => setOpen(false)}
        >
          {items.map(item => (
            <MenuItem
              key={item.id}
              icon={item.icon}
              selected={selected.has(item.id)}
              onClick={() => toggle(item.id)}
            >
              {item.label}
            </MenuItem>
          ))}
          <MenuDivider />
          <MenuItem disabled>Unavailable option</MenuItem>
        </Menu>
      </>
    );
  },
};

// ─── With Icons ───────────────────────────────────────────────────────────────

export const WithIcons: Story = {
  render: (args) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [open, setOpen] = useState(false);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const anchorRef       = useRef<HTMLButtonElement>(null);

    return (
      <>
        <button
          ref={anchorRef}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen(v => !v)}
          style={{ padding: '8px 16px', cursor: 'pointer' }}
        >
          Open Menu
        </button>

        <Menu {...args} open={open} anchorEl={anchorRef.current} onClose={() => setOpen(false)}>
          <MenuItem icon={<DiamondIcon />}>Diamonds</MenuItem>
          <MenuItem icon={<StarIcon />}>Favourites</MenuItem>
          <MenuItem icon={<SettingsIcon />}>Settings</MenuItem>
          <MenuDivider />
          <MenuItem icon={<DiamondIcon />} disabled>Unavailable</MenuItem>
        </Menu>
      </>
    );
  },
};

// ─── With Suffixes ────────────────────────────────────────────────────────────

export const WithSuffixes: Story = {
  render: (args) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [open, setOpen] = useState(false);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const anchorRef       = useRef<HTMLButtonElement>(null);

    return (
      <>
        <button
          ref={anchorRef}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen(v => !v)}
          style={{ padding: '8px 16px', cursor: 'pointer' }}
        >
          Open Menu
        </button>

        <Menu {...args} open={open} anchorEl={anchorRef.current} onClose={() => setOpen(false)}>
          <MenuItem suffix={{ type: 'tag',  label: '57' }}>Messages</MenuItem>
          <MenuItem suffix={{ type: 'tag',  label: '3'  }}>Notifications</MenuItem>
          <MenuItem suffix={{ type: 'text', label: '⌘K' }}>Search</MenuItem>
          <MenuItem suffix={{ type: 'text', label: '⌘,' }}>Preferences</MenuItem>
          <MenuDivider />
          <MenuItem suffix={{ type: 'icon' }}>More options</MenuItem>
        </Menu>
      </>
    );
  },
};

// ─── Multi-select ─────────────────────────────────────────────────────────────

export const MultiSelect: Story = {
  args: {
    multiSelect: true,
  },
  render: (args) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [open, setOpen]         = useState(false);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [selected, setSelected] = useState<Set<string>>(new Set(['diamonds']));
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

        <Menu {...args} open={open} anchorEl={anchorRef.current} onClose={() => setOpen(false)}>
          <MenuItem icon={<DiamondIcon />}  selected={selected.has('diamonds')}   onClick={() => toggle('diamonds')}>Diamonds</MenuItem>
          <MenuItem icon={<StarIcon />}     selected={selected.has('favourites')} onClick={() => toggle('favourites')}>Favourites</MenuItem>
          <MenuItem icon={<SettingsIcon />} selected={selected.has('settings')}   onClick={() => toggle('settings')}>Settings</MenuItem>
          <MenuDivider />
          <MenuItem disabled>Unavailable option</MenuItem>
        </Menu>
      </>
    );
  },
};

// ─── With selected item (single-select) ──────────────────────────────────────

export const WithSelectedItem: Story = {
  render: (args) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [open, setOpen]     = useState(false);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [active, setActive] = useState('profile');
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const anchorRef           = useRef<HTMLButtonElement>(null);

    const options = [
      { id: 'profile',       label: 'Profile' },
      { id: 'account',       label: 'Account settings' },
      { id: 'notifications', label: 'Notifications' },
      { id: 'help',          label: 'Help & support' },
    ];

    return (
      <>
        <button
          ref={anchorRef}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen(v => !v)}
          style={{ padding: '8px 16px', cursor: 'pointer' }}
        >
          {options.find(o => o.id === active)?.label ?? 'Select'}
        </button>

        <Menu {...args} open={open} anchorEl={anchorRef.current} onClose={() => setOpen(false)}>
          {options.map(o => (
            <MenuItem key={o.id} selected={active === o.id} onClick={() => setActive(o.id)}>
              {o.label}
            </MenuItem>
          ))}
        </Menu>
      </>
    );
  },
};

// ─── Long list (scrollable) ───────────────────────────────────────────────────

export const LongList: Story = {
  args: {
    maxHeight: 320,
  },
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
