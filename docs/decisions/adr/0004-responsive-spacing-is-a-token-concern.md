# ADR 0004 — Responsive spacing belongs to the space scale, not to a layout's props

**Status:** accepted **Date:** 2026-10-15 **Deciders:** Tim Hettler

## Context

A design specifies a gap per screen: 8 on desktop, 4 on mobile. That can be
expressed on the instance, as a responsive prop or a consumer override, or on
the token the instance names.

Most such specs describe the system's spacing growing with the room available,
not one instance being special. And the library does not publish breakpoints
(Grid plan): product teams own their widths and their number of screens.

## Decision

### 1. A layout's `space` takes one step, and there is no responsive prop

`space="m"` names a step. Whether that step changes with width is the step's
definition, set once, not something each instance restates.

### 2. The default scale is fluid against the nearest container

Each step is a `clamp()` in `cqi`, assigned on `:root` in `el.defaults` and
**left unregistered**. An unregistered custom property substitutes as tokens, so
the length resolves where a layout reads it: against that layout's nearest query
container, or the small viewport when there is none.

Never register a step with `@property`. A registered `<length>` computes on
`:root`, which fixes every container-relative step to the viewport.

The default values and names, and how a project replaces them, are ADR 0006.

### 3. The step names are the contract, and a consumer may redefine any step

A project whose design hands off one screen per breakpoint redefines steps in
its own media queries, stepped or as one fluid segment per pair of screens. ADR
0003 makes the override win regardless of load order.

### 4. Viewport or container is decided by structure, not by a prop

Which ancestor is a query container decides what a step responds to. The library
declares a container only inside a layout whose width is definite by
construction: `Grid.Item`, whose width comes from its track. Every other
container is the consumer's, on their own class.

There is no container component. `container-type` is one declaration, and its
failure — collapsing in a content-sized slot such as a `Cluster` item — depends
on the parent, which a component cannot control (ADR 0001 § 1).

### 5. A per-instance exception goes through a per-layout knob

```scss
@layer el.defaults {
  .el-stack[data-space="m"] {
    --el-stack-space: var(--el-space-m);
  }
}
.el-stack[data-space] {
  gap: var(--el-stack-space);
}
```

The knob is a length, since CSS cannot build a property name from a step name;
the documented value is `var(--el-space-*)`. Every instance assigns its own
default, so a nested layout never inherits an ancestor's override and no
`@property` is needed. A consumer sets the knob on the layout's own class. `gap`
stays on the `[data-space]` selector so a consumer's bare `gap` keeps losing.

Per-instance values that cannot be tokens, such as a Grid item's span, use the
same shape.

## Consequences

- **Design hands off step names per component.** Per-screen values belong in the
  step's definition, so a project's semantic spacing tokens need one value per
  screen (modes), not single-mode aliases of the primitives.
- **Per-screen QA keeps passing** when a project redefines steps at its
  breakpoints, or pins fluid endpoints to its reference screen widths.
- **The same `space="m"` is tighter in a 4-up card than in a full-width
  section** once the card or cell is a container. That is the intent.
- **Figma modes are per screen**, so a designer previewing a card in a mode sees
  the viewport value, not the one its container will give.

## Alternatives considered

- **A responsive prop on library breakpoints**
  (`space={{ initial: "s", md: "m" }}`, as in Radix Themes). Publishes widths,
  and Radix Themes passes off-scale values as inline custom properties, which
  ADR 0002 rules out.
- **A responsive prop on consumer-owned tiers.** The library publishes tier
  names, the consumer sets a flag per tier on `:root` in their own media or
  container queries, and style queries pick the rule. The strongest alternative:
  static, server-rendered, widths stay the consumer's. Held because it restates
  per-screen values on every instance, which turns a system-wide spacing change
  into a search. It is additive if exceptions turn out common.
- **Swapping values with `matchMedia`.** Cannot know the width during server
  render, so it paints the wrong value first and mismatches on hydration.
- **A `mode` prop (viewport or container).** The nearest container already
  decides, per § 4.
- **Per-layout tokens** (`--el-stack-space-m`). Grows as layouts × steps, and a
  medium gap should not differ between `Stack` and `Cluster` at the same width.

## Revisit when

- Many instances set the § 5 knob per breakpoint. That is the case for the
  consumer-owned tier prop.
- Page rhythm needs spacing no container gives, such as section spacing that
  ignores an open sidebar. That would add a viewport-relative family of steps.
