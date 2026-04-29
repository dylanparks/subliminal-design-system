import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProgressBar } from './ProgressBar';

const meta: Meta<typeof ProgressBar> = {
  component: ProgressBar,
  title: 'DataDisplay/ProgressBar',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Linear progress indicator. Pass a numeric `value` for determinate progress, or `null` for an indeterminate animated sweep. Supports `error` and `success` fill states.',
      },
    },
  },
  argTypes: {
    value: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description: 'Progress value (0–100). Pass `null` for indeterminate.',
    },
    label: {
      control: 'text',
    },
    showValue: {
      control: 'boolean',
      table: { defaultValue: { summary: 'false' } },
    },
    error: {
      control: 'boolean',
      table: { defaultValue: { summary: 'false' } },
    },
    success: {
      control: 'boolean',
      table: { defaultValue: { summary: 'false' } },
    },
    validationMessage: {
      control: 'text',
    },
    min:       { table: { disable: true } },
    max:       { table: { disable: true } },
    className: { table: { disable: true } },
  },
  args: {
    value:     40,
    label:     'Uploading…',
    showValue: false,
    error:     false,
    success:   false,
  },
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ProgressBar>;

export const Default: Story = {};

export const WithValue: Story = {
  args: { showValue: true },
};

export const Indeterminate: Story = {
  args: { value: null, label: 'Loading…', showValue: false },
  argTypes: { value: { control: false } },
};

export const Error: Story = {
  args: { error: true, label: 'Upload failed', showValue: true, validationMessage: 'Upload failed. Please try again.' },
};

export const Success: Story = {
  args: { success: true, value: 100, label: 'Upload complete', showValue: true, validationMessage: 'File uploaded successfully.' },
};

export const NoLabel: Story = {
  args: { label: undefined, showValue: false },
};
