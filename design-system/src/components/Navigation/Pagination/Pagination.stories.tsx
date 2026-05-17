import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Pagination } from './Pagination';

const meta: Meta<typeof Pagination> = {
  component: Pagination,
  title: 'Navigation/Pagination',
  parameters: { layout: 'centered' },
  argTypes: {
    variant: {
      control: 'radio',
      options: ['default', 'compact'],
    },
    count:        { control: { type: 'number', min: 1 } },
    defaultPage:  { control: { type: 'number', min: 1 } },
    siblingCount: { control: { type: 'number', min: 0, max: 3 } },
    boundaryCount:{ control: { type: 'number', min: 0, max: 3 } },
    page:         { control: false },
    onChange:     { control: false },
  },
  args: {
    count:        10,
    defaultPage:  1,
    variant:      'default',
    siblingCount:  1,
    boundaryCount: 1,
  },
};

export default meta;
type Story = StoryObj<typeof Pagination>;

// ─── Default ──────────────────────────────────────────────────────────────────

export const Default: Story = {};

// ─── Compact ──────────────────────────────────────────────────────────────────

export const Compact: Story = {
  args: { variant: 'compact', defaultPage: 3, count: 10 },
};

// ─── Many pages ───────────────────────────────────────────────────────────────

export const ManyPages: Story = {
  name: 'Many pages — ellipsis',
  args: { count: 27, defaultPage: 14 },
};

// ─── First page ───────────────────────────────────────────────────────────────

export const FirstPage: Story = {
  name: 'First page (prev disabled)',
  args: { count: 10, defaultPage: 1 },
};

// ─── Last page ────────────────────────────────────────────────────────────────

export const LastPage: Story = {
  name: 'Last page (next disabled)',
  args: { count: 10, defaultPage: 10 },
};

// ─── Few pages (no ellipsis) ──────────────────────────────────────────────────

export const FewPages: Story = {
  name: 'Few pages — no ellipsis',
  args: { count: 5, defaultPage: 3 },
};

// ─── Controlled ───────────────────────────────────────────────────────────────

export const Controlled: Story = {
  render: (args) => {
    const [page, setPage] = useState(1);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <span style={{ fontFamily: 'sans-serif', fontSize: 14 }}>Current page: {page}</span>
        <Pagination {...args} page={page} onChange={setPage} />
      </div>
    );
  },
  args: { count: 10 },
};

// ─── All variants ─────────────────────────────────────────────────────────────

export const AllVariants: Story = {
  name: 'All variants',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
      <Pagination count={10} defaultPage={5} variant="default" />
      <Pagination count={10} defaultPage={5} variant="compact" />
    </div>
  ),
  parameters: { controls: { disable: true } },
};
