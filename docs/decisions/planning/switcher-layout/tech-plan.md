# Switcher layout primitive — tech plan

**Status:** stub, not started **Owner:** unassigned **Recorded:** 2026-10-15

## Problem

A row of peers that should sit side by side or all stack, never split two and
one: pricing tiers, a pair of form fields, feature columns. `Cluster` wraps them
one at a time, and a media query switches them at a viewport width that has
nothing to do with the space the row is given (ADR 0005 § 3).

Every Layout's Switcher switches every item at once when its container is
narrower than a threshold, with no query and no `container-type`.

## Approach (to be designed)

A sketch, not a decision:

```scss
.el-switcher {
  display: flex;
  flex-wrap: wrap;
  gap: …; // data-space, on the shared scale

  > * {
    flex-grow: 1;
    flex-basis: calc((var(--el-switcher-threshold) - 100%) * 999);
    margin: 0;
  }
}
// past the item limit, always a column
.el-switcher[data-limit="4"] > :nth-last-child(n + 5),
.el-switcher[data-limit="4"] > :nth-last-child(n + 5) ~ * {
  flex-basis: 100%;
}
```

- **The basis does the switching.** Above the threshold it is negative, clamps
  to zero, and the items share the row equally; below, it is huge and each item
  takes a line.
- **The threshold is a public custom property** with a layered default. It is a
  length off the space scale, so not a prop (ADR 0002). In `rem` or `ch` it
  scales with text.
- **The item limit is a `data-*` axis**, one rule per value, since `:nth-child`
  cannot read a custom property.

## Constraints

- **ADR 0001 § 1.** Likely passes. The `999` basis and the limit are not things
  a caller would write, and a caller's media-query version switches on the
  viewport instead of the row.
- **The row is equal width.** `flex-grow: 1` on every item is the mechanism, so
  a natural-width row is `Cluster`'s flow knob (ADR 0005 § 4), not an axis here.

## Open questions

- **Threshold from the item count.** `:has(> :nth-child(n))` can count items, so
  the threshold could be the count times a minimum item width. That comes closer
  to "switch when the items no longer fit" than one fixed length. Test it before
  relying on it.
- **The default threshold**, and whether a short vocabulary of thresholds covers
  real cases well enough to be a prop.
- **Are items query containers?** Their width comes from the row, but
  containment removes their min-content floor, so an item could squeeze below
  its content in the row state.

## Steps

- [ ] Answer the open questions; record the decision as an ADR.
- [ ] The mixin, the compiled stylesheet, the component and its stories,
      following the Grid plan's steps.
