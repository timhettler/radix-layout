# ADR 0008 — `Sidebar` wraps when its content would fall below a share of the row

**Status:** accepted **Date:** 2026-10-20 **Deciders:** Tim Hettler

## Context

`Sidebar` is ADR 0005 § 3's two-unequal-parts intent: an image beside its text
(the media object), a filter panel beside results, a button beside its input.
Every Layout's Sidebar fixes the narrow part's width, gives the wide part the
rest, and wraps the pair when the wide part would be narrower than a percentage
of the row. Its custom element picks the narrow part by position and takes every
length as an attribute.

The planning record is `../planning/sidebar-layout/tech-plan.md`.

## Decision

### 1. The content grows from nothing, with a grow of `1e9`

```scss
.el-sidebar {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;

  > * {
    margin: 0;
  }
}
.el-sidebar__side {
  flex-basis: var(--el-sidebar-side-width);
  flex-grow: 1;
}
.el-sidebar__content {
  flex-basis: 0;
  flex-grow: 1e9;
  min-inline-size: var(--el-sidebar-content-min);
}
```

The content's zero basis and huge grow give it all the free space, so the side
sits at its basis. `min-inline-size` overrides the content's automatic minimum,
which makes the line break exact: at the default `50%` the pair holds at twice
the side plus the gap and stacks below it. Wrapped, each part fills its line.

Every Layout's grow of `999` hands the side 1/1000 of the free space, nearly 1px
beside a `15rem` side in a 1200px row, so the side is never exactly its width.
At `1e9` the side's share is below a layout unit. The sum `1e9 + 1` is past
float precision, so the content takes the free space whole and nothing
overflows.

### 2. The parts are components, marked by class

`SidebarRoot`, `SidebarSide` and `SidebarContent` are each a `Primitive.div`
with `asChild`. The side is `.el-sidebar__side`, not `:first-child`, so a
conditional or hidden sibling can't change which part is the side, and DOM order
stays the author's: it is the reading order and decides which part stacks on
top. Either part alone fills the row.

They are exported flat and as a namespace, `Sidebar.Root`, `Sidebar.Side` and
`Sidebar.Content`, through `export * as Sidebar`. A top-level `Root` alias, as
radix-card exports, would collide across layouts. The next compound layout
follows the same shape.

The name is Every Layout's. The JSDoc and README lead with the media object,
which is what people search for.

### 3. Both lengths are knobs, with no prop vocabulary

`--el-sidebar-side-width` defaults to `auto`, the side's content width, and
`--el-sidebar-content-min` to `50%`. Both defaults are assigned on every
`.el-sidebar` in `el.defaults`, so a consumer's rule on the root or on the part
wins regardless of load order (ADR 0003), and a nested sidebar never inherits an
outer one's values (ADR 0004 § 5).

Neither is a prop. Neither length is on the space scale, so a prop would need a
vocabulary, and no real use has measured one; ADR 0007 § 3's values are
provisional for the same reason.

The knobs stay unregistered. ADR 0007 § 6 registers Switcher's knobs because
every item must read the same pixels; here one part reads each, so a `30ch`
minimum resolves against the content's own font, which is the reading width it
names. The content minimum takes any length-percentage.

### 4. `align` defaults to `stretch`

`align` takes `start`, `center`, `end` and `stretch`, as on `Stack`, with
`stretch` the default, so a filter panel's fill reaches the bottom of the
results. The parts stretch and an image inside one keeps its aspect ratio. Only
`asChild` onto an `img` distorts it, and the JSDoc says so.

`space` is a required step emitted as `gap`, as on `Stack` and `Cluster`.
Nothing computes from the gap, so it has no knob.

### 5. Neither part is a query container

The content's width is definite only when the sidebar's is. In a shrink-to-fit
parent, inline-size containment zeroes its intrinsic width and it collapses, and
unlike Switcher (ADR 0007 § 5) there is no length for
`contain-intrinsic-inline-size` when the minimum is a percentage. The side is
sized by its content, so it can never be one. A consumer adds `container-type`
on their own class (ADR 0004 § 4).

## Consequences

- **The wrap is exact.** The stories check 0.1px either side of the threshold
  for a set side width, an intrinsic image, a `66.666%` search field and a
  `30ch` minimum, and assert the side within 0.02px of its width. They run in
  Chromium, and also pass in Firefox 157 and WebKit 27.2.
- **An `auto` side suits an image or a button.** A side of running text has a
  max-content width of the whole paragraph on one line, so it always stacks; it
  needs a length.
- **A long word in the content overflows the content**; the side keeps its
  width. A side whose content is wider than its knob grows to that content.
- **A stacked side fills its line.** Its content keeps its own width, so an
  avatar inside `Side` stays small.
- **A side that reads first but sits on the right is out of reach.** That is
  `order`, which separates reading order from visual order.
- **Children other than the two parts get no part rules.**

## Alternatives considered

- **Every Layout's `side` attribute, choosing the part by position.** Terser,
  and a conditional or `display: none` child changes which part is the side.
- **A `999` grow.** Matches the source, and the side is wider than its width by
  1/1000 of the free space.
- **A `sideWidth` vocabulary reusing Switcher's `s`, `m` and `l`.** Values
  measured against no content, for a length that is often an image's own width.
- **Content as a query container with an intrinsic-width knob.** Gives the
  results column fluid steps, at the cost of a third knob whose default nothing
  determines.
- **A `start` default.** Safe for `asChild` onto an `img`, but the commoner
  need, equal-height panels, would then take `align="stretch"`.

## Revisit when

- Real uses settle on a few side widths or content shares. That is the case for
  a vocabulary.
- Products routinely add `container-type` to the content.
