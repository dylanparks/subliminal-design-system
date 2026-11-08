# Relay export — the Brand-layer token model

Captured 2026-11-07 from a live **Subliminal Relay v0.5.0** export of the current Figma file
(`dylanparks/subliminal-relay@c0106ca`). This is the input for **Phase T.2**, the
`build-tokens.mjs` rewrite.

**Nothing reads these yet.** `build-tokens.mjs` still reads the 11 files in `../default-values/`,
a native Figma export of the *old* 12-collection structure that predates `$extensions` entirely.
Until T.2 lands, `default-values/` is the live input.

They're committed rather than left in a download folder because re-exporting means a round trip
through Dylan and Figma, and uploads haven't survived container resets — the 2026-09 native Figma
files were lost exactly that way. The previous snapshot (the 2026-09 four-collection structure,
v0.4.0) is at commit `f1310e1`, and Relay's offline test harness still uses it as a parity fixture.

## What's here

| File | Variables | Role |
| --- | --- | --- |
| `Globals.Value.tokens.json` | 345 | Primitives: colour ramps, `Transparent`, font weights. One mode. |
| `Brand.Default.tokens.json` | 114 | **The brand file.** `Colors/Light/*` and `Colors/Dark/*` (25 each), radius, size, border thickness, font family / weight / letter-spacing. One mode. |
| `Color mode.{Lightmode,Darkmode}.tokens.json` | 181 × 2 | Intent tokens: pick the Light or Dark Brand colours and apply state opacities. |
| `Breakpoint.{XS,MD,LG}.tokens.json` | 39 × 3 | Font size, line height, viewport. Numbers only — typeface is a Brand decision, deliberately not a breakpoint one. |
| `effect-styles.json` | — | Real `boxShadow` / `filter` CSS, not style names. |

Brand is *data* (a flat list of values, mode-less); Color mode is *behaviour*. Users write Brand;
components read Color mode — a component referencing Brand directly would bypass the state layer.

## The invariant T.2 depends on

In both Color mode files, **174 of the 176 colour tokens reach Brand** (Lightmode: 124 composed —
a Brand colour plus an opacity — and 50 aliases; Darkmode: 125 and 49). Every composed colour's
base is a Brand token. The other 5 tokens are the 4 elevation numbers and the `Images` boolean.

That is what makes runtime re-theming work: emit Brand as its own CSS variable layer and derive
intent tokens with `color-mix(in srgb, var(--sds-brand-x) N%, transparent)`. A token that reaches
past Brand into Globals silently stops re-theming, so **T.2 should assert this at build time**.

Known, deliberate exceptions: `Accents/Gradient/PrimaryStart` (→ `Colors/Cobalt/600`) and
`PrimaryEnd` (→ `Colors/Purple/700`), in both modes. The gradient is treated as a fixed
Subliminal signature for now; making it rebrandable means two new Brand tokens.

## Format

Figma's own "Export variables" shape, so a Relay export and a hand export are interchangeable.
Composed colours carry `$extensions["com.figma.composedColor"]`: `colorArg` (which variable) and
`opacityArg` (0–100). `$value` holds the flattened colour, with `alpha = fround(opacity / 100)`.

Because Brand is its own collection, **every `colorArg.alias` here is the long cross-collection
form** (`targetVariableId`, `targetVariableName`, `targetVariableSetId`, `targetVariableSetName`).
The 2026-09 export mostly used the short same-collection form, `{ targetVariableName }`. T.2's
parser should accept both.

Validated: this export matched an offline prediction from Relay's test harness on 937 of 938
tokens. The one difference was a Figma edit made between the two runs. Byte-parity with Figma's
*native* export of the new structure hasn't been checked yet; Relay's `CLAUDE.md` has the details.
