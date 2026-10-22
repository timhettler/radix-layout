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

Every `--el-*` default sits in `@layer el.defaults`, so an unlayered rule of
yours beats it whatever its specificity or the order your stylesheets load in. A
rule inside one of your own layers, such as a Tailwind v4 utility, beats it only
when `el.defaults` is declared first. Put the statement at the top of your entry
stylesheet:

```css
@layer el.defaults;
@import "tailwindcss";
```

Without it, whichever stylesheet loads first decides, and when yours does, the
defaults beat every layer of yours with nothing reporting it.

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

Every default sits in `@layer el.defaults`, so your rule wins whatever its
specificity or the order your stylesheets load in. If your CSS uses cascade
layers, declare `el.defaults` first; see
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
