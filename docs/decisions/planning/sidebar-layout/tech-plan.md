# Sidebar layout primitive — tech plan

**Status:** stub, not started **Owner:** unassigned **Recorded:** 2026-10-15

"Sidebar" is Every Layout's name and a working title; see § Open questions.

## Problem

Two unequal parts side by side that stack when there isn't room: an image beside
text (the OOCSS media object), a filter panel beside results, a form label
beside its field. Products build it with a media query at a guessed viewport
width, so it stacks too late in a narrow container and too early in a wide one.

Every Layout's Sidebar wraps on the content's own proportion instead. The main
part has a minimum share of the row, and the pair wraps exactly when the main
part would be narrower than that.

## Approach (to be designed)

A sketch, not a decision:

```scss
.el-sidebar {
  display: flex;
  flex-wrap: wrap;
  gap: …; // data-space, on the shared scale

  > * {
    margin: 0;
  }
}
.el-sidebar__side {
  flex-basis: var(--el-sidebar-side-width); // layered default: auto
  flex-grow: 1;
}
.el-sidebar__content {
  flex-basis: 0;
  flex-grow: 999;
  min-inline-size: var(--el-sidebar-content-min); // layered default: 50%
}
```

- **Compound parts** (`Sidebar.Root` / `Side` / `Content`), as in the Grid plan,
  so the side is marked by its class and not by `:first-child`. DOM order then
  stays the author's choice, and with it the reading order of a side on the
  right.
- **A side width of `auto`** uses the side's content width, such as an image's
  intrinsic width, so the commonest case needs no length.
- **Both lengths are public custom properties, not props.** Neither is on the
  space scale, and a prop would need an arbitrary value (ADR 0002).

## Constraints

- **ADR 0001 § 1.** Likely passes. The `999` grow ratio and `min-inline-size`
  are the wrap trigger, and a caller writing `flex: 1` on both parts gets equal
  halves that squeeze and never wrap.
- **ADR 0004.** The gap is a `data-space` step; nothing about the switch is a
  breakpoint.
- **Cross-axis default.** `stretch` distorts an image that is the side itself,
  so the default is probably `start`, not Cluster's `safe center`.

## Open questions

- **The name.** No one reaches for "sidebar" to build a media object, and the
  library's names are what consumers search for. Keep Every Layout's name and
  document the media object in the JSDoc and README, or name it for its
  commonest use (`Media`) or its shape (`Split`)?
- **When stacked, the side grows to full width.** Fine for a filter panel, wrong
  for a small avatar. Cap it, or leave it to the side's own content?
- **Is `content-min` a vocabulary?** A handful of shares (50%, 60%, 66%) may
  cover every real case, which would make it a prop.
- **Is the content part a query container?** Its width comes from the row, so
  containment should not collapse it (ADR 0004 § 4). The side, sized by its
  content, must never be one.

## Steps

- [ ] Answer the open questions; record the decision as an ADR.
- [ ] The mixin, the compiled stylesheet, the component and its stories,
      following the Grid plan's steps.
