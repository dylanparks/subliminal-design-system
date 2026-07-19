# Changelog

All notable changes to the Subliminal Design System are documented here.

---

## [Unreleased]

### Added

#### New components
- **Accordion** (`Surfaces/Accordion`) — collapsible disclosure component built with compound components (`Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionPanel`). Supports `small` and `large` sizes, optional leading icon per trigger, `multiple` prop for allowing multiple panels open simultaneously, controlled and uncontrolled modes, and per-item `disabled` state. Panel animates open/close via `grid-template-rows` (no JS height measurement). Full ARIA support: `aria-expanded`, `aria-controls`, `role="region"`, keyboard navigation (Arrow Up/Down, Home, End). Hover/active background fills the whole card via CSS `:has()`.
- **Modal** (`Surfaces/Modal`) — dialog overlay using the native `<dialog>` element with `showModal()` for built-in focus trapping, ESC key handling, and top-layer rendering. Supports `medium` (600px) and `small` (380px) widths, optional image-header variant, optional description and children slot, up to 2 action buttons (primary filled + secondary hollow), and a dismissible close button. Responsive: bottom-sheet layout with stacked full-width actions on narrow viewports. Linked `aria-labelledby` / `aria-describedby` via `useId()` for accessible multi-instance support.
- **Notification** (`Surfaces/Notification`) — status-colored alert/status banner with `informational`, `success`, `warning`, and `error` variants. Supports `stacked` and `inline` layouts, optional description, up to 2 action buttons, and a dismissible close button. Uses `role="alert"` + `aria-live="assertive"` for error/warning and `role="status"` + `aria-live="polite"` for info/success (WCAG AA SC 4.1.3).
- **ProgressCircle** (`DataDisplay/ProgressCircle`) — circular progress indicator with determinate and indeterminate modes.
- **Pagination** (`Navigation/Pagination`) — page navigation control with first/prev/next/last and direct page input.
- **Divider** (`Enhancers/Divider`) — horizontal or vertical separator.
- **Tooltip** (`Enhancers/Tooltip`) — floating label anchored to a trigger element via Floating UI.

#### Typography utility class system
- `build-tokens.mjs` now auto-generates `src/tokens/generated/typography.css` from the existing token JSON.
- 18 utility classes produced: `.sds-text--{category}-{size}` (title × 5, subtitle × 4, body-content × 5, body-interactive × 4).
- Each class declares all 5 font properties (`font-family`, `font-size`, `font-weight`, `line-height`, `letter-spacing`) via CSS custom properties.
- Responsive token overrides in `tokens.css` automatically apply to every utility class at each breakpoint — no duplication needed.
- `preview.ts` imports `typography.css` so all Storybook stories render with correct typography.

### Changed

#### Typography refactor — all components
All 30+ components migrated from per-rule `--sds-typography-*` token declarations to the new utility classes. Impact:

- **~317 lines of CSS removed** across component stylesheets. Repeated 5-property blocks replaced by a single class name on the element.
- Floating-label state overrides (3-prop: `font-size`, `line-height`, `letter-spacing`) are preserved in component CSS where needed.
- Layout tokens that happen to use typography token values (e.g. `height: var(--sds-typography-line-height-*)` on indicator elements) are unchanged.

#### Portal-rendered menu typography
- `.sds-menu-item` now owns its `body-content-medium` typography directly in `Menu.css`. All consumers (Menu, Combobox, TimePicker, SearchField) inherit it without per-instance class declarations.
- `.sds-datepicker__day-btn` and `.sds-datepicker__grid-btn` declare typography tokens directly after `all: unset` — utility classes cannot survive an `all: unset` reset at equal cascade specificity.

### Fixed
- Combobox listbox options, TimePicker column items, and DatePicker calendar buttons were not applying the correct font family in portal-rendered contexts (appended to `document.body` outside any themed ancestor).
- DatePicker year-mode grid buttons were missing the `body-content-small` typography scale.
- `ThemeProvider` crashed on the server (`window is not defined`) whenever it resolved to the `'system'` theme during SSR — `getSystemTheme()` called `window.matchMedia` unconditionally instead of guarding for a non-browser environment the way `readStoredTheme()` already did. Found while integrating the Astro site (Phase 3), where `ThemeProvider` renders inside a server-rendered `client:load` island.
