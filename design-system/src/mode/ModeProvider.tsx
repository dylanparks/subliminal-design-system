import React, { createContext, useCallback, useEffect, useState } from 'react';

// ─── Terminology ──────────────────────────────────────────────────────────────
//
// A MODE is a fixed system axis that every theme supports — light/dark here. A THEME is a whole
// Brand (colours, typography, radii, borders) with a user-chosen name, applied with
// `data-sds-theme` and `--sds-brand-*` variables. This provider manages the mode only.

// ─── Types ────────────────────────────────────────────────────────────────────

export type Mode = 'light' | 'dark' | 'system';
export type ResolvedMode = 'light' | 'dark';

export interface ModeContextValue {
  /** The user's stored preference: 'light', 'dark', or 'system'. */
  mode: Mode;
  /** The mode actually applied — always 'light' or 'dark'. */
  resolvedMode: ResolvedMode;
  /** Set the mode explicitly. */
  setMode: (mode: Mode) => void;
  /**
   * Toggle between light and dark. If the current resolved mode is dark,
   * switches to light, and vice versa. Always sets an explicit value
   * (never 'system') so the toggle is predictable.
   */
  toggleMode: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

export const ModeContext = createContext<ModeContextValue | null>(null);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'sds-mode';

/**
 * The key this preference was stored under before the theme/mode rename (2026-11). Read once and
 * migrated, so visitors who already picked a mode on the live site keep it. Safe to remove once
 * that's no longer a concern.
 */
const LEGACY_STORAGE_KEY = 'sds-theme';

function getSystemMode(): ResolvedMode {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveMode(mode: Mode): ResolvedMode {
  return mode === 'system' ? getSystemMode() : mode;
}

function applyMode(resolved: ResolvedMode) {
  document.documentElement.classList.toggle('dark', resolved === 'dark');
}

const isMode = (value: string | null): value is Mode =>
  value === 'light' || value === 'dark' || value === 'system';

function readStoredMode(): Mode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isMode(stored)) return stored;

    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (isMode(legacy)) {
      localStorage.setItem(STORAGE_KEY, legacy);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      return legacy;
    }
  } catch {
    // localStorage unavailable (SSR, sandboxed iframe, etc.)
  }
  return 'system';
}

// ─── Provider ─────────────────────────────────────────────────────────────────

interface ModeProviderProps {
  children: React.ReactNode;
  /**
   * Override the default initial mode. Useful for server-side rendering or
   * Storybook where localStorage isn't the source of truth.
   */
  defaultMode?: Mode;
}

export function ModeProvider({ children, defaultMode }: ModeProviderProps) {
  const [mode, setModeState] = useState<Mode>(
    () => defaultMode ?? readStoredMode()
  );

  const resolvedMode = resolveMode(mode);

  // Apply class whenever resolved mode changes
  useEffect(() => {
    applyMode(resolvedMode);
  }, [resolvedMode]);

  // Re-resolve when OS preference changes (only relevant when mode === 'system')
  useEffect(() => {
    if (mode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyMode(resolveMode('system'));
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [mode]);

  const setMode = useCallback((next: Mode) => {
    setModeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  const toggleMode = useCallback(() => {
    setMode(resolveMode(mode) === 'dark' ? 'light' : 'dark');
  }, [mode, setMode]);

  return (
    <ModeContext.Provider value={{ mode, resolvedMode, setMode, toggleMode }}>
      {children}
    </ModeContext.Provider>
  );
}
