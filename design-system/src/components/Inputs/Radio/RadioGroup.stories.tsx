import type { Meta, StoryObj } from '@storybook/react-vite';
import { RadioGroup } from './RadioGroup';
import { Radio } from './Radio';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<typeof RadioGroup> = {
  component: RadioGroup,
  title: 'Inputs/RadioGroup',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Layout container and state manager for a set of Radio items. Provide `defaultValue` (uncontrolled) or `value` + `onValueChange` (controlled) to let the group own selection — each Radio only needs a `value` prop. Arrow-key navigation between radios is handled natively by the browser.',
      },
    },
  },
  argTypes: {
    error: {
      control: 'boolean',
      description: 'Whether the group is in an error state.',
      table: { defaultValue: { summary: 'false' } },
    },
    errorMessage: {
      control: 'text',
      description: 'Validation message shown when `error` is true.',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables all Radio items in the group.',
      table: { defaultValue: { summary: 'false' } },
    },
    size: {
      control: 'select',
      options: ['large', 'medium'],
      description: 'Controls vertical gap between items.',
      table: { defaultValue: { summary: 'large' } },
    },
    label:        { table: { disable: true } },
    children:     { table: { disable: true } },
    value:        { table: { disable: true } },
    defaultValue: { table: { disable: true } },
    onValueChange:{ table: { disable: true } },
    name:         { table: { disable: true } },
    required:     { table: { disable: true } },
    className:    { table: { disable: true } },
  },
  args: {
    error:        false,
    errorMessage: 'Please select an option.',
    disabled:     false,
    size:         'large',
  },
};

export default meta;
type Story = StoryObj<typeof RadioGroup>;

// ─── Story helper ─────────────────────────────────────────────────────────────

function GroupLabel({ text }: { text: string }) {
  return (
    <span style={{
      fontFamily:    'var(--sds-typography-font-family-subtitle)',
      fontWeight:    'var(--sds-typography-font-weight-subtitle)' as React.CSSProperties['fontWeight'],
      fontSize:      'var(--sds-typography-font-size-subtitle-medium)',
      lineHeight:    'var(--sds-typography-line-height-subtitle-medium)',
      letterSpacing: 'var(--sds-typography-letter-spacing-subtitle-medium)',
      color:         'var(--sds-neutral-content-primary)',
    }}>
      {text}
    </span>
  );
}

// ─── Default ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  render: (args) => (
    <RadioGroup {...args} defaultValue="" label={<GroupLabel text="Select an option" />}>
      <Radio value="a" label="Option A" description="Description for option A" size={args.size} />
      <Radio value="b" label="Option B" description="Description for option B" size={args.size} />
      <Radio value="c" label="Option C" size={args.size} />
    </RadioGroup>
  ),
};

// ─── Error ────────────────────────────────────────────────────────────────────

export const Error: Story = {
  args: {
    error:        true,
    errorMessage: 'Please select an option.',
  },
  render: (args) => (
    <RadioGroup {...args} defaultValue="" label={<GroupLabel text="Select an option" />}>
      <Radio value="a" label="Option A" error size={args.size} />
      <Radio value="b" label="Option B" error size={args.size} />
      <Radio value="c" label="Option C" error size={args.size} />
    </RadioGroup>
  ),
};

// ─── Disabled ─────────────────────────────────────────────────────────────────

export const Disabled: Story = {
  args: { disabled: true },
  render: (args) => (
    <RadioGroup {...args} defaultValue="a" label={<GroupLabel text="Select an option" />}>
      <Radio value="a" label="Option A" description="Description for option A" size={args.size} />
      <Radio value="b" label="Option B" description="Description for option B" size={args.size} />
      <Radio value="c" label="Option C" size={args.size} />
    </RadioGroup>
  ),
};
