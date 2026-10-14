# Responsive layouts — open questions

**Status:** open; the next ADR after the repo is initialised. **Recorded:**
2026-10-13

Not a decision. This records the question, and the shape it took during the
port, so the ADR has a starting point.

## The motivating case

A component that is a `Cluster` on desktop and a `Stack` on mobile. In EJDS it
was hard to see how that would work, and the difficulty is that "responsive"
covers two different problems.

## 1. A value that varies by viewport

A column span, a gap, a column count. The Grid plan's mechanism is the
candidate general answer: **publish a custom property, layer its default
(ADR 0003), and let the consumer set it in their own media or container
query.** The library never publishes breakpoints, and the static case stays a
prop.

For `Stack` and `Cluster` that would mean `data-space` rules reading an
overridable property — `gap: var(--el-stack-space, var(--el-space-4))` or
similar — so a consumer class can change the step at their breakpoint. Open:
whether the knob is a step name or a length, and whether it is per component
(`--el-stack-space`) or shared.

## 2. A layout that changes shape

Row on desktop, column on mobile. This is **not** a `Cluster` or `Stack`
concern: the two differ in more than direction — one always wraps and the other
never can, they reset different margin axes, and their cross-axis defaults
differ — so a prop that flips one into the other would be a third layout wearing
a familiar name. Candidates:

- **Every Layout's `Switcher`.** Items sit in a row until the _container_ is
  narrower than a threshold, then all switch to a column at once, with no media
  query (`flex-basis: calc((var(--threshold) - 100%) * 999)`). Intrinsic, so it
  responds to the space it is given rather than the viewport. Needs its own
  ADR 0001 § 1 test; it likely passes, on the `999` mechanism and the item-count
  limit a caller would not think of.
- **A container-query variant.** An element that is a cluster above a
  container width and a stack below it, with the threshold as a public custom
  property. Container queries cannot read a custom property in the condition,
  which constrains how the threshold could be published.
- **The consumer owns it.** They write the switch in their own CSS, perhaps on
  top of the mixins if those were ever published.

**Ruled out: swapping components in JavaScript** (`matchMedia` choosing between
`<Cluster>` and `<Stack>`). It cannot know the width during server render, so it
renders the wrong layout first and corrects after hydration — a visible flash
and a hydration mismatch.

## Why deferring was safe

Nothing in the initial `Stack` / `Cluster` port closes any of these off. Making
`data-space` read an overridable property is additive and non-breaking, and a
`Switcher` is a new component.
