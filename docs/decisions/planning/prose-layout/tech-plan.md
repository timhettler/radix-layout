# Prose layout — tech plan

**Status:** not started **Owner:** unassigned **Started:** 2026-11-10 **PRs:** —

## Problem

A rich-text region needs the browser's document styling that a project's reset
removed, and design rarely specifies every element an editor can produce.
Restoring it by hand misses nested cases and restyles components placed in the
content.

## Approach

ADR 0014 holds the design: `Prose` reverts what resets remove inside
`@scope (.el-prose) to ([data-prose="off"])`, owns the block spacing with
`space` and `headingSpace`, and `NotProse` ends the scope.

**Rejected:** a hand-written theme on Tailwind Typography's model, and ADR
0014's other alternatives.

## Constraints & decisions

- **No type scale, colour or surface.** Headings get only the space above them.
- **A wide table's scroll wrapper is the consumer's.**
- **`@scope` is in every `.browserslistrc` target**, checked against
  caniuse-lite on 2026-11-10.
- **Done means:** in a `Prose` under Josh Comeau's reset and under Tailwind's
  preflight, the stories measure the restored list markers and indents, bold and
  italic, monospace code, link underlines and the flow spacing, including nested
  lists and a list inside a blockquote. A `<Cluster asChild><ul>` inside
  `NotProse` gets none of it, and a `Prose` inside `NotProse` gets it back.

## Steps

- [ ] **Accept ADR 0014,** amending it with anything the steps below disprove.
- [ ] **The element inventory.** Each element rich text can produce, checked
      against Tailwind Typography's list, with whether Prose reverts it, writes
      a value or leaves it alone, and why. It lands as a story table.
- [ ] **The rules** in `prose.scss`: the scoped restoration at element
      specificity, the flow between direct children outside the scope, nested
      flow in containers, tight list items, `headingSpace` above headings, a
      rule for every step on both axes, and `prose` in `styles.scss`.
- [ ] **`Prose` and `NotProse`** as flat exports, each a `Primitive.div` with
      `asChild`, `Prose` writing `data-space` and `data-heading-space`, with
      runtime lists the prop types derive from.
- [ ] **The `prose` mixin** in `mixins.scss`, for HTML a consumer doesn't wrap,
      if Sass can emit `@scope` from the including selector. If it can't, the
      README says to wrap the HTML in `Prose`.
- [ ] **The stories,** asserting computed styles and geometry for done means,
      each under both resets. Prove each guard by breaking it: a `:where()`
      selector, the flow inside the scope, a missing step. Include
      `<ol type="a">`, `start` and `reversed`, which `revert` may lose, and a
      `Frame` and a `Bleed` inside Prose.
- [ ] **The README:** what Prose restores and what it leaves, the knobs,
      `NotProse` and layered utilities losing to the restoration.
- [ ] `yarn lint && yarn format:check && yarn check:markdown && yarn typecheck && yarn build && yarn test`
- [ ] A changeset for every consumer-facing change (`yarn changeset`)
- [ ] Set `Status:` to `complete` in the PR that finishes the work, and archive
      the plan in that same PR if it closes the last open step

## Deferred / follow-ups

- **A scroll wrapper for wide tables.** Out of scope for the first version.
