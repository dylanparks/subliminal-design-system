import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Stepper } from './Stepper';

const meta: Meta<typeof Stepper> = {
  component: Stepper,
  title: 'Actions/Stepper',
  argTypes: {
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
    },
    showValue: { control: 'boolean' },
    disabled: { control: 'boolean' },
    value: { control: false },
    min: { control: false },
    max: { control: false },
    step: { control: false },
  },
  args: {
    orientation: 'horizontal',
    showValue: true,
    disabled: false,
    step: 1,
  },
};

export default meta;
type Story = StoryObj<typeof Stepper>;

export const Horizontal: Story = {
  render: (args) => {
    const [value, setValue] = useState(13);
    return <Stepper {...args} value={value} onChange={setValue} />;
  },
};

export const Vertical: Story = {
  args: { orientation: 'vertical' },
  render: (args) => {
    const [value, setValue] = useState(13);
    return <Stepper {...args} value={value} onChange={setValue} />;
  },
};
