# ADR 0013 — `Frame` crops its content to a ratio

**Status:** accepted **Date:** 2026-10-27 **Deciders:** Tim Hettler

## Context

Every Layout's Frame is a box of a given aspect ratio that acts as a window onto
whatever it holds: media is cropped with `object-fit`, anything else is centred
and clipped. `aspect-ratio` makes the shape one declaration, so the question is
whether the rest earns a layout (ADR 0001 § 1), and what the ratio API is.

## Decision

### 1. Frame is a layout

It passes ADR 0001 § 1 with three failures a caller would hit with
`aspect-ratio` alone. Content taller than the ratio grows the box, because the
automatic minimum size wins over the ratio; `overflow: hidden` removes that
minimum, so the content is cropped. A media child keeps its own proportions
unless it's sized to the box and given `object-fit: cover`, and a reset such as
`.prose img { height: auto }` undoes that sizing. And `object-fit` can't reach
through a `<picture>` to its image.

```scss
.el-frame {
  aspect-ratio: var(--el-frame-ratio);
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  object-fit: cover;
}
```

`object-fit` on the root is inert on a `div`, and crops when `asChild` puts the
frame on an `<img>` or `<video>` itself. Such a root also gets
`inline-size: 100%` at 0-1-0, so it fills as a `div` does; WebKit ignores
`aspect-ratio` on a replaced element whose width is `auto`.

### 2. Three named ratios and a knob, defaulting to `16:9`

`ratio` takes `1:1`, `16:9` or `4:5` and writes `data-ratio`, whose rule assigns
`--el-frame-ratio` in `el.defaults` (ADR 0003), so a consumer's class, or an
orientation media query, beats the prop. Any other ratio is the knob, in
`aspect-ratio` syntax (`3 / 2`).

The default is `16:9` because a Frame is opted into: unlike an image component,
nothing is cropped that the caller didn't wrap.

The knob stays unregistered: there's no `<ratio>` syntax to register, and an
invalid value leaves `aspect-ratio` at `auto`, which loses only the shape.

### 3. Media children fill the frame, and the fill is `!important`

```scss
.el-frame > img,
.el-frame > video,
.el-frame > iframe,
.el-frame > picture,
.el-frame > picture > img {
  box-sizing: border-box;
  inline-size: 100% !important;
  block-size: 100% !important;
  object-fit: cover;
}
```

The child's size is the layout: a caller who wants it smaller wants a different
component. At 0-1-1 the rule still ties `.prose img` and loses on load order, so
the size is `!important`. Only an `!important` in a cascade layer beats it.
`object-fit` isn't forced, since `contain` is a legitimate letterbox, and
`border-box` keeps an iframe's border inside the frame.

A `max-inline-size: 100%` reset needs nothing: it resolves against the same
frame as the fill.

## Consequences

- **A frame has no width of its own**, so in a flex row it needs one.
- **The focal point is `object-position` on the child**, which the frame leaves
  alone.

## Alternatives considered

- **Radix `AspectRatio`.** It writes inline styles on a wrapper and an inner
  element (ADR 0002).
- **Every Layout's `--n` and `--d`.** Two knobs for one value, and
  `aspect-ratio` takes the pair directly.
- **One element, as EJDS's `Image`.** It can't crop non-replaced content, such
  as a textual fallback where no image exists.

## Revisit when

- A design needs a named ratio outside the three.
- A consumer has a real reason to size a media child below the frame.
