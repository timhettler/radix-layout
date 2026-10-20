# ADR 0007 — `Switcher` switches when an item would fall below its minimum

**Status:** accepted **Date:** 2026-10-15 **Deciders:** Tim Hettler

## Context

`Switcher` is ADR 0005 § 3's all-at-once intent: peers that sit side by side or
all stack, never two and one. Every Layout's Switcher switches when its
container is narrower than one fixed threshold, and caps the row with an item
limit.

A fixed threshold answers the wrong question. What a design means is that the
row holds while each item has the width it needs. That is a minimum per item,
and the threshold follows from it and the number of items.

## Decision

### 1. The threshold is the item count times a minimum, plus the gaps

```scss
.el-switcher {
  display: flex;
  flex-wrap: wrap;

  > * {
    $min: var(--el-switcher-min);
    $gap: var(--el-switcher-space);
    $n: sibling-count();

    flex-grow: 1;
    flex-basis: min(100%, max(0px, ($min * $n + $gap * ($n - 1) - 100%) * 1e9));
    min-inline-size: 0;
    margin: 0;
    container-type: inline-size;
    contain-intrinsic-inline-size: $min;
  }
}

.el-switcher[data-space] {
  gap: var(--el-switcher-space);
}
```

While the items and their gaps fit at their minimum, the basis is zero and the
items share the row. Any narrower, it is `100%` and every item takes a line.
`sibling-count()` gives the count to one declaration, at any number of items,
and is Baseline newly available since Firefox 154.

The deficit is multiplied by `1e9` so that the smallest width a browser lays
out, 1/64px or Firefox's 1/60px, already reaches `100%`. Every Layout's `999`
leaves a band below the threshold, about 0.6px wide at 1178px, where the basis
is small enough to keep the row or split it two and one. `infinity` closes the
band, but at the exact threshold `0 × infinity` is NaN, and Chromium stacks the
row at the one width it should hold.

### 2. Items are equal width, and content wider than its share overflows

A zero basis and `min-inline-size: 0` mean an item's content never sizes it, so
`flex-grow` divides the row exactly. With the content floor, an item whose
content is wider than its share grows and pushes a sibling to the next line, the
two-and-one shape this layout exists to prevent. `min-inline-size: 0` also lets
an item shrink below the minimum when its slot is narrower than one. The fix for
overflowing content is a larger `min`, which the consumer picks for their
content.

### 3. `min` is a closed vocabulary: `s`, `m` and `l`

`data-min` takes `s`, `m` or `l`, for `10rem`, `15rem` and `20rem`, and the
default is `m`. They are item widths, not gaps, so they sit in `rem` off the
space scale.

The values are provisional: round numbers, measured against no content. With
`space="m"`, three `m` items need about 747px, so a full-width 3-up row stacks
in a 768px viewport with 16px of page padding.

`min` and `space` both take ADR 0004 § 5's knob shape. Each `data-min` value
assigns `--el-switcher-min` in `el.defaults`, each `data-space` step assigns
`--el-switcher-space`, and a bare `.el-switcher` assigns the `m` minimum. The
gap and the basis read the same knob, so an override moves both, and an off-list
minimum is the knob set on the consumer's own class. `gap` sits on
`[data-space]`, so a consumer's bare `gap` loses and can't disagree with the
basis.

`space` is required, as on `Stack` and `Cluster`. A project may compile a scale
with no `m` step (ADR 0006), so there is no step the class could name as a
default.

### 4. There is no `limit` prop and no cap on the count

The count is part of the threshold (§ 1), so more items switch sooner on their
own. Twelve `10rem` items with 16px gaps share a row from 2096px and stack at
2095px.

### 5. Items are query containers whose intrinsic width is the minimum

