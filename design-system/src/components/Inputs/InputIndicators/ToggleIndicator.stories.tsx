import type { Meta, StoryObj } from '@storybook/react-vite';
import { ToggleIndicator } from './ToggleIndicator';

const meta: Meta<typeof ToggleIndicator> = {
  component: ToggleIndicator,
  title: 'Inputs/InputIndicators/ToggleIndicator',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Purely visual toggle track and thumb used inside the Toggle component. Interactive states (hover, focus ring, pressed) are driven by the parent component\'s CSS.',
      },
    },
  },
  argTypes: {
    checked: {
      control: 'boolean',
      description: 'Whether the toggle is on.',
      table: { defaultValue: { summary: 'false' } },
    },
    size: {
      control: 'select',
      options: ['large', 'medium'],
      table: { defaultValue: { summary: 'large' } },
    },
    onMedia: {
      control: 'boolean',
      description: 'Inverts the color scheme for image/media backgrounds.',
      table: { defaultValue: { summary: 'false' } },
    },
    disabled: {
      control: 'boolean',
      table: { defaultValue: { summary: 'false' } },
    },
  },
  args: {
    checked:  false,
    size:     'large',
    onMedia:  false,
    disabled: false,
  },
};

export default meta;
type Story = StoryObj<typeof ToggleIndicator>;

export const Default: Story = {};
