import type { Meta, StoryObj } from '@storybook/react-vite';
import { userEvent, within, expect, waitFor } from '@storybook/test';
import { SelectField } from './SelectField';

const OPTIONS = [
  { value: 'apple',      label: 'Apple'      },
  { value: 'banana',     label: 'Banana'     },
  { value: 'cherry',     label: 'Cherry'     },
  { value: 'date',       label: 'Date'       },
  { value: 'elderberry', label: 'Elderberry' },
  { value: 'fig',        label: 'Fig'        },
  { value: 'grape',      label: 'Grape'      },
];

const meta: Meta<typeof SelectField> = {
  component: SelectField,
  title: 'Fields/SelectField',
  decorators: [(Story) => <div style={{ maxWidth: '38rem', width: '100%' }}><Story /></div>],
  argTypes: {
    size: {
      control: 'select',
      options: ['large', 'medium'],
    },
    disabled: { control: 'boolean' },
    error:    { control: 'boolean' },
    success:  { control: 'boolean' },
  },
  args: {
    label:    'Select an option',
    size:     'large',
    disabled: false,
    error:    false,
    success:  false,
    options:  OPTIONS,
  },
};

export default meta;
type Story = StoryObj<typeof SelectField>;

// Shared play function — opens the dropdown by clicking the combobox trigger.
// The dropdown menu is portal-rendered so we query document directly.
const openDropdown: Story['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  await userEvent.click(canvas.getByRole('combobox'));
  await waitFor(() =>
    expect(document.querySelector('[role="menu"]')).toBeInTheDocument()
  );
};

export const Default: Story = {
  play: openDropdown,
  parameters: { chromatic: { delay: 300 } },
};

export const Error: Story = {
  args: {
    defaultValue: 'banana',
    error:        true,
    message:      'Please select a valid option.',
  },
  play: openDropdown,
  parameters: { chromatic: { delay: 300 } },
};

export const Success: Story = {
  args: {
    defaultValue: 'cherry',
    success:      true,
    message:      'Selection confirmed.',
  },
  play: openDropdown,
  parameters: { chromatic: { delay: 300 } },
};
