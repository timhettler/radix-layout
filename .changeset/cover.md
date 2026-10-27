---
"@timhettler/radix-layout": minor
---

Adds `Cover`: a column at least the viewport's height with one child in the
middle of the space its header and footer leave, growing when its content is
taller. Its parts are `Cover.Root` and `Cover.Centered`, also exported as
`CoverRoot` and `CoverCentered`. `--el-cover-min` sets the minimum, `100svh` by
default. It loads with `styles.css`, or as `cover.css` after `defaults.css`.
