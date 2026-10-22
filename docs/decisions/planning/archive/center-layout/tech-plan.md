# Center layout primitive — tech plan

**Status:** complete **Owner:** unassigned **Started:** 2026-10-22
**Completed:** 2026-10-22 **PRs:** #19

## Problem

A page container, a column capped at a width, centred, with a minimum gutter, is
written by hand in each product or built into the product's grid as a variant,
which ties the grid to the top of the page. Every Layout's Center is that
container as a layout of its own, and its intrinsic centering covers a column of
short content such as buttons.

## Approach

ADR 0009 holds the design: a Center that fills its parent up to
`--el-center-max`, a `gutter` prop on the space scale backed by a registered
`--el-center-gutter`, and intrinsic centering as a `Stack` merged onto it with
`asChild`.

**Rejected:** Every Layout's CSS as published, which shrinks to its content as a
`Stack` child. The rest are ADR 0009's alternatives.

## Constraints & decisions

- **ADR 0001 § 1.** Passes on two silent failures: the shrink-wrap in a flex or
  grid parent, and a unitless gutter uncapping the Center (ADR 0009 §§ 1–2).
- **ADR 0004.** `gutter` is one step; nothing about the column is a breakpoint.
- **Public API:** `Center`, `CenterProps`, `.el-center`, `data-gutter`,
  `--el-center-max`, `--el-center-gutter` and `center.css`.
- **Out of scope:** a holy-grail page layout, and a minimum height.
- **Done means:** a bare `Center` caps its content at `60ch` and centres it; a
  `Center` in a `Stack` fills it up to the cap whatever its content;
  `<Center asChild><Stack align="center">` centres a button in the column; and a
  consumer class setting either knob wins regardless of load order.

## Steps

- [x] Record the decision as ADR 0009.
- [x] **The mixin and stylesheet:** `@mixin center` in `_layout.scss`, and
      `center.scss` with the registration and the layered defaults, added to
      `styles.scss`, `ENTRIES` and `exports`.
- [x] **The component:** `lib/src/Center.tsx` on `Primitive.div`, exported from
      `main.ts`.
- [x] **The stories,** each guard proved by breaking it: the `inline-size`, the
      doubled gutter, the layered max default and the registration.
- [x] **The README section,** and the Grid plan's page-container line pointing
      at `Center`.
- [x] `yarn lint && yarn format:check && yarn check:markdown && yarn typecheck && yarn build && yarn test`
- [x] A changeset for every consumer-facing change (`yarn changeset`)
- [x] Set `Status:` to `complete` in the PR that finishes the work, and archive
      the plan in that same PR if it closes the last open step

## Deferred / follow-ups

- **Full-bleed children of a Center**, for content whose structure isn't the
  author's, such as CMS prose. Cut so this plan doesn't wait on reversing ADR
  0001 § 4; it is [`center-bleed`](../../../planning/center-bleed/tech-plan.md).
