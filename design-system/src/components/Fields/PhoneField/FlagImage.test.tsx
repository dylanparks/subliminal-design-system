import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { FlagImage, hasFlag, loadFlagUrl } from './FlagImage';
import { PhoneField } from './PhoneField';
import { COUNTRIES, getFlagCode } from './countries';

// The src format depends on the environment (dev-server URL, inlined data: URI in Vitest and
// the library build), so compare against importing the same file directly.
const expectedSrc = (size: 'l' | 'm', code: string) =>
  import(`@sds-flagpack-flags/${size}/${code}.svg?url`).then(m => m.default as string);

describe('FlagImage — bundled flags', () => {
  it('bundles a flag for every country PhoneField can show, in both sizes', () => {
    const missing = COUNTRIES.flatMap(c =>
      (['l', 'm'] as const)
        .filter(size => !hasFlag(getFlagCode(c.code), size))
        .map(size => `${size}/${getFlagCode(c.code)}`),
    );
    expect(missing).toEqual([]);
  });

  it('resolves a module URL for the SVG, not a /flags/ path the host must serve', async () => {
    const url = await loadFlagUrl('US', 'm');
    expect(url).toBe(await expectedSrc('m', 'US'));
    expect(url).not.toMatch(/^\/flags\//);
  });

  it('resolves undefined for an unknown code', async () => {
    expect(hasFlag('ZZ', 'm')).toBe(false);
    await expect(loadFlagUrl('ZZ', 'm')).resolves.toBeUndefined();
  });

  it('renders react-flagpack-compatible markup with a decorative image', async () => {
    const { container } = render(<FlagImage code="GB-UKM" size="l" />);
    const box = container.querySelector('.flag')!;
    expect(box.tagName).toBe('SPAN');
    expect(box).toHaveClass('flag', 'size-l', 'border', 'border-radius');
    await waitFor(() => expect(box.querySelector('img')).toBeInTheDocument());
    const img = box.querySelector('img')!;
    expect(img).toHaveAttribute('alt', '');
    expect(img.getAttribute('src')).toBe(await expectedSrc('l', 'GB-UKM'));
  });

  it('renders an empty flag box (no broken image) for an unknown code', async () => {
    const { container } = render(<FlagImage code="ZZ" size="m" />);
    await loadFlagUrl('ZZ', 'm');
    expect(container.querySelector('.flag')).toBeInTheDocument();
    expect(container.querySelector('.flag img')).not.toBeInTheDocument();
  });
});

describe('PhoneField — flags', () => {
  it('shows the selected country flag from the bundled assets', async () => {
    const { container } = render(<PhoneField label="Phone" defaultCountry="US" />);
    const trigger = container.querySelector('.sds-phone-field__country-flag')!;
    await waitFor(() => expect(trigger.querySelector('.flag img')).toBeInTheDocument());
    const src = trigger.querySelector('.flag img')!.getAttribute('src')!;
    expect(src).toBe(await expectedSrc('l', 'US'));
    expect(src).not.toMatch(/^\/flags\//);
  });

  it('uses the medium flag for each country in the menu', async () => {
    const user = userEvent.setup();
    render(<PhoneField label="Phone" defaultCountry="US" />);
    await user.click(screen.getByRole('combobox'));
    const menu = screen.getByRole('menu');
    await waitFor(() => {
      expect(menu.querySelectorAll('.flag.size-m img')).toHaveLength(COUNTRIES.length);
    });
    const gb = screen.getByRole('menuitemradio', { name: /United Kingdom/ });
    expect(gb.querySelector('.flag img')!.getAttribute('src')).toBe(await expectedSrc('m', 'GB-UKM'));
  });
});
