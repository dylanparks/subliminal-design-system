import type { Meta, StoryObj } from '@storybook/react-vite';
import { Toggle } from './Toggle';

const meta: Meta<typeof Toggle> = {
  component: Toggle,
  title: 'Inputs/Toggle',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Toggle switch — an on/off control with `role="switch"` semantics. Use `label` + `description` for the default styled text slot, or pass `children` to override. Supports controlled (`checked` + `onChange`) and uncontrolled (`defaultChecked`) modes.',
      },
    },
  },
  argTypes: {
    label: {
      control: 'text',
      description: 'Primary label text. Ignored when `children` is provided.',
    },
    description: {
      control: 'text',
      description: 'Optional secondary description below the label.',
    },
    defaultChecked: {
      control: 'boolean',
      description: 'Initial on/off state. Toggle and re-mount to see effect.',
      table: { defaultValue: { summary: 'false' } },
    },
    disabled: {
      control: 'boolean',
      table: { defaultValue: { summary: 'false' } },
    },
    size: {
      control: 'select',
      options: ['large', 'medium'],
      table: { defaultValue: { summary: 'large' } },
    },
    checked:   { table: { disable: true } },
    onChange:  { table: { disable: true } },
    required:  { table: { disable: true } },
    id:        { table: { disable: true } },
    name:      { table: { disable: true } },
    value:     { table: { disable: true } },
    className: { table: { disable: true } },
    children:  { table: { disable: true } },
  },
  args: {
    label:          'Example label',
    defaultChecked: false,
    disabled:       false,
    size:           'large',
  },
};

export default meta;
type Story = StoryObj<typeof Toggle>;

// Strip `checked` so the component always runs in uncontrolled mode.
// `key` forces remount when defaultChecked is toggled via controls.
const uncontrolled = (args: React.ComponentProps<typeof Toggle>) => {
  const { checked: _checked, ...rest } = args;
  return <Toggle key={String(rest.defaultChecked)} {...rest} />;
};

export const Default: Story = { render: uncontrolled };

export const WithDescription: Story = {
  args: { description: 'Description content' },
  render: uncontrolled,
};

export const On: Story = {
  args: { defaultChecked: true },
  render: uncontrolled,
};

export const Disabled: Story = {
  args: { disabled: true },
  render: uncontrolled,
};

export const DisabledOn: Story = {
  args: { disabled: true, defaultChecked: true },
  render: uncontrolled,
};
