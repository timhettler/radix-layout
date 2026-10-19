# Switcher layout primitive — tech plan

**Status:** implemented **Owner:** unassigned **Recorded:** 2026-10-15

## Problem

A row of peers that should sit side by side or all stack, never split two and
one: pricing tiers, a pair of form fields, feature columns. `Cluster` wraps them
one at a time, and a media query switches them at a viewport width that has
nothing to do with the space the row is given (ADR 0005 § 3).

Every Layout's Switcher switches every item at once when its container is
narrower than a threshold, with no query and no `container-type`.

## Approach

A sketch; ADR 0007 holds the decision:

```scss
.el-switcher {
  display: flex;
  flex-wrap: wrap;

  > * {
    $min: var(--el-switcher-min);
    $gap: var(--el-switcher-space);
    $n: sibling-count();

    flex-grow: 1;
    flex-basis: min(100%, max(0px, ($min * $n + $gap * ($n - 1) - 100%) * 1e9));
    min-inline-size: 0;
    margin: 0;
    container-type: inline-size;
    contain-intrinsic-inline-size: $min;
  }
}

.el-switcher[data-space] {
  gap: var(--el-switcher-space); // data-space, on the shared scale
}
```

- **The basis does the switching.** Above the threshold it is zero and the items
  share the row equally; below, it is `100%` and each item takes a line.
- **The threshold follows from the item count and `--el-switcher-min`**, which
  `data-min` sets (ADR 0007 § 3).

## Constraints

- **ADR 0001 § 1.** Passes. The capped basis and the containment pair are not
  things a caller would write, and a caller's media-query version switches on
  the viewport instead of the row.
- **The row is equal width.** `flex-grow: 1` on every item is the mechanism, so
  a natural-width row is `Cluster`'s flow knob (ADR 0005 § 4), not an axis here.

## Decisions

The threshold, the `min` vocabulary and containment are ADR 0007.

## Steps

- [x] Answer the open questions; record the decision as an ADR (ADR 0007).
- [x] The mixin, the compiled stylesheet, the component and its stories,
      following the Grid plan's steps.
