import { createContext, useEffect } from 'react';
import type { ReactNode } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Direction = 'ltr' | 'rtl';

export interface DirectionContextValue {
  /** The active text direction. */
  dir: Direction;
}

// ─── Context ──────────────────────────────────────────────────────────────────

export const DirectionContext = createContext<DirectionContextValue>({ dir: 'ltr' });

// ─── Provider ─────────────────────────────────────────────────────────────────

export interface DirectionProviderProps {
  /** Text direction to apply. @default 'ltr' */
  dir: Direction;
  children: ReactNode;
}

/**
 * Sets the active text direction for the application.
 *
 * Mirrors the pattern of `ThemeProvider` — applies the `dir` attribute to
 * `document.documentElement` so that CSS `[dir="rtl"]` selectors and logical
 * properties (`padding-inline-start`, `text-align: start`, etc.) resolve
 * correctly throughout the component tree.
 *
 * Also exposes the direction value via React context so components and hooks
 * can read it without querying the DOM.
 *
 * @example
 * // Root-level (most common)
 * <DirectionProvider dir="rtl">
 *   <App />
 * </DirectionProvider>
 *
 * @example
 * // Controlled by user preference
 * const [dir, setDir] = useState<Direction>('ltr');
 * <DirectionProvider dir={dir}>
 *   <App />
 * </DirectionProvider>
 */
export function DirectionProvider({ dir, children }: DirectionProviderProps) {
  useEffect(() => {
    document.documentElement.dir = dir;
  }, [dir]);

  return (
    <DirectionContext.Provider value={{ dir }}>
      {children}
    </DirectionContext.Provider>
  );
}
