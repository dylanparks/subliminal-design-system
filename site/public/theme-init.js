// Applies the stored/system theme before paint, so the page doesn't flash the wrong theme
// while ThemeToggle's island is still hydrating. Mirrors the resolution logic in
// design-system/src/theme/ThemeProvider.tsx (same 'sds-theme' localStorage key).
// Kept as an external file (not inline) so it's covered by CSP's script-src 'self' — see
// site/public/_headers.
(function () {
  try {
    var stored = localStorage.getItem('sds-theme');
    var theme = stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
    var resolved = theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;
    document.documentElement.classList.toggle('dark', resolved === 'dark');
  } catch (e) {}
})();
