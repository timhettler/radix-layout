# ADR 0002 — Layouts are styled by a static stylesheet keyed on a class and `data-*` attributes

**Status:** accepted **Date:** 2026-10-13 **Deciders:** Tim Hettler

## Context

In EJDS the layout primitives' appearance lived in a framework-neutral
stylesheet package, and the React components only wrote a class and `data-*`
attributes. The reason given was a static-HTML consumer tier: hand-authored
markup had to be the same markup React rendered.

This library is React-only, so that reason is gone. The question is whether the
delivery mechanism should go with it — whether a React layout library should
instead write inline styles, inject rules at runtime, or ship CSS modules.

## Decision

**Each layout is a class (`.el-stack`) plus one rule per accepted `data-*`
value, compiled from Sass to static CSS and loaded by the consumer.** The
component writes `className` and the attributes, never a `style`.

The mechanism survives on its own merits:

- **CSP.** An inline `style` attribute is blocked under a `style-src` without
  `'unsafe-inline'`, which enterprise consumers commonly ship. A runtime
  `<style>` element needs a nonce threaded through every render. A static
  stylesheet needs neither.
- **No runtime.** Nothing to hydrate, no style recalculation per render, and
  the server-rendered markup is already styled.
- **Overridable on the consumer's terms.** A class and an attribute are 0-2-0,
  which a consumer can out-rank deliberately; an inline style beats everything
  but `!important`, so a consumer's media query could never win. The public
  custom properties (ADR 0003) are the intended override path and work only
  because nothing is inline.
- **A closed, checkable vocabulary.** One rule per accepted value means the
  accepted set can be scraped back out of the compiled CSS and asserted against
  the TypeScript lists the props derive from — the stories do exactly that.

Sass is authoring-only. Each keyword → CSS-value map is the public vocabulary in
one table, and the space scale is defined once and read by every layout.
Consumers receive plain CSS: `styles.css`, or one file per layout plus
`defaults.css` for selective loading.

## Consequences

- **The consumer must load the CSS.** A component rendered without it is an
  unstyled `div`. The README says so first.
- **An unrecognised attribute value renders as the default**, silently. That is
  the cost of an attribute vocabulary, and the reason the scrape exists.
- **Composition is plain React.** Without a static-HTML tier there is no
  objection to `<Cluster asChild><MyToolbar/></Cluster>`; EJDS's rule that a
  component reuses a layout only through a Sass mixin does not apply to
  consumers. Inside this library, a layout that contains another still reuses
  the mixin, because the mixin is the single definition.

## Alternatives considered

- **Inline styles from props.** Rejected for CSP and for overridability, above.
- **Runtime rule injection** (a `useId()` class plus a hoisted `<style>`).
  Works, and needs a nonce under CSP, adds a runtime, and still leaves the
  consumer unable to express a breakpoint through a prop.
- **CSS modules.** Hashed class names would close the vocabulary to consumers,
  who could no longer target `.el-stack` or override a step, and require a
  bundler that understands them.
