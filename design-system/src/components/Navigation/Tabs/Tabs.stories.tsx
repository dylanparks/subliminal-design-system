import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { userEvent, within, expect } from 'storybook/test';
import { Tabs, TabList, Tab, TabPanel } from './Tabs';
import { CircleIcon } from '../../../icons';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<typeof Tabs> = {
  component: Tabs,
  title: 'Navigation/Tabs',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: [
          'Tabs organize related content into sections within a page or modal.',
          'Implements the **WAI-ARIA Tabs pattern** with full keyboard navigation and WCAG AA compliance.',
          '',
          '**Composition:**',
          '```tsx',
          '<Tabs defaultValue="overview">',
          '  <TabList aria-label="Product sections">',
          '    <Tab value="overview">Overview</Tab>',
          '    <Tab value="specs" icon={<SomeIcon />}>Specs</Tab>',
          '  </TabList>',
          '  <TabPanel value="overview">Overview content</TabPanel>',
          '  <TabPanel value="specs">Specs content</TabPanel>',
          '</Tabs>',
          '```',
          '',
          '**Keyboard navigation:** `ArrowLeft` / `ArrowRight` to move between tabs, `Home` / `End` to jump to first / last.',
          '',
          '**Static variant:** Pass `propStatic` to `<Tabs>` when the tab strip sits on a dark or gradient surface.',
        ].join('\n'),
      },
    },
  },
  argTypes: {
    value:        { table: { disable: true } },
    defaultValue: { table: { disable: true } },
    onChange:     { table: { disable: true } },
    children:     { table: { disable: true } },
    className:    { table: { disable: true } },
    propStatic: {
      control: 'boolean',
      description: 'White-palette variant for dark or gradient backgrounds.',
      table: { defaultValue: { summary: 'false' } },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Tabs>;

// ─── Default (label only) ─────────────────────────────────────────────────────

export const Default: Story = {
  name: 'Label only',
  render: () => (
    <Tabs defaultValue="overview">
      <TabList aria-label="Product sections">
        <Tab value="overview">Overview</Tab>
        <Tab value="specs">Specs</Tab>
        <Tab value="reviews">Reviews</Tab>
        <Tab value="support">Support</Tab>
      </TabList>
      <TabPanel value="overview">
        <p style={{ marginTop: 16, color: 'var(--sds-neutral-content-primary)' }}>Overview panel content.</p>
      </TabPanel>
      <TabPanel value="specs">
        <p style={{ marginTop: 16, color: 'var(--sds-neutral-content-primary)' }}>Specs panel content.</p>
      </TabPanel>
      <TabPanel value="reviews">
        <p style={{ marginTop: 16, color: 'var(--sds-neutral-content-primary)' }}>Reviews panel content.</p>
      </TabPanel>
      <TabPanel value="support">
        <p style={{ marginTop: 16, color: 'var(--sds-neutral-content-primary)' }}>Support panel content.</p>
      </TabPanel>
    </Tabs>
  ),
  parameters: {
    docs: {
      description: { story: 'Label-only tabs — the most common usage pattern.' },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true');
    await expect(canvas.getByRole('tabpanel')).toBeVisible();
  },
};

// ─── With icons ───────────────────────────────────────────────────────────────

export const WithIcons: Story = {
  name: 'Label + icon',
  render: () => (
    <Tabs defaultValue="overview">
      <TabList aria-label="Product sections">
        <Tab value="overview" icon={<CircleIcon size={20} />}>Overview</Tab>
        <Tab value="specs"    icon={<CircleIcon size={20} />}>Specs</Tab>
        <Tab value="reviews"  icon={<CircleIcon size={20} />}>Reviews</Tab>
        <Tab value="support"  icon={<CircleIcon size={20} />}>Support</Tab>
      </TabList>
      <TabPanel value="overview">
        <p style={{ marginTop: 16, color: 'var(--sds-neutral-content-primary)' }}>Overview panel content.</p>
      </TabPanel>
      <TabPanel value="specs">
        <p style={{ marginTop: 16, color: 'var(--sds-neutral-content-primary)' }}>Specs panel content.</p>
      </TabPanel>
      <TabPanel value="reviews">
        <p style={{ marginTop: 16, color: 'var(--sds-neutral-content-primary)' }}>Reviews panel content.</p>
      </TabPanel>
      <TabPanel value="support">
        <p style={{ marginTop: 16, color: 'var(--sds-neutral-content-primary)' }}>Support panel content.</p>
      </TabPanel>
    </Tabs>
  ),
  parameters: {
    docs: {
      description: { story: 'Icon above label. Icon renders at 20 px when paired with a label.' },
    },
  },
};

// ─── Icon only ────────────────────────────────────────────────────────────────

export const IconOnly: Story = {
  name: 'Icon only',
  render: () => (
    <Tabs defaultValue="overview">
      <TabList aria-label="Product sections">
        <Tab value="overview" icon={<CircleIcon size={24} />} />
        <Tab value="specs"    icon={<CircleIcon size={24} />} />
        <Tab value="reviews"  icon={<CircleIcon size={24} />} />
        <Tab value="support"  icon={<CircleIcon size={24} />} />
      </TabList>
      <TabPanel value="overview">
        <p style={{ marginTop: 16, color: 'var(--sds-neutral-content-primary)' }}>Overview panel content.</p>
      </TabPanel>
      <TabPanel value="specs">
        <p style={{ marginTop: 16, color: 'var(--sds-neutral-content-primary)' }}>Specs panel content.</p>
      </TabPanel>
      <TabPanel value="reviews">
        <p style={{ marginTop: 16, color: 'var(--sds-neutral-content-primary)' }}>Reviews panel content.</p>
      </TabPanel>
      <TabPanel value="support">
        <p style={{ marginTop: 16, color: 'var(--sds-neutral-content-primary)' }}>Support panel content.</p>
      </TabPanel>
    </Tabs>
  ),
  parameters: {
    docs: {
      description: { story: 'Icon-only tabs render at 24 px. Ensure `aria-label` on each `<Tab>` if the icon alone may not be self-describing. (These placeholder icons are identifiable by context — in production, pass `aria-label` or ensure icon meaning is clear.)' },
    },
  },
};

// ─── With disabled tab ────────────────────────────────────────────────────────

export const WithDisabled: Story = {
  name: 'With disabled tab',
  render: () => (
    <Tabs defaultValue="overview">
      <TabList aria-label="Product sections">
        <Tab value="overview">Overview</Tab>
        <Tab value="specs">Specs</Tab>
        <Tab value="reviews" disabled>Reviews</Tab>
        <Tab value="support">Support</Tab>
      </TabList>
      <TabPanel value="overview">
        <p style={{ marginTop: 16, color: 'var(--sds-neutral-content-primary)' }}>Overview panel content.</p>
      </TabPanel>
      <TabPanel value="specs">
        <p style={{ marginTop: 16, color: 'var(--sds-neutral-content-primary)' }}>Specs panel content.</p>
      </TabPanel>
      <TabPanel value="reviews">
        <p style={{ marginTop: 16, color: 'var(--sds-neutral-content-primary)' }}>Reviews panel content.</p>
      </TabPanel>
      <TabPanel value="support">
        <p style={{ marginTop: 16, color: 'var(--sds-neutral-content-primary)' }}>Support panel content.</p>
      </TabPanel>
    </Tabs>
  ),
  parameters: {
    docs: {
      description: { story: 'Disabled tabs are non-interactive and skipped by arrow-key navigation.' },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const overviewTab = canvas.getByRole('tab', { name: 'Overview' });
    const specsTab    = canvas.getByRole('tab', { name: 'Specs' });
    const supportTab  = canvas.getByRole('tab', { name: 'Support' });

    overviewTab.focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(specsTab).toHaveFocus();
    await expect(specsTab).toHaveAttribute('aria-selected', 'true');

    // Skips disabled Reviews, lands on Support
    await userEvent.keyboard('{ArrowRight}');
    await expect(supportTab).toHaveFocus();
    await expect(supportTab).toHaveAttribute('aria-selected', 'true');

    // Home → back to first
    await userEvent.keyboard('{Home}');
    await expect(overviewTab).toHaveFocus();
    await expect(overviewTab).toHaveAttribute('aria-selected', 'true');
  },
};

// ─── Static variant ───────────────────────────────────────────────────────────

export const StaticVariant: Story = {
  name: 'Static variant',
  render: () => (
    <div style={{
      background: 'linear-gradient(109deg, var(--sds-accents-gradient-primarystart) 10.664%, var(--sds-accents-gradient-primaryend) 89.336%)',
      padding: 24,
      borderRadius: 'var(--sds-shape-border-radius-medium)',
    }}>
      <Tabs defaultValue="overview" propStatic>
        <TabList aria-label="Product sections">
          <Tab value="overview">Overview</Tab>
          <Tab value="specs">Specs</Tab>
          <Tab value="reviews">Reviews</Tab>
          <Tab value="support">Support</Tab>
        </TabList>
        <TabPanel value="overview">
          <p style={{ marginTop: 16, color: 'var(--sds-neutral-content-static-primary)' }}>Overview panel content.</p>
        </TabPanel>
        <TabPanel value="specs">
          <p style={{ marginTop: 16, color: 'var(--sds-neutral-content-static-primary)' }}>Specs panel content.</p>
        </TabPanel>
        <TabPanel value="reviews">
          <p style={{ marginTop: 16, color: 'var(--sds-neutral-content-static-primary)' }}>Reviews panel content.</p>
        </TabPanel>
        <TabPanel value="support">
          <p style={{ marginTop: 16, color: 'var(--sds-neutral-content-static-primary)' }}>Support panel content.</p>
        </TabPanel>
      </Tabs>
    </div>
  ),
  parameters: {
    docs: {
      description: { story: 'Pass `propStatic` to `<Tabs>` when the tab strip sits on a dark or gradient surface. Uses white-based interactive tokens for labels and indicator.' },
    },
  },
};

// ─── Controlled ───────────────────────────────────────────────────────────────

export const Controlled: Story = {
  name: 'Controlled',
  render: () => {
    const tabs = ['overview', 'specs', 'reviews', 'support'] as const;
    type TabValue = typeof tabs[number];
    const labels: Record<TabValue, string> = {
      overview: 'Overview',
      specs: 'Specs',
      reviews: 'Reviews',
      support: 'Support',
    };

    function ControlledDemo() {
      const [active, setActive] = useState<TabValue>('overview');
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {tabs.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setActive(t)}
                style={{
                  padding: '4px 12px',
                  borderRadius: 'var(--sds-shape-border-radius-xsmall)',
                  border: '1px solid var(--sds-neutral-stroke-default)',
                  background: active === t ? 'var(--sds-interactive-secondary-hollow-background-inactive-hover)' : 'transparent',
                  cursor: 'pointer',
                  fontFamily: 'var(--sds-typography-font-family-body-content)',
                  fontSize: 'var(--sds-typography-font-size-body-content-small)',
                  color: 'var(--sds-neutral-content-primary)',
                }}
              >
                {labels[t]}
              </button>
            ))}
          </div>
          <Tabs value={active} onChange={v => setActive(v as TabValue)}>
            <TabList aria-label="Product sections">
              {tabs.map(t => <Tab key={t} value={t}>{labels[t]}</Tab>)}
            </TabList>
            {tabs.map(t => (
              <TabPanel key={t} value={t}>
                <p style={{ marginTop: 16, color: 'var(--sds-neutral-content-primary)' }}>{labels[t]} panel content.</p>
              </TabPanel>
            ))}
          </Tabs>
        </div>
      );
    }

    return <ControlledDemo />;
  },
  parameters: {
    docs: {
      description: { story: 'Controlled mode via `value` + `onChange`. The external buttons above drive the same tab state.' },
    },
  },
};

