import type { Meta, StoryObj } from '@storybook/react-vite';
import { TimePicker } from './TimePicker';

const meta: Meta<typeof TimePicker> = {
  component: TimePicker,
  title: 'Fields/TimePicker',
  decorators: [(Story) => (
    <div style={{ maxWidth: '38rem', width: '100%', paddingBottom: '20rem' }}>
      <Story />
    </div>
  )],
  argTypes: {
    format: {
      control: 'select',
      options: ['12h', '24h'],
    },
    hourStep: {
      control: 'select',
      options: [1, 2, 3, 4, 6, 8, 12],
    },
    minuteStep: {
      control: 'select',
      options: [1, 5, 10, 15, 30],
    },
    secondStep: {
      control: 'select',
      options: [1, 5, 10, 15, 30],
    },
    size: {
      control: 'select',
      options: ['large', 'medium'],
    },
    allowClear:   { control: 'boolean' },
    showLabels:   { control: 'boolean' },
    showMinutes:  { control: 'boolean' },
    showSeconds:  { control: 'boolean' },
    disabled:     { control: 'boolean' },
    error:        { control: 'boolean' },
    success:      { control: 'boolean' },
    disabledTime: { control: false },
    onOpenChange: { control: false },
  },
  args: {
    label:      'Select a time',
    format:     '12h',
    hourStep:   1,
    minuteStep: 5,
    secondStep: 1,
    size:       'large',
    allowClear: true,
    showLabels: true,
    showMinutes: true,
    showSeconds: false,
    disabled:   false,
    error:      false,
    success:    false,
  },
};

export default meta;
type Story = StoryObj<typeof TimePicker>;

export const Default: Story = {};

export const Error: Story = {
  args: {
    defaultValue: { hour: 0, minute: 0 },
    error:        true,
    message:      'Please select a valid time.',
  },
};

export const Success: Story = {
  args: {
    defaultValue: { hour: 9, minute: 0 },
    success:      true,
    message:      'Appointment time confirmed.',
  },
};
