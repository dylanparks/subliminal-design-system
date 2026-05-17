import type { Meta, StoryObj } from '@storybook/react-vite';
import { Notification } from './Notification';

const noop = () => {};

const meta: Meta<typeof Notification> = {
  title: 'Surfaces/Notification',
  component: Notification,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: {
    onDismiss: noop,
    actions: [
      { label: 'Primary action', onClick: noop },
      { label: 'Secondary',      onClick: noop },
    ],
  },
  argTypes: {
    status: {
      control: { type: 'select' },
      options: ['informational', 'success', 'warning', 'error'],
    },
    layout: {
      control: { type: 'radio' },
      options: ['stacked', 'inline'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Notification>;

// ─── Stacked ──────────────────────────────────────────────────────────────────

export const StackedInformational: Story = {
  name: 'Stacked / Informational',
  args: {
    status:      'informational',
    layout:      'stacked',
    title:       'System update scheduled',
    description: 'Maintenance is scheduled for Sunday at 2:00 AM. Expect up to 15 minutes of downtime.',
    dismissable: true,
  },
};

export const StackedSuccess: Story = {
  name: 'Stacked / Success',
  args: {
    status:      'success',
    layout:      'stacked',
    title:       'Changes saved successfully',
    description: 'Your profile has been updated and changes are now live.',
    dismissable: true,
  },
};

export const StackedWarning: Story = {
  name: 'Stacked / Warning',
  args: {
    status:      'warning',
    layout:      'stacked',
    title:       'Storage almost full',
    description: 'You have used 90% of your available storage. Free up space to avoid interruptions.',
    dismissable: true,
  },
};

export const StackedError: Story = {
  name: 'Stacked / Error',
  args: {
    status:      'error',
    layout:      'stacked',
    title:       'Payment failed',
    description: 'We were unable to process your payment. Please check your billing details and try again.',
    dismissable: true,
  },
};

// ─── Inline ───────────────────────────────────────────────────────────────────

export const InlineInformational: Story = {
  name: 'Inline / Informational',
  args: {
    status:      'informational',
    layout:      'inline',
    title:       'A new version of the app is available.',
    dismissable: true,
  },
};

export const InlineSuccess: Story = {
  name: 'Inline / Success',
  args: {
    status:      'success',
    layout:      'inline',
    title:       'Your subscription is active.',
    dismissable: true,
  },
};

export const InlineWarning: Story = {
  name: 'Inline / Warning',
  args: {
    status:      'warning',
    layout:      'inline',
    title:       'Your session will expire in 5 minutes.',
    dismissable: false,
    actions:     [{ label: 'Stay signed in', onClick: noop }],
  },
};

export const InlineError: Story = {
  name: 'Inline / Error',
  args: {
    status:      'error',
    layout:      'inline',
    title:       'Unable to connect to the server.',
    dismissable: false,
    actions:     [{ label: 'Retry', onClick: noop }],
  },
};

// ─── Variants ─────────────────────────────────────────────────────────────────

export const WithoutDescription: Story = {
  name: 'Stacked / No description',
  args: {
    status:      'informational',
    layout:      'stacked',
    title:       'Reminder: your trial ends in 3 days.',
    dismissable: true,
  },
};

export const WithoutActions: Story = {
  name: 'Stacked / No actions',
  args: {
    status:      'success',
    layout:      'stacked',
    title:       'Email verified',
    description: 'Your email address has been confirmed.',
    dismissable: true,
    actions:     undefined,
  },
};

export const NonDismissable: Story = {
  name: 'Stacked / Non-dismissable',
  args: {
    status:      'error',
    layout:      'stacked',
    title:       'Account suspended',
    description: 'Your account has been temporarily suspended. Contact support to resolve this.',
    dismissable: false,
    actions:     [{ label: 'Contact support', onClick: noop }],
  },
};

export const Playground: Story = {
  name: 'Playground',
  args: {
    status:      'informational',
    layout:      'stacked',
    title:       'Notification title',
    description: 'Notification body description text that provides additional context.',
    dismissable: true,
  },
};
