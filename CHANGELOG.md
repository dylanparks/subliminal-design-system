# Changelog

All notable changes to the Subliminal Design System are documented here.

---

## [Unreleased]

### Changed

#### Privacy policy page
- New `/privacy` page (Subliminal Design System LLC; written for visitors in the EU/UK, California and
  Virginia) and a footer link. Stylesheets are now always separate files (`inlineStylesheets: 'never'`), so
  editing a page's CSS no longer changes the CSP's style hash.
- The policy states that the site loads no third-party fonts or scripts, which is true once the
  self-hosted fonts below are deployed: publish them together. Update the policy before adding
  analytics, a newsletter, or accounts.

#### No requests to Google: self-hosted fonts and SVG file icons
- **Breaking:** `tokens.css` no longer `@import`s the brand fonts from Google. They moved to a new,
  optional `subliminal-design-system/fonts.css` (the `sds-build-tokens` CLI writes it too). Import it
  to keep the old behaviour, or self-host Manrope and Work Sans. Before, every visitor's browser
  contacted Google just because the design system was installed.
- The docs site self-hosts both fonts (Latin subset, `site/public/fonts/`, with their OFL licences), and
  its CSP no longer allows Google. A browser load of the built page makes no request to any other
  origin, and both fonts load from the site.
- `FileUploadItem` draws file-type icons as SVGs (the same Material Symbols Rounded glyphs) instead of
  the Material Symbols icon font, so it no longer imports a font from Google either.

#### Security hardening
- **Dependencies:** `npm audit` went from 28 findings (3 critical, 12 high) to 7 moderate ones, all in
  Storybook's development tooling. `adm-zip`, which `sds-build-tokens` uses to open a ZIP, is on the
  patched 0.6.1 (a crafted ZIP could allocate 4 GB or overwrite files through symlinks). Astro,
  Storybook, Vite and Vitest moved to patched minor versions. All stories render identically and the
  CLI output is byte-identical.
- **The site's Content-Security-Policy is now enforced at build time** (`site/scripts/check-csp.mjs`).
  It pins inline scripts and styles by hash, and the Astro upgrade changed Astro's own inline
  hydration scripts: with the old hashes the browser blocked them and the page's interactive parts
  stopped working. The hashes are updated, and the build now fails if they ever go stale.
- New headers: `Cross-Origin-Opener-Policy` and `Cross-Origin-Resource-Policy` (`same-origin`).
- Added `SECURITY.md`, weekly Dependabot updates, and least-privilege (`contents: read`)
  permissions on the Chromatic workflow.

#### FileUpload matches the other fields (Phase T.3)
- **Visual change:** the drop zone's border is the Field border (`--sds-border-thickness-field-large`, 2px) instead of
  1px, so the zone is 2px taller. It gets the Fields hover fill as well as the hover stroke, and
  keyboard focus shows the focus ring alone, as in Figma's File Upload. Dragging a file over keeps the
  ring plus the hover look.

#### Type classes are built from Figma's text styles (Phase T.3)
- Relay 0.6.0 exports Figma's text styles (`text-styles.json`) with the variable bound to each
  field. `build:tokens` builds each `.sds-text--*` class from those bindings. With the current
  export the generated `typography.css` is byte-identical to before; the difference is that
  re-hooking a style to another variable in Figma now changes the class with no other edit.
- The build fails if a text style has an unbound field, a Font size variable has no text style, or
  a style is bound to a variable the export doesn't contain. Without `text-styles.json` it infers the
  classes from the Font size names as before.
- The `text-styles.json` committed here was produced by running Relay's extraction against the live
  Figma file, not by the plugin UI; replace it with the next real export.

#### Five breakpoints: XL, LG, MD, SM, XS (Phase T.3)
- Figma's Breakpoint collection now has five modes. Each applies from its own width up to the next
  wider one, in `em` so it follows the reader's font size: **XL** ≥ 1536px (the default), **LG**
  1200–1535px, **MD** 768–1199px, **SM** 576–767px, **XS** below 576px. Adding or moving a
  breakpoint in Figma needs no code change.
- **Visual change:** the MD layout used to start below 1440px and now starts below 1200px, so
  between 1200px and 1439px wide the larger XL/LG type sizes apply (for example titles at 64px,
  not 56px). The new SM layout (below 768px) has the same type sizes as before for those widths; XS differs
  from SM only in its viewport variables.
