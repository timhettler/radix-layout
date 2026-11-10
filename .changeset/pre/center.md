---
"@timhettler/radix-layout": minor
---

Adds `Center`: a column centred in its parent and filling it up to
`--el-center-max` (`60ch`), with a `gutter` on the space scale either side when
the parent is narrower. `--el-center-gutter` takes a gutter off the scale. Merge
it onto a `Stack` with `asChild` and `align="center"` to centre children
narrower than the column. It loads with `styles.css`, or as `center.css` after
`defaults.css`.
