import { ModeProvider, useMode, Button } from 'subliminal-design-system';

function ToggleButton() {
  const { resolvedMode, toggleMode } = useMode();

  return (
    <Button
      label={resolvedMode === 'dark' ? 'Dark' : 'Light'}
      variant="secondary"
      fillStyle="ghost"
      size="small"
      onClick={toggleMode}
      aria-label={resolvedMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    />
  );
}

export default function ModeToggle() {
  return (
    <ModeProvider>
      <ToggleButton />
    </ModeProvider>
  );
}
