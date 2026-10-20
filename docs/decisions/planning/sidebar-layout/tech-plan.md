# Sidebar layout primitive — tech plan

**Status:** implemented **Owner:** unassigned **Recorded:** 2026-10-15

## Problem

Two unequal parts side by side that stack when there isn't room: an image beside
text (the OOCSS media object), a filter panel beside results, a search button
beside its input. Products build it with a media query at a guessed viewport
width, so it stacks too late in a narrow container and too early in a wide one.

Every Layout's Sidebar wraps on the content's own proportion instead. The main
part has a minimum share of the row, and the pair wraps exactly when the main
part would be narrower than that.

## Approach

ADR 0008 holds the design.

## Constraints

- **ADR 0001 § 1.** Passes. The grow ratio, the zero basis and `min-inline-size`
  together are the wrap trigger, and a caller writing `flex: 1` on both parts
  gets equal halves that squeeze and never wrap. The reset is Cluster's, on both
  axes.
- **ADR 0004.** `space` is one step; nothing about the switch is a breakpoint.

## Decisions

The wrap trigger and grow ratio, the compound parts and their exports, the
knobs, the `stretch` default and containment are ADR 0008.

## Steps

- [x] Record the decision as ADR 0008.
- [x] The mixins, the compiled stylesheet, the components and their stories,
      following the Grid plan's steps.
