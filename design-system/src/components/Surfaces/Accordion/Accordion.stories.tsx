import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionPanel } from './Accordion';
import { CircleIcon } from '../../../icons';

const meta: Meta<typeof Accordion> = {
  title: 'Surfaces/Accordion',
  component: Accordion,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    size:     { control: { type: 'radio' }, options: ['small', 'medium'] as const },
    multiple: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Accordion>;

const BODY = "Here's some example text that may answer an FAQ or give the user some helpful advice. A wonderful serenity has taken possession of my entire soul, like these sweet mornings of spring which I enjoy with my whole heart.";

// ─── Default (small, single-open) ─────────────────────────────────────────────

export const Default: Story = {
  name: 'Default / Small',
  args: { size: 'small', multiple: false },
  render: (args) => (
    <Accordion {...args} defaultValue="item-1" style={{ maxWidth: 540 }}>
      <AccordionItem value="item-1">
        <AccordionTrigger icon={<CircleIcon size={16} />}>Accordion Title</AccordionTrigger>
        <AccordionPanel>{BODY}</AccordionPanel>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger icon={<CircleIcon size={16} />}>Accordion Title</AccordionTrigger>
        <AccordionPanel>{BODY}</AccordionPanel>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger icon={<CircleIcon size={16} />}>Accordion Title</AccordionTrigger>
        <AccordionPanel>{BODY}</AccordionPanel>
      </AccordionItem>
      <AccordionItem value="item-4" disabled>
        <AccordionTrigger icon={<CircleIcon size={16} />}>Accordion Title</AccordionTrigger>
        <AccordionPanel>{BODY}</AccordionPanel>
      </AccordionItem>
    </Accordion>
  ),
};

// ─── Large ────────────────────────────────────────────────────────────────────

export const Large: Story = {
  name: 'Default / Large',
  args: { size: 'medium', multiple: false },
  render: (args) => (
    <Accordion {...args} defaultValue="item-1" style={{ maxWidth: 682 }}>
      <AccordionItem value="item-1">
        <AccordionTrigger icon={<CircleIcon size={20} />}>Accordion Title</AccordionTrigger>
        <AccordionPanel>{BODY}</AccordionPanel>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger icon={<CircleIcon size={20} />}>Accordion Title</AccordionTrigger>
        <AccordionPanel>{BODY}</AccordionPanel>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger icon={<CircleIcon size={20} />}>Accordion Title</AccordionTrigger>
        <AccordionPanel>{BODY}</AccordionPanel>
      </AccordionItem>
      <AccordionItem value="item-4" disabled>
        <AccordionTrigger icon={<CircleIcon size={20} />}>Accordion Title</AccordionTrigger>
        <AccordionPanel>{BODY}</AccordionPanel>
      </AccordionItem>
    </Accordion>
  ),
};

// ─── Multiple open ────────────────────────────────────────────────────────────

export const Multiple: Story = {
  name: 'Multiple open',
  render: () => (
    <Accordion multiple defaultValue={['item-1', 'item-2']} style={{ maxWidth: 540 }}>
      <AccordionItem value="item-1">
        <AccordionTrigger icon={<CircleIcon size={16} />}>Shipping policy</AccordionTrigger>
        <AccordionPanel>{BODY}</AccordionPanel>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger icon={<CircleIcon size={16} />}>Return policy</AccordionTrigger>
        <AccordionPanel>{BODY}</AccordionPanel>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger icon={<CircleIcon size={16} />}>Payment methods</AccordionTrigger>
        <AccordionPanel>{BODY}</AccordionPanel>
      </AccordionItem>
    </Accordion>
  ),
};

// ─── No icon ──────────────────────────────────────────────────────────────────

export const NoIcon: Story = {
  name: 'No icon',
  render: () => (
    <Accordion style={{ maxWidth: 540 }}>
      <AccordionItem value="item-1">
        <AccordionTrigger>What is a design system?</AccordionTrigger>
        <AccordionPanel>{BODY}</AccordionPanel>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>How do I get started?</AccordionTrigger>
        <AccordionPanel>{BODY}</AccordionPanel>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Can I customise the components?</AccordionTrigger>
        <AccordionPanel>{BODY}</AccordionPanel>
      </AccordionItem>
    </Accordion>
  ),
};

// ─── Controlled ───────────────────────────────────────────────────────────────

export const Controlled: Story = {
  name: 'Controlled',
  render: () => {
    const [open, setOpen] = useState<string[]>(['item-1']);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p style={{ fontSize: 13, color: 'var(--sds-neutral-content-secondary)', margin: 0 }}>
          Open: {open.join(', ') || '(none)'}
        </p>
        <Accordion
          value={open}
          onChange={setOpen}
          style={{ maxWidth: 540 }}
        >
          <AccordionItem value="item-1">
            <AccordionTrigger icon={<CircleIcon size={16} />}>First item</AccordionTrigger>
            <AccordionPanel>{BODY}</AccordionPanel>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger icon={<CircleIcon size={16} />}>Second item</AccordionTrigger>
            <AccordionPanel>{BODY}</AccordionPanel>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger icon={<CircleIcon size={16} />}>Third item</AccordionTrigger>
            <AccordionPanel>{BODY}</AccordionPanel>
          </AccordionItem>
        </Accordion>
      </div>
    );
  },
};

// ─── Rich title content ───────────────────────────────────────────────────────

export const RichTitle: Story = {
  name: 'Rich title content',
  render: () => (
    <Accordion style={{ maxWidth: 540 }}>
      <AccordionItem value="item-1">
        <AccordionTrigger icon={<CircleIcon size={16} />}>
          Billing{' '}
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '1px 6px',
            borderRadius: 99,
            fontSize: 11,
            fontWeight: 600,
            background: 'var(--sds-interactive-secondary-hollow-background-inactive-hover)',
            color: 'var(--sds-interactive-secondary-hollow-content-default)',
            marginInlineStart: 6,
          }}>
            New
          </span>
        </AccordionTrigger>
        <AccordionPanel>{BODY}</AccordionPanel>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger icon={<CircleIcon size={16} />}>Account settings</AccordionTrigger>
        <AccordionPanel>{BODY}</AccordionPanel>
      </AccordionItem>
    </Accordion>
  ),
};

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  name: 'Playground',
  args: { size: 'small', multiple: false },
  render: (args) => (
    <Accordion {...args} defaultValue="item-1" style={{ maxWidth: 540 }}>
      <AccordionItem value="item-1">
        <AccordionTrigger icon={<CircleIcon size={16} />}>Accordion Title</AccordionTrigger>
        <AccordionPanel>{BODY}</AccordionPanel>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger icon={<CircleIcon size={16} />}>Accordion Title</AccordionTrigger>
        <AccordionPanel>{BODY}</AccordionPanel>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger icon={<CircleIcon size={16} />}>Accordion Title</AccordionTrigger>
        <AccordionPanel>{BODY}</AccordionPanel>
      </AccordionItem>
    </Accordion>
  ),
};
