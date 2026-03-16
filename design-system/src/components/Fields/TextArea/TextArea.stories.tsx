import type { Meta, StoryObj } from '@storybook/react';
import { TextArea } from './TextArea';

const meta: Meta<typeof TextArea> = {
  component: TextArea,
  title: 'Fields/TextArea',
  argTypes: {
    disabled:  { control: 'boolean' },
    error:     { control: 'boolean' },
    success:   { control: 'boolean' },
    maxLength: { control: 'number' },
  },
  args: {
    label:       'Input label',
    placeholder: 'Placeholder content',
    message:     'Input message',
    disabled:    false,
    error:       false,
    success:     false,
  },
};

export default meta;
type Story = StoryObj<typeof TextArea>;

export const Default: Story = {};

export const CharacterLimit: Story = {
  args: {
    maxLength: 50,
  },
};

export const Error: Story = {
  args: {
    value:   'Invalid content',
    message: 'This field contains an error.',
    error:   true,
  },
};

export const Success: Story = {
  args: {
    value:   'Valid content',
    message: 'Looks good!',
    success: true,
  },
};
