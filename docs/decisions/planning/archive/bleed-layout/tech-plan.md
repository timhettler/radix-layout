# Bleed layout primitive — tech plan

**Status:** complete **Owner:** unassigned **Started:** 2026-10-22
**Completed:** 2026-10-22 **PRs:** #20 **Predecessor:**
[`center-layout`](../../archive/center-layout/tech-plan.md)

## Problem

A region inside a centred column often has to reach the page's edges: a hero
image in an article, a full-width band in CMS prose. ADR 0001 § 4 makes that
structural, a full-width sibling of the column with its own Center inside. That
works where the author writes the markup and fails where the content arrives as
one block of HTML.

## Approach

ADR 0010 holds the design: `BleedBoundary` as the query container, a registered
`--el-bleed-width` computed on its children, and `Bleed` and a `bleed` mixin
centring on their parent with negative margins.

**Rejected:** ADR 0010's alternatives.

## Constraints & decisions

- **Supersedes ADR 0001 § 4 and ADR 0004 § 4 in part,** in ADR 0010.
- **Done means:** in a boundary with a classic scrollbar showing, a bleed in a
  centred column spans the boundary's content box at every width and gutter,
  with no horizontal overflow. It does so with containers between them, the
  column included, inside a merged `Stack` aligned `stretch` or `center`, and on
  an `<img>` under a `max-width: 100%` reset. Outside any boundary it is inert.
  Measured in the stories, 2026-10-22.

## Steps

- [x] **Settle the open questions.**
- [x] **Record the decision** in ADR 0010, and mark ADR 0001 § 4 and ADR 0004 §
      4 as superseded in part.
- [x] **The rule** in `bleed.scss`, the `bleed` mixin in `_layout.scss` behind a
      `mixins` Sass entry, and `Bleed` and `BleedBoundary`.
- [x] **The stories,** asserting the done-means geometry, each guard proved by
      breaking it: the registration, `max-inline-size: none`, `border-box`, the
      per-boundary cap default and the width's placement on the boundary's
      children.
- [x] **The README:** the boundary, the cap and the mixin.
- [x] `yarn lint && yarn format:check && yarn check:markdown && yarn typecheck && yarn build && yarn test`
- [x] A changeset for every consumer-facing change (`yarn changeset`)
- [x] Set `Status:` to `complete` in the PR that finishes the work, and archive
      the plan in that same PR if it closes the last open step

## Open questions

- ~~**What is the bleed's API?**~~ — **answered 2026-10-22:** two flat
  components, `Bleed` and `BleedBoundary`, which can sit files apart, and a
  `bleed` mixin for HTML a consumer doesn't author (ADR 0010 § 4).
- ~~**Does the library declare the page container?**~~ — **answered
  2026-10-22:** `BleedBoundary` is the container, around the page or a narrower
  region (ADR 0010 § 3).
