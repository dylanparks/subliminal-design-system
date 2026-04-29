import type { Meta, StoryObj } from '@storybook/react-vite';
import { Checkbox } from './Checkbox';

const meta: Meta<typeof Checkbox> = {
  component: Checkbox,
  title: 'Inputs/Checkbox',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Core checkbox component. Use `label` + `description` for the default styled text slot, or pass `children` to override with any non-interactive content. Supports controlled (`checked` + `onChange`) and uncontrolled (`defaultChecked`) modes.',
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
      description: 'Initial checked state. Toggle and re-mount to see effect.',
      table: { defaultValue: { summary: 'false' } },
    },
    indeterminate: {
      control: 'boolean',
      description: 'Shows a dash. Typically used on a `parent` checkbox when some children are selected.',
      table: { defaultValue: { summary: 'false' } },
    },
    disabled: {
      control: 'boolean',
      table: { defaultValue: { summary: 'false' } },
    },
    error: {
      control: 'boolean',
      description: 'Error state — red indicator and label styling.',
      table: { defaultValue: { summary: 'false' } },
    },
    required: {
      control: 'boolean',
      description: 'Marks the checkbox as required for form validation.',
      table: { defaultValue: { summary: 'false' } },
    },
    parent: {
      control: 'boolean',
      description: 'Designates this as a parent controller. Pair with `indeterminate` for partial selection state.',
      table: { defaultValue: { summary: 'false' } },
    },
    size: {
      control: 'select',
      options: ['large', 'medium'],
      table: { defaultValue: { summary: 'large' } },
    },
    // hide controlled props — stories use uncontrolled mode
    checked:   { table: { disable: true } },
    onChange:  { table: { disable: true } },
    id:        { table: { disable: true } },
    name:      { table: { disable: true } },
    value:     { table: { disable: true } },
    className: { table: { disable: true } },
    children:  { table: { disable: true } },
  },
  args: {
    label:          'Example label',
    defaultChecked: false,
    indeterminate:  false,
    disabled:       false,
    error:          false,
    required:       false,
    parent:         false,
    size:           'large',
  },
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

// Strip `checked` from args so the component always runs in uncontrolled mode.
// Use `key` tied to `defaultChecked` so toggling that control remounts the
// component and the new initial value takes effect.
const uncontrolled = (args: React.ComponentProps<typeof Checkbox>) => {
  const { checked: _checked, ...rest } = args;
  return <Checkbox key={String(rest.defaultChecked)} {...rest} />;
};

export const Default: Story = { render: uncontrolled };

export const WithDescription: Story = {
  args: { description: 'Description content' },
  render: uncontrolled,
};

export const Disabled: Story = {
  args: { disabled: true },
  render: uncontrolled,
};

export const Error: Story = {
  args: { error: true },
  render: uncontrolled,
};

export const Parent: Story = {
  args: { parent: true, indeterminate: true, label: 'Select all' },
  render: uncontrolled,
};
