# Relay export — the new 4-collection Brand/alpha model

Captured 2026-09-10 from a live **Subliminal Relay v0.4.0** export of the restructured Figma file.
This is the input for **Phase T.2** (reworking `build-tokens.mjs`).

**Nothing reads these yet.** `build-tokens.mjs` still reads the 10 files in `../default-values/`,
which are a native Figma export of the *old* 12-collection structure. T.2 decides whether to
cut over cleanly or support both shapes; until it lands, `default-values/` is the live input.

They're committed rather than left in a download folder because everything about this project's
local state has proven fragile, and re-exporting means a round trip through Dylan and Figma.

## What's here

| File | Variables | Notes |
| --- | --- | --- |
| `Global Values.Value.tokens.json` | 336 | Raw palette. Single mode, named `Value`. |
| `Intent Colors.{Lightmode,Darkmode}.tokens.json` | 193 × 2 | The semantic layer. |
| `Shape and Space.{Subliminal Brand,Example Brand}.tokens.json` | 14 × 2 | Two modes — the collection is *brand*-switched, not theme-switched. |
| `Responsive Typography.{XS,MD,LG}.tokens.json` | 65 × 3 | Breakpoint modes. |
| `effect-styles.json` | — | Real `boxShadow` / `filter` CSS, not style names. |

## The property T.2 depends on

In **both** Intent Colors modes, 189 of 193 tokens reach the Brand layer:

- **132 composed** — a Brand token plus an opacity, recorded in
  `$extensions["com.figma.composedColor"]` as `colorArg` (which Brand token) + `opacityArg`
  (0–100). `$value` carries the flattened result, `alpha = fround(opacity/100)`.
- **38 pure aliases** — `$value: "{Brand.Something}"`.
- **19 `com.figma.aliasData`** — the Brand tokens themselves, pointing into Global Values. This is
  the definition layer: the ~17 knobs.

Every one of the 132 composed colours derives from a Brand token — **zero** compose directly onto
Global Values, in either mode. That's what makes the target architecture work: emit Brand as its
own CSS variable layer and derive the rest with
`color-mix(in srgb, var(--sds-brand-x) N%, transparent)`, so a new brand is ~17 runtime variable
overrides with no token rebuild. If a future export breaks that invariant, the re-theming
guarantee quietly stops holding — worth asserting in the build.

## Format

Figma's own "Export variables" shape, deliberately — a Relay export and a hand export are
interchangeable, so the pipeline needs one parser. See `CLAUDE.md` in the `subliminal-relay` repo.

## Known staleness

Produced by v0.4.0; two parity fixes landed in v0.4.1 immediately after
(`dylanparks/subliminal-relay@ef0a40b`). A re-export will differ in exactly two ways, neither of
which affects colour values:

- scope `STROKE_COLOR` → `STROKE` (the native export's spelling)
- `com.figma.scopes` omitted rather than `[]` when a variable has no scopes

Also worth knowing: these files came from a Figma file where **Global Values is a local
collection**. The older `../default-values/` export was taken while it was a *subscribed library*,
so its `aliasData` ids carry the `/-1:-1` library suffix and won't match ids here. Names match.
