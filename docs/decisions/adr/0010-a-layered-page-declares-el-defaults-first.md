# ADR 0010 — A page with its own cascade layers declares `el.defaults` first

**Status:** accepted; amends ADR 0003 **Date:** 2026-10-22 **Deciders:** Tim
Hettler

## Context

ADR 0003 puts every knob's default in `@layer el.defaults` so that a consumer's
rule beats it whatever the load order. That holds for unlayered consumer CSS,
which outranks every layer. A consumer rule inside a cascade layer gets no such
guarantee. Layers rank by the order they are first declared, the last one
winning, and Tailwind v4's output opens with
`@layer theme, base, components, utilities;`. When that sheet loads before the
library's, `el.defaults` is appended after `utilities` and outranks it, so a
`[--el-space-l:2rem]` utility renders the default with nothing reporting it.
Loaded the other way round, the utility wins.

The library can't fix this from its own files. ADR 0003 § 3's statement fixes
the order of the library's layers whichever of its files loads first, but no
stylesheet can place a layer ahead of one the page has already declared.

## Decision

A consumer whose CSS uses cascade layers declares `el.defaults` before them,
first in their entry stylesheet:

```css
@layer el.defaults;
@import "tailwindcss";
```

The library documents this in its README and changes nothing in its CSS. ADR
0003's layering and its § 3 statement stand.

## Consequences

- **With the statement, a knob set from any consumer layer wins**, whichever
  stylesheet loads first. The `LayeredRemap` story asserts that, and that the
  same sheet without the statement loses.
- **Unlayered consumer CSS needs nothing.** ADR 0003's guarantee holds for it as
  written.
- **Forgetting the statement fails silently, and only when the consumer's layers
  load first**, so the same code can work on one page and not on another. It's
  the ritual ADR 0003 rejected the specificity workaround for, accepted here
  because it is one line in one file rather than one per override.

## Alternatives considered

- **Defaults as `var()` fallbacks where each knob is read**, with the library
  declaring no knob at all. A consumer rule would then win from any layer
  without the statement. Consumer CSS could no longer read a step,
  `var(--el-space-l)`, unless it set that step itself, and Switcher and Sidebar
  scope their defaults per element so a nested layout doesn't inherit an outer
  one's, which a fallback can't do without an internal registered property per
  knob.
- **Support knobs from unlayered CSS only.** That shuts out Tailwind's
  arbitrary-property utilities and `@theme`, the usual ways a Tailwind project
  sets a custom property, to save the consumer one line.

## Revisit when

- Layered consumers are found forgetting the statement. That is the signal to
  take the fallback alternative despite the break.