- Modal's mobile layout now applies below the MD breakpoint (768px) and its test follows Figma's
  MD width.

#### Token names follow the kebab-case standard; Tag matches Figma's badge (Phase T.3)
- **Breaking, renamed CSS variables** (Figma renamed them; the build follows mechanically):

  | Before | After |
  |---|---|
  | `--sds-effects-focusring` | `--sds-effects-focus-ring` |
  | `--sds-effects-overlaysolid` | `--sds-effects-overlay-solid` |
  | `--sds-accents-solid-primaryweak` | `--sds-accents-solid-primary-weak` |
  | `--sds-accents-gradient-primarystart` | `--sds-accents-gradient-primary-start` |
  | `--sds-accents-gradient-primaryend` | `--sds-accents-gradient-primary-end` |
  | `--sds-effects-elevatedshadow-{blur,spread,x,y}` | `--sds-effects-elevated-shadow-{blur,spread,x,y}` |
  | `--sds-mix-effects-focusring` / `-overlaysolid` / `-accents-solid-primaryweak` | the same renames |

  The TypeScript token keys follow (`focusring` → `"focus-ring"`, `elevatedshadow` →
  `"elevated-shadow"`, and so on). The `Images/Dark-images` flag is renamed in Figma too, but it
  isn't emitted.
- **Visual change, Modal:** the mobile bottom-sheet layout applies below the MD breakpoint
  (768px, `48em`) instead of below 600px, so it follows Figma's breakpoints. A test fails if
  Modal's query ever differs from the breakpoint in `tokens.css`.
- New token `--sds-accents-solid-primary-stroke` (the brand accent at 30%, with an optional
  `--sds-mix-accents-solid-primary-stroke`).
- **Visual change, Tag:** the outline border is 1px (`--sds-border-thickness-data-badge`) instead of
  2px. Primary Tags use `--sds-accents-solid-primary-weak` for the fill and
  `--sds-accents-solid-primary` for the text; primary outline Tags also get that fill and
  `--sds-accents-solid-primary-stroke` for the border. Static outline Tags use
  `--sds-neutral-stroke-static-default` for the border. All as in Figma's Badges.

#### Radio indicator matches Figma's size (Phase T.3)
- **Visual change:** the Radio indicator is 24px (large) and 20px (medium) instead of 22px and
  18px, with an inner dot of 10px and 8px instead of 8px and 6px, as in Figma. It uses
  `--sds-size-custom-radio-large` / `--sds-size-custom-radio-medium`, so a theme can change it.

#### Component sizes and borders use tokens and rem (Phase T.3)
- **No visual change at default settings.** Every component story renders pixel-identical to
  before (201 of 211 stories compared; the rest are either not renderable offline or vary between
  runs on the old build too, and behave the same on the new one), and every changed CSS
  declaration resolves to the same value as before.
- Border widths use the Border-thickness tokens: field borders by size
  (`--sds-border-thickness-field-{large,medium,small}`), dropdown panels, Tooltip, Popover, Toast
  and Modal (`neutral-elevated`), Tabs (`neutral-divider`), Button, ButtonGroup, Stepper and
  Breadcrumbs (`interactive-*`), and the Checkbox, Radio and Toggle indicators
  (`interactive-secondary-inactive`). ButtonGroup's border-overlap margin follows its border.
  A theme can now change these, per field size.
- Control sizes use the Figma size tokens: `--sds-size-xsmall` (Stepper buttons, Pagination,
  Breadcrumbs overflow), `--sds-size-small` (small Combobox) and the `--sds-size-custom-*`
  tokens (Checkbox and Toggle indicators, Rating star, Slider thumb and track, ProgressBar track).
- Every other `px` length in component CSS is `rem` (÷ 16), so components scale with the reader's
  browser font size like the type does. Hairlines (1–2px widths and heights, borders, rings and
  outline offsets) and fully round radii stay `px`. Pagination's sliding indicator now measures the
  button's padding instead of assuming 8px. Modal's mobile layout switches below `37.5em` (600px
  at the default size) instead of `max-width: 599px`, so it follows the font size too.

