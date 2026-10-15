# ADR 0006 — The space scale is a fluid modular scale that a project may replace

**Status:** accepted **Date:** 2026-10-15 **Deciders:** Tim Hettler

## Context

`Stack`, `Cluster` and every later layout take `space` as a step on one scale,
and ADR 0004 makes that step, not the instance, the place where spacing responds
to width. The scale needs a rhythm a reader can see between adjacent steps, has
to grow with the room a layout is given, and needs names that stay true when its
values change.

A product team's design system usually has its own spacing tokens, with a
different number of steps and names. A library scale that cannot match them
forces a translation layer between what a designer specs and what a developer
writes.

## Decision

### 1. Each default step is the base times the ratio to its distance from `m`

The default steps are `xs`, `s`, `m`, `l`, `xl` and `2xl`. `m` is
`--el-space-base`, and each step up or down multiplies or divides by
`--el-space-ratio`, 1.5 by default. Each step is computed with `pow()` from the
two knobs rather than chained off its neighbour, so redefining one step moves no
other.

The base is `0.75rem`, which puts `s` and `m` on the 8px and 12px a design
system's primitives usually include.

### 2. The base is fluid in `cqi`, between two `rem` bounds

The default base is a `clamp()` from `0.75rem` to `0.9375rem` across container
widths of `20rem` to `80rem`, left unregistered (ADR 0004 § 2). Every step
multiplies the base, so every step is fluid over the same range.

Sass precomputes the `clamp()`. Interpolating in CSS divides a length by a
length, which needs typed arithmetic, and that is not in Baseline. A ratio that
tightens on small screens is held for the same reason.

The bounds are `rem` because spacing carries grouping: a user who raises their
default font size needs gaps that grow with the text, or headings and paragraphs
stop reading as groups. The fluid range is also in `rem`, so at large text a
container counts as narrower and the steps grow less than the text.

### 3. The knobs and the steps are public, so all are layered

`--el-space-base`, `--el-space-ratio` and every step's default live in
`@layer el.defaults` on `:root` (ADR 0003). The steps substitute the knobs on
`:root`, so retuning the scale is a `:root` declaration. A knob set lower in the
tree reaches no step.

### 4. A project may replace the vocabulary

`$spaces` is a `!default` map from step name to either an exponent on the ratio
or a literal value such as `var(--ds-space-300)`. The fluid bounds and the ratio
are `!default` too. A project compiles the stylesheet through
`@use "pkg:@timhettler/radix-layout" with (...)`, and augments the `Register`
interface so `Space` is its own steps.

The two lists are the project's to keep in agreement. A step missing from the
Sass renders with no gap; a step missing from `Register` fails type-checking.
The prebuilt CSS keeps the default scale, for a project without Sass.

So no layout may hard-code a step name outside `_space.scss`.

### 5. Type is out of scope

This is a layout library and publishes no type scale.

## Consequences

- **A retune is two declarations.** `--el-space-base` and `--el-space-ratio` on
  `:root` move every step; the `RetunedScale` story asserts it.
- **The same step differs by container**, as ADR 0004 intends: below `20rem`
  every step is at its minimum, above `80rem` at its maximum.
- **Every step grows by the same proportion.** A design that wants large steps
  to grow faster redefines those steps (ADR 0004 § 3).
- **The default tops out near 40px.** Section spacing past `2xl` is a project's
  own step, added through `$spaces`.
- **A configured project depends on Dart Sass with `NodePackageImporter`** to
  resolve the `pkg:` URL.

## Alternatives considered

- **`px` bounds.** Keep spacing from eating line length when a user raises their
  font size, at the cost of the grouping in § 2 for the users who rely on it. A
  project that prefers it sets `$base-min` and `$base-max` in `px`.
- **Position names (`s-2` … `s5`), as Every Layout uses.** Match the source
  material, but read worse in Figma than T-shirt sizes, and the scale is meant
  to be replaced by a project's own names anyway.
- **A fixed vocabulary that a project remaps step by step.** That is the
  translation layer this decision exists to remove.
- **A codegen CLI that writes the CSS and the types from one list.** Removes the
  drift between the two lists, at the cost of a build step and a tool to
  maintain.
- **Precomputing every step in Sass.** Removes the dependency on `pow()`, and
  turns a CSS retune into redefining every step.

## Revisit when

- Typed arithmetic reaches Baseline. The fluid bounds can then be CSS knobs
  rather than Sass variables.
- Projects routinely ship a `$spaces` that disagrees with their `Register`. That
  is the case for codegen.
