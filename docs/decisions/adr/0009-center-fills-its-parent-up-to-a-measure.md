# ADR 0009 — `Center` fills its parent up to a measure

**Status:** accepted **Date:** 2026-10-22 **Deciders:** Tim Hettler

## Context

Every Layout's Center caps a column at a measure, centres it with auto inline
margins and keeps a minimum gutter with padding on a content box. Products need
the same shape as a page container, and often build it into their grid, which
then only works at the top of a page.

The planning record is `../planning/archive/center-layout/tech-plan.md`.

## Decision

### 1. Center fills its parent up to the measure

```scss
.el-center {
  box-sizing: border-box;
  inline-size: 100%;
  max-inline-size: calc(var(--el-center-max) + 2 * var(--el-center-gutter));
  margin-inline: auto;
  padding-inline: var(--el-center-gutter);
}
```

Every Layout leaves `inline-size` at `auto`. A flex or grid item with an auto
inline margin doesn't stretch, so as a `Stack` child it shrinks to its content:
a Center holding one short heading is the heading's width, centred. The explicit
`inline-size` fills the parent. The cap adds both gutters, so the content box
keeps the measure and the gutter grows outward from it. In a block parent the
geometry is Every Layout's.

`border-box` puts the gutter in the cap rather than in the width. One
declaration needs the gutter either way, and with `border-box` a border or
padding of the consumer's own comes out of the measure rather than pushing the
Center past its parent.

`margin-block` is untouched, so a parent's rhythm survives.

### 2. The measure is a knob; the gutter is a prop and a registered knob

`--el-center-max` defaults to `60ch`, Every Layout's measure. It is assigned on
every `.el-center` in `el.defaults`, so a consumer's rule wins regardless of
load order (ADR 0003) and a nested Center never inherits an outer one's (ADR
0004 § 5). It has no prop for ADR 0008 § 3's reason: the length is off the space
scale, and a page container's width is the product's. It stays unregistered: no
one sets a measure to a unitless `0`, so a registration would guard nothing.

`gutter` takes a step on the space scale and writes `data-gutter`, which assigns
`--el-center-gutter` in `el.defaults`. It isn't `data-space`: merged onto a
`Stack` with `asChild`, the child's props win, and Stack's `data-space` would
replace the gutter silently. Omitted, there is no gutter.

`--el-center-gutter` is registered as a `<length-percentage>`, not inherited,
with an initial value of `0px`, which is the gutter's only default.
Unregistered, a consumer's unitless `0` or a step name makes the cap's `calc()`
invalid, and the Center is as wide as its parent with nothing reporting it.
Registered, `0` computes to `0px`, and a value that isn't a length or a
percentage falls back to the initial value. A percentage, as in `max(1rem, 5%)`,
resolves against the containing block in both the padding and the cap, so the
content keeps the measure. ADR 0004 § 2 bans registering a step because a step
is assigned on `:root`. This knob is assigned on each Center, so a fluid step
computes against the Center's nearest container, where it would resolve
unregistered (ADR 0007 § 6).

### 3. Intrinsic centering is composition

Every Layout's `intrinsic` flag makes the Center a centred flex column. Here
that is a `Stack` merged onto it:

```tsx
<Center asChild gutter="m">
  <Stack space="m" align="center">
    <p>…</p>
    <button type="button">Launch demo</button>
  </Stack>
</Center>
```

The two layouts share no property. The stack also gives the column its gap, and
its `safe center` keeps a child wider than the column reachable.

### 4. There is no `andText`

`text-align: center` is one declaration (ADR 0001 § 1), and centred running text
is hard to read. A consumer writes it on their own class.

### 5. The page container is a Center, not a grid variant

The max width, the auto margins and the gutter are this layout's, so the planned
`Grid` carries none of them. A page-width grid is a Center merged onto the
grid's root.

## Consequences

- **It passes ADR 0001 § 1** on the shrink-wrap in § 1 and the uncapped Center
  in § 2, both silent.
- **The stories break each guard.** Removing the `inline-size`, the doubled
  gutter, the layered `--el-center-max` default or the registration fails at
  least one story. They run in Chromium, and also pass in Firefox 157 and WebKit
  27.2.
- **A border or padding of your own on a Center comes out of the measure.** The
  inset is `gutter` or `--el-center-gutter`.
- **A Center that is a `Cluster`, `Switcher` or `Sidebar` child isn't
  supported,** placed or merged. Their `> * { margin: 0 }` ties with its auto
  margins at 0-1-0, so load order decides. Nest it inside the child.
- **Full bleed is structural where the author writes the markup** (ADR 0001 §
  4): a full-width region is a sibling of the Centers in a page `Stack`, with
  its own Center inside. A child of a Center reaches the page's edges as a
  `Bleed` (ADR 0010).

## Alternatives considered

- **Every Layout's content-box Center, as published.** Shrinks to its content as
  a `Stack` child (§ 1).
- **`content-box` with `inline-size: calc(100% - 2 × gutter)`.** The same
  geometry, and a border pushes the Center past its parent.
- **`inline-size: stretch`.** Fills the parent with no gutter in a calc, and
  Firefox supports it only in part, so it isn't Baseline.
- **A gutter registered as a `<length>`.** A percentage gutter, such as
  `max(1rem, 5%)`, fails the syntax and silently becomes `0px`.
- **An unregistered gutter defaulting to `0px`.** A consumer's unitless `0`
  uncaps the Center (§ 2).
- **A unitless knob cast with `* 1px`.** Rules out `rem`, `cqi` and the space
  steps, since a length times a length is invalid.
- **An `intrinsic` prop.** Restates `Stack`'s alignment as a flag (§ 3).
- **A `max` vocabulary.** Widths measured against no content (ADR 0008 § 3).
- **Full-bleed grid tracks** (`1fr min(max, 100%) 1fr`), which give every child
  a bleed. Children become grid items, so prose margins stop collapsing, and the
  Center can't merge onto a `Stack`.

## Revisit when

- Real uses settle on a few measures. That is the case for a vocabulary.
- `stretch` reaches Baseline. With `content-box`, it replaces `100%` and drops
  the cap's calc.
