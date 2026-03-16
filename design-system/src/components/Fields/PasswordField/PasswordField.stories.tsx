import type { Meta, StoryObj } from '@storybook/react';
import { PasswordField } from './PasswordField';

const meta: Meta<typeof PasswordField> = {
  component: PasswordField,
  title: 'Fields/PasswordField',
  argTypes: {
    size: {
      control: 'select',
      options: ['large', 'medium', 'small'],
    },
    disabled: { control: 'boolean' },
    error:    { control: 'boolean' },
    success:  { control: 'boolean' },
    visible:  { control: 'boolean' },
  },
  args: {
    label:        'Input label',
    placeholder:  'Placeholder content',
    message:      'Input message',
    size:         'large',
    disabled:     false,
    error:        false,
    success:      false,
    autoComplete: 'new-password',
  },
};

export default meta;
type Story = StoryObj<typeof PasswordField>;

export const Default: Story = {};

export const CharacterLimit: Story = {
  args: {
    maxLength: 50,
  },
};

export const Error: Story = {
  args: {
    value:   'wrongpassword',
    message: 'Incorrect password.',
    error:   true,
  },
};

export const Success: Story = {
  args: {
    value:   'StrongPassword1!',
    message: 'Password accepted.',
    success: true,
  },
};
