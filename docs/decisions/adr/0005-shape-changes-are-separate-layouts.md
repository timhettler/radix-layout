# ADR 0005 — A layout that changes shape is a separate layout, chosen by intent

**Status:** accepted **Date:** 2026-10-15 **Deciders:** Tim Hettler

## Context

A design shows a component as a row on desktop and a column on mobile, typically
a `Cluster` on one screen and a `Stack` on the other. Two screens leave out the
actual spec: what happens at the widths between them. Asked, the answer
separates into a few intents, and each is a different layout.

## Decision

### 1. `Cluster` and `Stack` do not flip into each other

They differ in more than direction. One always wraps and the other never can,
they reset different margin axes, and their cross-axis defaults differ. A prop
that flips one into the other would be a third layout under a familiar name.

### 2. The library publishes no widths for a shape change

A switch is intrinsic, decided by the content or the space a layout is given, or
its condition is the consumer's own media or container query. This is ADR 0004's
position applied to shape rather than value.

### 3. Each intent is its own layout

| Intent                                                       | Layout                                                  |
| ------------------------------------------------------------ | ------------------------------------------------------- |
| Ragged wrap: items move to the next line one at a time       | `Cluster`                                               |
| All at once: side by side or all stacked, never two + one    | `Switcher` (`../planning/switcher-layout/tech-plan.md`) |
| Two unequal parts: media beside text, a panel beside results | `Sidebar` (`../planning/sidebar-layout/tech-plan.md`)   |
| Natural width to full width: an action bar of buttons        | `Cluster` with `--el-cluster-flow` (§ 4)                |

A new layout still passes ADR 0001 § 1 on its own merits.

### 4. `Cluster` takes a flow knob that the consumer's query sets

```scss
@container style(--el-cluster-flow: stack) {
  .el-cluster > * {
    flex-basis: 100%;
  }
}
```

```css
/* the consumer's stylesheet, with the consumer's condition */
@container (width < 30rem) {
  .checkout-actions {
    --el-cluster-flow: stack;
  }
}
```

A container query cannot read a custom property but can set one, so the
condition is the consumer's and the declarations are the library's, and nothing
ties on specificity. The style query reads the cluster from its children, which
is why the knob changes only child declarations: it gives `Stack`'s `stretch`
look, and `start` alignment is out of reach.

`--el-cluster-flow` is registered with `@property` as `wrap | stack`, not
inherited, with an initial value of `wrap`, so a nested cluster never inherits
an outer one's switch and an unknown keyword renders as `wrap`. ADR 0004 § 2's
ban is on registering a length, which computes on `:root`; a keyword has nothing
to resolve. The keywords are a closed list with a runtime array, like a `data-*`
axis, and the vocabulary scrape reads the registration's `syntax` and the
`@container style()` rules.

## Consequences

- **A design review asks what happens between the screens.** "It wraps", "it all
  switches together" and "the image drops below when the text is cramped" name
  different layouts; the screens alone do not.
- **The media object is a `Sidebar`**, which no one would search for by that
  name. The Sidebar plan holds the naming question.
- **Every shape change renders on the server as it will look**, since none
  involves script.

## Alternatives considered

- **A direction prop on `Cluster` or `Stack`, per breakpoint.** A third layout
  under a familiar name (§ 1) that also publishes widths (§ 2).
- **A container-query variant**, a cluster above a container width and a stack
  below it. An element cannot query itself, so it needs `container-type` on its
  parent or a wrapper, which collapses a content-sized parent, and the threshold
  would be a width in library CSS.
- **Swapping components with `matchMedia`.** Cannot know the width during server
  render, so it paints the wrong layout first and mismatches on hydration.
- **The consumer overriding `flex-direction` on `.el-cluster`.** Ties at 0-1-0,
  so load order decides, and it leaves `Cluster`'s wrap and both-axis reset in
  place.

## Revisit when

- A design's shape change fits none of the § 3 intents.
- A consumer needs `start` alignment in the stacked state, which § 4 cannot
  reach.
