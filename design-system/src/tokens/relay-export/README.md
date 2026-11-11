# Relay export — the token source of truth

This folder is the input to `npm run build:tokens`: Figma's variables, exported with
**Subliminal Relay ≥ 0.6.0** ("Download All (.zip)"), unzipped as-is. Don't edit these files by
hand — change Figma and re-export.

| File | Role |
| --- | --- |
| `Globals.Value.tokens.json` | Primitives: colour ramps, font weights. Not emitted; Brand aliases into it. |
| `Brand.Default.tokens.json` | **The theme**: `Colors/Light/*` and `Colors/Dark/*`, radius, size, border thickness, font family / weight / letter-spacing. One mode. |
| `Color mode.{Lightmode,Darkmode}.tokens.json` | Intent colours — each a Brand colour, alone or with an opacity. |
| `Breakpoint.{XL,LG,MD,SM,XS}.tokens.json` | Font sizes, line heights, viewport. Numbers only; typeface is a Brand decision. |
| `effect-styles.json` | Figma effect styles as CSS (`boxShadow`, …). Linked values become variable references. |
| `text-styles.json` | Figma text styles, each with the variable bound to every field. The `.sds-text--*` classes are built from these bindings. |

## To update

1. In Figma, run Relay → **Extract Tokens** → **Download All (.zip)**. There should be no red
   problems banner.
2. Replace every file here with the ZIP's contents.
3. `npm run build:tokens`. It fails, listing every problem, rather than guessing.

> **`text-styles.json` here wasn't produced by the plugin UI.** It is the output of Relay 0.6.0's
> `extractTextStyles`, run against the live Figma file through the Figma MCP (2026-11-11). Replace it
> with the real export the next time you run Relay. Without the file the build still works: it infers
> the type classes from the Breakpoint › Font size names.

## What the build relies on

- **Every intent colour derives from Brand** (174 of 176 per mode). Otherwise rebranding would miss
  it, and the build fails. The two exceptions, `Accents/Gradient/Primary-start` and `Primary-end`, are
  fixed by decision (`FIXED_TO_GLOBALS` in `build-color-layer.mjs`).
- **Brand colours are opaque.** Opacity belongs in Color mode; a translucent Brand colour would
  compound with every state's opacity.
- **Each mode uses its own palette**: Lightmode uses `Colors/Light/*`, and Darkmode uses `Colors/Dark/*`.
- **Every type style has all five properties**: family, weight, letter-spacing (Brand), and size and
  line height (Breakpoint).
- **Type classes follow the Figma text styles** (when `text-styles.json` is present): each style's
  five bound variables are the class's five properties. A style with an unbound field, a Font size
  variable with no style, or a style bound to a variable that isn't exported fails the build.

## Format

This is Figma's own "Export variables" shape, so a hand export from Figma is interchangeable with
Relay's. Composed colours carry `$extensions["com.figma.composedColor"]`, with `colorArg` (which
variable) and `opacityArg` (0–100). See `CLAUDE.md` in the `subliminal-relay` repo.