#### Focus rings, button labels and effect styles follow Figma (Phase T.3)
- New token `--sds-border-thickness-focus-ring` (Brand › Border-thickness › Focus-ring, 4px).
  Every component's focus ring uses it: plain rings via the Focus effect style
  (`--sds-effect-interactive-element-focus-box-shadow`), outlines and inset rings via the width
  token directly. **Visual change:** ButtonGroup, Stepper, Popover, Toast, PasswordField and the
  Menu toggle zone go from 3px to 4px; DatePicker and PhoneField from 2px to 4px. The unused
  `.sds-checkbox-indicator--focus-ring` hook goes from 6px to 4px.
- Effect-style variables (`--sds-effect-*`) now reference the variables their values are linked to
  in Figma instead of fixed values, and are re-declared on `[data-sds-theme]` and
  `[data-sds-mode]` sections, so they follow the theme and mode. **Visual change:** in dark mode,
  Tooltip, Popover, Modal and Toast no longer show a drop shadow; Figma's Darkmode sets the
  elevated-shadow sizes to 0, which Menu, DatePicker, Combobox, SearchField and TimePicker
  already followed.
- **Visual change:** Medium Button and ButtonGroup labels use `interactive-medium` (16/24px)
  instead of `interactive-large` (20/32px), as in Figma.
- **Visual change:** Large Button labels use `interactive-large` (20/32px) instead of
  `interactive-huge` (24/36px); Figma's Large buttons all use Interactive/Large.
- **Visual change:** selected options in Menu (so Select, Combobox, Phone Field and Time Picker
  lists too) and the selected day or month in Date Picker now use the whole Interactive style,
  including its Manrope family. Before, only the weight and letter-spacing changed, so the text
  stayed in Work Sans.
- **Visual change:** the ProgressBar validation message uses `content-xsmall` (12px) instead of
  `content-small` (14px).
- **Breaking:** ButtonGroup no longer has a `large` size (`ButtonGroupSize` is now
  `'xsmall' | 'small' | 'medium'`); Figma's Button Group only has those three.

#### Colour tokens derive from Brand at runtime (Phase T.2.1)
- `tokens.css` now has a **Brand layer**: `--sds-brand-light-*` and `--sds-brand-dark-*`, both
  palettes, mirroring the Figma Brand collection. Intent colours are no longer baked hex values;
  they're formulas over Brand, e.g.
  `color-mix(in srgb, var(--sds-brand-light-primary) var(--sds-mix-interactive-primary-filled-background-hover, 93%), transparent)`.
  **Rebrand by overriding `--sds-brand-*`. No rebuild needed.**
- Every composed state has an optional `--sds-mix-<token>` variable. Set one (e.g. `80%`) to
  retune that state's opacity in both modes.
- **Themes and modes, scoped to any section (Phase T.2.4).** Two independent hooks:
  - **Theme** = a whole Brand, user-named. Put `data-sds-theme="<name>"` on any element and set
    `--sds-brand-*` (and optionally `--sds-mix-*`) on it; everything inside re-themes.
  - **Mode** = a fixed system axis (light/dark). Put `data-sds-mode="light|dark"` on any element.
    `.dark` still works; it is what ModeProvider sets on `<html>`.

  They nest freely: a theme on a dark page, dark inside a theme, a light section inside a dark page
  inside a theme. Intent tokens use CSS `light-dark()`, which resolves on the element using the
  colour, from its inherited `color-scheme`. **This requires browsers from mid-2024 onward**
  (Chrome 123, Firefox 120, Safari 17.5); `color-mix()` alone needed 2023 browsers.
- Modes now set `color-scheme`, so **native scrollbars and form controls follow the mode** (dark
  in dark mode). Previously nothing set it.
- `build-tokens.mjs` reads colours from a Brand-layer Relay export (≥ 0.5.0) and fails the build,
  rather than guessing, if an intent colour doesn't derive from Brand, a Brand colour is
  translucent, or a mode uses the other palette. Style Dictionary is no longer used for colours.
- New `brandTokens` export in `tokens.ts` (typed `var(--sds-brand-…)` references).
- **Visual change:** colours now follow the redesigned Figma file. 112 of the 169 pre-existing
  light-mode intent tokens render differently, including the focus ring (`#8f9fbf` → `#7a8fff`).

