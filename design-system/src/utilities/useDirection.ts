import { useContext } from 'react';
import { DirectionContext } from './DirectionProvider';
import type { Direction } from './DirectionProvider';

/**
 * Returns the current text direction set by the nearest `<DirectionProvider>`.
 *
 * Falls back to `'ltr'` when used outside a provider — safe to call anywhere.
 *
 * @example
 * function Chevron() {
 *   const dir = useDirection();
 *   return <ChevronIcon style={{ transform: dir === 'rtl' ? 'scaleX(-1)' : 'none' }} />;
 * }
 */
export function useDirection(): Direction {
  return useContext(DirectionContext).dir;
}
