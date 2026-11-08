import { useContext } from 'react';
import { ModeContext, ModeContextValue } from './ModeProvider';

/**
 * Returns the current mode (light/dark) and controls.
 *
 * Must be used inside a <ModeProvider>.
 *
 * @example
 * // Toggle on a button
 * const { toggleMode, resolvedMode } = useMode();
 * <button onClick={toggleMode}>
 *   {resolvedMode === 'dark' ? 'Light mode' : 'Dark mode'}
 * </button>
 *
 * @example
 * // Explicit set from a select / settings page
 * const { mode, setMode } = useMode();
 * <select value={mode} onChange={e => setMode(e.target.value as Mode)}>
 *   <option value="light">Light</option>
 *   <option value="dark">Dark</option>
 *   <option value="system">System</option>
 * </select>
 */
export function useMode(): ModeContextValue {
  const ctx = useContext(ModeContext);
  if (!ctx) {
    throw new Error('useMode must be used within a <ModeProvider>.');
  }
  return ctx;
}