### Removed / renamed (breaking)

#### Theme vs Mode: names now follow the terminology
A **theme** is a whole Brand (colours, typography, radii, borders) with a user-chosen name. A
**mode** is a fixed system axis that every theme supports (light/dark). The provider that switches
light/dark was named for themes, so it's been renamed to say what it does:

| Before | After |
| --- | --- |
| `ThemeProvider` (prop `defaultTheme`) | `ModeProvider` (prop `defaultMode`) |
| `useTheme()` → `{ theme, resolvedTheme, setTheme, toggleTheme }` | `useMode()` → `{ mode, resolvedMode, setMode, toggleMode }` |
| types `Theme`, `ResolvedTheme`, `ThemeContextValue`; `ThemeContext` | `Mode`, `ResolvedMode`, `ModeContextValue`; `ModeContext` |
| `src/theme/` | `src/mode/` |
| localStorage key `sds-theme` | `sds-mode`. The old key is still read once and migrated, so a stored preference survives the rename. |

Behaviour is unchanged: it still toggles `.dark` on `<html>`. On the site, `ThemeToggle` /
`theme-init.js` are now `ModeToggle` / `mode-init.js`.

#### Radius, size, border and typography come from the Brand-layer export (Phase T.2.2)
Names are now a mechanical translation of the Figma path, without the collection name (the
shortest form, since developers type these).

| Before | After | Figma source |
| --- | --- | --- |
| `--sds-shape-border-radius-{xxsmall…xlarge,round}` | `--sds-radius-{…}` | `Brand/Radius/*` |
| `--sds-shape-border-radius-display-{small,medium,large}` | `--sds-radius-cards-{small,medium,large}` | `Brand/Radius/Cards/*` |
| `--sds-spacing-size-{xsmall…large}` | `--sds-size-{xsmall…large}` | `Brand/Size/*` |
| `--sds-typography-*-body-content-*` | `--sds-typography-*-content-*` | `Brand` / `Breakpoint` › Typography |
| `--sds-typography-*-body-interactive-*` | `--sds-typography-*-interactive-*` | |
| `.sds-text--body-content-*` | `.sds-text--content-*` | |
| `.sds-text--body-interactive-*` | `.sds-text--interactive-*` | |
| `--sds-effect-interactive-element-elevated-box-shadow` | `--sds-effect-static-element-elevated-box-shadow` | effect style moved in Figma |

`title` / `subtitle` names and `--sds-viewport-width` / `-x-padding` are unchanged.

- **New:** `--sds-border-thickness-*` (14), `--sds-size-custom-*` (slider, checkbox, toggle, radio,
  progress bar, rating star), `--sds-viewport-min-height`.
- **Themeable:** every Brand value above can be overridden on a `[data-sds-theme]` element.
- **Font families include a fallback**, e.g. `"Work Sans", ui-sans-serif, system-ui, sans-serif`.
- `tokens.ts`: `shapeTokens` / `spacingTokens` / `breakpointTokens` are replaced by `radiusTokens`,
  `sizeTokens`, `borderThicknessTokens`, `viewportTokens`; `typographyTokens` follows the new names.
- **Visual change:** letter-spacing tightens throughout (e.g. `interactive-medium` +0.2px → −0.5px,
  `content-huge` −0.5px → −1.5px) and subtitles go from weight 600 to 700. Font sizes and line
  heights are unchanged. `interactive` text no longer switches to Work Sans below 1440px: the
  typeface is a Brand decision, not a breakpoint one.
- The build **fails** if a type style is missing any of its five properties. The old generator
  silently left it out, which is how a line height could disappear unnoticed.
- Each narrower breakpoint now overrides relative to the next-wider one, not to the default. No
  current value was affected, but a value that returned to the default at the narrowest width
  would previously have shown the middle breakpoint's value on phones.
- Float noise is rounded in effect-style values too (`0.10000000149011612` → `0.1`).
- `build-tokens.mjs` reads **only** the Brand-layer export now; the legacy files in
  `src/tokens/default-values/` are no longer used.

#### Sizes follow the reader's font-size setting: rem and em (Phase T.2.5)
Figma stays in px; the build converts with a fixed rule (px ÷ 16), so names still map mechanically.

