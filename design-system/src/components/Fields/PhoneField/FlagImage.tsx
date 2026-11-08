import { useEffect, useState } from 'react';

// ─── Bundled flag assets ──────────────────────────────────────────────────────
//
// react-flagpack's own <Flag> renders <img src="/flags/{size}/{code}.svg">, which only works if
// the host app serves those files at /flags. Instead, PhoneField imports the SVGs as modules so
// they ship with the component and work wherever it is imported.
//
// `@sds-flagpack-flags` is a Vite alias for react-flagpack/dist/flags (see vite.flagpack.ts).
// The glob is lazy: each flag is its own tiny chunk, loaded only when that flag is rendered,
// so importing PhoneField never pulls in all ~500 SVGs up front. Only the sizes PhoneField uses
// (l, m) and the codes it can produce (ISO alpha-2, plus GB-UKM — see getFlagCode) are included.

export type FlagSize = 'l' | 'm';

const loaders = import.meta.glob<string>(
  '@sds-flagpack-flags/{l,m}/{[A-Z][A-Z],GB-UKM}.svg',
  { query: '?url', import: 'default' },
);

const loaderByKey = new Map<string, () => Promise<string>>();
for (const [file, load] of Object.entries(loaders)) {
  const match = /\/(l|m)\/([A-Z-]+)\.svg$/.exec(file);
  if (match) loaderByKey.set(`${match[1]}/${match[2]}`, load);
}

const resolved = new Map<string, string>();
const pending  = new Map<string, Promise<string | undefined>>();

/** Whether a bundled flag exists for this flagpack code and size. */
export function hasFlag(code: string, size: FlagSize): boolean {
  return loaderByKey.has(`${size}/${code}`);
}

/** Resolves the URL of a bundled flag, or undefined if there is no flag for the code. */
export function loadFlagUrl(code: string, size: FlagSize): Promise<string | undefined> {
  const key = `${size}/${code}`;
  const hit = resolved.get(key);
  if (hit) return Promise.resolve(hit);

  let promise = pending.get(key);
  if (!promise) {
    const load = loaderByKey.get(key);
    promise = load
      ? load().then(url => { resolved.set(key, url); return url; })
      : Promise.resolve(undefined);
    promise.finally(() => pending.delete(key));
    pending.set(key, promise);
  }
  return promise;
}

// ─── FlagImage ────────────────────────────────────────────────────────────────

export interface FlagImageProps {
  /** Flagpack flag code (ISO alpha-2, or an override from getFlagCode such as GB-UKM) */
  code: string;
  /** l = 32×24px · m = 20×15px */
  size: FlagSize;
}

/**
 * Decorative country flag. Renders the same `.flag.size-* .border .border-radius` markup as
 * react-flagpack's <Flag> (styled by react-flagpack/dist/style.css), but with a bundled image
 * source. The wrapper is a <span> so it is valid inside PhoneField's <button>.
 */
export function FlagImage({ code, size }: FlagImageProps) {
  const key = `${size}/${code}`;
  const [src, setSrc] = useState<string | undefined>(() => resolved.get(key));

  useEffect(() => {
    let live = true;
    setSrc(resolved.get(key));
    loadFlagUrl(code, size).then(url => { if (live) setSrc(url); });
    return () => { live = false; };
  }, [key, code, size]);

  return (
    <span className={`flag size-${size} border border-radius`}>
      {src && <img src={src} alt="" />}
    </span>
  );
}
