# ADR 0003 — A public custom property's default is layered so a consumer's own rule wins; layout declarations stay unlayered

**Status:** accepted; amended by
[ADR 0010](0010-a-layered-page-declares-el-defaults-first.md) **Date:**
2026-10-13 **Deciders:** Tim Hettler

## Context

The library publishes CSS custom properties as the knobs a consumer turns:
`--el-space-*` today, `--el-grid-span` and `--el-grid-columns` when Grid lands.
The consumer sets them on a class or `:root` in their own stylesheet, often
inside their own media query.

The library also assigns each property a default, and that assignment has to
lose to the consumer's. **Specificity cannot guarantee it.** The defaults for
the scale sit on `:root`, which ties a consumer's `:root`; a tie is broken by
source order, and the library does not control the order a consumer imports CSS
in. A default assigned from a `data-*` vocabulary
(`.el-grid__item[data-span="4"]`, 0-2-0) is worse: it _out-ranks_ a consumer's
single class, silently — both declarations are valid and the element renders at
the library's default with nothing reporting it.

## Decision

### 1. A public custom property's default goes in `@layer el.defaults`; nothing else does

The layer holds exactly one kind of declaration: the assignment of a
**documented public custom property**, as the default a consumer is expected to
override. Every layered rule sits below every unlayered one, so a consumer's
rule wins regardless of specificity or load order.

```css
@layer el.defaults {
  :root {
    --el-space-m: 0.75rem;
  }
}
```

The test is whether a consumer overriding the declaration is the intended use.
For a knob default it is the whole point. For a layout declaration it is not.

### 2. Every layout declaration stays unlayered

A product's plain `div { display: block }` or `p { margin: 1em 0 }` reset must
still lose to `.el-stack` and its child-margin reset. Layering those would make
them erasable by any unlayered product rule, which is the failure each primitive
exists to prevent.

### 3. Every artifact declares the order

Each published stylesheet opens with `@layer el.defaults;`. A layer first seen
without the statement is appended to the order rather than placed in it; the
statement is idempotent and the first one the browser sees fixes the order, so
emitting it from each file costs a line and removes the dependency on which
loaded first.

## Consequences

- **A consumer's override wins regardless of load order** —
  `:root { --el-space-m: var(--my-space-md) }` remaps the step even if it loads
  before `styles.css`. The `RemappedScale` story asserts exactly that.
- **A stylesheet carries two override semantics**, and a reader has to know
  which declaration has which. The rule in § 1 is mechanical — is this assigning
  a public custom property? — which keeps it decidable.
- **A misfiled declaration fails silently and in the dangerous direction.** A
  layout declaration placed in `el.defaults` becomes erasable by any unlayered
  product rule. The narrowness of § 1 is the mitigation.

## Alternatives considered

- **`:where()` to drop the default's specificity.** Produces a tie, and a tie is
  resolved by source order the library does not control.
- **Layer every rule.** The cleanest override story, and it makes every layout
  declaration erasable by a generic reset — § 2.
- **Have props write inline custom properties.** Beats everything, so the
  consumer's media query could never win, and is blocked by a restrictive CSP
  (ADR 0002).
- **`!important` on the default, or documenting a higher-specificity selector
  for consumers.** Both invert the problem; the second is a ritual that gets
  forgotten, and forgetting it fails silently.

## Revisit when

- A second kind of declaration is proposed for `el.defaults`. That is the signal
  § 1 is being stretched rather than applied.
- A product reset is observed assigning an `--el-` custom property, which would
  falsify the safety argument for layering.
