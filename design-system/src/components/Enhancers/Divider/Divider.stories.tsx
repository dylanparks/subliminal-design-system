import type { Meta, StoryObj } from '@storybook/react-vite';
import { Divider } from './Divider';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<typeof Divider> = {
  component: Divider,
  title: 'Enhancers/Divider',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: [
          'A 1px separator for visually dividing sections of content.',
          '',
          'Renders as a `div[role="separator"]` with `aria-orientation` set accordingly.',
          '',
          'Pass `propStatic` when the divider sits on a dark or gradient surface.',
        ].join('\n'),
      },
    },
  },
  argTypes: {
    orientation: {
      control: 'radio',
      options: ['horizontal', 'vertical'],
      table: { defaultValue: { summary: 'horizontal' } },
    },
    propStatic: {
      control: 'boolean',
      description: 'White-palette variant for dark or gradient backgrounds.',
      table: { defaultValue: { summary: 'false' } },
    },
    className: { table: { disable: true } },
  },
};

export default meta;
type Story = StoryObj<typeof Divider>;

// ─── Horizontal ───────────────────────────────────────────────────────────────

export const Horizontal: Story = {
  name: 'Horizontal',
  args: { orientation: 'horizontal' },
  decorators: [
    (Story) => (
      <div style={{ width: 320, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p style={{ margin: 0, fontFamily: 'var(--sds-typography-font-family-body-content)', color: 'var(--sds-neutral-content-primary)' }}>
          Section above
        </p>
        <Story />
        <p style={{ margin: 0, fontFamily: 'var(--sds-typography-font-family-body-content)', color: 'var(--sds-neutral-content-primary)' }}>
          Section below
        </p>
      </div>
    ),
  ],
  parameters: {
    docs: { description: { story: 'Default orientation — a full-width 1px horizontal rule.' } },
  },
};

// ─── Vertical ─────────────────────────────────────────────────────────────────

export const Vertical: Story = {
  name: 'Vertical',
  args: { orientation: 'vertical' },
  decorators: [
    (Story) => (
      <div style={{ height: 48, display: 'flex', alignItems: 'center', gap: 16 }}>
        <p style={{ margin: 0, fontFamily: 'var(--sds-typography-font-family-body-content)', color: 'var(--sds-neutral-content-primary)' }}>
          Left
        </p>
        <Story />
        <p style={{ margin: 0, fontFamily: 'var(--sds-typography-font-family-body-content)', color: 'var(--sds-neutral-content-primary)' }}>
          Right
        </p>
      </div>
    ),
  ],
  parameters: {
    docs: { description: { story: 'Vertical orientation — a 1px full-height separator. The parent must define the height.' } },
  },
};

// ─── Static horizontal ────────────────────────────────────────────────────────

export const StaticHorizontal: Story = {
  name: 'Static — horizontal',
  args: { orientation: 'horizontal', propStatic: true },
  decorators: [
    (Story) => (
      <div style={{
        width:        320,
        padding:      24,
        borderRadius: 'var(--sds-shape-border-radius-medium)',
        background:   'linear-gradient(109deg, var(--sds-accents-gradient-primarystart) 10.664%, var(--sds-accents-gradient-primaryend) 89.336%)',
        display:      'flex',
        flexDirection: 'column',
        gap:          16,
      }}>
        <p style={{ margin: 0, fontFamily: 'var(--sds-typography-font-family-body-content)', color: 'var(--sds-neutral-content-static-primary)' }}>
          Section above
        </p>
        <Story />
        <p style={{ margin: 0, fontFamily: 'var(--sds-typography-font-family-body-content)', color: 'var(--sds-neutral-content-static-primary)' }}>
          Section below
        </p>
      </div>
    ),
  ],
  parameters: {
    docs: { description: { story: 'Pass `propStatic` when the divider sits on a dark or gradient surface. Uses a subtle white stroke token.' } },
  },
};

// ─── Static vertical ──────────────────────────────────────────────────────────

export const StaticVertical: Story = {
  name: 'Static — vertical',
  args: { orientation: 'vertical', propStatic: true },
  decorators: [
    (Story) => (
      <div style={{
        height:       64,
        padding:      16,
        borderRadius: 'var(--sds-shape-border-radius-medium)',
        background:   'linear-gradient(109deg, var(--sds-accents-gradient-primarystart) 10.664%, var(--sds-accents-gradient-primaryend) 89.336%)',
        display:      'flex',
        alignItems:   'center',
        gap:          16,
      }}>
        <p style={{ margin: 0, fontFamily: 'var(--sds-typography-font-family-body-content)', color: 'var(--sds-neutral-content-static-primary)' }}>
          Left
        </p>
        <Story />
        <p style={{ margin: 0, fontFamily: 'var(--sds-typography-font-family-body-content)', color: 'var(--sds-neutral-content-static-primary)' }}>
          Right
        </p>
      </div>
    ),
  ],
  parameters: {
    docs: { description: { story: 'Vertical static variant on a gradient background.' } },
  },
};
