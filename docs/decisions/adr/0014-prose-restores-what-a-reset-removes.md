# ADR 0014 — `Prose` restores what a reset removes from rich text

**Status:** proposed **Date:** 2026-11-10 **Deciders:** Tim Hettler

## Context

A project's reset strips the browser's document styling: list markers and
indents, bold and italic, monospace code, link underlines, the spacing between
blocks. A rich-text region, such as CMS output or an editor's HTML, needs that
styling back, and design rarely specifies every element an editor can produce,
nested lists inside a blockquote included. Writing the restoration by hand
misses cases, and a hand-written `.prose p` rule (0-1-1) restyles any component
placed inside it. Every Layout has no Prose.

## Decision

### 1. Prose is a layout

It passes ADR 0001 § 1: it is many declarations, and each failure is one a
caller would hit. A nested list picks up block spacing, a loose list's `li > p`
doubles the gap, the first child's margin leaks out of the container, and a
component placed inside gets restyled.

It is not `Stack`. A flex column blockifies its children, stops margins
collapsing, wraps a bare text node at the root in an anonymous flex item and
blockifies an inline one, both of which CMS HTML produces. Prose stays in flow
layout (ADR 0005 § 3).

### 2. It restores structure with `revert`, and leaves type and surfaces alone

`revert` rolls a property back to the browser's stylesheet, past every author
rule, the reset included. That stylesheet already handles nesting: marker types
step `disc`, `circle`, `square`, an `ol` inside a `ul` keeps its numbers, and
`dd` and `blockquote` indent. Prose reverts only the properties resets remove,
such as `list-style`, `padding-inline-start`, `margin-inline` on `blockquote`
and `dd`, `font-weight` on `strong` and `text-decoration` on links, so a
consumer's own base rules for other properties, such as a link's `color`, still
apply.

Where the browser's default is wrong for rich text, Prose writes the value:
`figure` loses its inline margins, `sub` and `sup` stop moving the line box,
media is capped at the container's width and `pre` scrolls.

Headings get only the space above them. Sizes, weights, `line-height`, the
measure and every colour, border and fill are the consumer's: design has a type
scale, and this library ships no surfaces (ADR 0001 § 3).

### 3. Prose owns the block spacing, on two knobs

`space` is a required step on the scale, for the gap between blocks.
`headingSpace` is an optional step that replaces it above `h1`–`h6`; omitted,
headings take `space`. Only the space above a block is written, so the first
child adds none and the gap after a heading stays `space`. Flow repeats inside
`li`, `blockquote`, `dd` and similar containers, at the same step. List items
themselves stay tight, as the browser draws them.

### 4. Restoration is scoped and stays at element specificity

```css
@scope (.el-prose) to ([data-prose="off"]) {
  ul,
  ol {
    list-style: revert;
    padding-inline-start: revert;
  }
}
```

Inside the scope every rule keeps its element weight, never `:where()`. A
reset's `ul { padding: 0 }` ties it on specificity, and scope proximity breaks
the tie for Prose whatever the load order, while a universal `* { margin: 0 }`
loses on specificity. Any class beats the scoped rules, so a component inside
Prose keeps its own declarations. The rules are unlayered, as ADR 0003 § 2
requires of layout declarations, so a reset inside a cascade layer loses too.
Prose declares nothing in `el.defaults`.

The gap between direct children sits outside the scope, on `.el-prose`, so an
excluded child still gets its margin. A direct child's own `margin-block-start`
ties with the gap and wins only by load order.

### 5. `NotProse` ends the scope

A component that never declares a property Prose restores still inherits the
restoration: a `<Cluster asChild><ul>` tag list gets bullets and an indent,
because Cluster doesn't set either. `NotProse` writes `data-prose="off"`, the
scope's limit, so that element and everything inside it are out of the scope. It
merges with `asChild`, so no layout changes to accommodate Prose. A `Prose`
inside it starts a new scope. Both are flat exports: an exclusion usually sits
in a component renderer, not directly under `Prose`.

## Consequences

- **A cascade-layered utility on an element inside Prose loses to the
  restoration**, as it loses to Stack's child-margin reset. Tailwind 4's
  `list-none` on a `ul` in Prose does nothing; the `ul` needs `NotProse`.
- **`Frame` and `Bleed` work inside Prose unchanged.** Frame's media fill is
  `!important` (ADR 0013 § 3), and Bleed's `margin-inline` sits on a class.
- **A reset that targets with an attribute, such as `ul[role="list"]`, beats the
  restoration.** That reset marks a list a component owns, so this is the wanted
  outcome.
- **Presentational hints may be reverted away.** The browser applies
  `<ol type="a">` as an author-level hint, which `revert` skips, so Prose may
  have to write those rules itself.

## Alternatives considered

- **A complete hand-written stylesheet, as Tailwind Typography ships.** It's a
  typographic look for when design hasn't spoken, so every value is a theme to
  fight, and its `em` spacing ignores the scale.
- **`:where()` inside the scope.** 0-0-0 loses to any reset that names the
  element.
- **`:not(.not-prose *)` on every selector, as Tailwind does.** A `Prose` inside
  the exclusion can't restart.
- **Ending the scope at layout classes automatically.** A `Stack` holding rich
  text inside Prose wants the restoration, and a scope that ends at some layout
  classes is harder to reason about than one with a single exit.
- **`Flow` as its own export.** No use was found for the spacing without the
  restoration.

## Revisit when

- A design needs Prose to style headings, or any surface.
- A consumer needs a different gap inside lists or blockquotes than between
  top-level blocks.
