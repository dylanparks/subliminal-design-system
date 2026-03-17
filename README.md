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
| `Button` | ✓ | Multiple variants |
| `ButtonGroup` | ✓ | Grouped related buttons |
| `Stepper` | ✓ | Numeric input stepper, horizontal + vertical |

### Fields

| Component | Status | Notes |
|---|---|---|
| `TextField` | ✓ | Floating label, character counter, clear, error/success states |
| `PasswordField` | ✓ | Show/hide toggle |
| `TextArea` | ✓ | Auto-resizing, floating label, character counter |
| `SearchField` | ✓ | Standard (`type="search"`) + Autocomplete (WAI-ARIA combobox) |
| `PhoneField` | Planned | |
| `Dropdown` | Planned | |
| `Datepicker` | Planned | |
| `Timepicker` | Planned | |

### Inputs

| Component | Status |
|---|---|
| `Checkbox` | Planned |
| `Radio` | Planned |
| `Toggle` | Planned |
| `Rating Input` | Planned |
| `Slider` | Planned |

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
    │   │   └── SearchField/
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