`contain-intrinsic-inline-size` makes the minimum each item's intrinsic content
width, so the switcher's max-content width is the row at its minimum, plus each
item's padding and border, and its min-content width is one item. A
shrink-to-fit parent (inline-block, a flex item that does not grow, an
absolutely positioned box) then sizes the switcher to the row when there is
room, and the row stacks exactly at the threshold. The intrinsic width is
required: containment without it collapses a three-item switcher in an
inline-block parent to its two 16px gaps, 32px.

An item's width comes from the row, so like `Grid.Item` it is a container by
construction (ADR 0004 § 4), and the layouts inside it space themselves for its
width. The switcher declares no container itself.

### 6. The knobs are registered, so each computes once, on the switcher

```scss
@property --el-switcher-min {
  syntax: "<length>";
  inherits: true;
  initial-value: 0px;
}
```

`--el-switcher-space` is registered the same way. A registered length computes
on the element that assigns it, here each switcher, and the items inherit the
pixels. Unregistered, each item would resolve the knobs for itself. A `12em`
minimum would be larger in an item with a larger font, and split the row two and
one. A switcher that is another switcher's item, and so a query container, would
resolve its gap against its parent's container but its items' basis against
itself, and switch up to 7px from where its gap says.

ADR 0004 § 2 bans registering a space step, because a step is assigned on
`:root` and would compute there, against the viewport. A knob is assigned on
each switcher, so it computes against the same container as the switcher's
`gap`. The steps the knobs read stay unregistered.

## Consequences

- **The switch is exact.** Three `10rem` items with two 16px gaps sit in a row
  at 512px and stack at 511px, in a block parent and in an inline-block one.
  Beside a 300px title in a flex bar with a 16px gap, the bar holds the row down
  to 828px. The stories check 0.1px either side of the threshold; they run in
  Chromium, and also pass in Firefox 157 and WebKit 27.2.
- **A hidden item still counts.** `sibling-count()` counts every element
  sibling, so three items and one `display: none` sibling switch at the
  four-item threshold, 688px. A consumer renders an item conditionally to remove
  it.
- **A knob takes any length.** An `em` or `ch` minimum resolves against the
  switcher's font (§ 6).
- **A switcher is never narrower than one item's minimum** in a parent that
  sizes to content (inline-block, a flex item, a grid track). A `10rem` switcher
  in a 120px slot of that kind overflows it by 40px. A block parent narrower
  than the minimum shrinks it.
- **Content that overflows its item is the consumer's to fix**, by choosing a
  larger `min`. The row stays equal and the content overflows its own item.
- **A button group that goes vertical at a design's breakpoint is not a
  `Switcher`.** The EJDS Button Group switches on the design's width, not on its
  items' minimum, so it is `Cluster` with `--el-cluster-flow` (ADR 0005 § 4).

## Alternatives considered

- **Every Layout's fixed threshold with an item limit.** The threshold ignores
  the count: with a limit of 6, six items in a 500px container get 70px each.
- **Counting with selectors**, a `:first-child:nth-last-child(n)` rule or a
  `:has()` rule per count. The geometry matches `sibling-count()`, but the list
  ends somewhere, and past its end the items wrap one at a time unless a last
  rule stacks them.
- **Keeping the content floor** (`min-inline-size: auto`, no containment). An
  item with long content splits the row two and one (§ 2), and in a
  shrink-to-fit parent the switcher sizes to its labels and always stacks.
- **`sign()` of the deficit**, for a basis of exactly `0` or `100%`. Chromium
  does not resolve the percentage inside `sign()` here, so the items always
  stack.
- **`inline-size: var(--el-switcher-min)` on the items.** The basis overrides it
  in layout, so it sets the same intrinsic width with the same geometry, but
  leaves the items' content without a container.
- **Unregistered knobs, with `rem` or `px` minimums documented.** Still leaves a
  switcher that is another switcher's item switching off its gap (§ 6).

## Revisit when

- The first real use, such as a form row of City, State and Zip in a drawer,
  measures the width its items need. That sets the values in § 3.
- A design caps how many items share the row.
