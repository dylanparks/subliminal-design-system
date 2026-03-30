import type { Meta, StoryObj } from '@storybook/react-vite';
import { PhoneField } from './PhoneField';

const meta: Meta<typeof PhoneField> = {
  component: PhoneField,
  title: 'Fields/PhoneField',
  decorators: [(Story) => <div style={{ maxWidth: '38rem', width: '100%' }}><Story /></div>],
  argTypes: {
    size: {
      control: 'select',
      options: ['large', 'medium'],
    },
    defaultCountry: {
      control: 'text',
      description: 'ISO 3166-1 alpha-2 country code (e.g. "US", "GB", "AU")',
    },
    disabled: { control: 'boolean' },
    error:    { control: 'boolean' },
    success:  { control: 'boolean' },
  },
  args: {
    label:   'Phone number',
    size:    'large',
    disabled: false,
    error:    false,
    success:  false,
  },
};

export default meta;
type Story = StoryObj<typeof PhoneField>;

export const Default: Story = {};

export const Error: Story = {
  args: {
    defaultValue: '555',
    error:        true,
    message:      'Please enter a valid phone number.',
  },
};

export const Success: Story = {
  args: {
    defaultValue: '2025551234',
    success:      true,
    message:      'Phone number verified.',
  },
};
