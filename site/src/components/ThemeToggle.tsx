import { ThemeProvider, useTheme, Button } from 'subliminal-design-system';

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