// ─── All variants ─────────────────────────────────────────────────────────────

export const AllVariants: Story = {
  name: 'All variants',
  render: () => {
    const labelStyle: React.CSSProperties = {
      fontFamily:    'var(--sds-typography-font-family-subtitle)',
      fontWeight:    'var(--sds-typography-font-weight-subtitle)',
      fontSize:      'var(--sds-typography-font-size-subtitle-small)',
      lineHeight:    'var(--sds-typography-line-height-subtitle-small)',
      letterSpacing: 'var(--sds-typography-letter-spacing-subtitle-small)',
      color:         'var(--sds-neutral-content-secondary)',
      marginBottom: 8,
    };
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
        <div>
          <p style={labelStyle}>Label only</p>
          <Tabs defaultValue="a">
            <TabList aria-label="Label only">
              <Tab value="a">Overview</Tab>
              <Tab value="b">Specs</Tab>
              <Tab value="c">Reviews</Tab>
              <Tab value="d" disabled>Disabled</Tab>
            </TabList>
          </Tabs>
        </div>

        <div>
          <p style={labelStyle}>Label + icon</p>
          <Tabs defaultValue="a">
            <TabList aria-label="Label and icon">
              <Tab value="a" icon={<CircleIcon size={20} />}>Overview</Tab>
              <Tab value="b" icon={<CircleIcon size={20} />}>Specs</Tab>
              <Tab value="c" icon={<CircleIcon size={20} />}>Reviews</Tab>
              <Tab value="d" icon={<CircleIcon size={20} />} disabled>Disabled</Tab>
            </TabList>
          </Tabs>
        </div>

        <div>
          <p style={labelStyle}>Icon only</p>
          <Tabs defaultValue="a">
            <TabList aria-label="Icon only">
              <Tab value="a" icon={<CircleIcon size={24} />} />
              <Tab value="b" icon={<CircleIcon size={24} />} />
              <Tab value="c" icon={<CircleIcon size={24} />} />
              <Tab value="d" icon={<CircleIcon size={24} />} disabled />
            </TabList>
          </Tabs>
        </div>

        <div style={{
          background: 'linear-gradient(109deg, var(--sds-accents-gradient-primarystart) 10.664%, var(--sds-accents-gradient-primaryend) 89.336%)',
          padding: 24,
          borderRadius: 'var(--sds-shape-border-radius-medium)',
        }}>
          <p style={{ ...labelStyle, color: 'var(--sds-neutral-content-static-secondary)' }}>Static variant</p>
          <Tabs defaultValue="a" propStatic>
            <TabList aria-label="Static variant">
              <Tab value="a">Overview</Tab>
              <Tab value="b">Specs</Tab>
              <Tab value="c">Reviews</Tab>
              <Tab value="d" disabled>Disabled</Tab>
            </TabList>
          </Tabs>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: { story: 'All four tab configurations in one view: label-only, label + icon, icon-only, and the static (white) variant.' },
    },
  },
};
