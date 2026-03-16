import type { Meta, StoryObj } from '@storybook/react';
import { ButtonGroup } from './ButtonGroup';

const meta: Meta<typeof ButtonGroup> = {
  component: ButtonGroup,
  title: 'Actions/ButtonGroup',
  argTypes: {
    mode: {
      control: 'select',
      options: ['single', 'multi'],
    },
    size: {
      control: 'select',
      options: ['xsmall', 'small', 'medium', 'large'],
    },
    value: { control: false },
  },
  args: {
    mode: 'single',
    size: 'small',
    items: [
      { value: 'day', label: 'Day' },
      { value: 'week', label: 'Week' },
      { value: 'month', label: 'Month' },
    ],
    defaultValue: ['day'],
  },
};

export default meta;
type Story = StoryObj<typeof ButtonGroup>;

export const Single: Story = {};

export const Multi: Story = {
  args: {
    mode: 'multi',
    items: [
      { value: 'bold', label: 'Bold' },
      { value: 'italic', label: 'Italic' },
      { value: 'underline', label: 'Underline' },
      { value: 'strike', label: 'Strike' },
    ],
    defaultValue: ['bold', 'underline'],
  },
};
