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
specificity or the order your stylesheets load in.

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
