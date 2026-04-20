import { useState, useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { CheckboxItem } from './CheckboxItem';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<typeof CheckboxItem> = {
  component: CheckboxItem,
  title: 'Inputs/CheckboxItem',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Core checkbox component with an open content slot. The `children` prop accepts any non-interactive content — labels, descriptions, icons, or custom layouts. Uses a native `<input type="checkbox">` for full accessibility and form participation.',
      },
    },
  },
  argTypes: {
    checked: {
      control: 'boolean',
      description: 'Whether the checkbox is checked.',
      table: { defaultValue: { summary: 'false' } },
    },
    indeterminate: {
      control: 'boolean',
      description: 'Indeterminate state — shows a dash. Takes visual precedence over `checked`.',
      table: { defaultValue: { summary: 'false' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Prevents interaction and dims the content slot.',
      table: { defaultValue: { summary: 'false' } },
    },
    error: {
      control: 'boolean',
      description: 'Error state — red indicator styling.',
      table: { defaultValue: { summary: 'false' } },
    },
    size: {
      control: 'select',
      options: ['large', 'medium'],
      description: 'Visual size (affects indicator scale).',
      table: { defaultValue: { summary: 'large' } },
    },
    id:        { table: { disable: true } },
    name:      { table: { disable: true } },
    value:     { table: { disable: true } },
    onChange:  { table: { disable: true } },
    className: { table: { disable: true } },
    children:  { table: { disable: true } },
  },
  args: {
    checked:       false,
    indeterminate: false,
    disabled:      false,
    error:         false,
    size:          'large',
  },
};

export default meta;
type Story = StoryObj<typeof CheckboxItem>;

// ─── Shared label styles ──────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  fontFamily:    'var(--sds-typography-font-family-body-content)',
  fontWeight:    'var(--sds-typography-font-weight-body-content)' as React.CSSProperties['fontWeight'],
  fontSize:      'var(--sds-typography-font-size-body-content-medium)',
  lineHeight:    'var(--sds-typography-line-height-body-content-medium)',
  letterSpacing: 'var(--sds-typography-letter-spacing-body-content-medium)',
  color:         'var(--sds-neutral-content-primary)',
};

const descriptionStyle: React.CSSProperties = {
  fontFamily:    'var(--sds-typography-font-family-body-content)',
  fontWeight:    'var(--sds-typography-font-weight-body-content)' as React.CSSProperties['fontWeight'],
  fontSize:      'var(--sds-typography-font-size-body-content-small)',
  lineHeight:    'var(--sds-typography-line-height-body-content-small)',
  letterSpacing: 'var(--sds-typography-letter-spacing-body-content-small)',
  color:         'var(--sds-neutral-content-tertiary)',
};

// ─── Default ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  render: (args) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [checked, setChecked] = useState(args.checked);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => { setChecked(args.checked); }, [args.checked]);
    return (
      <CheckboxItem {...args} checked={checked} onChange={setChecked}>
        <span style={labelStyle}>Example label</span>
      </CheckboxItem>
    );
  },
};

// ─── With description ─────────────────────────────────────────────────────────

export const WithDescription: Story = {
  render: (args) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [checked, setChecked] = useState(args.checked);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => { setChecked(args.checked); }, [args.checked]);
    return (
      <CheckboxItem {...args} checked={checked} onChange={setChecked}>
        <span style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={labelStyle}>Example label</span>
          <span style={descriptionStyle}>Description content</span>
        </span>
      </CheckboxItem>
    );
  },
};

// ─── Disabled ─────────────────────────────────────────────────────────────────

export const Disabled: Story = {
  args: { disabled: true },
  render: (args) => (
    <CheckboxItem {...args} onChange={() => {}}>
      <span style={labelStyle}>Disabled label</span>
    </CheckboxItem>
  ),
};

// ─── Error ────────────────────────────────────────────────────────────────────

export const Error: Story = {
  args: { error: true },
  render: (args) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [checked, setChecked] = useState(args.checked);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => { setChecked(args.checked); }, [args.checked]);
    return (
      <CheckboxItem {...args} checked={checked} onChange={setChecked}>
        <span style={labelStyle}>Example label</span>
      </CheckboxItem>
    );
  },
};
