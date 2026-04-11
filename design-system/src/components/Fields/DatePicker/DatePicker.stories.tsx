import type { Meta, StoryObj } from '@storybook/react-vite';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { DatePicker } from './DatePicker';

const meta: Meta<typeof DatePicker> = {
  component: DatePicker,
  title: 'Fields/DatePicker',
  decorators: [(Story) => (
    <div style={{ maxWidth: '38rem', width: '100%', paddingBottom: '24rem' }}>
      <Story />
    </div>
  )],
  parameters: {
    docs: {
      description: {
        component:
          'A date-picker field. Supports four modes: `date` (single date), `range` (start–end), `month` (month + year), and `year`.\n\n' +
          '- Click or press `Enter`/`Space` on the trigger to open the popover\n' +
          '- `ArrowKeys` navigate the calendar grid\n' +
          '- `Enter`/`Space` commits the focused date\n' +
          '- `Escape` / `Tab` closes the popover',
      },
    },
  },
  argTypes: {
    mode:     { control: 'select', options: ['date', 'range', 'month', 'year'] },
    size:     { control: 'select', options: ['large', 'medium'] },
    disabled: { control: 'boolean' },
    error:    { control: 'boolean' },
    success:  { control: 'boolean' },
  },
  args: {
    label:    'Date',
    mode:     'date',
    size:     'large',
    disabled: false,
    error:    false,
    success:  false,
  },
};

export default meta;
type Story = StoryObj<typeof DatePicker>;

// Default: pin a date so the calendar snapshot is deterministic (no "today" drift).
export const Default: Story = {
  args: {
    defaultValue: { year: 2026, month: 4, day: 11 },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /^date/i }));
    await waitFor(() =>
      expect(document.querySelector('[role="dialog"]')).toBeInTheDocument()
    );
  },
  parameters: { chromatic: { delay: 400 } },
};

export const Range: Story = {
  args: {
    mode:  'range',
    label: 'Date range',
    defaultStartValue: { year: 2026, month: 3, day: 10 },
    defaultEndValue:   { year: 2026, month: 3, day: 22 },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /date range/i }));
    await waitFor(() =>
      expect(document.querySelector('[role="dialog"]')).toBeInTheDocument()
    );
  },
  parameters: { chromatic: { delay: 400 } },
};

// RangeEmpty: pin a start value so the calendar opens to a fixed month.
export const RangeEmpty: Story = {
  args: {
    mode:              'range',
    label:             'Date range',
    defaultStartValue: { year: 2026, month: 4, day: 1 },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /date range/i }));
    await waitFor(() =>
      expect(document.querySelector('[role="dialog"]')).toBeInTheDocument()
    );
  },
  parameters: { chromatic: { delay: 400 } },
};

export const Month: Story = {
  args: {
    mode:         'month',
    label:        'Month',
    defaultValue: { year: 2026, month: 3, day: 1 },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /month/i }));
    await waitFor(() =>
      expect(document.querySelector('[role="dialog"]')).toBeInTheDocument()
    );
  },
  parameters: { chromatic: { delay: 400 } },
};

export const Year: Story = {
  args: {
    mode:         'year',
    label:        'Year',
    defaultValue: { year: 2026, month: 1, day: 1 },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /year/i }));
    await waitFor(() =>
      expect(document.querySelector('[role="dialog"]')).toBeInTheDocument()
    );
  },
  parameters: { chromatic: { delay: 400 } },
};

export const Error: Story = {
  args: {
    defaultValue: { year: 2026, month: 3, day: 22 },
    error:        true,
    message:      'Please select a valid date.',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /^date/i }));
    await waitFor(() =>
      expect(document.querySelector('[role="dialog"]')).toBeInTheDocument()
    );
  },
  parameters: { chromatic: { delay: 400 } },
};

export const Success: Story = {
  args: {
    defaultValue: { year: 2026, month: 3, day: 22 },
    success:      true,
    message:      'Date confirmed.',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /^date/i }));
    await waitFor(() =>
      expect(document.querySelector('[role="dialog"]')).toBeInTheDocument()
    );
  },
  parameters: { chromatic: { delay: 400 } },
};
