# Responsive rhythmic scale — tech plan

**Status:** stub, not started **Owner:** unassigned **Recorded:** 2026-10-14

## Problem

The space scale in `lib/src/scss/_space.scss` is **FPO**. It is a naive linear
stepping: multiples of `0.25rem`, named by their multiplier (`1` … `30`). It was
carried over from EJDS's token steps so `Stack` and `Cluster` had something to
render. It has none of the properties a layout library's scale should have:

- **No rhythm.** The steps are evenly spaced arithmetic increments rather than a
  ratio. Adjacent steps are hard to tell apart at the top of the scale (`24` and
  `30`), and the gaps (`5`, `7`, …) exist only because some multipliers were
  never picked.
- **Not responsive.** Every step is one fixed length at every viewport. A
  generous gap on desktop is the same gap on a phone.
- **Names that encode values.** `space="4"` means "4 × 0.25rem". Change a value
  and the name lies; change the name and every consumer's markup breaks.

Every Layout's own answer is a **modular scale**: a base and a ratio, with each
step the previous one multiplied by the ratio. Combined with fluid sizing, every
step interpolates between a minimum and a maximum across a viewport (or
container) range. Together that is a responsive rhythmic scale.

## Approach (to be designed)

A sketch, not a decision:

```scss
// public knobs, layered defaults (ADR 0003)
@layer el.defaults {
  :root {
    --el-space-base: 1rem;
    --el-space-ratio: 1.5;
    // each step fluid between a min and max, e.g. via clamp()
  }
}
```

- Steps named by **position**, not value: `s-2 … s0 … s5`, or `xs … xl`.
- Each step is a `clamp(min, preferred, max)` in `cqi`, left unregistered, so it
  grows with the layout's nearest container and needs no breakpoints (ADR 0004 §
  2).
- The base, ratio and the fluid range are public custom properties, so a
  consumer retunes the whole scale with a few declarations rather than remapping
  every step.

## Constraints

- **Breaking change to the `space` vocabulary.** Renaming the steps changes
  every `space` prop and `data-space` value. It lands before 1.0, which is the
  reason to do it soon, and needs a changeset that says so plainly.
- **The vocabulary check stays.** Whatever the steps become, `space.ts` and
  `_space.scss` must still agree, and the stories must still scrape and measure.
- **ADR 0003 applies unchanged.** The scale's knobs are public custom
  properties, so their defaults are layered.
- **Grid's gutter default** (Grid plan § Open questions) should come from this
  scale, so settle this first or at the same time.
- **The step names are the contract; the values are defaults** (ADR 0004 § 3). A
  consumer may redefine any step, stepped per media query or fluid between their
  own screen widths, so name for position and document the redefinition pattern.

## Open questions

- **Ratio and base.** Which ratio? 1.5 is Every Layout's default; a musical
  ratio like 1.25 or 1.333 is gentler. And is the base `1rem` or tied to the
  type scale?
- **How many steps, and their names?** Position names (`s-2 … s5`) or T-shirt
  sizes. Negative steps are needed for tight gaps.
- **Can a ratio-derived scale stay CSS-only?** `calc()` handles multiplication
  and `clamp()` handles the fluid range. Fluid _interpolation_ between two
  ratios (a tighter ratio on small screens) needs `pow()`, which is newer CSS;
  check browser support before relying on it, or precompute the steps in Sass.
- **Does the type scale belong here?** A shared rhythm usually means space and
  type share a base and ratio. This is a layout library; type is out of scope
  unless the scale is published for consumers to build type on.

## Steps

- [ ] Answer the open questions; record the decision as an ADR.
- [ ] Replace `$spaces` in `_space.scss` and `SPACE_PROPERTY` in `space.ts`.
- [ ] Emit the knobs and the derived steps from `defaults.scss`, layered.
- [ ] Update the stories: the vocabulary scrape, and gap measurements at two
      container widths to prove the steps are fluid.
- [ ] Document in `lib/README.md` how to redefine steps per media query and
      where to declare query containers (ADR 0004 § 3–4).
- [ ] Remove the FPO notes from `_space.scss`, `space.ts` and `lib/README.md`.
- [ ] A changeset marking the `space` rename as breaking.
