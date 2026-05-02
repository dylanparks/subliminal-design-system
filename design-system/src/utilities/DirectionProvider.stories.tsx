import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { DirectionProvider } from './DirectionProvider';
import { useDirection } from './useDirection';
import type { Direction } from './DirectionProvider';

const meta: Meta = {
  title: 'Utilities/DirectionProvider',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: [
          'Sets the active text direction (`ltr` / `rtl`) for the application.',
          '',
          'Applies `dir` to `document.documentElement` so that CSS logical properties',
          '(`padding-inline-start`, `text-align: start`) and `[dir="rtl"]` selectors',
          'resolve correctly throughout the tree. Also exposes the value via React',
          'context so components can read it with `useDirection()` without touching the DOM.',
          '',
          '```tsx',
          "import { DirectionProvider } from '@sds/utilities';",
          '',
          'function App() {',
          "  return <DirectionProvider dir='rtl'><YourApp /></DirectionProvider>;",
          '}',
          '```',
        ].join('\n'),
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Demo component ───────────────────────────────────────────────────────────

function DirectionReadout() {
  const dir = useDirection();
  return (
    <div style={{ fontFamily: 'monospace', fontSize: 14, padding: '8px 12px', background: 'var(--sds-neutral-background-subtle, #e1e6f0)', borderRadius: 8, display: 'inline-block' }}>
      useDirection() → <strong>"{dir}"</strong>
    </div>
  );
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Controlled: Story = {
  name: 'Controlled direction toggle',
  render: () => {
    const [dir, setDir] = useState<Direction>('ltr');
    return (
      <DirectionProvider dir={dir}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['ltr', 'rtl'] as Direction[]).map((d) => (
              <button
                key={d}
                onClick={() => setDir(d)}
                style={{
                  padding: '6px 16px',
                  borderRadius: 8,
                  border: '2px solid',
                  borderColor: dir === d ? '#3e5cff' : '#ccc',
                  background: dir === d ? '#f0f2ff' : 'transparent',
                  color: dir === d ? '#3e5cff' : 'inherit',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                {d.toUpperCase()}
              </button>
            ))}
          </div>
          <DirectionReadout />
          <p style={{ textAlign: 'start', margin: 0 }}>
            This paragraph uses <code>text-align: start</code> — it follows the active direction.
          </p>
        </div>
      </DirectionProvider>
    );
  },
};

export const UseDirectionHook: Story = {
  name: 'useDirection() outside provider (fallback)',
  render: () => <DirectionReadout />,
  parameters: {
    docs: {
      description: {
        story: 'When called outside a `<DirectionProvider>`, `useDirection()` safely returns `"ltr"` — no error thrown.',
      },
    },
  },
};
