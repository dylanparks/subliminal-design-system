import type { Meta, StoryObj } from '@storybook/react-vite';
import { CheckboxIndicator } from './CheckboxIndicator';

const meta: Meta<typeof CheckboxIndicator> = {
  component: CheckboxIndicator,
  title: 'Inputs/InputIndicators/CheckboxIndicator',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A purely visual tick-box indicator used inside Checkbox and multi-select MenuItem components. Interactive states (hover, focus ring, pressed) are driven by the parent component\'s CSS — this component only responds to prop-driven state modifiers.',
      },
    },
  },
  argTypes: {
    selection: {
      control: 'select',
      options: ['unselected', 'selected', 'indeterminate'],
      description: 'Selection state of the indicator.',
      table: { defaultValue: { summary: 'unselected' } },
    },
    size: {
      control: 'select',
      options: ['large', 'medium'],
      description: 'Visual size of the indicator.',
      table: { defaultValue: { summary: 'large' } },
    },
    onMedia: {
      control: 'boolean',
      description: 'Inverts the color scheme for placement on image/media backgrounds.',
      table: { defaultValue: { summary: 'false' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Muted disabled appearance.',
      table: { defaultValue: { summary: 'false' } },
    },
    error: {
      control: 'boolean',
      description: 'Error state appearance.',
      table: { defaultValue: { summary: 'false' } },
    },
  },
  args: {
    selection: 'unselected',
    size:      'large',
    onMedia:   false,
    disabled:  false,
    error:     false,
  },
};

export default meta;
type Story = StoryObj<typeof CheckboxIndicator>;

export const Default: Story = {};
