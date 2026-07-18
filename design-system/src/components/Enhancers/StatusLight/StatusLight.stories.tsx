import type { Meta, StoryObj } from '@storybook/react-vite';
import { StatusLight, type StatusLightVariant, type StatusLightPosition } from './StatusLight';

const meta: Meta<typeof StatusLight> = {
  title:      'Enhancers/StatusLight',
  component:  StatusLight,
  tags:       ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'error', 'success', 'warning', 'informative', 'disabled'] satisfies StatusLightVariant[],
    },
    position: {
      control: { type: 'select' },
      options: ['top-start', 'top-end', 'bottom-start', 'bottom-end'] satisfies StatusLightPosition[],
    },
  },
};

export default meta;
type Story = StoryObj<typeof StatusLight>;

// ─── Avatar stand-in ──────────────────────────────────────────────────────────

function Avatar({ name = 'AB' }: { name?: string }) {
  return (
    <div
      style={{
        width:          40,
        height:         40,
        borderRadius:   '50%',
        background:     'var(--sds-neutral-stroke-elevated)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        color:          'var(--sds-neutral-content-secondary)',
        userSelect:     'none',
      }}
    >
      <span className="sds-text--body-interactive-small">{name}</span>
    </div>
  );
}

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  name: 'Playground',
  args: { variant: 'success', position: 'bottom-end', label: 'Online' },
  render: (args) => (
    <StatusLight {...args}>
      <Avatar />
    </StatusLight>
  ),
};

// ─── All variants ─────────────────────────────────────────────────────────────

const VARIANTS: StatusLightVariant[] = [
  'default', 'error', 'success', 'warning', 'informative', 'disabled',
];

export const AllVariants: Story = {
  name: 'All variants',
  render: () => (
    <div style={{ display: 'flex', gap: 24, alignItems: 'center', padding: 16 }}>
      {VARIANTS.map(v => (
        <div key={v} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <StatusLight variant={v} position="bottom-end">
            <Avatar name={v.slice(0, 2).toUpperCase()} />
          </StatusLight>
          <span className="sds-text--body-content-xsmall" style={{ color: 'var(--sds-neutral-content-subtle)', textTransform: 'capitalize' }}>
            {v}
          </span>
        </div>
      ))}
    </div>
  ),
};

// ─── All positions ────────────────────────────────────────────────────────────

const POSITIONS: StatusLightPosition[] = [
  'top-start', 'top-end', 'bottom-start', 'bottom-end',
];

export const AllPositions: Story = {
  name: 'All positions',
  render: () => (
    <div style={{ display: 'flex', gap: 32, alignItems: 'center', padding: 24 }}>
      {POSITIONS.map(p => (
        <div key={p} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <StatusLight variant="success" position={p}>
            <Avatar name="AB" />
          </StatusLight>
          <span className="sds-text--body-content-xsmall" style={{ color: 'var(--sds-neutral-content-subtle)' }}>
            {p}
          </span>
        </div>
      ))}
    </div>
  ),
};

// ─── Non-circular children ────────────────────────────────────────────────────

export const RectangularChild: Story = {
  name: 'Rectangular child',
  render: () => (
    <StatusLight variant="error" position="top-end" label="3 notifications">
      <div
        style={{
          width:        80,
          height:       48,
          borderRadius: 8,
          background:   'var(--sds-neutral-stroke-elevated)',
        }}
      />
    </StatusLight>
  ),
};
