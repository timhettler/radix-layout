# ADR 0010 — `Bleed` reaches the edges of its `BleedBoundary`

**Status:** accepted **Date:** 2026-10-22 **Deciders:** Tim Hettler
**Supersedes:** ADR 0001 § 4 and ADR 0004 § 4, in part

## Context

A region inside a centred column often has to reach the page's edges: a hero
image in an article, a full-width band in CMS prose. ADR 0001 § 4 makes that
structural, a full-width sibling of the column with its own `Center` inside.
That works where the author writes the markup and fails where the content
arrives as one block of HTML.

The technique is David Bushell's container-unit breakout,
[Fixing full-bleed CSS](https://dbushell.com/2026/07/03/fixing-full-bleed-css/).
The planning record is `../planning/archive/bleed-layout/tech-plan.md`.

## Decision

### 1. A bleed breaks out of its column by the boundary's width

```scss
.el-bleed {
  box-sizing: border-box;
  inline-size: var(--el-bleed-width);
  max-inline-size: none;
  margin-inline: calc(50% - var(--el-bleed-width) / 2);
}
```

The margins are half the difference between the parent's width and the bleed's,
negative when the bleed is wider, so the bleed is centred on its parent. It
reaches the boundary's edges when that parent is centred in the boundary, as a
`Center` is, or a `Stack` merged onto one.

`max-inline-size: none` beats a product's `img { max-width: 100% }`, so an image
made the bleed still spans. `border-box` keeps padding of the consumer's own
inside the bleed, so a padded band doesn't overflow by its padding.

This supersedes ADR 0001 § 4 for a bleed, which is a child cancelling its
column's inset with a negative margin. The structural answer still suits markup
the author writes.

### 2. The width is registered and computed on the boundary's children

```scss
@property --el-bleed-width {
  syntax: "<length-percentage>";
  inherits: true;
  initial-value: 100%;
}

@layer el.defaults {
  .el-bleed-boundary > * {
    --el-bleed-width: min(100cqi, var(--el-bleed-max));
  }
}
```

`100cqi` resolves against the nearest query container above the element it is
computed on, so it is computed on the boundary's children: on the boundary
itself it would measure the boundary's ancestors. Registered, it computes to
pixels there and inherits as pixels, so a container between the boundary and the
bleed, the column made a container included, doesn't change what the bleed
reaches. That is Bushell's nested-container fix, with the boundary in the place
of his element below `body`.

Outside any boundary, the initial `100%` leaves the bleed its parent's width
with no margins.

### 3. The boundary is a container component

`BleedBoundary` declares `container-type: inline-size`. A bleed can't work
without a container, and a requirement only the README states doesn't show in
the React tree that needs it. A boundary can also be narrower than the page,
around a region a bleed should stop at.

This supersedes ADR 0004 § 4 for the boundary: the library declares it, and its
width comes from its parent. The failure that section names still holds: in a
content-sized slot, such as a `Cluster` child, a boundary collapses, and its
JSDoc says so.

### 4. Two flat components, and a mixin

`Bleed` and `BleedBoundary` are each a `Primitive.div` with `asChild`, exported
flat. They aren't ADR 0008 § 2's parts, whose `Root` is the element holding
them: a boundary goes once in a layout file and a bleed anywhere below it, often
in another file.

For HTML a consumer doesn't author, the bleed's rule is the `bleed` mixin, from
an entry that emits no CSS:

```scss
@use "pkg:@timhettler/radix-layout/mixins" as el;

.prose .alignfull {
  @include el.bleed;
}
```

A project without Sass copies § 1's rule; the README shows it.

### 5. The cap is a knob on the boundary

`--el-bleed-max` caps every bleed in a boundary, centred on it, so a band can
stop short of a very wide screen. It defaults to `100cqi`, assigned on every
`.el-bleed-boundary` in `el.defaults`, so a consumer's rule on the boundary's
class wins regardless of load order (ADR 0003) and a nested boundary never
inherits an outer one's cap. It stays unregistered so the default substitutes on
the boundary's children, where `100cqi` measures the boundary. It takes a
length; a percentage would resolve against the bleed's parent.

## Consequences

- **It passes ADR 0001 § 1** on two silent failures: a container between the
  boundary and the bleed shrinks the reach, and an image under a product's reset
  stays its parent's width.
- **The stories break each guard.** Removing the registration,
  `max-inline-size: none`, `border-box`, the end margin or the layered
  `--el-bleed-max` default, or computing the width on the boundary, fails at
  least one story. They run in Chromium with a classic scrollbar, and also pass
  in WebKit 27.2. Headless Firefox 157 on macOS shows overlay scrollbars, so its
  scrollbar premise fails; the geometry passes.
- **A bleed's parent must be centred in the boundary.** In an off-centre column,
  such as a `Sidebar` part, the bleed lands off-centre and can overflow.
- **A bleed that is a `Cluster`, `Switcher` or `Sidebar` child isn't
  supported.** Their `> * { margin: 0 }` ties with its margins at 0-1-0, so load
  order decides.
- **A boundary merged onto the column with `asChild` is the column,** so its
  bleeds reach the column. Wrap the column.
- **Fluid space steps inside a boundary resolve against it,** not the small
  viewport. At page width that is the viewport less a classic scrollbar.
- **A boundary scopes CSS counters,** as every size container does, and isn't a
  containing block for fixed-position descendants.
- **A bleed outside a boundary doesn't warn.** It is its parent's width, which
  shows on first render, and a warning couldn't see mixin-styled HTML or an
  off-centre parent.

## Alternatives considered

- **Full-bleed grid tracks.** ADR 0009, Alternatives.
- **`100vw` with `overflow-x: hidden` on `body`.** Crops a few pixels either
  side under a classic scrollbar.
- **`scrollbar-gutter: stable`.** Reserves a gutter on a page that doesn't
  scroll.
- **A bleed part of `Center`,** as `Center.Root` and `Center.Bleed`, or a flat
  `CenterBleed`. Any centred parent works, so nothing in the bleed needs a
  `Center`.
- **A class alone.** CMS output carries its own classes, not the library's, and
  the boundary would still be undeclared.
- **`Bleed.Root` and `Bleed.Item`.** Parts that aren't adjacent (§ 4).
- **Each `Center` assigning `100cqi`, so a bleed reaches the nearest query
  container.** Any container a consumer adds moves the reach, and with none the
  bleed reads the small viewport, which includes a classic scrollbar and
  overflows by its width.
- **`defaults.css` making `body` a container.** A layout declaration on an
  element the library doesn't render, for every consumer, bleed or not.

## Revisit when

- Products routinely cap at one length. That is the case for a default cap.
- Real uses put a boundary in a content-sized slot, which would need
  `contain-intrinsic-inline-size`.
