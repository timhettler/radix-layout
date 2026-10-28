# ADR 0012 — `Cover` gives one child the space its siblings leave

**Status:** accepted **Date:** 2026-10-27 **Deciders:** Tim Hettler

## Context

Every Layout's Cover is a hero: an optional header, one principal child in the
middle, an optional footer, all at least the viewport's height. The same column
with the principal child grown instead of centred is a page shell, a panel with
a scrolling body, or a card with its actions at the bottom. Products often build
both from a general flex component with item props, such as a
`<Stack.Item push="both">`. Here `Stack` has no item API and zeroes its
children's block margins (ADR 0001), so the shape needs a decision: a layout of
its own, or items on `Stack`.

## Decision

### 1. Cover is a layout, not a `Stack` with item props

It passes ADR 0001 § 1 with failures a caller would hit building it by hand. A
consumer's `margin-block: auto` on a `Stack` child ties `.el-stack > *` at
0-1-0, so load order decides whether the child centres. Centring with
`justify-content: center` instead centres the header, child and footer as one
group, so neither end stays at the cover's edge. A grown child in a box of fixed
height keeps its content's height as its minimum, and pushes the footer out (§
3). And `100vh`, the obvious minimum, puts a footer behind a mobile browser's
toolbar.

Item props on `Stack` would make it a compound component, a breaking change to
every caller, and carve an exception out of its reset.

### 2. A centred child is a part, with auto margins that outrank the reset

```scss
.el-cover {
  min-block-size: var(--el-cover-min);
  /* layout.stack: a column that never wraps, children's block margins zeroed */
}

.el-cover > .el-cover__centered {
  margin-block: auto;
}
```

Auto margins split the space the header, the footer and the gaps leave, and
shrink to 0 when the content fills the cover, so the gap is the least space
between parts. At 0-2-0 the rule beats the reset and a consumer's single-class
block margin whatever the load order; a rule of two classes on the child, loaded
after, wins.

The part is `Cover.Centered` rather than a selector prop, because a selector
would need a style or a generated rule per value (ADR 0002).

### 3. A filling child is a part that may shrink

```scss
.el-cover__fill {
  flex-grow: 1;
  min-block-size: 0;
}
```

`min-block-size: 0` replaces a flex item's automatic minimum, its content's
height, so in a cover of fixed height the fill shrinks to the space left and the
footer stays at the bottom. Whether what doesn't fit scrolls or is clipped is
the consumer's `overflow`: a scrolling region has to be reachable by keyboard,
which the layout can't know. Neither declaration is in the reset, so one class
is enough, and a consumer's own minimum on the fill wins on load order.

One principal child per cover. A fill takes all the free space, so a centred
child beside it has none to be centred in.

### 4. The minimum is opt-in: `min="screen"`, or a knob

Omitted, `min` leaves the cover its content's height, so a height of the
consumer's own on the root, or a fixed-height parent's, holds without a reset.
`min="screen"` writes `data-min`, which assigns `100svh` to `--el-cover-min` in
`el.defaults` (ADR 0003), the viewport with the browser's toolbars shown, so the
footer is visible on first paint. The prop gives that unit a name a caller asks
for, where a default would also apply to every cover in a fixed box.

`--el-cover-min` takes any other length, such as `calc(100svh - <header>)` below
a sticky header, from a class of the consumer's own, and wins over the prop.
It's assigned on every `.el-cover`, as `auto`, so a nested cover never inherits
an outer one's. It stays unregistered: no `calc()` sums it, and an invalid value
leaves `min-block-size` at `auto`, which loses only the minimum.

### 5. No padding and no cross-axis prop

Padding is the consumer's (ADR 0001 § 2); Every Layout's `noPad` has nothing to
turn off. Horizontal centring is a `Center` around the cover or inside a part,
or `text-align`, as Every Layout composes it. Children stretch, as in `Stack`.

## Consequences

- **Padding on the root adds to the minimum** unless the consumer's class sets
  `box-sizing: border-box`.
- **A page shell is a composition:** a `Sidebar` merged onto `Cover.Fill` runs
  both columns between the header and footer.

## Alternatives considered

- **`push` on `Stack` items, as a general auto-margin prop.** See § 1.
- **Every Layout's margin rules**, which zero the first and last child's outer
  margin unless it is the centred one. They predate flex `gap`, which does the
  same job.
- **A `100svh` default with `min="none"` to opt out.** A cover given a height of
  its own would be viewport-tall until the caller found the prop.
- **`overflow: auto` on the fill.** Makes every fill a scroll container, which
  needs keyboard access the layout can't give.

## Revisit when

- A design needs a cover centred on the cross axis that a `Center` can't give.
- A second named minimum, such as a container's height, is asked for twice.
