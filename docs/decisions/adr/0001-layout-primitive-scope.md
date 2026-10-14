# ADR 0001 — A layout primitive needs several declarations and a failure mode

**Status:** accepted **Date:** 2026-10-13 **Deciders:** Tim Hettler

Adapted from EJDS ADR 0012.

## Context

`Stack` and `Cluster` are drawn from the Every Layout vocabulary, and `Box` — an
element with padding, a border and a background — is the first layout in that
set. Proposing it raised the question of what a layout primitive has to be to
earn a place here, and the two that exist are the evidence.

Neither is a wrapper around a `display` value. Each carries a reset its layout
would be wrong without: a cluster zeroes its children's `margin` on both axes,
because an inline margin is additive to the `gap` and a block margin makes every
`align-items` value resolve against the wrong box; a stack zeroes `margin-block`
alone, because a column's inline axis is its cross axis and
`margin-inline: auto` centring a width-constrained child is a use worth keeping.
The reset is the part a caller would not think to write, and it is why each is a
primitive rather than a note recommending four declarations. Each also pins
`flex-wrap`.

Padding has no such part. It is one declaration, and nothing inherited corrupts
it.

## Decision

### 1. A layout primitive ships only for a layout of several declarations that carries a failure mode

Two tests, and both existing primitives pass both. The layout is more than one
declaration, so there is something for the primitive to be the single definition
of. And it carries a failure a caller would otherwise hit — a reset, an ordering
requirement, an alignment value that would push content out of reach — so the
primitive is protection rather than an abbreviation.

A layout that fails either test is documented, not shipped. The cost of shipping
one anyway is not the code: a public class, its `data-*` values and any public
custom property are versioned contract, with documentation, tests and migration
behind them. One declaration cannot pay that.

### 2. Padding is the consumer's, authored where the component is

There is no `Box` component, no `.el-box` class and no `layout.box()` mixin. A
consumer who needs an inset writes the declaration themselves, against their own
spacing tokens or `--el-space-*`. That is the answer `Cluster` already gives for
an off-scale gap — the layout wants its own container — and it is what keeps a
scale a scale.

### 3. Radius, border and fill are surfaces, and this library ships no surfaces

The visible box — a border, a corner radius, a fill — is the other half of the
Box pattern. It is component appearance, and the component that draws one holds
the declarations on its own class.

### 4. Full bleed is structural, and the inset goes on an inner element

A region reaching the edge of a container is a sibling of that container's
padded content, never a child cancelling the padding with a negative margin.

## The strongest case for Box

Every Layout's Box carries a genuine failure guard — a transparent outline, so a
filled box stays visible in forced-colours mode, where backgrounds are removed.
That is exactly the kind of thing § 1 asks for.

**The decision holds anyway.** Padding alone is still one declaration with
nothing to protect. The forced-colours guard is real, but it belongs to a
_surface_ — it exists because the box has a fill — and § 3 keeps surfaces out of
a layout library. A consumer drawing a filled box owns its forced-colours
behaviour along with its fill.

## Consequences

- **The rest of the Every Layout set is tested on its own merits, one at a
  time.** Membership in a published vocabulary is not an argument for shipping
  one, and neither is having shipped two of its siblings. `Grid` is the next
  candidate (`../planning/grid-layout-primitive/tech-plan.md`); `Switcher` is
  the likely one after (`../planning/responsive-layouts/questions.md`).
- **Consumers get no inset or surface utility.** They write the rule, against
  the same scale if they want it.

## Alternatives considered

### Every Layout's Box, as published

A custom element taking CSS values — `padding="var(--s1)"` — and inverting its
own colours with `filter: invert(100%)`. Arbitrary CSS values are refused here,
because an arbitrary value is the mechanism by which a scale stops being one,
and passing them through would need inline styles, which a restrictive CSP
blocks (ADR 0002). Its `.box * { color: inherit }` forces an inheritance a
consumer's own colour system should decide. What survives the subtraction is a
padding prop, which § 1 rejects.

### A padding-only Box on the space scale

The strongest remaining form, now that there is one scale. It still fails § 1:
one declaration, no reset, no ordering requirement, nothing out of reach.

## Revisit when

- Two layouts here would otherwise retype the same declarations.
- A consumer's measured difficulty with insets outweighs the commitment § 1
  describes.
