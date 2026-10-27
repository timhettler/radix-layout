# ADR 0012 — `Cover` centres one child in a minimum height

**Status:** accepted **Date:** 2026-10-27 **Deciders:** Tim Hettler

## Context

Every Layout's Cover is a hero: an optional header, one principal child in the
middle, an optional footer, all at least the viewport's height. Products often
build it from a general flex component with item props, such as a
`<Stack.Item push="both">` on a stack given a `min-height`. Here `Stack` has no
item API and zeroes its children's block margins (ADR 0001), so the same shape
needs a decision: a layout of its own, or items on `Stack`.

## Decision

### 1. Cover is a layout, not a `Stack` with item props

It passes ADR 0001 § 1 with three failures a caller would hit building it by
hand. A consumer's `margin-block: auto` on a `Stack` child ties `.el-stack > *`
at 0-1-0, so load order decides whether the child centres. Centring with
`justify-content: center` instead pushes content taller than the cover out above
its top, where no one can scroll to it. And `100vh`, the obvious minimum, puts a
footer behind a mobile browser's toolbar.

Item props on `Stack` would make it a compound component, a breaking change to
every caller, and carve an exception out of its reset. A `push` prop also
generalises toward the one-flex-component-with-every-knob that ADR 0005 turns
down.

### 2. The centred child is a part, with auto margins that outrank the reset

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
block margin whatever the load order. Every Layout's `:first-child:not(h1)`
margin rules predate flex `gap` and have nothing left to do.

The part is `Cover.Centered` rather than a selector prop, because a selector
would need a style or a generated rule per value (ADR 0002).

### 3. The minimum is a knob, defaulting to `100svh`

`--el-cover-min` is assigned on every `.el-cover` in `el.defaults` (ADR 0003),
so a nested cover never inherits an outer one's. `svh` is the viewport with the
browser's toolbars shown, so the footer is visible on first paint. A cover meant
to fill the space around a sticky header sets the knob to
`calc(100svh - <header height>)` on its own class.

It stays unregistered: no `calc()` here sums it, and an invalid value leaves
`min-block-size` at `auto`, the content's height, which loses only the minimum.

### 4. No padding and no cross-axis prop

Padding is the consumer's (ADR 0001 § 2); Every Layout's `noPad` has nothing to
turn off. Horizontal centring is a `Center` around the cover or inside a part,
or `text-align`, as Every Layout composes it. Children stretch, as in `Stack`.

## Consequences

- **Padding on the root adds to the minimum** unless the consumer's class sets
  `box-sizing: border-box`. The JSDoc and README say so.
- **Two `Cover.Centered` in one root share the space between them**, which is
  documented rather than prevented.

## Alternatives considered

- **`push` on `Stack` items, as a general auto-margin prop.** See § 1.
- **A `min` axis of closed `data-*` values**, such as `screen` and `none`. A
  height is the product's, like Center's measure (ADR 0009 § 2), and a closed
  list can't express a minimum less a sticky header.

## Revisit when

- A design needs a cover centred on the cross axis that a `Center` can't give.
- `svh` hides content on a platform whose toolbars it doesn't account for.
