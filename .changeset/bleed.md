---
"@timhettler/radix-layout": minor
---

Adds `Bleed` and `BleedBoundary`: a child of a centred column that reaches the
edges of the nearest boundary above it, at any depth, with no horizontal
overflow under a classic scrollbar. `--el-bleed-max` on the boundary caps every
bleed inside it. For HTML you don't author, `@include el.bleed` from
`pkg:@timhettler/radix-layout/mixins` applies the same rule to your own
selector. It loads with `styles.css`, or as `bleed.css` after `defaults.css`.
