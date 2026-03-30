import type { Meta, StoryObj } from '@storybook/react-vite';
import { TextField } from './TextField';

const meta: Meta<typeof TextField> = {
  component: TextField,
  title: 'Fields/TextField',
  decorators: [(Story) => <div style={{ maxWidth: '38rem', width: '100%' }}><Story /></div>],
  argTypes: {
    size: {
      control: 'select',
      options: ['large', 'medium', 'small'],
    },
    disabled: { control: 'boolean' },
    error:    { control: 'boolean' },
    success:  { control: 'boolean' },
    maxLength: { control: 'number' },
  },
  args: {
    label:       'Input label',
    placeholder: 'Placeholder content',
    message:     'Input message',
    size:        'large',
    disabled:    false,
    error:       false,
    success:     false,
  },
};

export default meta;
type Story = StoryObj<typeof TextField>;

export const Default: Story = {};

export const CharacterLimit: Story = {
  args: {
    maxLength: 50,
  },
};

export const Error: Story = {
  args: {
    defaultValue: 'Invalid input',
    message:      'This field contains an error.',
    error:        true,
  },
};

export const Success: Story = {
  args: {
    defaultValue: 'Valid input',
    message:      'Looks good!',
    success:      true,
  },
};
