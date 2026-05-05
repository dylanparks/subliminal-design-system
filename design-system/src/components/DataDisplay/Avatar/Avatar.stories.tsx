import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar } from './Avatar';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<typeof Avatar> = {
  component: Avatar,
  title: 'DataDisplay/Avatar',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: [
          'A circular user avatar with a three-level fallback chain:',
          '',
          '1. **Photo** — renders `src` image with `object-fit: cover`; fades in on load.',
          '2. **Initials** — shown while the image loads or when no `src` is provided.',
          '   Derived from `name` (first + last initial) or the explicit `initials` prop.',
          '   Rendered on the primary accent gradient.',
          '3. **Icon** — generic person silhouette on a neutral background;',
          '   shown when neither a photo nor initials are available.',
          '',
          'Accessibility: the root element carries `role="img"` and `aria-label` (defaults',
          'to `name`). Pass `aria-hidden` when the avatar is decorative within a component',
          'that already provides a visible label (e.g. a Profile row).',
        ].join('\n'),
      },
    },
  },
  argTypes: {
    src: {
      control: 'text',
      description: 'Image source URL.',
    },
    name: {
      control: 'text',
      description: 'Full name — derives initials and is the accessible label.',
    },
    initials: {
      control: 'text',
      description: 'Explicit initials override (max 2 characters rendered).',
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      table: { defaultValue: { summary: 'medium' } },
    },
  },
  args: {
    size: 'medium',
  },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

// ─── Initials ─────────────────────────────────────────────────────────────────

export const Initials: Story = {
  args: { name: 'Blake Pierce' },
  parameters: {
    docs: {
      description: {
        story: 'Initials derived from `name` (first + last initial) rendered on the primary accent gradient.',
      },
    },
  },
};

// ─── Explicit initials ────────────────────────────────────────────────────────

export const ExplicitInitials: Story = {
  name: 'Explicit initials',
  args: { initials: 'SDS' },
  parameters: {
    docs: {
      description: {
        story: 'The `initials` prop overrides auto-derivation from `name`. Only the first 2 characters are rendered.',
      },
    },
  },
};

// ─── Photo ────────────────────────────────────────────────────────────────────

export const Photo: Story = {
  args: {
    name: 'Evan Michaels',
    src: 'https://i.pravatar.cc/150?img=11',
  },
  parameters: {
    docs: {
      description: {
        story: 'Photo loaded from `src`. Initials show as placeholder while the image loads, then fade out.',
      },
    },
  },
};

// ─── Icon fallback ────────────────────────────────────────────────────────────

export const IconFallback: Story = {
  name: 'Icon fallback',
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'No `name`, `initials`, or `src` — shows the generic person silhouette on a neutral background.',
      },
    },
  },
};

// ─── Broken image (error fallback) ───────────────────────────────────────────

export const BrokenImage: Story = {
  name: 'Broken image → initials',
  args: {
    name: 'Ava Kim',
    src: 'https://this-url-does-not-exist.example/avatar.jpg',
  },
  parameters: {
    docs: {
      description: {
        story: 'When the image fails to load, the component falls back to initials (or the icon if no name is provided).',
      },
    },
  },
};

// ─── Sizes ────────────────────────────────────────────────────────────────────

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <Avatar name="Blake Pierce" size="small"  />
      <Avatar name="Blake Pierce" size="medium" />
      <Avatar name="Blake Pierce" size="large"  />
    </div>
  ),
  parameters: {
    docs: {
      description: { story: '`small` (32 px), `medium` (48 px), `large` (64 px).' },
    },
  },
};

// ─── All states — side by side ────────────────────────────────────────────────

export const AllStates: Story = {
  name: 'All states',
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
      {/* Photo */}
      <Avatar name="Evan Michaels" src="https://i.pravatar.cc/150?img=11" />
      {/* Initials — various names */}
      <Avatar name="Nadia Romero" />
      <Avatar name="Julian Kessler" />
      <Avatar name="Elena Voss" />
      <Avatar name="Imani Brooks" />
      <Avatar name="Claire Zhang" />
      {/* Single name → single initial */}
      <Avatar name="Soojin" />
      {/* Explicit initials */}
      <Avatar initials="SDS" />
      {/* Icon fallback */}
      <Avatar />
    </div>
  ),
};

// ─── All states × all sizes ───────────────────────────────────────────────────

export const SizeMatrix: Story = {
  name: 'Size matrix',
  render: () => {
    const sizes = ['small', 'medium', 'large'] as const;
    const rows: Array<{ label: string; props: React.ComponentProps<typeof Avatar> }> = [
      { label: 'Photo',    props: { name: 'Evan Michaels', src: 'https://i.pravatar.cc/150?img=11' } },
      { label: 'Initials', props: { name: 'Blake Pierce' } },
      { label: 'Icon',     props: {} },
    ];
    const labelStyle: React.CSSProperties = {
      fontFamily:    'var(--sds-typography-font-family-subtitle)',
      fontWeight:    'var(--sds-typography-font-weight-subtitle)',
      fontSize:      'var(--sds-typography-font-size-subtitle-small)',
      lineHeight:    'var(--sds-typography-line-height-subtitle-small)',
      letterSpacing: 'var(--sds-typography-letter-spacing-subtitle-small)',
      color:         'var(--sds-neutral-content-primary)',
    };
    return (
      <table style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ ...labelStyle, padding: '4px 12px 4px 0', textAlign: 'left' }}></th>
            {sizes.map(s => (
              <th key={s} style={{ ...labelStyle, padding: '4px 12px', textAlign: 'center' }}>{s}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ label, props }) => (
            <tr key={label}>
              <td style={{ ...labelStyle, padding: '8px 12px 8px 0' }}>{label}</td>
              {sizes.map(size => (
                <td key={size} style={{ padding: 8, textAlign: 'center' }}>
                  <Avatar {...props} size={size} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  },
};

// ─── Accessibility: aria-hidden decorative usage ─────────────────────────────

export const Decorative: Story = {
  name: 'Decorative (aria-hidden)',
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <Avatar name="Blake Pierce" aria-hidden />
      <div>
        <div style={{
          fontFamily:    'var(--sds-typography-font-family-subtitle)',
          fontWeight:    'var(--sds-typography-font-weight-subtitle)',
          fontSize:      'var(--sds-typography-font-size-subtitle-small)',
          lineHeight:    'var(--sds-typography-line-height-subtitle-small)',
          letterSpacing: 'var(--sds-typography-letter-spacing-subtitle-small)',
          color:         'var(--sds-neutral-content-primary)',
        }}>Blake Pierce</div>
        <div style={{
          fontFamily:    'var(--sds-typography-font-family-body-content)',
          fontWeight:    'var(--sds-typography-font-weight-body-content)',
          fontSize:      'var(--sds-typography-font-size-body-content-small)',
          lineHeight:    'var(--sds-typography-line-height-body-content-small)',
          letterSpacing: 'var(--sds-typography-letter-spacing-body-content-small)',
          color:         'var(--sds-neutral-content-secondary)',
        }}>Design Lead</div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'When the avatar is inside a labeled container (e.g. a Profile row with a visible name), pass `aria-hidden` to remove it from the accessibility tree — the visible text already provides the label.',
      },
    },
  },
};
