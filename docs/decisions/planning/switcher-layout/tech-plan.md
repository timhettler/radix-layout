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

ADR 0007 holds the design.

## Constraints

- **ADR 0001 § 1.** Passes. The capped basis and the containment pair are not
  things a caller would write, and a caller's media-query version switches on
  the viewport instead of the row.
- **The row is equal width.** `flex-grow: 1` on every item is the mechanism, so
  a natural-width row is `Cluster`'s flow knob (ADR 0005 § 4), not an axis here.

## Decisions

The threshold, the `min` vocabulary and containment are ADR 0007.

## Steps

- [x] Record the decision as ADR 0007.
- [x] The mixin, the compiled stylesheet, the component and its stories,
      following the Grid plan's steps.
