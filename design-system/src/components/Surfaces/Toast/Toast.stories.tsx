import type { Meta, StoryObj } from '@storybook/react-vite';
import { ToastProvider, useToast, type ToastPosition } from './Toast';
import { Button } from '../../Actions/Button/Button';

const meta: Meta<typeof ToastProvider> = {
  title:      'Surfaces/Toast',
  component:  ToastProvider,
  tags:       ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div style={{ minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ToastProvider>;

// ─── Trigger helper ───────────────────────────────────────────────────────────

function ToastTrigger({
  label = 'Show toast',
  options,
}: {
  label?: string;
  options: Parameters<ReturnType<typeof useToast>['add']>[0];
}) {
  const { add } = useToast();
  return (
    <Button
      variant="secondary"
      fillStyle="hollow"
      label={label}
      onClick={() => add(options)}
    />
  );
}

// ─── Default ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  name: 'Default',
  render: () => (
    <ToastProvider position="bottom-end">
      <ToastTrigger
        options={{ title: 'Changes saved' }}
      />
    </ToastProvider>
  ),
};

// ─── With description ─────────────────────────────────────────────────────────

export const WithDescription: Story = {
  name: 'With description',
  render: () => (
    <ToastProvider position="bottom-end">
      <ToastTrigger
        options={{
          title:       'File uploaded',
          description: 'Your file has been uploaded successfully and is ready to use.',
        }}
      />
    </ToastProvider>
  ),
};

// ─── With actions ─────────────────────────────────────────────────────────────

export const WithActions: Story = {
  name: 'With actions',
  render: () => (
    <ToastProvider position="bottom-end">
      <ToastTrigger
        options={{
          title:       'Message deleted',
          description: 'The message was moved to trash.',
          actions: [
            { label: 'Undo',   onClick: () => console.log('Undo'), variant: 'hollow' },
          ],
        }}
      />
    </ToastProvider>
  ),
};

// ─── Two actions ──────────────────────────────────────────────────────────────

export const TwoActions: Story = {
  name: 'Two actions',
  render: () => (
    <ToastProvider position="bottom-end">
      <ToastTrigger
        options={{
          title:   'Added to favourites',
          actions: [
            { label: 'View',    onClick: () => console.log('View') },
            { label: 'Dismiss', variant: 'hollow' },
          ],
        }}
      />
    </ToastProvider>
  ),
};

// ─── No close button ─────────────────────────────────────────────────────────

export const NoCloseButton: Story = {
  name: 'No close button',
  render: () => (
    <ToastProvider position="bottom-end">
      <ToastTrigger
        options={{
          title:           'Copied to clipboard',
          showCloseButton: false,
          duration:        2500,
        }}
      />
    </ToastProvider>
  ),
};

// ─── Persist ──────────────────────────────────────────────────────────────────

export const Persistent: Story = {
  name: 'Persistent (duration: 0)',
  render: () => (
    <ToastProvider position="bottom-end">
      <ToastTrigger
        label="Show persistent toast"
        options={{
          title:       'Sync paused',
          description: 'Reconnect to resume syncing your data.',
          duration:    0,
          actions: [{ label: 'Reconnect', onClick: () => console.log('reconnect') }],
        }}
      />
    </ToastProvider>
  ),
};

// ─── Multiple ─────────────────────────────────────────────────────────────────

export const Multiple: Story = {
  name: 'Multiple toasts',
  render: () => {
    const messages = [
      'Changes saved',
      'Link copied',
      'File uploaded',
    ];
    let i = 0;
    function CycleTrigger() {
      const { add } = useToast();
      return (
        <Button
          variant="secondary"
          fillStyle="hollow"
          label="Add another toast"
          onClick={() => add({ title: messages[i++ % messages.length], duration: 4000 })}
        />
      );
    }
    return (
      <ToastProvider position="bottom-end">
        <CycleTrigger />
      </ToastProvider>
    );
  },
};

// ─── Positions ────────────────────────────────────────────────────────────────

const POSITIONS: ToastPosition[] = [
  'top-start', 'top-center', 'top-end',
  'bottom-start', 'bottom-center', 'bottom-end',
];

export const Positions: Story = {
  name: 'All positions',
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, auto)', gap: 8 }}>
      {POSITIONS.map((pos) => {
        function Trigger() {
          const { add } = useToast();
          return (
            <Button
              variant="secondary"
              fillStyle="hollow"
              size="xsmall"
              label={pos}
              onClick={() => add({ title: `Toast — ${pos}`, duration: 3000 })}
            />
          );
        }
        return (
          <ToastProvider key={pos} position={pos}>
            <Trigger />
          </ToastProvider>
        );
      })}
    </div>
  ),
};

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  name: 'Playground',
  args: { position: 'bottom-end' },
  argTypes: {
    position: {
      control: { type: 'select' },
      options: POSITIONS,
    },
  },
  render: (args) => (
    <ToastProvider {...args}>
      <ToastTrigger
        options={{
          title:       'Toast title',
          description: 'Example toast description',
          actions: [
            { label: 'Favourite' },
            { label: 'Undo', variant: 'hollow' },
          ],
        }}
      />
    </ToastProvider>
  ),
};
