# Grid layout primitive — tech plan

**Status:** not started **Owner:** unassigned **Started:** 2026-09-24

Adapted from the EJDS plan.

## Problem

`Cluster` and `Stack` cover a row and a column; nothing covers two dimensions. A
product laying content out on a column grid reinvents it — and gets the two
failure modes below wrong.

The hard half is not the tracks, it is that **an item's span varies by viewport
and the viewports are not ours.** Product teams define their own breakpoints and
their own column count per breakpoint. A library that publishes 768px and 1180px
as the boundaries of its item vocabulary has decided that question on every
consumer's behalf.

## Approach

**The span is a public CSS custom property, and the consumer writes the media
query.** The library publishes one declaration that reads the property; a
product sets it on a class of its own, at whatever breakpoints it supports.

```scss
// the item's one unlayered declaration
.el-grid__item {
  grid-column: auto / span var(--el-grid-span, var(--el-grid-columns));
}

// the `span` prop's default, one rule per legal value, layered (ADR 0003)
@layer el.defaults {
  .el-grid__item[data-span="4"] {
    --el-grid-span: 4;
  }
}
```

```css
/* the product's stylesheet, with the product's breakpoints */
.hero-feature {
  --el-grid-span: 4;
}
@media (min-width: 60rem) {
  .hero-feature {
    --el-grid-span: 6;
  }
}
```

Three properties follow. **One property name rather than one per tier**, since
the consumer's media query does the selecting — no fallback chain, nothing to
register. **The default is full width without a keyword**: an item with no
`--el-grid-span` falls back to `--el-grid-columns`, and a span equal to the
column count is the full row at every width. **The static case is a prop**:
`Grid.Item`'s `span` emits `data-span`, whose rule is layered so a consumer's
own class still wins (ADR 0003 § 1).

This is also the general answer for any responsive _value_; see
`../responsive-layouts/questions.md`.

**Rejected: an enumerated `data-span-tablet` / `data-span-desktop` vocabulary.**
Bakes our breakpoints into the consumer's vocabulary, costs a rule per value per
tier, and its safety benefit (no span wider than the grid) guards a failure that
is already visible as a horizontal scrollbar.

**Rejected: `repeat(auto-fit, minmax(min(X, 100%), 1fr))`**, the Every Layout
intrinsic grid. `auto-fit` yields a track count known only at layout time, so a
span has no referent. An intrinsic card grid is a different primitive, tested on
its own merits (ADR 0001).

**Rejected: per-tier custom properties set inline**
(`style="--el-grid-span-desktop: 6"`). Markup cannot carry a media query, so it
forces three property names, a fallback chain and `@property` registration, and
it is blocked by a restrictive CSP (ADR 0002).

**Rejected: runtime rule generation** (`useId()` plus a hoisted `<style>`).
Returns the breakpoints to the library and adds a runtime (ADR 0002).

## Constraints & decisions

- **These property names are versioned API**: `--el-grid-span`,
  `--el-grid-columns`, `--el-grid-gutter`.
- **`--el-grid-columns` must inherit**, because the item reads it for its
  full-width default while the root sets it. That rules out registering it with
  `inherits: false`, the opposite of what `--el-grid-span` wants.
- **The gutter is a public property and the row gap is a prop.** `column-gap`
  reads `--el-grid-gutter`, defaulted in `el.defaults` to a space step; the
  consumer remaps it per breakpoint like the column count. Row rhythm is
  `data-space`, on the same scale as `Stack`.
- **Clears ADR 0001 § 1 on two failure modes**: `minmax(0, 1fr)` and the
  child-margin reset, both of which a caller hand-writing `display: grid` gets
  wrong — see § Notes.
- **Done means:** a bare `.el-grid` lays out its default columns with no
  consumer CSS; a consumer class setting `--el-grid-span` at its **own**
  breakpoints changes an item's span at those widths; and an item with no span
  renders full width at every width.

## Not in scope

- **The page container** — margins and max inline size belong to the product's
  page shell (ADR 0001 § 2).
- **A per-tier span vocabulary**, per § Approach.
- **`subgrid`** and **an intrinsic `auto-fit` grid** — § Deferred.

## Steps

- [ ] **Settle the default column count** — § Open questions, first bullet.
      Nothing else depends on the answer except the default block in
      `grid.scss`.
- [ ] **Add `@mixin grid($row-space)` to `lib/src/scss/_layout.scss`** carrying
      `display: grid`, `grid-auto-flow: row`,
      `grid-template-columns: repeat(var(--el-grid-columns), minmax(0, 1fr))`,
      `column-gap: var(--el-grid-gutter)`, `row-gap` and the `> * { margin: 0 }`
      reset — with the `minmax(0, 1fr)` reason in the header, since that
      declaration is the primitive's main justification.