- **rem:** font size, line height, letter-spacing, `--sds-size-*`, `--sds-radius-*`. Someone who sets
  their browser to 20px text now gets 20px labels in 45px-tall controls, not 16px in 36px.
- **px, deliberately:** border thickness (hairlines shouldn't scale to blurry fractions),
  `--sds-radius-round` (999px only means "fully round"), and `--sds-viewport-*` (Figma frame sizes).
- **Breakpoints are em, in range syntax** (`@media (width < 90em)`), which is exact where
  `max-width: 1439px` was off by one. At a larger text setting the layout moves to the narrower
  breakpoint sooner, so bigger text gets the room it needs.
- **No visual change at default settings.** Every scale value computes to exactly the same px as
  before, verified at all three breakpoint widths.

#### Cutover: the Brand-layer export is the only token input (Phase T.2.3)
- **`npx sds-build-tokens` now ships.** `package.json` `files` listed only `dist`, so the CLI's
  entry point was missing from the published package. It now includes `build-tokens.mjs` and its
  three modules. Verified by installing the packed tarball into an empty project and building from
  a real Relay ZIP; the output is byte-identical to the repo's.
- **`--output` is required when run from an installed package.** The default pointed inside the
  package, so tokens would have been written into `node_modules` and wiped on the next install.
  Without `--input` or a `subliminal-tokens*.zip` in the current directory, the CLI now explains how
  to export instead of looking for files that don't ship.
- Removed `src/tokens/default-values/` (the legacy 12-collection export, unused since T.2.2) and the
  `style-dictionary` dependency (unused since T.2.1). That's 92 fewer packages for consumers to install.
- README "Token Pipeline" section rewritten for the four collections, runtime derivation, themes
  vs modes, and the consumer CLI.

#### Token variables

- `--sds-effects-focus` → `--sds-effects-focusring`
- `--sds-effects-shadowdefault` → `--sds-effects-dropshadow-elevated` (the 10% elevation shadow;
  `--sds-effects-dropshadow-default` is the 0% interactive-state shadow and is *not* a replacement)
- `--sds-effects-values-elevated-{blur,spread,x,y}` → `--sds-effects-elevatedshadow-{blur,spread,x,y}`
- `--sds-effects-shadowcallout` → `--sds-effects-dropshadow-callout` (now 30% Brand Shadow, was opaque)
- `--sds-utility-transparent` removed (use `transparent`)
- New: `--sds-effects-dropshadow-{default,hover,active,disabled}`

### Added

#### Library build (npm publish readiness)
- `npm run build:lib` (Vite lib mode, `vite.lib.config.ts`) produces a real publishable package
  in `design-system/dist/`: a single ESM bundle (`index.js`), rolled TypeScript declarations,
  and three separate CSS files (`style.css` for component rules, `tokens.css`, `typography.css`).
  `react`/`react-dom` and every other real dependency are externalized, not bundled.
- New `package.json` `exports` map: `subliminal-design-system` (components + mode + utilities +
  typed tokens), `subliminal-design-system/style.css`, `/tokens.css`, `/typography.css`.
  `react`/`react-dom` moved from `dependencies` to `peerDependencies` (correct for a library —
  prevents consumers from getting a duplicate React instance).
- Package metadata: `license` (MIT), `repository`, `keywords`, `description`, `sideEffects: false`
  (enables consumer-side tree-shaking), `files: ["dist"]`.
- New `design-system/src/lib.ts` — the library's public entry point, distinct from the existing
  CRA demo app entry (`src/index.tsx`), which is not included in the published package.
- Root-level `npm run build:site` script — builds `design-system`'s library **before** `site`'s
  build, now required since `site` consumes the real package exports instead of deep source
  paths. **Deploy-affecting:** the Cloudflare Worker's dashboard Build command must change from
  `npm run build -w site` to `npm run build:site`.

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
- `Tooltip` and `Toast` failed to type-check (`useRef<T>()` called with no initial value) under current `@types/react` — both now explicitly initialize with `undefined`. `PhoneField`'s country-selector `<button>` set an `autoComplete="country"` attribute that isn't valid on `<button>` elements and had no actual effect in any browser (autocomplete only applies to form input elements) — removed. Found while generating TypeScript declarations for the npm package build (Phase 2.0); these type errors would have failed the existing `npm run build` script too.
