import { useState, useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Checkbox } from './Checkbox';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<typeof Checkbox> = {
  component: Checkbox,
  title: 'Inputs/Checkbox',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A labelled checkbox input. Uses a native `<input type="checkbox">` for full accessibility and form participation. Supports checked, indeterminate, and disabled states across two sizes.\n\n**Accessibility:** WCAG AA compliant. The native input handles keyboard interaction (Space to toggle), and the focus ring appears only on keyboard navigation (`:focus-visible`).',
      },
    },
  },
  argTypes: {
    label: {
      control: 'text',
      description: 'Primary label text.',
    },
    description: {
      control: 'text',
      description: 'Optional secondary description below the label.',
    },
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
      description: 'Prevents interaction and dims the component.',
      table: { defaultValue: { summary: 'false' } },
    },
    size: {
      control: 'select',
      options: ['large', 'medium'],
      description: 'Visual size (affects indicator and typography scale).',
      table: { defaultValue: { summary: 'large' } },
    },
    id:        { table: { disable: true } },
    name:      { table: { disable: true } },
    value:     { table: { disable: true } },
    onChange:  { table: { disable: true } },
    className: { table: { disable: true } },
  },
  args: {
    label:         'Example label',
    description:   'Description content',
    checked:       false,
    indeterminate: false,
    disabled:      false,
    size:          'large',
  },
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

// ─── Default ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  render: (args) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [checked, setChecked] = useState(args.checked);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => { setChecked(args.checked); }, [args.checked]);
    return <Checkbox {...args} checked={checked} onChange={setChecked} />;
  },
};

// ─── Disabled ─────────────────────────────────────────────────────────────────

export const Disabled: Story = {
  args: { disabled: true },
  render: (args) => <Checkbox {...args} onChange={() => {}} />,
};
