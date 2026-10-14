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

## Stack

Children in a column, spaced by a step on the space scale. Never wraps.

```tsx
import { Stack } from "@timhettler/radix-layout";

<Stack space="4">
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

<Cluster space="3" justify="between">
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

## `asChild`

Renders your element instead of a `div`, merging the layout's class and
attributes onto it — the same contract as every Radix primitive.

```tsx
<Cluster asChild space="2">
  <ul role="list">
    <li>…</li>
  </ul>
</Cluster>
```

## The space scale

> **FPO (for placement only).** The current steps are a naive linear stepping so
> the layouts have something to render. A responsive, rhythmic scale will
> replace them before 1.0, and the step names are likely to change with it.

The accepted steps are exported as `spaces`. Each is a custom property,
`--el-space-<step>`, with a `rem` default. Remap any of them to your own tokens:

```css
:root {
  --el-space-4: var(--my-space-md);
}
```

The defaults sit in `@layer el.defaults`, so your rule wins whatever its
specificity or the order your stylesheets load in.

## Design notes

The reasoning behind the API lives in [`docs/decisions`](../docs/decisions):
what earns a layout a component (and why there is no `Box`), why the styling is
static CSS, and how the overridable defaults work.
