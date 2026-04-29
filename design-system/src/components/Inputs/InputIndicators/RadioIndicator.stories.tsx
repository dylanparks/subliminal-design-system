import type { Meta, StoryObj } from '@storybook/react-vite';
import { RadioIndicator } from './RadioIndicator';

const meta: Meta<typeof RadioIndicator> = {
  component: RadioIndicator,
  title: 'Inputs/InputIndicators/RadioIndicator',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A purely visual radio indicator used inside Radio components. Interactive states (hover, focus ring, pressed) are driven by the parent component\'s CSS — this component only responds to prop-driven state modifiers.',
      },
    },
  },
  argTypes: {
    selected: {
      control: 'boolean',
      description: 'Whether the radio is selected.',
      table: { defaultValue: { summary: 'false' } },
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
    selected:  false,
    size:      'large',
    onMedia:   false,
    disabled:  false,
    error:     false,
  },
};

export default meta;
type Story = StoryObj<typeof RadioIndicator>;

export const Default: Story = {};
