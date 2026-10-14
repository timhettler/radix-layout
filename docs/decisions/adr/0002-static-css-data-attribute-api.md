# ADR 0002 — Layouts are styled by a static stylesheet keyed on a class and `data-*` attributes

**Status:** accepted **Date:** 2026-10-13 **Deciders:** Tim Hettler

## Context

React-only, so: does static CSS still beat inline styles, runtime injection or
CSS modules?

## Decision

**Each layout is a class (`.el-stack`) plus one rule per accepted `data-*`
value, compiled from Sass to static CSS and loaded by the consumer.** The
component writes `className` and the attributes, never a `style`.

The mechanism survives on its own merits:

- **CSP.** An inline `style` attribute is blocked under a `style-src` without
  `'unsafe-inline'`, which enterprise consumers commonly ship. A runtime
  `<style>` element needs a nonce threaded through every render. A static
  stylesheet needs neither.
- **No runtime.** Nothing to hydrate, no style recalculation per render, and the
  server-rendered markup is already styled.
- **Overridable on the consumer's terms.** Nothing is inline, so a consumer's
  media query can win; the public custom properties (ADR 0003) are the intended
  override path.
- **A closed, checkable vocabulary.** One rule per accepted value means the
  accepted set can be scraped back out of the compiled CSS and asserted against
  the TypeScript lists the props derive from — the stories do exactly that.

Sass is authoring-only. Each keyword → CSS-value map is the public vocabulary in
one table; the keyword is the contract, not the CSS value, so the implementation
can change without renaming what consumers write. The scale is defined once and
read by every layout. Consumers receive plain CSS: `styles.css`, or one file per
layout plus `defaults.css` for selective loading.

## Consequences

- **The consumer must load the CSS.** A component rendered without it is an
  unstyled `div`. The README says so first.
- **An unrecognised attribute value renders as the default**, silently. That is
  the cost of an attribute vocabulary, and the reason the scrape exists.
- **Composition is plain React** (`asChild`); inside the library a layout
  containing another reuses its mixin.

## Alternatives considered

- **Inline styles from props.** Rejected for CSP and for overridability, above.
- **Runtime rule injection** (a `useId()` class plus a hoisted `<style>`).
  Works, and needs a nonce under CSP, adds a runtime, and still leaves the
  consumer unable to express a breakpoint through a prop.
- **CSS modules.** Hashed class names would close the vocabulary to consumers,
  who could no longer target `.el-stack` or override a step, and require a
  bundler that understands them.
