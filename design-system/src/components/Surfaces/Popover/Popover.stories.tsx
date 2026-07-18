import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Popover } from './Popover';
import { Button } from '../../Actions/Button/Button';
import { CircleIcon, InfoIcon } from '../../../icons';

const meta: Meta<typeof Popover> = {
  title: 'Surfaces/Popover',
  component: Popover,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    side:           { control: { type: 'radio' }, options: ['top', 'bottom', 'start', 'end'] },
    openOnHover:    { control: 'boolean' },
    showCloseButton:{ control: 'boolean' },
    disabled:       { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Popover>;

const TITLE = 'Popover title';
const DESC  = 'This is additional context or detail that helps the user understand something.';

// ─── Default ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  name: 'Default / Top',
  args: { side: 'top', showCloseButton: true },
  render: (args) => (
    <Popover {...args} title={TITLE} description={DESC}>
      <Button variant="secondary" fillStyle="hollow" label="Open popover" />
    </Popover>
  ),
};

// ─── Placements ───────────────────────────────────────────────────────────────

export const Placements: Story = {
  name: 'Placements',
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, auto)', gap: 16, placeItems: 'center' }}>
      <span />
      <Popover title={TITLE} description={DESC} side="top">
        <Button variant="secondary" fillStyle="hollow" size="small" label="Top" />
      </Popover>
      <span />

      <Popover title={TITLE} description={DESC} side="start">
        <Button variant="secondary" fillStyle="hollow" size="small" label="Start" />
      </Popover>
      <span style={{ width: 120 }} />
      <Popover title={TITLE} description={DESC} side="end">
        <Button variant="secondary" fillStyle="hollow" size="small" label="End" />
      </Popover>

      <span />
      <Popover title={TITLE} description={DESC} side="bottom">
        <Button variant="secondary" fillStyle="hollow" size="small" label="Bottom" />
      </Popover>
      <span />
    </div>
  ),
};

// ─── Title only ───────────────────────────────────────────────────────────────

export const TitleOnly: Story = {
  name: 'Title only',
  render: () => (
    <Popover title="Saved to your library" side="bottom">
      <Button variant="secondary" fillStyle="hollow" label="Show" />
    </Popover>
  ),
};

// ─── No close button ─────────────────────────────────────────────────────────

export const NoCloseButton: Story = {
  name: 'No close button',
  render: () => (
    <Popover title={TITLE} description={DESC} showCloseButton={false} side="bottom">
      <Button variant="secondary" fillStyle="hollow" label="Open" />
    </Popover>
  ),
};

// ─── Open on hover ────────────────────────────────────────────────────────────

export const HoverMode: Story = {
  name: 'Open on hover',
  render: () => (
    <Popover
      title="Hover to reveal"
      description="This popover opens on hover, like a rich tooltip."
      openOnHover
      showCloseButton={false}
      side="top"
    >
      <Button
        variant="secondary"
        fillStyle="hollow"
        size="small"
        icon={<InfoIcon size={16} />}
        label="Info"
        showLabel={false}
        disableTooltip
      />
    </Popover>
  ),
};

// ─── Custom content ───────────────────────────────────────────────────────────

export const CustomContent: Story = {
  name: 'Custom content',
  render: () => (
    <Popover
      content={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span className="sds-text--subtitle-medium" style={{ color: 'var(--sds-neutral-content-primary)' }}>
            Upgrade plan
          </span>
          <span className="sds-text--body-content-small" style={{ color: 'var(--sds-neutral-content-secondary)' }}>
            You've reached the limit for your current plan.
          </span>
          <div style={{ marginTop: 4 }}>
            <Button variant="primary" fillStyle="filled" size="small" label="View plans" />
          </div>
        </div>
      }
      side="bottom"
    >
      <Button variant="secondary" fillStyle="hollow" label="Upgrade" />
    </Popover>
  ),
};

// ─── Icon trigger ─────────────────────────────────────────────────────────────

export const IconTrigger: Story = {
  name: 'Icon trigger',
  render: () => (
    <Popover
      title="What is this?"
      description="This explains the field or feature next to the icon."
      side="end"
    >
      <button
        type="button"
        style={{
          display: 'flex',
          alignItems: 'center',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          padding: 4,
          color: 'var(--sds-neutral-content-secondary)',
          borderRadius: 'var(--sds-shape-border-radius-xxsmall)',
        }}
        aria-label="Learn more"
      >
        <InfoIcon size={16} />
      </button>
    </Popover>
  ),
};

// ─── Controlled ───────────────────────────────────────────────────────────────

export const Controlled: Story = {
  name: 'Controlled',
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <p style={{ fontSize: 13, color: 'var(--sds-neutral-content-secondary)', margin: 0 }}>
          Open: {open ? 'true' : 'false'}
        </p>
        <Popover
          title={TITLE}
          description={DESC}
          open={open}
          onOpenChange={setOpen}
          side="bottom"
        >
          <Button variant="secondary" fillStyle="hollow" label="Toggle" />
        </Popover>
      </div>
    );
  },
};

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  name: 'Playground',
  args: { side: 'top', showCloseButton: true, openOnHover: false },
  render: (args) => (
    <Popover {...args} title={TITLE} description={DESC}>
      <Button
        variant="secondary"
        fillStyle="hollow"
        icon={<CircleIcon size={16} />}
        label="Open popover"
      />
    </Popover>
  ),
};
