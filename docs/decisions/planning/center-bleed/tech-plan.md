# Full-bleed children of a Center — tech plan

**Status:** not started **Owner:** unassigned **Started:** 2026-10-22 **PRs:** —
**Predecessor:**
[`center-layout`](../../planning/archive/center-layout/tech-plan.md)

## Problem

A region inside a centred column often has to reach the page's edges: a hero
image in an article, a full-width band in CMS prose. ADR 0001 § 4 makes that
structural, a full-width sibling of the Centers in a page `Stack` with its own
Center inside. That works where the author writes the markup and fails where the
content arrives as one block of HTML. `Center` exists (ADR 0009), so the bleed
has a column to break out of.

## Approach

David Bushell's container-unit breakout, adapted. Each Center assigns a
registered width, which computes once, on the Center, against its nearest query
container, and the bleed reads it:

```scss
@property --el-center-bleed-width {
  syntax: "<length-percentage>";
  inherits: true;
  initial-value: 100%;
}

@layer el.defaults {
  .el-center {
    --el-center-bleed-width: 100cqi;
  }
}

.el-center__bleed {
  box-sizing: border-box;
  inline-size: var(--el-center-bleed-width);
  max-inline-size: none;
  margin-inline: calc(50% - var(--el-center-bleed-width) / 2);
}
```

- **`100cqi` is the nearest query container's content box**, or the small
  viewport when there is none, which brings back the classic scrollbar's
  overflow. The consumer makes the page root a container.
- **Registered,** so a container between the Center and its bleed, or the Center
  itself made a container, doesn't change what the bleed reaches. Outside any
  Center the initial `100%` makes the bleed inert.
- **`max-inline-size: none`** beats a product's `img { max-width: 100% }`, and
  `border-box` keeps a padded band from overflowing by its padding.
- **The geometry needs the Center centred in that container,** and the bleed in
  a full-width column of the Center: a direct child, or a child of a `Stack`
  merged onto it.
- **The knob caps the bleed:** `--el-center-bleed-width: min(100cqi, 120rem)` on
  the Center's own class keeps a band centred on a wide screen.

**Rejected:** full-bleed grid tracks (ADR 0009, Alternatives); `100vw` with
`overflow-x: hidden` on `body`, which crops a few pixels either side under a
classic scrollbar; `scrollbar-gutter: stable`, which reserves a gutter on a page
that doesn't scroll.

## Constraints & decisions

- **Supersedes ADR 0001 § 4 for a Center's children,** in a new ADR. § 4 forbids
  a child cancelling its parent's inset with a negative margin, and this is that
  child.
- **Done means:** in a page whose root is a query container, with a classic
  scrollbar showing, a bleed child of a Center spans the container's content box
  at every width and gutter, with no horizontal overflow. It does so with the
  Center made a container too, inside a merged `Stack` aligned `stretch` or
  `center`, and on an `<img>` under a `max-width: 100%` reset. Outside any
  Center it is inert.

## Steps

- [ ] **Settle the open questions.**
- [ ] **Record the decision** in a new ADR superseding ADR 0001 § 4 for a
      Center's children, and mark § 4 as superseded in part.
- [ ] **The bleed rule** in `center.scss` with its registration and layered
      default, and the API the first open question settles.
- [ ] **The stories,** asserting the done-means geometry, each guard proved by
      breaking it: the registration, `max-inline-size: none` and `border-box`.
- [ ] **The README:** the container on the page root, and the cap.
- [ ] `yarn lint && yarn format:check && yarn check:markdown && yarn typecheck && yarn build && yarn test`
- [ ] A changeset for every consumer-facing change (`yarn changeset`)
- [ ] Set `Status:` to `complete` in the PR that finishes the work, and archive
      the plan in that same PR if it closes the last open step

## Open questions

- **What is the bleed's API?** A compound `Center.Root` and `Center.Bleed` (ADR
  0008 § 2's shape), `Center` beside a flat `CenterBleed`, and a class alone
  were set aside on 2026-10-22 for an answer not yet named.
- **Does the library declare the page container?** The bleed needs one, and ADR
  0004 § 4 leaves every container outside a layout of definite width to the
  consumer.

## Notes

The technique is from David Bushell,
[Fixing full-bleed CSS](https://dbushell.com/2026/07/03/fixing-full-bleed-css/)
(2026-07-03). His nested-container fix registers the width on an element below
`body`; here each Center plays that part. Nothing above is measured yet; the
stories in Steps are the measurement.
