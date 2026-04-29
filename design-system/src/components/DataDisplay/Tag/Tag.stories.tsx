import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tag } from './Tag';
import type { TagType } from './Tag';

// Inline placeholder icon for Storybook demos
const DemoIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="8"  r="4" fill="currentColor" />
    <path   d="M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const meta: Meta<typeof Tag> = {
  component: Tag,
  title:     'DataDisplay/Tag',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Non-interactive label used to categorise or annotate content. Supports six semantic types, solid and outline fill styles, two sizes, and an optional decorative icon.',
      },
    },
  },
  argTypes: {
    label:        { control: 'text' },
    size:         { control: 'radio', options: ['large', 'small'] },
    fillStyle:    { control: 'radio', options: ['solid', 'outline'] },
    type:         { control: 'select', options: ['primary', 'neutral', 'informational', 'success', 'warning', 'error'] },
    iconPosition: { control: 'radio', options: ['start', 'end'] },
    isStatic:     { control: 'boolean', table: { defaultValue: { summary: 'false' } } },
    icon:         { table: { disable: true } },
    role:         { table: { disable: true } },
    className:    { table: { disable: true } },
    'aria-label': { table: { disable: true } },
  },
  args: {
    label:        'Label',
    size:         'large',
    fillStyle:    'solid',
    type:         'primary',
    iconPosition: 'start',
    isStatic:     false,
  },
};

export default meta;
type Story = StoryObj<typeof Tag>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {};

// ─── All types ────────────────────────────────────────────────────────────────

const ALL_TYPES: TagType[] = ['primary', 'neutral', 'informational', 'success', 'warning', 'error'];

export const AllTypesSolid: Story = {
  name: 'All Types — Solid',
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {ALL_TYPES.map((type) => (
        <Tag key={type} label={type} type={type} fillStyle="solid" />
      ))}
    </div>
  ),
};

export const AllTypesOutline: Story = {
  name: 'All Types — Outline',
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {ALL_TYPES.map((type) => (
        <Tag key={type} label={type} type={type} fillStyle="outline" />
      ))}
    </div>
  ),
};

// ─── Sizes ────────────────────────────────────────────────────────────────────

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
      {(['large', 'small'] as const).map((size) => (
        <Tag key={size} label={size} size={size} />
      ))}
    </div>
  ),
};

// ─── With icons ───────────────────────────────────────────────────────────────

export const WithIconStart: Story = {
  name: 'Icon — Start',
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {ALL_TYPES.map((type) => (
        <Tag
          key={type}
          label={type}
          type={type}
          icon={<DemoIcon size={20} />}
          iconPosition="start"
        />
      ))}
    </div>
  ),
};

export const WithIconEnd: Story = {
  name: 'Icon — End',
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {ALL_TYPES.map((type) => (
        <Tag
          key={type}
          label={type}
          type={type}
          icon={<DemoIcon size={20} />}
          iconPosition="end"
        />
      ))}
    </div>
  ),
};

export const SmallWithIcon: Story = {
  name: 'Small — With Icon',
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {ALL_TYPES.map((type) => (
        <Tag
          key={type}
          label={type}
          type={type}
          size="small"
          icon={<DemoIcon size={16} />}
        />
      ))}
    </div>
  ),
};

// ─── Static (on-media) ────────────────────────────────────────────────────────

export const StaticOnMedia: Story = {
  name: 'Static — On Media',
  parameters: {
    backgrounds: { default: 'dark' },
  },
  render: () => (
    <div
      style={{
        display:         'flex',
        flexWrap:        'wrap',
        gap:             8,
        padding:         16,
        backgroundColor: '#1a2540',
        borderRadius:    12,
      }}
    >
      <Tag label="Solid" isStatic fillStyle="solid" />
      <Tag label="Outline" isStatic fillStyle="outline" />
      <Tag label="With icon" isStatic fillStyle="solid" icon={<DemoIcon size={20} />} />
    </div>
  ),
};
