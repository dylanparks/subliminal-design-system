import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { RatingInput } from './RatingInput';

const meta: Meta<typeof RatingInput> = {
  component: RatingInput,
  title: 'Inputs/RatingInput',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: [
          'A star-based rating control implemented as a radio group.',
          '',
          'Each star is a native `<input type="radio">` so the browser handles',
          'arrow-key navigation between stars, form submission, and screen-reader',
          'announcements ("N out of max stars, radio button").',
          '',
          'Supports controlled (`value` + `onChange`) and uncontrolled (`defaultValue`) modes.',
        ].join('\n'),
      },
    },
  },
  argTypes: {
    label: {
      control: 'text',
      description: 'Visible group label shown above the stars.',
      table: { defaultValue: { summary: '—' } },
    },
    value: {
      control: { type: 'number', min: 0, max: 5, step: 1 },
      description: 'Controlled value (1–max). 0 or null = no selection. Omit for uncontrolled.',
    },
    defaultValue: {
      control: { type: 'number', min: 1, max: 5, step: 1 },
      description: 'Initial value for uncontrolled mode.',
    },
    max: {
      control: { type: 'number', min: 1, max: 10, step: 1 },
      table: { defaultValue: { summary: '5' } },
    },
    disabled: {
      control: 'boolean',
      table: { defaultValue: { summary: 'false' } },
    },
  },
  args: {
    label: 'Rate this',
    max: 5,
    disabled: false,
  },
};

export default meta;
type Story = StoryObj<typeof RatingInput>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {};

// ─── Uncontrolled ─────────────────────────────────────────────────────────────

export const Uncontrolled: Story = {
  args: { label: 'Your rating', defaultValue: 3 },
  parameters: {
    docs: {
      description: {
        story: 'Uncontrolled — initial value set via `defaultValue`. The component manages its own state.',
      },
    },
  },
};

// ─── Controlled ───────────────────────────────────────────────────────────────

export const Controlled: Story = {
  args: { label: 'Your rating', value: 4 },
  render: (args) => {
    const [val, setVal] = useState(args.value ?? null);
    return <RatingInput {...args} value={val} onChange={setVal} />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Controlled — parent owns the value via `value` + `onChange`.',
      },
    },
  },
};

// ─── All ratings ──────────────────────────────────────────────────────────────

export const AllRatings: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
      <RatingInput label="Initial (0)" value={null} />
      <RatingInput label="1 star"  value={1} />
      <RatingInput label="2 stars" value={2} />
      <RatingInput label="3 stars" value={3} />
      <RatingInput label="4 stars" value={4} />
      <RatingInput label="5 stars" value={5} />
    </div>
  ),
};

// ─── Disabled ─────────────────────────────────────────────────────────────────

export const Disabled: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
      <RatingInput label="No rating (disabled)" value={null} disabled />
      <RatingInput label="3 stars (disabled)"   value={3}    disabled />
    </div>
  ),
};

// ─── No label ─────────────────────────────────────────────────────────────────

export const NoLabel: Story = {
  args: { label: undefined, 'aria-label': 'Rate this product', value: 3 },
  parameters: {
    docs: {
      description: {
        story: 'When no visible `label` is provided, pass `aria-label` to name the group for assistive technology.',
      },
    },
  },
};

// ─── Custom max ───────────────────────────────────────────────────────────────

export const CustomMax: Story = {
  args: { label: 'Rate out of 10', max: 10, defaultValue: 7 },
  parameters: {
    docs: {
      description: {
        story: 'The `max` prop controls the number of stars. Each star announces "N out of max stars".',
      },
    },
  },
};
