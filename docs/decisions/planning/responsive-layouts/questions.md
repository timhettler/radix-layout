# Responsive layouts — open questions

**Status:** § 1 decided in ADR 0004; § 2 open. Not a decision. **Recorded:**
2026-10-13

## The motivating case

A component that is a `Cluster` on desktop and a `Stack` on mobile. "Responsive"
covers two different problems.

## 1. A value that varies by viewport

Decided in `../../adr/0004-responsive-spacing-is-a-token-concern.md`: responsive
spacing lives in the space scale's step definitions, and a per-instance
exception goes through a per-layout knob such as `--el-stack-space`.

## 2. A layout that changes shape

Row on desktop, column on mobile. This is **not** a `Cluster` or `Stack`
concern: the two differ in more than direction — one always wraps and the other
never can, they reset different margin axes, and their cross-axis defaults
differ — so a prop that flips one into the other would be a third layout wearing
a familiar name. Candidates:

- **Every Layout's `Switcher`.** Items sit in a row until the _container_ is
  narrower than a threshold, then all switch to a column at once, with no media
  query (`flex-basis: calc((var(--threshold) - 100%) * 999)`). Intrinsic, so it
  responds to the space it is given rather than the viewport. Its row is
  equal-width growing items, not a `Cluster` row, so it answers "equal columns
  to a column" rather than the motivating case. The threshold is a length off
  the space scale, so it is likely a public property with a layered default and
  no prop. Needs its own ADR 0001 § 1 test; it likely passes, on the `999`
  mechanism and the item-count limit a caller would not think of.
- **A container-query variant.** An element that is a cluster above a container
  width and a stack below it. An element cannot query itself, so it needs
  `container-type` on its parent or on a wrapper, and that collapses a
  content-sized parent. Container queries cannot read a custom property in the
  condition, so the threshold would be a width published in library CSS.
- **A style-query knob on `Cluster`.** `--el-cluster-flow: stack` set on the
  cluster switches its children to `flex-basis: 100%`, one per line, at the
  consumer's own breakpoint. The consumer writes only a custom property, so
  nothing ties on specificity. Gives `Stack`'s `stretch` look only: `start`
  alignment would need a declaration on the container, which a style query
  cannot reach. Needs the Baseline Newly Available target.
- **The consumer owns it.** They write the switch in their own CSS, perhaps on
  top of the mixins if those were ever published. Overriding `flex-direction` on
  `.el-cluster` ties at 0-1-0, so load order decides.

**Ruled out: swapping components in JavaScript** (`matchMedia` choosing between
`<Cluster>` and `<Stack>`). It cannot know the width during server render, so it
renders the wrong layout first and corrects after hydration — a visible flash
and a hydration mismatch.

## Why deferring was safe

Nothing in the initial `Stack` / `Cluster` port closes any of these off. A
`Switcher` is a new component, and the style-query knob is an additive axis.
