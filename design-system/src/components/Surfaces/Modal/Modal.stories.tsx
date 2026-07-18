import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Modal } from './Modal';

const noop = () => {};

const meta: Meta<typeof Modal> = {
  title: 'Surfaces/Modal',
  component: Modal,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: { type: 'radio' },
      options: ['medium', 'small'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Modal>;

// Wraps the story so the modal starts open and re-opens on trigger click.
function ModalDemo(props: React.ComponentProps<typeof Modal>) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ padding: 24 }}>
      <button onClick={() => setOpen(true)} style={{ marginBottom: 12 }}>
        Open Modal
      </button>
      <Modal {...props} open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

// ─── Default ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  name: 'Default / Medium',
  render: (args) => <ModalDemo {...args} />,
  args: {
    size:            'medium',
    title:           'Confirm your action',
    description:     'This will permanently delete your account and all associated data. This action cannot be undone.',
    dismissable:     true,
    primaryAction:   { label: 'Delete account', onClick: noop },
    secondaryAction: { label: 'Cancel',          onClick: noop },
  },
};

export const Small: Story = {
  name: 'Default / Small',
  render: (args) => <ModalDemo {...args} />,
  args: {
    size:            'small',
    title:           'Save changes?',
    description:     'You have unsaved changes. Would you like to save before leaving?',
    dismissable:     true,
    primaryAction:   { label: 'Save',    onClick: noop },
    secondaryAction: { label: 'Discard', onClick: noop },
  },
};

// ─── Image variant ────────────────────────────────────────────────────────────

export const ImageMedium: Story = {
  name: 'Image / Medium',
  render: (args) => <ModalDemo {...args} />,
  args: {
    size:            'medium',
    title:           'Upgrade your plan',
    description:     'Get access to premium features and unlimited storage with our Pro plan.',
    dismissable:     true,
    imageSrc:        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=207&fit=crop',
    imageAlt:        'Mountain landscape at sunset',
    primaryAction:   { label: 'Upgrade to Pro', onClick: noop },
    secondaryAction: { label: 'Maybe later',    onClick: noop },
  },
};

export const ImageSmall: Story = {
  name: 'Image / Small',
  render: (args) => <ModalDemo {...args} />,
  args: {
    size:          'small',
    title:         'New feature',
    description:   'We just launched dark mode. Try it out in your settings.',
    dismissable:   true,
    imageSrc:      'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=380&h=200&fit=crop',
    imageAlt:      'Abstract colourful lights',
    primaryAction: { label: 'Try it now', onClick: noop },
  },
};

// ─── Variants ─────────────────────────────────────────────────────────────────

export const NoDescription: Story = {
  name: 'No description',
  render: (args) => <ModalDemo {...args} />,
  args: {
    size:            'medium',
    title:           'Are you sure?',
    dismissable:     true,
    primaryAction:   { label: 'Confirm', onClick: noop },
    secondaryAction: { label: 'Cancel',  onClick: noop },
  },
};

export const NoActions: Story = {
  name: 'No actions',
  render: (args) => <ModalDemo {...args} />,
  args: {
    size:        'medium',
    title:       'Keyboard shortcuts',
    description: 'Use ⌘K to open the command palette, ⌘/ to focus search, and Esc to close any open panel.',
    dismissable: true,
    children:    (
      <div style={{ padding: '16px', background: 'var(--sds-neutral-background-subtle)', borderRadius: 12, fontSize: 14 }}>
        Slot content goes here.
      </div>
    ),
  },
};

export const WithContent: Story = {
  name: 'With content slot',
  render: (args) => <ModalDemo {...args} />,
  args: {
    size:            'medium',
    title:           'Edit profile',
    description:     'Update your display name and bio.',
    dismissable:     true,
    primaryAction:   { label: 'Save changes', onClick: noop },
    secondaryAction: { label: 'Cancel',        onClick: noop },
    children: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          placeholder="Display name"
          style={{
            padding: '10px 14px',
            border: '1px solid var(--sds-neutral-stroke-default)',
            borderRadius: 10,
            fontSize: 16,
            fontFamily: 'inherit',
          }}
        />
        <textarea
          placeholder="Bio"
          rows={3}
          style={{
            padding: '10px 14px',
            border: '1px solid var(--sds-neutral-stroke-default)',
            borderRadius: 10,
            fontSize: 16,
            fontFamily: 'inherit',
            resize: 'vertical',
          }}
        />
      </div>
    ),
  },
};

export const NonDismissable: Story = {
  name: 'Non-dismissable',
  render: (args) => <ModalDemo {...args} />,
  args: {
    size:            'medium',
    title:           'Terms of service updated',
    description:     'We have updated our terms of service. You must accept them to continue using the app.',
    dismissable:     false,
    primaryAction:   { label: 'Accept',  onClick: noop },
    secondaryAction: { label: 'Sign out', onClick: noop },
  },
};

export const Playground: Story = {
  name: 'Playground',
  render: (args) => <ModalDemo {...args} />,
  args: {
    size:            'medium',
    title:           'Modal title',
    description:     'Support text that provides additional context for this action.',
    dismissable:     true,
    primaryAction:   { label: 'Primary action',   onClick: noop },
    secondaryAction: { label: 'Secondary action', onClick: noop },
  },
};
