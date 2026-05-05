import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Slider } from './Slider';

const meta: Meta<typeof Slider> = {
  component: Slider,
  title: 'Inputs/Slider',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: [
          'A draggable range control with full keyboard accessibility.',
          '',
          'Each thumb is a `div[role="slider"]` with ARIA APG keyboard support:',
          'Arrow keys (±step), Shift+Arrow (±largeStep), Home/End, PageUp/PageDown.',
          'Horizontal arrows are RTL-aware.',
          '',
          'Supports single and range modes, controlled/uncontrolled state,',
          'and optional `Intl.NumberFormat` formatting via `formatOptions`.',
        ].join('\n'),
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 320, padding: 16 }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    label: {
      control: 'text',
      description: 'Visible label shown above the track.',
    },
    min: {
      control: { type: 'number' },
      table: { defaultValue: { summary: '0' } },
    },
    max: {
      control: { type: 'number' },
      table: { defaultValue: { summary: '100' } },
    },
    step: {
      control: { type: 'number' },
      table: { defaultValue: { summary: '1' } },
    },
    showValue: {
      control: 'boolean',
      description: 'Show numeric input. When false, a tooltip appears on interaction.',
      table: { defaultValue: { summary: 'true' } },
    },
    disabled: {
      control: 'boolean',
      table: { defaultValue: { summary: 'false' } },
    },
  },
  args: {
    label: 'Volume',
    min: 0,
    max: 100,
    step: 1,
    showValue: true,
    disabled: false,
  },
};

export default meta;
type Story = StoryObj<typeof Slider>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  args: { defaultValue: 40 },
};

// ─── Uncontrolled ─────────────────────────────────────────────────────────────

export const Uncontrolled: Story = {
  args: { label: 'Brightness', defaultValue: 60 },
  parameters: {
    docs: {
      description: { story: 'Uncontrolled — initial value set via `defaultValue`.' },
    },
  },
};

// ─── Controlled ───────────────────────────────────────────────────────────────

export const Controlled: Story = {
  args: { label: 'Opacity', value: 75 },
  render: (args) => {
    const [val, setVal] = useState<number>((args.value as number) ?? 0);
    return (
      <div style={{ width: '100%' }}>
        <Slider
          label={args.label}
          min={args.min}
          max={args.max}
          step={args.step}
          disabled={args.disabled}
          showValue={args.showValue}
          value={val}
          onChange={setVal}
        />
        <p style={{ marginTop: 8, fontSize: 12 }}>onChange value: {val}</p>
      </div>
    );
  },
  parameters: {
    docs: {
      description: { story: 'Controlled — parent owns the value via `value` + `onChange`.' },
    },
  },
};

// ─── No label ─────────────────────────────────────────────────────────────────

export const NoLabel: Story = {
  args: { label: undefined, 'aria-label': 'Playback position', defaultValue: 33 },
  parameters: {
    docs: {
      description: {
        story: 'When no visible `label` is provided, pass `aria-label` to name the slider for assistive technology.',
      },
    },
  },
};

// ─── No value input (tooltip mode) ───────────────────────────────────────────

export const TooltipMode: Story = {
  name: 'showValue=false (tooltip)',
  args: { label: 'Seek', defaultValue: 25, showValue: false },
  parameters: {
    docs: {
      description: {
        story: '`showValue={false}` hides the numeric input. Dragging or using keyboard shows a tooltip over the thumb that auto-dismisses after 1.5 s.',
      },
    },
  },
};

// ─── Percentage ───────────────────────────────────────────────────────────────

export const Percentage: Story = {
  args: {
    label: 'Discount',
    min: 0,
    max: 1,
    step: 0.01,
    defaultValue: 0.25,
    formatOptions: { style: 'percent' },
  },
  parameters: {
    docs: {
      description: {
        story: '`formatOptions={{ style: "percent" }}` formats the value as a percentage in `aria-valuetext` and the tooltip.',
      },
    },
  },
};

// ─── Currency ─────────────────────────────────────────────────────────────────

export const Currency: Story = {
  args: {
    label: 'Budget',
    min: 0,
    max: 1000,
    step: 10,
    defaultValue: 250,
    formatOptions: { style: 'currency', currency: 'USD', maximumFractionDigits: 0 },
  },
  parameters: {
    docs: {
      description: {
        story: '`formatOptions={{ style: "currency", currency: "USD" }}` formats the value with a currency symbol.',
      },
    },
  },
};

// ─── Custom getValueText ──────────────────────────────────────────────────────

export const CustomValueText: Story = {
  args: {
    label: 'Quality',
    min: 1,
    max: 3,
    step: 1,
    defaultValue: 2,
    getValueText: (v: number) => ['Low', 'Medium', 'High'][v - 1] ?? String(v),
    showValue: false,
  },
  parameters: {
    docs: {
      description: {
        story: '`getValueText` overrides `formatOptions` and drives `aria-valuetext`. Useful for step values that map to named options.',
      },
    },
  },
};

// ─── Step / large step ────────────────────────────────────────────────────────

export const SteppedValues: Story = {
  args: {
    label: 'Rating',
    min: 0,
    max: 10,
    step: 1,
    largeStep: 5,
    defaultValue: 5,
  },
  parameters: {
    docs: {
      description: {
        story: 'Integer steps of 1. `largeStep={5}` means Shift+Arrow or PageUp/Down jumps by 5.',
      },
    },
  },
};

// ─── Range ────────────────────────────────────────────────────────────────────

export const Range: Story = {
  render: () => (
    <div style={{ width: '100%' }}>
      <Slider range label="Price range" min={0} max={100} defaultValue={[20, 80]} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '`range={true}` renders two thumbs. Each thumb announces as "minimum" / "maximum". Arrow-key navigation operates independently per thumb.',
      },
    },
  },
};

// ─── Range — controlled ───────────────────────────────────────────────────────

export const RangeControlled: Story = {
  render: () => {
    const [val, setVal] = useState<[number, number]>([30, 70]);
    return (
      <div style={{ width: '100%' }}>
        <Slider
          range
          label="Date range"
          min={0}
          max={100}
          value={val}
          onChange={setVal}
        />
        <p style={{ marginTop: 8, fontSize: 12 }}>
          [{val[0]}, {val[1]}]
        </p>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Controlled range slider — parent owns the `[start, end]` tuple.',
      },
    },
  },
};

// ─── Range — tooltip mode ─────────────────────────────────────────────────────

export const RangeTooltip: Story = {
  name: 'Range showValue=false',
  render: () => (
    <div style={{ width: '100%' }}>
      <Slider range label="Filter range" min={0} max={100} defaultValue={[15, 65]} showValue={false} />
    </div>
  ),
};

// ─── Disabled ─────────────────────────────────────────────────────────────────

export const Disabled: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
      <Slider label="Volume (disabled)" defaultValue={60} disabled />
      <Slider range label="Price range (disabled)" defaultValue={[20, 80]} disabled />
    </div>
  ),
};

// ─── All values ───────────────────────────────────────────────────────────────

export const AllValues: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
      <Slider label="0%"   value={0}   />
      <Slider label="25%"  value={25}  />
      <Slider label="50%"  value={50}  />
      <Slider label="75%"  value={75}  />
      <Slider label="100%" value={100} />
    </div>
  ),
  parameters: {
    docs: {
      description: { story: 'All positions — min, 25%, 50%, 75%, max.' },
    },
  },
};
