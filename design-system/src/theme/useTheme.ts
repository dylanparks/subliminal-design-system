import { useContext } from 'react';
import { ThemeContext, ThemeContextValue } from './ThemeProvider';

/**
 * Returns the current theme state and controls.
 *
 * Must be used inside a <ThemeProvider>.
 *
 * @example
 * // Toggle on a button
 * const { toggleTheme, resolvedTheme } = useTheme();
 * <button onClick={toggleTheme}>
 *   {resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'}
 * </button>
 *
 * @example
 * // Explicit set from a select / settings page
 * const { theme, setTheme } = useTheme();
 * <select value={theme} onChange={e => setTheme(e.target.value as Theme)}>
 *   <option value="light">Light</option>
 *   <option value="dark">Dark</option>
 *   <option value="system">System</option>
 * </select>
 */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a <ThemeProvider>.');
  }
  return ctx;
}
