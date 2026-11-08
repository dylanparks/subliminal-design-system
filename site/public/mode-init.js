// Applies the stored/system mode (light/dark) before paint, so the page doesn't flash the wrong
// mode while ModeToggle's island is still hydrating. Mirrors the resolution logic in
// design-system/src/mode/ModeProvider.tsx (same 'sds-mode' localStorage key; 'sds-theme' is the
// pre-rename key, read as a fallback — ModeProvider migrates it on hydration).
// Kept as an external file (not inline) so it's covered by CSP's script-src 'self' — see
// site/public/_headers.
(function () {
  try {
    var stored = localStorage.getItem('sds-mode') || localStorage.getItem('sds-theme');
    var mode = stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
    var resolved = mode === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : mode;
    document.documentElement.classList.toggle('dark', resolved === 'dark');
  } catch (e) {}
})();
