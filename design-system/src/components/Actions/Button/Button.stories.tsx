import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  component: Button,
  title: 'Actions/Button',
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'static', 'negative'],
    },
    fillStyle: {
      control: 'select',
      options: ['filled', 'hollow', 'ghost'],
    },
    size: {
      control: 'select',
      options: ['xsmall', 'small', 'medium', 'large'],
    },
    disabled: { control: 'boolean' },
    showLabel: { control: 'boolean' },
    iconPosition: { control: 'select', options: ['left', 'right'] },
  },
  args: {
    label: 'Button',
    variant: 'primary',
    fillStyle: 'filled',
    size: 'small',
    disabled: false,
    showLabel: true,
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {};
