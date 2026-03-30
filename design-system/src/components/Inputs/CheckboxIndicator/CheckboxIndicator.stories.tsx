import type { Meta, StoryObj } from '@storybook/react-vite';
import { CheckboxIndicator } from './CheckboxIndicator';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<typeof CheckboxIndicator> = {
  component: CheckboxIndicator,
  title: 'Inputs/Checkbox/Indicator',
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
    checked: {
      control: 'boolean',
      description: 'Whether the indicator shows a checkmark (selected state).',
      table: { defaultValue: { summary: 'false' } },
    },
    indeterminate: {
      control: 'boolean',
      description: 'Indeterminate state — shows a dash and takes precedence over `checked` visually.',
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
  },
  args: {
    checked:       false,
    indeterminate: false,
    size:          'large',
    onMedia:       false,
    disabled:      false,
  },
};

export default meta;
type Story = StoryObj<typeof CheckboxIndicator>;

// ─── Default ──────────────────────────────────────────────────────────────────

export const Default: Story = {};
