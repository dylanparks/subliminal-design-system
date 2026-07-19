import { ThemeProvider, useTheme } from 'subliminal-design-system/src/theme';
import { Button } from 'subliminal-design-system/src/components/Actions/Button/Button';

function ToggleButton() {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <Button
      label={resolvedTheme === 'dark' ? 'Dark' : 'Light'}
      variant="secondary"
      fillStyle="ghost"
      size="small"
      onClick={toggleTheme}
      aria-label={resolvedTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
    />
  );
}

export default function ThemeToggle() {
  return (
    <ThemeProvider>
      <ToggleButton />
    </ThemeProvider>
  );
}
