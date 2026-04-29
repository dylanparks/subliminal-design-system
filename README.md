# Subliminal Design System

A component library and design token pipeline built for product teams. Subliminal provides a cohesive set of accessible, themeable React components backed by a Figma-driven token system — bridging design and engineering with a single source of truth.

## Stack

- **React 19** + **TypeScript**
- **Vite** — dev server and build tool
- **Style Dictionary v5** — transforms Figma variable exports into CSS custom properties and typed TypeScript constants
- **Storybook 8** — component development environment and documentation
- **Vitest** + **Testing Library** — unit and accessibility testing
- **Chromatic** — visual regression testing

## Token Pipeline

Design tokens originate in Figma as variable collections and flow through Style Dictionary into two outputs:

| Source (Figma JSON) | Contents |
|---|---|
| `Global Colors.json` | Raw color palette |
| `Intent Colors.json` | Semantic color tokens (light + dark modes) |
| `Typography.json` | Font size + line-height across 3 responsive breakpoints |
| `Shape.json` | Border-radius scale |
| `Breakpoint.json` | Viewport width + padding reference values |

**Generated outputs** (in `design-system/src/tokens/generated/`):
- `tokens.css` — CSS custom properties prefixed with `--sds-`
- `tokens.ts` — Typed TypeScript constants

**Designer workflow:** Export Figma JSON → drop into `design-system/src/tokens/figma/` → run `npm run build:tokens`.

## Components

### Actions

| Component | Status | Notes |
|---|---|---|
| `Button` | ✓ | Variants: primary, secondary, static, negative — fill styles: filled, hollow, ghost |
| `ButtonGroup` | ✓ | Grouped related buttons |
| `Stepper` | ✓ | Numeric input stepper, horizontal + vertical |

### Fields

| Component | Status | Notes |
|---|---|---|
| `TextField` | ✓ | Floating label, character counter, clear, error/success states |
| `PasswordField` | ✓ | Show/hide toggle |
| `TextArea` | ✓ | Auto-resizing, floating label, character counter |
| `SearchField` | ✓ | Standard (`type="search"`) + Autocomplete (WAI-ARIA combobox) |
| `PhoneField` | ✓ | Country selector (flag + dial code), timezone detection, numeric formatting, WCAG AA |
| `SelectField` | ✓ | Dropdown built on Menu, floating label, error/success states, WCAG AA |
| `DatePicker` | ✓ | Date / range / month / year modes, Floating UI positioning, WCAG AA |
| `TimePicker` | ✓ | 12 h / 24 h, configurable minute intervals (1·5·10·15·30), WCAG AA |
| `FileUpload` | ✓ | Drop zone + `FileUploadItem` — drag-and-drop, click-to-browse, MIME/size validation, progress |
| `Dropdown` | Planned | |

### Inputs

| Component | Status | Notes |
|---|---|---|
| `Checkbox` | ✓ | Core checkbox — native `<input type="checkbox">`, free children slot, indeterminate state, WCAG AA |
| `CheckboxGroup` | ✓ | Group container — context-managed value state, select-all parent, cascading disabled, `aria-labelledby` |
| `Radio` | ✓ | Single radio item — always used inside `RadioGroup`; browser arrow-key navigation via shared `name` |
| `RadioGroup` | ✓ | `role="radiogroup"` container — controlled/uncontrolled value, cascading disabled, `aria-labelledby` |
| `Toggle` | ✓ | On/off switch — `<input type="checkbox" role="switch">`, controlled/uncontrolled, error state, WCAG AA |
| ↳ `CheckboxIndicator` | ✓ | Visual sub-component (`InputIndicators/`) — used internally and by multi-select Menu items |
| ↳ `RadioIndicator` | ✓ | Visual sub-component (`InputIndicators/`) — used internally by `Radio` |
| ↳ `ToggleIndicator` | ✓ | Visual sub-component (`InputIndicators/`) — track + thumb, used internally by `Toggle` |
| `Rating Input` | Planned | |
| `Slider` | Planned | |

### Navigation

| Component | Status | Notes |
|---|---|---|
| `Menu` | ✓ | Portal-rendered, WAI-ARIA menu pattern, single + multi-select |
| `Combobox` | Planned | Filterable select (WAI-ARIA combobox pattern) |
| `Tabs` | Planned | |
| `Breadcrumbs` | Planned | |

### Data Display

| Component | Status | Notes |
|---|---|---|
| `ProgressBar` | ✓ | Determinate + indeterminate (animated sweep), error/success states, optional label + value |
| `Badges` | Planned | Menu tag suffix uses a temporary inline pill until this is built |
| `Avatar` | Planned | |
| `Profile` | Planned | Avatar + label + support content |

### Table

| Component | Status |
|---|---|
| `Table` | Planned |

### Surfaces

