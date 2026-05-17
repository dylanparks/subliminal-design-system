import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tooltip } from './Tooltip';
import { CircleIcon } from '../../../icons';

const meta: Meta<typeof Tooltip> = {
  component: Tooltip,
  title: 'Enhancers/Tooltip',
  parameters: { layout: 'centered' },
  argTypes: {
    side: {
      control: 'radio',
      options: ['top', 'bottom', 'left', 'right'],
    },
    delay:    { control: { type: 'number', min: 0 } },
    disabled: { control: 'boolean' },
    content:  { control: 'text' },
  },
  args: {
    content:  'Example tooltip content',
    side:     'top',
    delay:    0,
    disabled: false,
  },
  decorators: [
    (Story) => (
      <div style={{ padding: 64 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

// ─── Default ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  render: (args) => (
    <Tooltip {...args}>
      <button type="button" aria-label="More information">Hover me</button>
    </Tooltip>
  ),
};

// ─── All sides ────────────────────────────────────────────────────────────────

export const AllSides: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, auto)', gap: 16, alignItems: 'center', justifyItems: 'center' }}>
      <span />
      <Tooltip content="Tooltip on top" side="top" delay={0}>
        <button type="button">Top</button>
      </Tooltip>
      <span />

      <Tooltip content="Tooltip on left" side="left" delay={0}>
        <button type="button">Left</button>
      </Tooltip>
      <span />
      <Tooltip content="Tooltip on right" side="right" delay={0}>
        <button type="button">Right</button>
      </Tooltip>

      <span />
      <Tooltip content="Tooltip on bottom" side="bottom" delay={0}>
        <button type="button">Bottom</button>
      </Tooltip>
      <span />
    </div>
  ),
  parameters: { controls: { disable: true } },
};

// ─── Long content ─────────────────────────────────────────────────────────────

export const LongContent: Story = {
  render: (args) => (
    <Tooltip {...args} content="This is a longer tooltip label that wraps across multiple lines to show the max-width constraint in action.">
      <button type="button">Hover for long tooltip</button>
    </Tooltip>
  ),
};

// ─── Icon-only button (primary use case) ──────────────────────────────────────

const PlaceholderIcon = () => <CircleIcon size={20} />;

export const IconButton: Story = {
  name: 'Icon-only button',
  render: (args) => (
    <Tooltip {...args} content="Edit item">
      <button
        type="button"
        aria-label="Edit item"
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, border: 'none', borderRadius: 8, background: 'transparent', cursor: 'pointer' }}
      >
        <PlaceholderIcon />
      </button>
    </Tooltip>
  ),
};

// ─── Disabled ─────────────────────────────────────────────────────────────────

export const Disabled: Story = {
  render: (args) => (
    <Tooltip {...args} disabled>
      <button type="button">No tooltip here</button>
    </Tooltip>
  ),
};
