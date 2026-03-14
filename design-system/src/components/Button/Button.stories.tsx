import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  component: Button,
  title: 'Components/Button',
  argTypes: {
    intent: {
      control: 'select',
      options: ['primary', 'secondary', 'media'],
    },
    variant: {
      control: 'select',
      options: ['filled', 'hollow'],
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large', 'xlarge'],
    },
    disabled: { control: 'boolean' },
    showLabel: { control: 'boolean' },
    iconPosition: { control: 'select', options: ['left', 'right'] },
  },
  args: {
    label: 'Button',
    intent: 'primary',
    variant: 'filled',
    size: 'medium',
    disabled: false,
    showLabel: true,
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {};