- [ ] **Add the defaults to `lib/src/scss/defaults.scss`**: `--el-grid-columns`
      and `--el-grid-gutter` inside `el.defaults`.
- [ ] **Author `lib/src/scss/grid.scss`** emitting `.el-grid`, the `data-space`
      row-gap rules (from `_space.scss`), the layered `data-span` rules that set
      `--el-grid-span`, and the single unlayered `.el-grid__item` declaration.
      Add `grid` to `ENTRIES` in `lib/scripts/build-css.mjs` and to `exports`.
- [ ] **Add `lib/src/Grid.tsx`** in the Radix compound shape radix-card uses:
      `Grid` / `GridItem` with `Root` / `Item` aliases, both on `Primitive.div`
      so both take `asChild` and a `ref`. `GridItem` takes `span`, typed from a
      runtime `gridSpans` list; re-export from `main.ts`.
- [ ] **Add `docs/stories/Grid.stories.tsx`** with a `play` function per story,
      asserting resolved placement: the `data-span` vocabulary scrape, the
      full-width default, and a story that injects a consumer stylesheet with
      its own media query — that stylesheet **is** the API, and a page that only
      shows static spans demonstrates nothing.
- [ ] **Prove the guards by breaking them**: revert `minmax(0, 1fr)` to `1fr`
      and watch a long unbreakable string widen its column; drop the
      child-margin reset and watch a `<p>` add to the row gap; move the
      `data-span` rules out of `el.defaults` and watch a consumer's single-class
      `--el-grid-span` override stop working.
- [ ] **Document the responsive pattern in `lib/README.md`.** This carries more
      weight than usual: the responsive half of the API is CSS the consumer
      writes, so the doc is the only place the pattern exists.
- [ ] A changeset, then `yarn lint && yarn typecheck && yarn build && yarn test`
      and `check:package` clean.

## Notes

**The default is full width, and it costs no vocabulary.** `grid-column` falls
back to the column count, and a span equal to the column count is the full row.
It works only because `--el-grid-columns` inherits from the root to the item.

**Two failure modes, and they are the ones that make this a primitive.** `1fr`
is `minmax(auto, 1fr)`, whose `auto` minimum is content-based, so one long URL
or wide image makes that column wider than its share; the `0` minimum also
switches off the item's automatic minimum size, so the item overflows its own
box instead of distorting the grid. And margins do not collapse through a grid
container, so a child's block margin adds to the row gap and an inline margin
eats the track.

**What this gives up.** The vocabulary scrape reaches the `span` prop, whose
values are enumerable. It does not reach the responsive half: a consumer's
`--el-grid-span` accepts any integer. What is left for that half is an assertion
about resolved placement at a given width, which the Storybook Vitest runner can
make by resizing the browser viewport.

**A span wider than the grid overflows rather than clamping.** The implicit grid
is extended to accommodate the largest span, so `--el-grid-span: 99` produces a
horizontal scrollbar. Not guarded, deliberately: the symptom is visible to
whoever wrote it.

## Open questions

- **What is the default column count?**
  - **A breakpoint-free default** — `--el-grid-columns: 12` (or 4) set once.
    Takes no position on viewports, which is the plan's own premise, but a bare
    12-column grid on a phone is rarely right.
  - **Three default media queries at stated widths.** Correct out of the box for
    most products, and the only place the library would publish breakpoints. The
    consumer replaces it wholesale by setting the property themselves, which
    wins because the defaults are layered.
- **Should `--el-grid-span` inherit?** Unregistered, it does — so a nested
  grid's items pick up an ancestor item's span unless they set their own.
  `@property { syntax: "*"; inherits: false }` should stop that while still
  letting the property be _absent_ so the `var()` fallback fires. **Verify in
  Chromium, Gecko and WebKit before relying on it** — the full-width default
  depends on it.
- **What is the default gutter?** A step on the space scale, ideally the
  rhythmic one (`../responsive-rhythmic-scale/tech-plan.md`). It does not block
  the mechanism.

## Deferred / follow-ups

- **`subgrid`.** The real answer to nested grids not aligning. Held because a
  subgrid's track count is the parent's span at that breakpoint, which varies
  per instance and per breakpoint. Revisit when a real layout needs aligned
  nesting; it is purely additive.
- **`grid-auto-flow: dense` as a deliberate axis.** Declared as `row` so a
  product's reset cannot win; `dense` backfills holes, which is a legitimate
  request and a reordering hazard at once.
- **This is the precedent for every later responsive value** — see
  `../responsive-layouts/questions.md`. Write the convention down once it has a
  second instance; a responsive `space` on `Stack` or `Cluster` is the likely
  one.
