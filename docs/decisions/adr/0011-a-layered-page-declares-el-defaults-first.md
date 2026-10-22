# ADR 0011 — A page with its own cascade layers declares `el.defaults` first

**Status:** accepted; amends ADR 0003 **Date:** 2026-10-22 **Deciders:** Tim
Hettler

## Context

ADR 0003 puts each default the library declares in `@layer el.defaults` so that
a consumer's rule beats it whatever the load order. That holds for unlayered
consumer CSS, which outranks every layer. A consumer rule inside a cascade layer
gets no such guarantee where it sets a knob on the element the default is
declared on: `:root` for the scale, the layout's own element for its knobs.
Layers rank by the order they are first declared, the last one winning, and
Tailwind v4's output opens with `@layer theme, base, components, utilities;`.
When that sheet loads before the library's, `el.defaults` is appended after
`utilities` and outranks it, so a step remapped on `:root` from one of those
layers, or a `[--el-switcher-min:18rem]` utility on a Switcher, keeps the
default with nothing reporting it. Loaded the other way round, the consumer's
rule wins. Set on any other element, a knob wins either way, because the default
reaches that element only by inheritance.

The library can't fix this from its own files: no stylesheet can place a layer
ahead of one the page has already declared.

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
  stylesheet loads first. The `LayeredRemap` story asserts both outcomes with
  the consumer's sheet loaded first.
- **Unlayered consumer CSS needs nothing.** ADR 0003's guarantee holds for it as
  written.
- **Forgetting the statement fails silently, and only when the consumer's layers
  load first and set a knob where its default is declared**, so the same code
  can work on one page and not on another. It's the ritual ADR 0003 rejected the
  specificity workaround for, accepted here because it is one line in one file
  rather than one per override.

## Alternatives considered

- **Defaults as `var()` fallbacks where each knob is read**, with the library
  declaring no knob at all. A consumer rule would then win from any layer
  without the statement. Consumer CSS could no longer read a step,
  `var(--el-space-l)`, unless it set that step itself. Each layout also declares
  its knob defaults per element so a nested layout doesn't inherit an outer
  one's, which a fallback can't do without an internal registered property per
  knob.
- **Support knobs from unlayered CSS only.** That shuts out `@theme`, and
  arbitrary-property utilities on a layout itself, to save the consumer one
  line.

## Revisit when

- Layered consumers are found forgetting the statement. That is the signal to
  take the fallback alternative and accept that consumer CSS can no longer read
  a step.
