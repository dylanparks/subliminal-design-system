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

**Generated outputs** (in `src/tokens/generated/`):
- `tokens.css` — CSS custom properties prefixed with `--sds-`
- `tokens.ts` — Typed TypeScript constants

**Designer workflow:** Export Figma JSON → drop into `src/tokens/figma/` → run `npm run build:tokens`.

## Components

### Actions
| Component | Description |
|---|---|
| `Button` | Primary interaction element with multiple variants |
| `ButtonGroup` | Grouped set of related buttons |
| `Stepper` | Numeric input stepper (horizontal + vertical) |

### Fields
| Component | Status |
|---|---|
| `TextField` | Floating label text input with character counter, clear, error/success states |
| `PasswordField` | Password input with show/hide toggle |
| `TextArea` | Auto-resizing textarea with floating label and character counter |
| Search Field | Upcoming |
| Phone Field | Upcoming |
| Dropdown | Upcoming |
| Datepicker | Upcoming |
| Timepicker | Upcoming |

### Upcoming Sections
- **Inputs** — Checkbox, Radio, Toggle, Rating Input, Slider
- **Data Display** — Badges, Avatar, Profile
- **Navigation** — Tabs, Breadcrumbs
- **Table** — Data tables
- **Surfaces** — Notification, Modal, Tooltips, Accordion

## Accessibility

All components target **WCAG 2.1 AA**. Field components include:
- Dual ARIA live regions for character-limit announcements
- Milestone announcements at 50%, 25%, 10 characters, and at-limit
- 500ms debounced announcements to avoid live-region spam
- Keyboard-navigable interactive elements

## Getting Started

```bash
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
src/
├── components/
│   ├── Actions/
│   │   ├── Button/
│   │   ├── ButtonGroup/
│   │   └── Stepper/
│   └── Fields/
│       ├── TextField/
│       ├── PasswordField/
│       └── TextArea/
└── tokens/
    ├── figma/          ← Figma JSON exports (source of truth)
    └── generated/      ← CSS custom properties + TS constants
```

## License

See [LICENSE](../LICENSE).