| Component | Status |
|---|---|
| `Notification` | Planned |
| `Modal` | Planned |
| `Tooltips` | Planned |
| `Accordion` | Planned |

## Accessibility

All components target **WCAG 2.1 AA**. Patterns in use across the library:

- Field focus communicated via border-color change on `:focus-within` — no redundant focus ring on wrappers
- Character-limit fields: dual ARIA live regions, milestone announcements (50% / 25% / 10 chars / at-limit), 500ms debounce
- `SearchField` autocomplete: WAI-ARIA Combobox pattern — `role="combobox"`, DOM focus stays on input, `aria-activedescendant` for virtual navigation, polite live region announcing result counts (1400ms debounce)
- `Menu`: WAI-ARIA Menu pattern — `role="menu"`, arrow-key navigation, focus save/restore, transparent backdrop for outside-click capture
- `PhoneField`: `role="group"` wrapper, country button as WAI-ARIA combobox (`role="combobox"`, `aria-expanded`, `aria-haspopup="menu"`), printable-character typeahead in country list, `role="status"` live region for dial-code changes, `autocomplete="tel-national"` + `inputmode="numeric"` on phone input
- `SelectField`: trigger button as WAI-ARIA combobox (`role="combobox"`, `aria-expanded`, `aria-haspopup="menu"`), keyboard open/close (Space / Enter / ArrowDown / ArrowUp / Escape), `role="status"` live region announces selected option, focus restored to trigger on close
- `TimePicker`: trigger as button with `aria-haspopup="dialog"` + `aria-expanded`, popover is `role="dialog" aria-modal`, each column is `role="listbox"` with `aria-orientation="vertical"`, items are `role="option"` with `aria-selected`, roving tabindex within each column, Arrow up/down navigates within column, Escape closes, `role="status"` live region announces each committed time change
- `Checkbox`: native `<input type="checkbox">` (visually hidden) inside a `<label>` for form participation and screen-reader support; `indeterminate` set imperatively via ref; focus ring on indicator via `:has(:focus-visible)` with `mousedown` guard to suppress Chrome's checkbox `:focus-visible` on click; `CheckboxIndicator` is always `aria-hidden`
- `CheckboxGroup`: `role="group"` + `aria-labelledby` wired to label slot via `useId()`; group value state cascades to items via React context; parent checkbox derives indeterminate state from child values
- `RadioGroup`: `role="radiogroup"` + `aria-labelledby`; arrow-key navigation handled natively by browser when all radios share the same auto-generated `name` attribute
- `Toggle`: `<input type="checkbox" role="switch">` for switch semantics + form participation; `aria-checked` mirrors resolved checked state; same Chrome `:focus-visible` mousedown guard as Checkbox
- `ProgressBar`: `role="progressbar"` + `aria-valuemin/max/now/text`; omits `aria-valuenow` when indeterminate; `aria-valuetext` reads "Loading…" for indeterminate
- Minimum 44px touch targets on interactive list items (WCAG 2.5.8)
- Icons are inline SVG with `aria-hidden="true"` — will be replaced by the icon library import when available

## Getting Started

```bash
cd design-system

# Install dependencies
npm install

# Start Storybook
npm run storybook

# Run tests
npm test

# Build design tokens from Figma exports
npm run build:tokens

# Build Storybook for deployment
npm run build-storybook
```

## Project Structure

```
design-system/
└── src/
    ├── components/
    │   ├── Actions/
    │   │   ├── Button/
    │   │   ├── ButtonGroup/
    │   │   └── Stepper/
    │   ├── Fields/
    │   │   ├── TextField/
    │   │   ├── PasswordField/
    │   │   ├── TextArea/
    │   │   ├── SearchField/
    │   │   ├── PhoneField/
    │   │   ├── SelectField/
    │   │   ├── DatePicker/
    │   │   ├── TimePicker/
    │   │   └── FileUpload/
    │   ├── Inputs/
    │   │   ├── Checkbox/           ← Checkbox, CheckboxGroup
    │   │   ├── Radio/              ← Radio, RadioGroup
    │   │   ├── Toggle/             ← Toggle
    │   │   └── InputIndicators/    ← CheckboxIndicator, RadioIndicator, ToggleIndicator (utility)
    │   ├── DataDisplay/
    │   │   └── ProgressBar/
    │   └── Navigation/
    │       └── Menu/
    └── tokens/
        ├── figma/          ← Figma JSON exports (source of truth)
        └── generated/      ← CSS custom properties + TS constants
```

Each component folder contains:
```
ComponentName.tsx          ← Component + exported types
ComponentName.css          ← BEM-structured styles using --sds-* tokens
ComponentName.stories.tsx  ← Storybook stories
ComponentName.test.tsx     ← Vitest + Testing Library tests
```

## License

See [LICENSE](LICENSE).
