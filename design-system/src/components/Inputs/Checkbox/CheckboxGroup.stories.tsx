import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { CheckboxGroup } from './CheckboxGroup';
import { CheckboxItem } from './CheckboxItem';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<typeof CheckboxGroup> = {
  component: CheckboxGroup,
  title: 'Inputs/CheckboxGroup',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Layout container for multiple CheckboxItems. Provides an open label slot for group-level content and optional error validation messaging. Size controls the vertical gap between items.',
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
    size: {
      control: 'select',
      options: ['large', 'medium'],
      description: 'Controls vertical gap between items.',
      table: { defaultValue: { summary: 'large' } },
    },
    label:     { table: { disable: true } },
    children:  { table: { disable: true } },
    className: { table: { disable: true } },
  },
  args: {
    error:        false,
    errorMessage: 'Please select at least one option.',
    size:         'large',
  },
};

export default meta;
type Story = StoryObj<typeof CheckboxGroup>;

// ─── Story helpers ────────────────────────────────────────────────────────────
// These are illustrative examples of what consumers might pass into the free
// label/children slots. The component itself applies no typography opinions —
// slot styling is entirely the consumer's responsibility.

function Label({ text, description }: { text: string; description?: string }) {
  return (
    <span style={{ display: 'flex', flexDirection: 'column' }}>
      <span style={{ fontFamily: 'var(--sds-typography-font-family-body-content)', fontSize: 'var(--sds-typography-font-size-body-content-medium)', color: 'var(--sds-neutral-content-primary)' }}>
        {text}
      </span>
      {description && (
        <span style={{ fontFamily: 'var(--sds-typography-font-family-body-content)', fontSize: 'var(--sds-typography-font-size-body-content-small)', color: 'var(--sds-neutral-content-tertiary)' }}>
          {description}
        </span>
      )}
    </span>
  );
}

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
  render: (args) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [values, setValues] = useState({ a: false, b: false, c: false });
    const toggle = (key: keyof typeof values) =>
      setValues((v) => ({ ...v, [key]: !v[key] }));
    return (
      <CheckboxGroup
        {...args}
        label={<GroupLabel text="Select options" />}
      >
        <CheckboxItem checked={values.a} onChange={() => toggle('a')} size={args.size}>
          <Label text="Option A" description="Description for option A" />
        </CheckboxItem>
        <CheckboxItem checked={values.b} onChange={() => toggle('b')} size={args.size}>
          <Label text="Option B" description="Description for option B" />
        </CheckboxItem>
        <CheckboxItem checked={values.c} onChange={() => toggle('c')} size={args.size}>
          <Label text="Option C" />
        </CheckboxItem>
      </CheckboxGroup>
    );
  },
};

// ─── Error ────────────────────────────────────────────────────────────────────

export const Error: Story = {
  args: {
    error:        true,
    errorMessage: 'Please select at least one option.',
  },
  render: (args) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [values, setValues] = useState({ a: false, b: false, c: false });
    const toggle = (key: keyof typeof values) =>
      setValues((v) => ({ ...v, [key]: !v[key] }));
    return (
      <CheckboxGroup
        {...args}
        label={<GroupLabel text="Select options" />}
      >
        <CheckboxItem checked={values.a} onChange={() => toggle('a')} error size={args.size}>
          <Label text="Option A" />
        </CheckboxItem>
        <CheckboxItem checked={values.b} onChange={() => toggle('b')} error size={args.size}>
          <Label text="Option B" />
        </CheckboxItem>
        <CheckboxItem checked={values.c} onChange={() => toggle('c')} error size={args.size}>
          <Label text="Option C" />
        </CheckboxItem>
      </CheckboxGroup>
    );
  },
};
