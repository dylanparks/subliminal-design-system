import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProgressCircle } from './ProgressCircle';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<typeof ProgressCircle> = {
  component: ProgressCircle,
  title: 'DataDisplay/ProgressCircle',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: [
          'A circular progress indicator for loading and processing states.',
          '',
          '**Indeterminate** (default — omit `value`): animated spinner for unknown duration tasks.',
          '',
          '**Determinate** (`value={number}`): fills a percentage arc for trackable progress.',
          '',
          '**Static variant**: pass `propStatic` when the circle sits on a dark or gradient surface.',
        ].join('\n'),
      },
    },
  },
  argTypes: {
    value: {
      control: { type: 'number', min: 0, max: 100 },
      description: 'Progress value (0–100). Omit or pass `null` for indeterminate.',
    },
    size: {
      control: 'radio',
      options: ['xsmall', 'small', 'medium', 'large'],
    },
    propStatic: {
      control: 'boolean',
      description: 'White-palette variant for dark or gradient backgrounds.',
      table: { defaultValue: { summary: 'false' } },
    },
    min:       { control: { type: 'number' } },
    max:       { control: { type: 'number' } },
    className: { table: { disable: true } },
  },
};

export default meta;
type Story = StoryObj<typeof ProgressCircle>;

// ─── Indeterminate ────────────────────────────────────────────────────────────

export const Indeterminate: Story = {
  name: 'Indeterminate',
  args: { size: 'medium' },
  parameters: {
    docs: { description: { story: 'Animated spinner — use when task duration is unknown.' } },
  },
};

// ─── Determinate ─────────────────────────────────────────────────────────────

export const Determinate: Story = {
  name: 'Determinate — 65%',
  args: { value: 65, size: 'medium', 'aria-label': '65%' },
  parameters: {
    docs: { description: { story: 'Fills an arc proportional to `value`. Pass any number between `min` and `max`.' } },
  },
};

// ─── All sizes (indeterminate) ────────────────────────────────────────────────

export const AllSizes: Story = {
  name: 'All sizes',
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <ProgressCircle size="xsmall" aria-label="Loading" />
      <ProgressCircle size="small"  aria-label="Loading" />
      <ProgressCircle size="medium" aria-label="Loading" />
      <ProgressCircle size="large"  aria-label="Loading" />
    </div>
  ),
  parameters: {
    docs: { description: { story: 'XSmall (16px) · Small (24px) · Medium (40px) · Large (64px)' } },
  },
};

// ─── All sizes (determinate) ──────────────────────────────────────────────────

export const AllSizesDeterminate: Story = {
  name: 'All sizes — determinate',
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <ProgressCircle size="xsmall" value={65} aria-label="65%" />
      <ProgressCircle size="small"  value={65} aria-label="65%" />
      <ProgressCircle size="medium" value={65} aria-label="65%" />
      <ProgressCircle size="large"  value={65} aria-label="65%" />
    </div>
  ),
  parameters: {
    docs: { description: { story: 'Determinate arc at 65% across all four sizes.' } },
  },
};

// ─── Static variant ───────────────────────────────────────────────────────────

export const StaticVariant: Story = {
  name: 'Static variant',
  render: () => (
    <div style={{
      display:      'flex',
      alignItems:   'center',
      gap:          24,
      padding:      32,
      borderRadius: 'var(--sds-shape-border-radius-medium)',
      background:   'linear-gradient(109deg, var(--sds-accents-gradient-primarystart) 10.664%, var(--sds-accents-gradient-primaryend) 89.336%)',
    }}>
      <ProgressCircle size="xsmall" propStatic aria-label="Loading" />
      <ProgressCircle size="small"  propStatic aria-label="Loading" />
      <ProgressCircle size="medium" propStatic aria-label="Loading" />
      <ProgressCircle size="large"  propStatic aria-label="Loading" />
    </div>
  ),
  parameters: {
    docs: { description: { story: 'Pass `propStatic` when the spinner sits on a dark or gradient surface. Uses white-based tokens.' } },
  },
};

// ─── Static variant determinate ───────────────────────────────────────────────

export const StaticDeterminate: Story = {
  name: 'Static variant — determinate',
  render: () => (
    <div style={{
      display:      'flex',
      alignItems:   'center',
      gap:          24,
      padding:      32,
      borderRadius: 'var(--sds-shape-border-radius-medium)',
      background:   'linear-gradient(109deg, var(--sds-accents-gradient-primarystart) 10.664%, var(--sds-accents-gradient-primaryend) 89.336%)',
    }}>
      <ProgressCircle size="xsmall" value={65} propStatic aria-label="65%" />
      <ProgressCircle size="small"  value={65} propStatic aria-label="65%" />
      <ProgressCircle size="medium" value={65} propStatic aria-label="65%" />
      <ProgressCircle size="large"  value={65} propStatic aria-label="65%" />
    </div>
  ),
  parameters: {
    docs: { description: { story: 'Determinate arc at 65% in the static (white) variant.' } },
  },
};

// ─── Progress values ──────────────────────────────────────────────────────────

export const ProgressValues: Story = {
  name: 'Progress values',
  render: () => {
    const values = [0, 25, 50, 75, 100];
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        {values.map((v) => (
          <ProgressCircle key={v} size="medium" value={v} aria-label={`${v}%`} />
        ))}
      </div>
    );
  },
  parameters: {
    docs: { description: { story: '0% · 25% · 50% · 75% · 100%' } },
  },
};
