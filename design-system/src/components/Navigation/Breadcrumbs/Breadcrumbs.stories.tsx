import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, userEvent, expect } from 'storybook/test';
import { Breadcrumbs } from './Breadcrumbs';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<typeof Breadcrumbs> = {
  component: Breadcrumbs,
  title: 'Navigation/Breadcrumbs',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: [
          'Breadcrumbs indicate where the user is within a site or app hierarchy.',
          '',
          '**Usage:**',
          '```tsx',
          'const items = [',
          '  { label: "Home", href: "/" },',
          '  { label: "Products", href: "/products" },',
          '  { label: "Detail" }, // no href = current page',
          '];',
          '',
          '<Breadcrumbs items={items} />',
          '```',
          '',
          '**Overflow:** Pass `maxItems` to collapse the middle crumbs into an ellipsis button.',
          'When activated, the button opens a dropdown revealing the hidden items.',
          '',
          '**Static variant:** Pass `propStatic` when the breadcrumb sits on a dark or gradient surface.',
        ].join('\n'),
      },
    },
  },
  argTypes: {
    items:     { table: { disable: true } },
    className: { table: { disable: true } },
    'aria-label': {
      control: 'text',
      table: { defaultValue: { summary: 'Breadcrumb' } },
    },
    maxItems: {
      control: { type: 'number', min: 2 },
      description: 'Collapse middle items when total exceeds this count.',
    },
    propStatic: {
      control: 'boolean',
      description: 'White-palette variant for dark or gradient backgrounds.',
      table: { defaultValue: { summary: 'false' } },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Breadcrumbs>;

// ─── Shared items ─────────────────────────────────────────────────────────────

const twoItems = [
  { label: 'Home', href: '/' },
  { label: 'Current Page' },
];

const threeItems = [
  { label: 'Home',     href: '/' },
  { label: 'Products', href: '/products' },
  { label: 'Current Page' },
];

const manyItems = [
  { label: 'Home',        href: '/' },
  { label: 'Shop',        href: '/shop' },
  { label: 'Electronics', href: '/shop/electronics' },
  { label: 'Phones',      href: '/shop/electronics/phones' },
  { label: 'Smartphones', href: '/shop/electronics/phones/smartphones' },
  { label: 'Current Page' },
];

// ─── Two items ────────────────────────────────────────────────────────────────

export const TwoItems: Story = {
  name: 'Two items',
  args: { items: twoItems },
  parameters: {
    docs: { description: { story: 'Minimum breadcrumb — one ancestor link + current page.' } },
  },
};

// ─── Three items ──────────────────────────────────────────────────────────────

export const ThreeItems: Story = {
  name: 'Three items',
  args: { items: threeItems },
  parameters: {
    docs: { description: { story: 'Two ancestor links + current page.' } },
  },
};

// ─── Many items (no overflow) ─────────────────────────────────────────────────

export const ManyItems: Story = {
  name: 'Many items (no overflow)',
  args: { items: manyItems },
  parameters: {
    docs: { description: { story: 'Six items with no `maxItems` set — all items shown inline.' } },
  },
};

// ─── With overflow ────────────────────────────────────────────────────────────

export const WithOverflow: Story = {
  name: 'With overflow',
  args: { items: manyItems, maxItems: 4 },
  parameters: {
    docs: {
      description: {
        story: 'When `items.length > maxItems`, the middle crumbs collapse into an overflow button. Click the button to reveal the hidden items.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const overflowBtn = canvas.getByRole('button', { name: 'Show hidden breadcrumbs' });
    await expect(overflowBtn).toBeInTheDocument();
    await userEvent.click(overflowBtn);
    // Menu items for collapsed crumbs should appear
    await expect(canvas.getByRole('menuitem', { name: 'Home' })).toBeVisible();
    await expect(canvas.getByRole('menuitem', { name: 'Shop' })).toBeVisible();
    await expect(canvas.getByRole('menuitem', { name: 'Electronics' })).toBeVisible();
  },
};

// ─── Static variant ───────────────────────────────────────────────────────────

export const StaticVariant: Story = {
  name: 'Static variant',
  args: { items: threeItems, propStatic: true },
  decorators: [
    (Story) => (
      <div style={{
        background: 'linear-gradient(109deg, var(--sds-accents-gradient-primarystart) 10.664%, var(--sds-accents-gradient-primaryend) 89.336%)',
        padding: 24,
        borderRadius: 'var(--sds-shape-border-radius-medium)',
      }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: { story: 'Pass `propStatic` when the breadcrumb sits on a dark or gradient surface. Uses white-based tokens for links and separators.' },
    },
  },
};

// ─── Static with overflow ─────────────────────────────────────────────────────

export const StaticWithOverflow: Story = {
  name: 'Static variant with overflow',
  args: { items: manyItems, maxItems: 4, propStatic: true },
  decorators: [
    (Story) => (
      <div style={{
        background: 'linear-gradient(109deg, var(--sds-accents-gradient-primarystart) 10.664%, var(--sds-accents-gradient-primaryend) 89.336%)',
        padding: 24,
        borderRadius: 'var(--sds-shape-border-radius-medium)',
      }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: { story: 'Static variant with overflow collapse. The overflow button uses the static hollow stroke token.' },
    },
  },
};

// ─── onClick navigation ───────────────────────────────────────────────────────

export const OnClickNavigation: Story = {
  name: 'onClick navigation (no href)',
  args: {
    items: [
      { label: 'Home',     onClick: () => alert('Navigate: Home') },
      { label: 'Products', onClick: () => alert('Navigate: Products') },
      { label: 'Current Page' },
    ],
  },
  parameters: {
    docs: {
      description: { story: 'When `href` is omitted, each ancestor crumb renders as a `<button>` — useful for client-side navigation with a router\'s `navigate()` function.' },
    },
  },
};

// ─── All depths ───────────────────────────────────────────────────────────────

export const AllDepths: Story = {
  name: 'All depths',
  render: () => {
    const labelStyle: React.CSSProperties = {
      fontFamily:    'var(--sds-typography-font-family-subtitle)',
      fontWeight:    'var(--sds-typography-font-weight-subtitle)',
      fontSize:      'var(--sds-typography-font-size-subtitle-small)',
      lineHeight:    'var(--sds-typography-line-height-subtitle-small)',
      letterSpacing: 'var(--sds-typography-letter-spacing-subtitle-small)',
      color:         'var(--sds-neutral-content-secondary)',
      marginBottom:  8,
    };
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        <div>
          <p style={labelStyle}>2 items</p>
          <Breadcrumbs items={twoItems} />
        </div>
        <div>
          <p style={labelStyle}>3 items</p>
          <Breadcrumbs items={threeItems} />
        </div>
        <div>
          <p style={labelStyle}>6 items — no overflow</p>
          <Breadcrumbs items={manyItems} />
        </div>
        <div>
          <p style={labelStyle}>6 items — maxItems 4 (overflow)</p>
          <Breadcrumbs items={manyItems} maxItems={4} />
        </div>
      </div>
    );
  },
  parameters: {
    docs: { description: { story: 'All depth variants side by side.' } },
  },
};
