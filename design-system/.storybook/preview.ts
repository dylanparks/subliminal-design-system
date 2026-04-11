import type { Preview } from '@storybook/react-vite';
import { withThemeByClassName } from '@storybook/addon-themes';
import '../src/tokens/generated/tokens.css';
import './preview.css';
import { fontFamilies } from '../src/tokens/generated/fonts';

// ─── Font load check ──────────────────────────────────────────────────────────
//
// After the browser has finished loading all declared font faces, check each
// family declared in Typography.json:
//
//   • Failed to load (not Google Fonts, not locally installed)
//     → Red error: font is completely missing for this user and everyone else.
//
//   • Loaded but not on Google Fonts (unverified — custom/purchased font)
//     → Amber warning: works locally, but other users won't have it unless
//       the font file is self-hosted.
//
// The check fires once per Storybook session and is dismissed with ×.

if (typeof document !== 'undefined' && typeof document.fonts !== 'undefined') {
  checkFontsOnLoad();
}

async function checkFontsOnLoad(): Promise<void> {
  await document.fonts.ready;

  const weights = ['400', '600', '800'];
  const missing: string[] = [];

  for (const family of fontFamilies.all) {
    const loaded = await isFontLoaded(family, weights);
    if (!loaded) missing.push(family);
  }

  // Unverified fonts that DID load — present locally but not on Google Fonts
  const localOnly = fontFamilies.unverified.filter((f) => !missing.includes(f));

  if (missing.length > 0 || localOnly.length > 0) {
    showFontWarning(missing, localOnly);
  }
}

/**
 * Explicitly triggers the browser to load the font via document.fonts.load(),
 * which works even if no element is currently using the font (avoiding false
 * negatives from lazy font loading). Falls back to document.fonts.check() for
 * system fonts, which load() returns [] for even when available.
 */
async function isFontLoaded(family: string, weights: string[]): Promise<boolean> {
  const results = await Promise.all(
    weights.map((w) =>
      document.fonts.load(`${w} 16px "${family}"`).catch(() => [] as FontFace[])
    )
  );
  if (results.some((r) => r.length > 0)) return true;
  // System fonts don't appear in load() results — check() catches them
  return weights.some((w) => document.fonts.check(`${w} 16px "${family}"`));
}

function showFontWarning(missing: string[], localOnly: string[]): void {
  if (document.getElementById('sds-font-warning')) return;

  const banner = document.createElement('div');
  banner.id = 'sds-font-warning';
  banner.setAttribute('role', 'alert');
  banner.style.cssText = [
    'position:fixed',
    'bottom:16px',
    'left:50%',
    'transform:translateX(-50%)',
    'background:#1c1c28',
    'color:#f0f0f0',
    'padding:12px 40px 12px 14px',
    'border-radius:8px',
    'font-family:system-ui,sans-serif',
    'font-size:12.5px',
    'line-height:1.6',
    'z-index:99999',
    'box-shadow:0 4px 24px rgba(0,0,0,.5)',
    'max-width:440px',
    'width:max-content',
  ].join(';');

  const rows: string[] = [];

  if (missing.length > 0) {
    banner.style.borderLeft = '3px solid #e05252';
    rows.push(
      `<strong style="color:#ff8080">✕ Font${missing.length > 1 ? 's' : ''} failed to load</strong><br>` +
      `<span style="opacity:.85">${missing.map((f) => `<em>${f}</em>`).join(', ')} — not on Google Fonts and not installed locally.<br>` +
      `Add a @font-face rule or install the font to continue.</span>`
    );
  }

  if (localOnly.length > 0) {
    if (!banner.style.borderLeft) banner.style.borderLeft = '3px solid #f5a623';
    rows.push(
      `<strong style="color:#ffd27a">⚠ Custom font${localOnly.length > 1 ? 's' : ''} detected</strong><br>` +
      `<span style="opacity:.85">${localOnly.map((f) => `<em>${f}</em>`).join(', ')} loaded from your local install.<br>` +
      `Other users need the font file or a self-hosted @font-face.</span>`
    );
  }

  const close = document.createElement('button');
  close.textContent = '×';
  close.setAttribute('aria-label', 'Dismiss font warning');
  close.style.cssText = [
    'position:absolute',
    'top:8px',
    'right:10px',
    'background:none',
    'border:none',
    'color:#999',
    'cursor:pointer',
    'font-size:18px',
    'line-height:1',
    'padding:0',
  ].join(';');
  close.onclick = () => banner.remove();

  banner.innerHTML = rows.join('<hr style="border:none;border-top:1px solid #333;margin:8px 0">');
  banner.appendChild(close);
  document.body.appendChild(banner);
}

const preview: Preview = {
  decorators: [
    withThemeByClassName({
      themes: {
        Light: '',
        Dark: 'dark',
      },
      defaultTheme: 'Light',
    }),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      // axe-core config applied to every story
      config: {},

      options: {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21aa'],
        },
      },

      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo'
    },
    chromatic: {
      // Capture every story in both themes so visual diffs and a11y checks
      // cover light and dark mode. Theme names must match withThemeByClassName keys.
      modes: {
        light: { theme: 'Light' },
        dark:  { theme: 'Dark'  },
      },
    },
  },
};

export default preview;
