# @timhettler/radix-layout

[Every Layout](https://every-layout.dev)'s layout primitives as Radix-style
React components. Each is a `div` (or, with `asChild`, your own element)
carrying a class and `data-*` attributes; the layout itself is a static
stylesheet you load once.

```sh
yarn add @timhettler/radix-layout
```

## Load the CSS

Without it the components render unstyled `div`s.

```ts
import "@timhettler/radix-layout/styles.css";
```

Or selectively — `defaults.css` is required by every layout:

```ts
import "@timhettler/radix-layout/defaults.css";
import "@timhettler/radix-layout/stack.css";
```

### With your own cascade layers

If your CSS uses its own cascade layers, as Tailwind v4 does, put this at the
top of your entry stylesheet:

```css
@layer el.defaults;
@import "tailwindcss";
```

Without it, when your stylesheet loads first, a knob set from one of your layers
on `:root` or on the layout itself, such as a `[--el-switcher-min:18rem]`
utility on a `Switcher`, keeps the default and nothing reports it.

## Stack

Children in a column, spaced by a step on the space scale. Never wraps.

```tsx
import { Stack } from "@timhettler/radix-layout";

<Stack space="m">
  <h2>Notification settings</h2>
  <p>Choose how and when we get in touch.</p>
</Stack>;
```

| Prop      | Values                                   | Default   |
| --------- | ---------------------------------------- | --------- |
| `space`   | a step from [`spaces`](#the-space-scale) | required  |
| `align`   | `start` `center` `end` `stretch`         | `stretch` |
| `asChild` | `boolean`                                | `false`   |

Children's block margins are zeroed, so a `<p>`'s UA margin does not add to the
gap. Inline margins are left alone, so `margin-inline: auto` still centres a
child.

## Cluster

Children in a row, spaced by a step on the space scale, wrapping when they run
out of room.

```tsx
import { Cluster } from "@timhettler/radix-layout";

<Cluster space="s" justify="between">
  <button>Back</button>
  <button>Continue</button>
</Cluster>;
```

| Prop      | Values                                   | Default  |
| --------- | ---------------------------------------- | -------- |
| `space`   | a step from [`spaces`](#the-space-scale) | required |
| `justify` | `start` `center` `end` `between`         | `start`  |
| `align`   | `start` `center` `end` `stretch`         | `center` |
| `display` | `block` `inline`                         | `block`  |
| `asChild` | `boolean`                                | `false`  |

Children's margins are zeroed on both axes.

### Stack below your breakpoint

Set `--el-cluster-flow: stack` on the cluster's own class, under your own media
or container query, and every child takes a full-width line of its own. The
breakpoint is yours; the library publishes none.

```css
@container (width < 30rem) {
  .checkout-actions {
    --el-cluster-flow: stack;
  }
}
```

The property doesn't inherit, so set on an ancestor it does nothing, and a
cluster nested inside a stacked one keeps wrapping. The values are exported as
`clusterFlows`. Stacked children are always full width; for a column whose
children keep their own width, use `Stack`.

## Switcher

Children in one row of equal widths, or all stacked, never split two and one.
Every child stacks at once when any would be narrower than `min`, so the switch
follows the space the switcher is given, not the viewport.

```tsx
import { Switcher } from "@timhettler/radix-layout";

<Switcher space="m" min="s">
  <PlanCard plan="basic" />
  <PlanCard plan="pro" />
  <PlanCard plan="team" />
</Switcher>;
```

| Prop      | Values                                   | Default  |
| --------- | ---------------------------------------- | -------- |
| `space`   | a step from [`spaces`](#the-space-scale) | required |
| `min`     | `s` (10rem) `m` (15rem) `l` (20rem)      | `m`      |
| `asChild` | `boolean`                                | `false`  |

The row needs every child at `min` plus the gaps, so three children at `min="s"`
need `30rem` and two gaps. Every child counts, including one hidden with
`display: none`; leave a child out of the render to remove it.

A child's content never sizes it, so content wider than its share overflows, and
the fix is a larger `min`. Each child is an inline-size query container, so the
layouts inside it space themselves for the child's width (see
[The space scale](#the-space-scale)).

For a minimum off the list, set `--el-switcher-min` on a class of your own on
the switcher. `--el-switcher-space` sets the gap, as a length rather than a step
name. Both take any length, and the switch point follows both:

```css
.plan-tiers {
  --el-switcher-min: 18rem;
  --el-switcher-space: var(--el-space-l);
}
```

Children's margins are zeroed on both axes.

## Sidebar

Two unequal parts side by side, stacking when the content would be narrower than
its share of the row: the media object, a filter panel beside results, a button
beside its input. The switch follows the space the sidebar is given, not the
viewport.

```tsx
import { Sidebar } from "@timhettler/radix-layout";

<Sidebar.Root space="m">
  <Sidebar.Side>
    <img src="avatar.jpg" alt="" width="160" height="160" />
  </Sidebar.Side>
  <Sidebar.Content>
    <p>…</p>
  </Sidebar.Content>
</Sidebar.Root>;
```

The parts are also exported as `SidebarRoot`, `SidebarSide` and
`SidebarContent`.

| Prop (`Root`) | Values                                   | Default   |
| ------------- | ---------------------------------------- | --------- |
| `space`       | a step from [`spaces`](#the-space-scale) | required  |
| `align`       | `start` `center` `end` `stretch`         | `stretch` |
| `asChild`     | `boolean`                                | `false`   |

`Side` and `Content` take `asChild`. Put them in reading order: whichever comes
first sits at the start and stacks on top. To nest a sidebar, put it inside a
part rather than merging the two with `asChild`.

The side is its content's width, which suits an image or a button. A side of
running text needs a width, or it always stacks. The pair stacks when the
content would be under half the row, so it holds while the row is at least
`2 × (side + gap)`. Set `--el-sidebar-side-width` or `--el-sidebar-content-min`
on a class of your own on the root or on the part. The content minimum takes a
percentage or a reading width such as `30ch`:

```css
.filters-layout {
  --el-sidebar-side-width: 18rem;
  --el-sidebar-content-min: 60%;
}
```

Both lengths measure a part's content box, so padding or a border on a part
moves the wrap point unless the part is `box-sizing: border-box`.

`stretch` makes both parts the height of the taller. Put an image inside `Side`
rather than making it the side with `asChild`: stacked, the side fills its line,
and so would the image. Content wider than the content part overflows it rather
than pushing the side, over the side when the content comes first. Neither part
is a query container; add `container-type` on your own class.

Children's margins are zeroed on both axes.

## Center

A column centred in its parent, filling it up to a maximum width, with a gutter
either side when the parent is narrower: an article held to a readable measure,
or a page container.

```tsx
import { Center } from "@timhettler/radix-layout";

<Center gutter="m">
  <h1>…</h1>
  <p>…</p>
</Center>;
```

| Prop      | Values                                   | Default   |
| --------- | ---------------------------------------- | --------- |
| `gutter`  | a step from [`spaces`](#the-space-scale) | no gutter |
| `asChild` | `boolean`                                | `false`   |

The content is at most `--el-center-max` wide, `60ch` in the center's own font,
and the gutter is added outside it. For a page container, set the width on a
class of your own, and `--el-center-gutter` for a gutter off the scale:

```css
.page {
  --el-center-max: 90rem;
  --el-center-gutter: max(1rem, 5%);
}
```

Padding of your own on a center comes out of the measure, so set the inset with
the gutter.

To centre children narrower than the column, such as a button, merge it onto a
`Stack`. Running text still fills the column:

```tsx
<Center asChild gutter="m">
  <Stack space="m" align="center">
    <p>…</p>
    <button type="button">Launch demo</button>
  </Stack>
</Center>
```

Block margins are left alone. Put a center inside a `Cluster`, `Switcher` or
`Sidebar` child, not as the child itself.

## Bleed

A child of a centred column that reaches the edges of the nearest
`BleedBoundary` above it: a hero image or a full-width band in an article.

Put the boundary once around the page, or around a region a bleed should stop
at, wrapping the column rather than merged onto it. The bleed can sit any depth
below it:

```tsx
import { Bleed, BleedBoundary, Center, Stack } from "@timhettler/radix-layout";

// layout.tsx
<BleedBoundary className="page">{children}</BleedBoundary>;

// article.tsx
<Center asChild gutter="m">
  <Stack space="m">
    <p>…</p>
    <Bleed asChild>
      <img src="hero.jpg" alt="…" />
    </Bleed>
  </Stack>
</Center>;
```

Both take `asChild`. Outside a boundary, a bleed is its parent's width. Its
parent must be centred in the boundary, as a `Center` is; as a `Cluster`,
`Switcher` or `Sidebar` child it isn't supported. Padding of your own stays
inside the bleed, and it overrides a `max-width: 100%` reset on images. To hold
a band's content to a column, nest a `Center` inside the bleed rather than
merging the two with `asChild`.

The boundary is an inline-size query container, so it needs a width from its
parent, and space steps inside it are fluid against it. To cap every bleed in a
boundary, centred on it, set `--el-bleed-max` to a length on the boundary's own
class; on `:root` or another ancestor it does nothing:

```css
.page {
  --el-bleed-max: 120rem;
}
```

For HTML you don't author, such as CMS output, include the bleed's rule on your
own selector. The `mixins` entry emits no CSS, and its `pkg:` URL needs the same
setup as [your own steps](#use-your-own-steps):

```scss
@use "pkg:@timhettler/radix-layout/mixins" as el;

.prose .alignfull {
  @include el.bleed;
}
```

Without Sass, write what it compiles to:

```css
.prose .alignfull {
  box-sizing: border-box;
  inline-size: var(--el-bleed-width);
  max-inline-size: none;
  margin-inline: calc(50% - var(--el-bleed-width) / 2);
}
```

## Cover

A column at least the viewport's height with one child in the middle of the
space its siblings leave: a hero with an optional header above and footer below.
Content taller than the minimum grows the cover, with `space` between the parts.

```tsx
import { Cover } from "@timhettler/radix-layout";

<Cover.Root space="m">
  <header>…</header>
  <Cover.Centered asChild>
    <h1>…</h1>
  </Cover.Centered>
  <p>…</p>
</Cover.Root>;
```

The parts are also exported as `CoverRoot` and `CoverCentered`.

| Prop (`Root`) | Values                                   | Default  |
| ------------- | ---------------------------------------- | -------- |
| `space`       | a step from [`spaces`](#the-space-scale) | required |
| `asChild`     | `boolean`                                | `false`  |

`Centered` takes `asChild`. Use one per cover. The minimum is `--el-cover-min`,
`100svh`, so a footer clears a mobile browser's toolbar; set it on your own
class on the root:

```css
.hero {
  --el-cover-min: calc(100svh - var(--site-header-height));
  box-sizing: border-box;
  padding: 2rem;
}
```

Padding of your own adds to the minimum unless the root is
`box-sizing: border-box`. A block margin you set on `Centered` with two classes
or more replaces the centring. Cover centres vertically only: put a `Center`
around it or inside a part, or set `text-align`.

## Frame

A box of a fixed aspect ratio that crops its content: it fills the inline space
it's given and takes its height from the ratio.

```tsx
import { Frame } from "@timhettler/radix-layout";

<Frame ratio="4:5">
  <img src="…" alt="…" />
</Frame>;
```

| Prop      | Values                                          | Default |
| --------- | ----------------------------------------------- | ------- |
| `ratio`   | `1:1`, `16:9` or `4:5`, listed in `frameRatios` | `16:9`  |
| `asChild` | `boolean`                                       | `false` |

A child `img`, `video`, `iframe` or `picture` fills the frame and is cropped by
`object-fit: cover`. Any other child is centred and clipped where it's taller
than the frame; give it a `min-inline-size` over `100%` to crop it across. The
fill is `!important`, so a reset such as `.prose img { height: auto }` can't
undo it. Set `object-position` on the child to move the focal point, or
`object-fit: contain` with two classes, such as `.el-frame > .letterbox`, to
letterbox it.

For any other ratio, or to change it at a breakpoint, set `--el-frame-ratio` on
your own class:

```css
.hero-image {
  --el-frame-ratio: 3 / 2;
}

@media (orientation: portrait) {
  .hero-image {
    --el-frame-ratio: 1 / 1;
  }
}
```

A frame has no width of its own, so give it one in a flex row, such as a
`Cluster` or another `Frame`, and in a `Stack` aligned other than `stretch`.

## `asChild`

Renders your element instead of a `div`, merging the layout's class and
attributes onto it — the same contract as every Radix primitive.

```tsx
<Cluster asChild space="xs">
  <ul role="list">
    <li>…</li>
  </ul>
</Cluster>
```

## The space scale

The default steps are exported as `spaces`: `xs` `s` `m` `l` `xl` `2xl`. `m` is
`--el-space-base`, and each step up or down multiplies or divides by
`--el-space-ratio` (1.5). Each step is a custom property, `--el-space-<step>`.

The base is fluid: `0.75rem` in a container `20rem` wide or narrower, growing to
`0.9375rem` at `80rem`, so every step grows with the room a layout is given.
"Container" means the layout's nearest
[query container](https://developer.mozilla.org/docs/Web/CSS/CSS_containment/Container_queries),
or the viewport when there is none. Declare one on your own element, such as a
card or a sidebar, and the layouts inside it space themselves for its width:

```css
.card {
  container-type: inline-size;
}
```

Don't declare one on an element sized by its content, such as a `Cluster` child:
inline-size containment collapses it.

Your rule beats these defaults whatever its specificity or the order your
stylesheets load in. If your CSS uses cascade layers, see
[With your own cascade layers](#with-your-own-cascade-layers).

### Retune the scale

Set the knobs on `:root`. The steps read them there, so a knob set on any other
element changes nothing.

```css
:root {
  --el-space-base: 1rem;
  --el-space-ratio: 1.25;
}
```

### Redefine a step

A step name is the contract and its value is a default. Map a step to your own
token, or step it per breakpoint when your design specs one value per screen:

```css
:root {
  --el-space-l: var(--my-space-md);
}

@media (width >= 64rem) {
  :root {
    --el-space-l: var(--my-space-lg);
  }
}
```

### Use your own steps

When your design system's names or number of steps differ, compile the
stylesheet with your own scale in place of loading `styles.css`. Each value is
either an exponent on the ratio or a value as written:

```scss
@use "pkg:@timhettler/radix-layout" with (
  $spaces: (
    "xs": var(--ds-space-xs),
    "sm": var(--ds-space-sm),
    "md": 0,
    "lg": 1,
  )
);
```

`$ratio`, `$base-min`, `$base-max`, `$fluid-min` and `$fluid-max` configure the
same way. The `pkg:` URL needs Dart Sass 1.71 or later with its
`NodePackageImporter`; in Vite, set
`css.preprocessorOptions.scss.importers: [new NodePackageImporter()]`.

Then give `space` the same names:

```ts
declare module "@timhettler/radix-layout" {
  interface Register {
    space: "xs" | "sm" | "md" | "lg";
  }
}
```

Keep the two lists in step. A name missing from the Sass renders with no gap,
and nothing reports it.

## Design notes

The reasoning behind the API lives in [`docs/decisions`](../docs/decisions):
what earns a layout a component (and why there is no `Box`), why the styling is
static CSS, and how the overridable defaults work.
