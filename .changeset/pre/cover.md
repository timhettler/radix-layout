---
"@timhettler/radix-layout": minor
---

Adds `Cover`: a column whose principal child takes the space its header and
footer leave, either centred in it (`Cover.Centered`) or grown into it
(`Cover.Fill`). Its parts are `Cover.Root`, `Cover.Centered` and `Cover.Fill`,
also exported as `CoverRoot`, `CoverCentered` and `CoverFill`. `min="screen"`
makes it at least the viewport's height, and `--el-cover-min` sets any other
minimum. It loads with `styles.css`, or as `cover.css` after `defaults.css`.
