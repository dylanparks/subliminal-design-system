# Relay export — the token source of truth

This folder is the input to `npm run build:tokens`: Figma's variables, exported with
**Subliminal Relay ≥ 0.5.0** ("Download All (.zip)"), unzipped as-is. Don't edit these files by
hand — change Figma and re-export.

| File | Role |
| --- | --- |
| `Globals.Value.tokens.json` | Primitives: colour ramps, font weights. Not emitted; Brand aliases into it. |
| `Brand.Default.tokens.json` | **The theme**: `Colors/Light/*` and `Colors/Dark/*`, radius, size, border thickness, font family / weight / letter-spacing. One mode. |
| `Color mode.{Lightmode,Darkmode}.tokens.json` | Intent colours — each a Brand colour, alone or with an opacity. |
| `Breakpoint.{LG,MD,XS}.tokens.json` | Font sizes, line heights, viewport. Numbers only; typeface is a Brand decision. |
| `effect-styles.json` | Figma effect styles as CSS (`boxShadow`, …). |

## To update

1. In Figma, run Relay → **Extract Tokens** → **Download All (.zip)**. There should be no red
   problems banner.
2. Replace every file here with the ZIP's contents.
3. `npm run build:tokens`. It fails, listing every problem, rather than guessing.

## What the build relies on

- **Every intent colour derives from Brand** (174 of 176 per mode). Otherwise rebranding would miss
  it, and the build fails. The two exceptions, `Accents/Gradient/PrimaryStart` and `PrimaryEnd`, are
  fixed by decision (`FIXED_TO_GLOBALS` in `build-color-layer.mjs`).
- **Brand colours are opaque.** Opacity belongs in Color mode; a translucent Brand colour would
  compound with every state's opacity.
- **Each mode uses its own palette**: Lightmode uses `Colors/Light/*`, and Darkmode uses `Colors/Dark/*`.
- **Every type style has all five properties**: family, weight, letter-spacing (Brand), and size and
  line height (Breakpoint).

## Format

This is Figma's own "Export variables" shape, so a hand export from Figma is interchangeable with
Relay's. Composed colours carry `$extensions["com.figma.composedColor"]`, with `colorArg` (which
variable) and `opacityArg` (0–100). See `CLAUDE.md` in the `subliminal-relay` repo.
